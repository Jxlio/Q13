import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as pasteController from './controllers/pasteController.js';
import helmet from 'helmet';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { randomBytes } from 'crypto';
import { body, validationResult } from 'express-validator';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import csrf from 'csurf';
import sanitizeHtml from 'sanitize-html';
import hpp from 'hpp';
import cors from 'cors';

// Configuration
dotenv.config();
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration de la base de données MongoDB
const mongooseOptions = process.env.NODE_ENV === 'production' 
  ? {
      authSource: 'admin',
      user: process.env.MONGODB_USER,
      pass: process.env.MONGODB_PASS
    }
  : {};

mongoose.connect(process.env.MONGODB_URI, mongooseOptions);

// Génération d'un nonce aléatoire pour le CSP
const generateNonce = () => {
  return randomBytes(16).toString('base64');
};

// Middleware pour ajouter un nonce à chaque requête
app.use((req, res, next) => {
  res.locals.nonce = generateNonce();
  next();
});

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.nonce}'`,
        'cdn.jsdelivr.net',
        'https://cdn.jsdelivr.net'
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin'],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Protection supplémentaire contre les XSS
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Middleware pour parser le JSON avec limite de taille et validation
app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));

// Protection contre les attaques par pollution de paramètres
app.use((req, res, next) => {
  if (req.body) {
    const sanitizedBody = {};
    for (let [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        sanitizedBody[key] = value.slice(0, 10000); // Limite la taille des chaînes
      } else {
        sanitizedBody[key] = value;
      }
    }
    req.body = sanitizedBody;
  }
  next();
});

// Middleware de sécurité supplémentaire
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));

// Configuration de la session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 heures
  }
}));

// Protection CSRF
app.use(csrf());

// Middleware pour rendre le token CSRF disponible dans les templates
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Limiteur de taux pour les requêtes API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use('/api/', apiLimiter);

// Middleware de validation et de sanitization
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(hpp()); // Protection contre la pollution des paramètres HTTP

// Middleware de validation personnalisé
const validatePaste = [
  body('content').trim().escape(),
  body('title').trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Middleware de sanitization du contenu
const sanitizeContent = (req, res, next) => {
  if (req.body.content) {
    req.body.content = sanitizeHtml(req.body.content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        'img': ['src', 'alt']
      }
    });
  }
  next();
};

// Routes API avec protection
app.post('/api/paste', validatePaste, sanitizeContent, pasteController.createPaste);
app.get('/api/paste/:id', pasteController.getPaste);
app.get('/api/paste/:id/status', pasteController.getPasteStatus);
app.get('/api/paste/:id/sse', pasteController.getPasteSSE);

// Configuration des types MIME
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});

// Servir uniquement les fichiers publics nécessaires
app.use(express.static(join(__dirname, '../public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Ajouter des headers de sécurité
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  }
}));

// Configuration du moteur de template
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/paste', pasteController.createPaste);
app.get('/paste/:id', (req, res) => {
  res.render('paste', { id: req.params.id });
});

// Routes pour les pages statiques
app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/legal', (req, res) => {
    res.render('legal');
});

app.get('/privacy', (req, res) => {
    res.render('privacy');
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Gestion globale des erreurs améliorée
app.use((err, req, res, next) => {
  console.error('Erreur:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Ne pas exposer les détails de l'erreur en production
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Une erreur est survenue'
  });
});

// Démarrage du serveur
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

if (process.env.NODE_ENV === 'development') {
  try {
    const certDir = join(process.cwd(), 'certs');
    const httpsOptions = {
      key: fs.readFileSync(join(certDir, 'server.key')),
      cert: fs.readFileSync(join(certDir, 'server.crt'))
    };

    // Créer un serveur HTTPS
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(port, host, () => {
      console.log(`Serveur HTTPS démarré sur https://${host}:${port}`);
    });

    // Rediriger HTTP vers HTTPS
    const httpApp = express();
    httpApp.use((req, res) => {
      res.redirect(`https://${req.headers.host}${req.url}`);
    });
    httpApp.listen(80, host, () => {
      console.log('Redirection HTTP -> HTTPS active');
    });
  } catch (err) {
    console.error('Erreur lors du démarrage du serveur HTTPS:', err);
    console.log('Démarrage en mode HTTP...');
    app.listen(port, host, () => {
      console.log(`Serveur HTTP démarré sur http://${host}:${port}`);
    });
  }
} else {
  // En production, utiliser la configuration du serveur web (nginx, etc.)
  app.listen(port, host, () => {
    console.log(`Serveur démarré sur http://${host}:${port}`);
  });
} 