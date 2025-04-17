import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as pasteController from './controllers/pasteController.js';

// Configuration
dotenv.config();
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/secure-paste')
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Middleware de limitation de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(express.static(join(__dirname, 'public')));

// Configuration du moteur de template
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/paste', pasteController.createPaste);
app.get('/paste/:id', (req, res) => {
  res.render('paste');
});
app.get('/api/paste/:id', pasteController.getPaste);

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

// Démarrage du serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
}); 