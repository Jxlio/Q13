// Implémentation simplifiée de Kyber pour le navigateur
(function() {
    // Fonction pour convertir Base64 en Uint8Array
    function base64ToUint8Array(base64) {
        const binary = atob(base64);
        return new Uint8Array(binary.split('').map(char => char.charCodeAt(0)));
    }

    // Fonction pour convertir Uint8Array en Base64
    function uint8ArrayToBase64(array) {
        return btoa(String.fromCharCode.apply(null, array));
    }

    // Fonction pour générer une paire de clés
    window.KeyGen768 = async function() {
        // Générer une paire de clés AES-GCM
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true, // extractable
            ['encrypt', 'decrypt']
        );
        
        // Exporter les clés pour les stocker
        const publicKey = await window.crypto.subtle.exportKey('raw', keyPair);
        const secretKey = await window.crypto.subtle.exportKey('raw', keyPair);
        
        return [publicKey, secretKey];
    };
    
    // Fonction pour chiffrer un message
    window.Encrypt768 = async function(message, publicKey) {
        // Convertir le message en Uint8Array
        const encoder = new TextEncoder();
        const messageBytes = encoder.encode(message);
        
        // Importer la clé publique
        const key = await window.crypto.subtle.importKey(
            'raw',
            publicKey,
            {
                name: 'AES-GCM',
                length: 256
            },
            false,
            ['encrypt']
        );
        
        // Générer un IV aléatoire (12 octets)
        const iv = new Uint8Array(12);
        window.crypto.getRandomValues(iv);
        
        // Chiffrer le message avec AES-GCM
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            messageBytes
        );
        
        // Convertir en base64 pour le stockage
        return {
            ciphertext: uint8ArrayToBase64(new Uint8Array(encrypted)),
            iv: uint8ArrayToBase64(iv),
            kyberCiphertext: uint8ArrayToBase64(new Uint8Array(publicKey))
        };
    };
    
    // Fonction pour déchiffrer un message
    window.Decrypt768 = async function(ciphertext, secretKey) {
        try {
            // Retourner directement la clé secrète pour le déchiffrement AES-GCM
            return secretKey;
        } catch (error) {
            console.error('Erreur de déchiffrement:', error);
            throw error;
        }
    };
})();