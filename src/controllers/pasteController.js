import Paste from '../models/Paste.js';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { nanoid } from 'nanoid';
import { marked } from 'marked';

// Configuration de marked pour une sécurité renforcée
marked.setOptions({
  headerIds: false,
  mangle: false,
  breaks: true,
  gfm: true,
  sanitize: true
});

// Fonction pour générer le randomart (algorithme Drunken Bishop)
function generateRandomArt(content) {
  const encoder = new TextEncoder();
  const hash = sha256(encoder.encode(content));
  
  const width = 17;
  const height = 9;
  const field = new Array(height).fill(0).map(() => new Array(width).fill(0));
  
  let x = width >> 1;
  let y = height >> 1;
  
  for (let i = 0; i < hash.length; i++) {
    for (let j = 3; j >= 0; j--) {
      const move = (hash[i] >> (j * 2)) & 3;
      
      switch (move) {
        case 0: x--; y--; break; // Northwest
        case 1: x++; y--; break; // Northeast
        case 2: x--; y++; break; // Southwest
        case 3: x++; y++; break; // Southeast
      }
      
      x = Math.max(0, Math.min(x, width - 1));
      y = Math.max(0, Math.min(y, height - 1));
      field[y][x]++;
    }
  }
  
  // Caractères pour représenter les différentes densités
  const chars = ' .o+=*BOX@%&#/^SE';
  let art = '+---[RandomArt]---+\n';
  
  for (let y = 0; y < height; y++) {
    art += '|';
    for (let x = 0; x < width; x++) {
      const value = field[y][x];
      art += chars[Math.min(value, chars.length - 1)];
    }
    art += '|\n';
  }
  art += '+-----------------+';
  
  return art;
}

// Créer un nouveau paste
export const createPaste = async (req, res) => {
  try {
    const { content, iv, kyberCiphertext, expiresIn, maxViews, enableMarkdown } = req.body;
    
    if (!content || !iv || !kyberCiphertext) {
      return res.status(400).json({ error: 'Contenu, IV et kyberCiphertext sont requis' });
    }
    
    // Générer un ID unique
    const id = nanoid(32);
    
    // Générer le RandomArt
    const hash = sha256(content);
    const randomArt = generateRandomArt(hash);
    
    // Créer le paste
    const paste = new Paste({
      id,
      content,
      iv,
      kyberCiphertext,
      randomArt,
      maxViews: maxViews || null,
      remainingViews: maxViews || null,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      enableMarkdown: enableMarkdown || false
    });
    
    await paste.save();
    res.json({ id });
    
  } catch (error) {
    console.error('Erreur lors de la création du paste:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer un paste
export const getPaste = async (req, res) => {
  try {
    const paste = await Paste.findOne({ id: req.params.id });
    
    if (!paste) {
      return res.status(404).json({ error: 'Paste non trouvé' });
    }
    
    // Si success=true dans la requête, décrémenter le compteur de vues
    if (req.query.success === 'true') {
      await paste.addVisitor(req.ip);
    }
    
    res.json({
      content: paste.content,
      iv: paste.iv,
      kyberCiphertext: paste.kyberCiphertext,
      randomArt: paste.randomArt,
      expiresAt: paste.expiresAt,
      remainingViews: paste.remainingViews,
      visitors: paste.visitors,
      enableMarkdown: paste.enableMarkdown
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération du paste:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les informations de statut d'un paste sans compter les visites
export const getPasteStatus = async (req, res) => {
  try {
    const paste = await Paste.findOne({ id: req.params.id });
    
    if (!paste) {
      return res.status(404).json({ error: 'Paste non trouvé' });
    }
    
    res.json({
      expiresAt: paste.expiresAt,
      remainingViews: paste.remainingViews,
      visitors: paste.visitors,
      enableMarkdown: paste.enableMarkdown
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération du statut du paste:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Gérer les événements SSE pour les mises à jour en temps réel
export const getPasteSSE = async (req, res) => {
  try {
    const paste = await Paste.findOne({ id: req.params.id });
    
    if (!paste) {
      return res.status(404).json({ error: 'Paste non trouvé' });
    }

    // Configuration des headers SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Fonction pour envoyer les mises à jour
    const sendUpdate = async () => {
      const updatedPaste = await Paste.findOne({ id: req.params.id });
      if (updatedPaste) {
        const data = {
          expiresAt: updatedPaste.expiresAt,
          remainingViews: updatedPaste.remainingViews,
          visitors: updatedPaste.visitors,
          enableMarkdown: updatedPaste.enableMarkdown
        };
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    // Envoyer une mise à jour initiale
    await sendUpdate();

    // Configurer un intervalle pour les mises à jour
    const interval = setInterval(sendUpdate, 5000);

    // Nettoyer lors de la déconnexion
    req.on('close', () => {
      clearInterval(interval);
    });

  } catch (error) {
    console.error('Erreur lors de la configuration SSE:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}; 