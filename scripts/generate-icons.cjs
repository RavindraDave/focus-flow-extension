
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_DIR = path.join(__dirname, '../public/icons');
const MASTER_ICON = path.join(ICON_DIR, 'icon_new_master.png');

const SIZES = [16, 32, 48, 128];

async function generateIcons() {
    if (!fs.existsSync(MASTER_ICON)) {
        console.error('Master icon not found:', MASTER_ICON);
        process.exit(1);
    }

    console.log('Generating icons from:', MASTER_ICON);

    for (const size of SIZES) {
        const outputFile = path.join(ICON_DIR, `icon_new_${size}.png`);

        // Calculate corner radius (approx 18% of size is standard for iOS/modern icons)
        // 128 * 0.18 = ~23
        const radius = Math.round(size * 0.18);

        // Create an SVG mask for rounded corners
        const mask = Buffer.from(`
            <svg width="${size}" height="${size}">
                <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
            </svg>
        `);

        try {
            await sharp(MASTER_ICON)
                .resize(size, size)
                .composite([{
                    input: mask,
                    blend: 'dest-in' // Keeps the destination where the mask is white
                }])
                .png() // Ensure output is PNG
                .toFile(outputFile);

            console.log(`Generated ${size}x${size} with radius ${radius}px: ${outputFile}`);
        } catch (error) {
            console.error(`Error generating ${size}x${size}:`, error);
        }
    }
}

generateIcons();
