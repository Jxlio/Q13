import Paste from '../models/Paste.js';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

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
    const { content, iv, expiresIn, maxViews } = req.body;
    
    if (!content || !iv) {
      return res.status(400).json({ error: 'Le contenu et l\'IV sont requis' });
    }
    
    const paste = new Paste({
      content,
      iv,
      randomArt: generateRandomArt(content),
      remainingViews: maxViews,
      maxViews: maxViews || null,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null
    });
    
    await paste.save();
    res.json({ id: paste.id });
    
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
    
    // Ajouter le visiteur et décrémenter le compteur seulement si success=true
    if (req.query.success === 'true') {
      await paste.addVisitor(req.ip);
    }
    
    res.json({
      content: paste.content,
      iv: paste.iv,
      randomArt: paste.randomArt,
      visitors: paste.visitors,
      remainingViews: paste.remainingViews,
      expiresAt: paste.expiresAt
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération du paste:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}; 