import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const certDir = join(process.cwd(), 'certs');

// Créer le dossier certs s'il n'existe pas
try {
    mkdirSync(certDir, { recursive: true });
} catch (err) {
    if (err.code !== 'EEXIST') {
        console.error('Erreur lors de la création du dossier certs:', err);
        process.exit(1);
    }
}

// Configuration OpenSSL
const config = `[req]
default_bits = 2048
prompt = no
default_md = sha256
x509_extensions = v3_req
distinguished_name = dn

[dn]
C = FR
ST = France
L = Paris
O = Q13 Development
OU = Development
CN = localhost

[v3_req]
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 192.168.1.50
IP.2 = 127.0.0.1`;

// Écrire la configuration OpenSSL
const configPath = join(certDir, 'openssl.cnf');
writeFileSync(configPath, config);

try {
    // Générer la clé privée et le certificat
    execSync(`openssl req -x509 -new -nodes -sha256 -utf8 -days 3650 -newkey rsa:2048 \
        -keyout ${join(certDir, 'server.key')} \
        -out ${join(certDir, 'server.crt')} \
        -config ${configPath}`);

    console.log('✅ Certificat SSL auto-signé généré avec succès');
    console.log('📁 Les fichiers ont été sauvegardés dans le dossier "certs"');
    console.log('\n⚠️  Important: Vous devez ajouter le certificat à vos certificats de confiance');
    console.log('Sur macOS:');
    console.log('1. Ouvrez Keychain Access');
    console.log('2. File > Import Items');
    console.log(`3. Sélectionnez ${join(certDir, 'server.crt')}`);
    console.log('4. Double-cliquez sur le certificat');
    console.log('5. Développez "Trust"');
    console.log('6. Changez "When using this certificate" à "Always Trust"');
} catch (err) {
    console.error('❌ Erreur lors de la génération du certificat:', err);
    process.exit(1);
} 