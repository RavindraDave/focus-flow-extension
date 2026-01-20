
const sharp = require('sharp');
const path = require('path');

const MASTER_ICON = path.join(__dirname, '../public/icons/icon_new_master.png');

async function checkMetadata() {
    try {
        const metadata = await sharp(MASTER_ICON).metadata();
        console.log('Metadata:', metadata);
    } catch (error) {
        console.error('Error:', error);
    }
}

checkMetadata();
