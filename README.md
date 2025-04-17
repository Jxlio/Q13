# Secure Paste

Un service de partage de texte sécurisé avec chiffrement post-quantique côté client et visualisation RandomArt.

## Fonctionnalités

- 🔒 Chiffrement post-quantique côté client
- 🎨 Visualisation unique RandomArt pour chaque paste
- ⏱️ Options d'expiration par temps ou nombre de vues
- 🗑️ Suppression automatique après expiration
- 📊 Suivi des accès avec horodatage et adresses IP
- 🖥️ Interface minimaliste en noir et blanc

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/votre-username/secure-paste.git
cd secure-paste
```

2. Installez les dépendances :
```bash
npm install
```

3. Créez un fichier `.env` à la racine du projet :
```env
MONGODB_URI=mongodb://localhost/secure-paste
PORT=3000
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
- Web Crypto API
- RandomArt (Drunken Bishop Algorithm)

## Sécurité

- Chiffrement AES-GCM côté client
- Clé de déchiffrement uniquement dans le fragment d'URL
- Pas de stockage de données non chiffrées sur le serveur
- Suppression automatique des données expirées

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

[MIT](LICENSE) 