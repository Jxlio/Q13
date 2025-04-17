import { copyFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const dependencies = [
  {
    src: '../node_modules/marked/marked.min.js',
    dest: '../public/js/lib/marked.min.js'
  }
];

async function copyDependencies() {
  try {
    // Créer le dossier lib s'il n'existe pas
    await mkdir(join(__dirname, '../public/js/lib'), { recursive: true });

    // Copier chaque dépendance
    for (const dep of dependencies) {
      await copyFile(
        join(__dirname, dep.src),
        join(__dirname, dep.dest)
      );
      console.log(`Copié: ${dep.src} -> ${dep.dest}`);
    }

    console.log('Toutes les dépendances ont été copiées avec succès.');
  } catch (error) {
    console.error('Erreur lors de la copie des dépendances:', error);
    process.exit(1);
  }
}

copyDependencies(); 