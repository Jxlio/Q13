import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const connectDB = async () => {
    try {
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            ssl: process.env.NODE_ENV === 'production',
            sslValidate: process.env.NODE_ENV === 'production',
            authSource: 'admin',
            retryWrites: true,
            w: 'majority',
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        // Ajouter le certificat SSL en production
        if (process.env.NODE_ENV === 'production' && process.env.MONGODB_CA_CERT) {
            const certPath = path.join(process.cwd(), 'certs', 'mongodb.pem');
            if (fs.existsSync(certPath)) {
                options.sslCA = fs.readFileSync(certPath);
            }
        }

        // Connexion avec authentification
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, options);

        // Événements de connexion
        mongoose.connection.on('connected', () => {
            console.log('MongoDB connecté avec succès');
        });

        mongoose.connection.on('error', (err) => {
            console.error('Erreur de connexion MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB déconnecté');
        });

        // Gestion gracieuse de la fermeture
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('Connexion MongoDB fermée suite à l\'arrêt de l\'application');
                process.exit(0);
            } catch (err) {
                console.error('Erreur lors de la fermeture de la connexion MongoDB:', err);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error('Erreur de connexion à MongoDB:', error);
        process.exit(1);
    }
};

export default connectDB; 