import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

// Génération d'ID sécurisés et longs (32 caractères)
const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', 32);

const pasteSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => nanoid(),
    unique: true,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  kyberCiphertext: {
    type: String,
    required: true
  },
  iv: {
    type: String,
    required: true
  },
  randomArt: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: false,
    index: { expires: 0 }
  },
  maxViews: {
    type: Number,
    required: false
  },
  remainingViews: {
    type: Number,
    required: false
  },
  visitors: [{
    ip: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour vérifier les vues restantes avant chaque accès
pasteSchema.pre('save', async function(next) {
  if (this.maxViews && this.remainingViews <= 0) {
    await this.deleteOne();
  }
  next();
});

// Méthode pour ajouter un visiteur
pasteSchema.methods.addVisitor = async function(ip) {
  const update = {
    $push: { visitors: { ip, timestamp: new Date() } }
  };
  
  if (this.maxViews) {
    update.$inc = { remainingViews: -1 };
  }
  
  const updatedPaste = await mongoose.model('Paste').findOneAndUpdate(
    { _id: this._id },
    update,
    { new: true }
  );

  if (!updatedPaste) {
    throw new Error('Paste non trouvé');
  }

  // Mettre à jour l'instance courante
  this.visitors = updatedPaste.visitors;
  this.remainingViews = updatedPaste.remainingViews;

  // Vérifier si le paste doit être supprimé
  if (this.maxViews && this.remainingViews <= 0) {
    await this.deleteOne();
  }
};

// Nettoyage périodique des pastes expirés
setInterval(async () => {
  try {
    await mongoose.model('Paste').deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { maxViews: { $exists: true }, remainingViews: { $lte: 0 } }
      ]
    });
  } catch (error) {
    console.error('Erreur lors du nettoyage des pastes expirés:', error);
  }
}, 15 * 60 * 1000); // Toutes les 15 minutes

const Paste = mongoose.model('Paste', pasteSchema);
export default Paste; 