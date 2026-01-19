import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const outputZip = path.resolve(__dirname, '../extension.zip');

if (!fs.existsSync(distDir)) {
    console.error('dist directory not found. Run npm run build first.');
    process.exit(1);
}

try {
    // Use system zip command for simplicity on Mac/Linux
    console.log('Creating extension.zip...');
    if (fs.existsSync(outputZip)) {
        fs.unlinkSync(outputZip);
    }

    // cd into dist so the zip doesn't contain the dist folder itself
    execSync(`cd "${distDir}" && zip -r "${outputZip}" .`);

    console.log(`Successfully created ${outputZip}`);
} catch (error) {
    console.error('Failed to zip:', error);
    process.exit(1);
}
