import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

class KeyManager {
    constructor() {
        this.keys = new Map();
        this.currentKeyId = null;
        this.rotationPeriod = parseInt(process.env.ENCRYPTION_KEY_ROTATION_PERIOD || '30') * 24 * 60 * 60 * 1000; // conversion en millisecondes
    }

    async initialize() {
        try {
            // Charger ou créer le fichier de clés
            const keysPath = path.join(process.cwd(), 'keys.json');
            let keysData;
            
            try {
                const fileContent = await fs.readFile(keysPath, 'utf8');
                keysData = JSON.parse(fileContent);
            } catch (error) {
                // Si le fichier n'existe pas, créer une nouvelle clé
                keysData = {
                    keys: [{
                        id: crypto.randomBytes(16).toString('hex'),
                        key: crypto.randomBytes(32).toString('hex'),
                        createdAt: Date.now()
                    }]
                };
                await fs.writeFile(keysPath, JSON.stringify(keysData, null, 2));
            }

            // Charger les clés en mémoire
            keysData.keys.forEach(keyData => {
                this.keys.set(keyData.id, {
                    key: Buffer.from(keyData.key, 'hex'),
                    createdAt: keyData.createdAt
                });
            });

            // Définir la clé courante
            this.currentKeyId = keysData.keys[keysData.keys.length - 1].id;

            // Planifier la rotation des clés
            setInterval(() => this.rotateKeys(), this.rotationPeriod);
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du gestionnaire de clés:', error);
            throw error;
        }
    }

    async rotateKeys() {
        try {
            const newKeyId = crypto.randomBytes(16).toString('hex');
            const newKey = crypto.randomBytes(32);
            
            // Ajouter la nouvelle clé
            this.keys.set(newKeyId, {
                key: newKey,
                createdAt: Date.now()
            });
            
            this.currentKeyId = newKeyId;

            // Supprimer les anciennes clés (garder les 2 plus récentes)
            const sortedKeys = Array.from(this.keys.entries())
                .sort((a, b) => b[1].createdAt - a[1].createdAt);
            
            while (sortedKeys.length > 2) {
                const [oldKeyId] = sortedKeys.pop();
                this.keys.delete(oldKeyId);
            }

            // Sauvegarder les clés
            const keysData = {
                keys: Array.from(this.keys.entries()).map(([id, data]) => ({
                    id,
                    key: data.key.toString('hex'),
                    createdAt: data.createdAt
                }))
            };

            await fs.writeFile(
                path.join(process.cwd(), 'keys.json'),
                JSON.stringify(keysData, null, 2)
            );
        } catch (error) {
            console.error('Erreur lors de la rotation des clés:', error);
            throw error;
        }
    }

    getCurrentKey() {
        return {
            id: this.currentKeyId,
            key: this.keys.get(this.currentKeyId).key
        };
    }

    getKey(keyId) {
        return this.keys.get(keyId)?.key;
    }
}

export const keyManager = new KeyManager(); 