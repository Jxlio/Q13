# Q13

Un service de partage de texte sécurisé avec chiffrement post-quantique côté client et visualisation RandomArt.

## Fonctionnalités

- 🔒 Chiffrement post-quantique (Kyber) côté client
- 🎨 Visualisation unique RandomArt pour chaque paste
- ⏱️ Options d'expiration par temps ou nombre de vues
- 🗑️ Suppression automatique après expiration


## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/Jxlio/Q13.git
cd Q13
```

2. Installez les dépendances :
```bash
npm install
```

3. Créez un fichier `.env` à la racine du projet :
```env
# Configuration du serveur
PORT=3000
NODE_ENV=development

# Configuration MongoDB
MONGODB_URI=mongodb://localhost:27017/randomart
MONGODB_USER=your_username
MONGODB_PASS=your_password

# Sécurité
SESSION_SECRET=your_session_secret_here
ALLOWED_ORIGINS=http://localhost:3000

# Limitation de taux
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Chiffrement
ENCRYPTION_KEY=your_encryption_key_here
```

4. Démarrez le serveur de développement :
```bash
npm run dev
```

## Technologies utilisées

- Node.js
- Express
- MongoDB
- EJS
- Kyber (chiffrement post-quantique)
- Marked (traitement Markdown)
- Web Crypto API
- RandomArt (Drunken Bishop Algorithm)

## Sécurité

- Chiffrement post-quantique (Kyber) côté client
- Chiffrement AES-GCM pour le contenu
- Protection CSRF sur toutes les routes
- Headers de sécurité (Helmet)
- Limitation de taux des requêtes
- Clé de déchiffrement uniquement dans le fragment d'URL
- Pas de stockage de données non chiffrées sur le serveur
- Suppression automatique des données expirées
- Sanitization des entrées utilisateur

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

[MIT](LICENSE) 