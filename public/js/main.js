import '../css/style.css';
import { MlKem768 } from '/node_modules/mlkem/esm/mod.js';

// Fonction utilitaire pour convertir un ArrayBuffer en Base64
function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Fonction utilitaire pour convertir Base64 en ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

async function encryptPaste(content, expiresIn, views) {
    try {
        // Génération des clés ML-KEM
        const recipient = new MlKem768();
        const [publicKey, privateKey] = await recipient.generateKeyPair();

        // Génération d'une clé AES pour le chiffrement symétrique
        const aesKey = await crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["encrypt"]
        );

        // Export de la clé AES
        const exportedAesKey = await crypto.subtle.exportKey("raw", aesKey);

        // Chiffrement de la clé AES avec ML-KEM
        const sender = new MlKem768();
        const [encryptedAesKey, sharedSecret] = await sender.encap(publicKey);

        // Génération de l'IV
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Préparation des données à chiffrer
        const data = {
            content: content,
            timestamp: Date.now(),
            expiresIn: expiresIn,
            views: views
        };

        // Conversion en bytes
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(JSON.stringify(data));

        // Chiffrement des données avec AES-GCM
        const encryptedContent = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            aesKey,
            dataBytes
        );

        // Création du blob final
        const encryptedBlob = new Uint8Array(iv.length + encryptedContent.byteLength);
        encryptedBlob.set(iv);
        encryptedBlob.set(new Uint8Array(encryptedContent), iv.length);

        return {
            encrypted: arrayBufferToBase64(encryptedBlob),
            encryptedKey: arrayBufferToBase64(encryptedAesKey),
            privateKey: arrayBufferToBase64(privateKey)
        };
    } catch (error) {
        console.error('Erreur dans encryptPaste:', error);
        throw error;
    }
}

async function submitForm() {
    const submitButton = document.getElementById('submitBtn');
    if (!submitButton) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Chiffrement en cours...';

    try {
        const contentElement = document.getElementById('content');
        if (!contentElement || !contentElement.value) {
            throw new Error('Le contenu est requis');
        }

        const expiresIn = document.getElementById('expires')?.checked ? 
            parseInt(document.getElementById('expiresIn')?.value || '86400') : 86400;
        const views = document.getElementById('views')?.checked ? 
            parseInt(document.getElementById('viewsCount')?.value || '1') : 1;

        console.log('Chiffrement du contenu...');
        const encrypted = await encryptPaste(contentElement.value, expiresIn, views);
        
        submitButton.textContent = 'Envoi en cours...';

        const response = await fetch('/paste', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                content: encrypted.encrypted,
                encryptedKey: encrypted.encryptedKey,
                expiresIn: expiresIn,
                views: views
            })
        });

        const responseText = await response.text();
        console.log('Réponse du serveur:', responseText);

        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Réponse serveur invalide: ' + responseText);
        }

        if (!response.ok) {
            throw new Error(responseData.error || 'Erreur serveur');
        }

        if (!responseData.id) {
            throw new Error('ID du paste manquant dans la réponse');
        }

        console.log('Paste chiffré créé avec succès, redirection...');
        window.location.href = `/paste/${responseData.id}#${encrypted.privateKey}`;
    } catch (error) {
        console.error('Erreur lors de la création du paste:', error);
        alert('Une erreur est survenue lors de la création du paste: ' + error.message);
        submitButton.disabled = false;
        submitButton.textContent = 'Créer le paste';
    }
}

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners pour les checkboxes
    const expires = document.getElementById('expires');
    if (expires) {
        expires.addEventListener('change', function() {
            const select = document.getElementById('expiresIn');
            if (select) {
                select.disabled = !this.checked;
            }
        });
    }

    const views = document.getElementById('views');
    if (views) {
        views.addEventListener('change', function() {
            const input = document.getElementById('viewsCount');
            if (input) {
                input.disabled = !this.checked;
            }
        });
    }

    // Attacher l'événement au bouton
    const submitButton = document.getElementById('submitBtn');
    if (submitButton) {
        submitButton.addEventListener('click', submitForm);
    }
}); 