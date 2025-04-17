// Wrapper pour le module crystals-kyber
let isKyberLoaded = false;

const kyber = {
    KeyGen768: async function() {
        if (!isKyberLoaded) {
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = '/js/lib/kyber768.js';
                script.onload = () => {
                    isKyberLoaded = true;
                    resolve();
                };
                document.head.appendChild(script);
            });
        }
        return window.KeyGen768();
    },

    Encrypt768: async function(message, publicKey) {
        if (!isKyberLoaded) {
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = '/js/lib/kyber768.js';
                script.onload = () => {
                    isKyberLoaded = true;
                    resolve();
                };
                document.head.appendChild(script);
            });
        }
        return window.Encrypt768(message, publicKey);
    },

    Decrypt768: async function(ciphertext, secretKey) {
        if (!isKyberLoaded) {
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = '/js/lib/kyber768.js';
                script.onload = () => {
                    isKyberLoaded = true;
                    resolve();
                };
                document.head.appendChild(script);
            });
        }
        return window.Decrypt768(ciphertext, secretKey);
    }
};

// Exposer les fonctions globalement
window.KeyGen768 = kyber.KeyGen768;
window.Encrypt768 = kyber.Encrypt768;
window.Decrypt768 = kyber.Decrypt768; 