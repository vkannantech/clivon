const sharp = require('sharp');
const fs = require('fs');

async function convert() {
    try {
        console.log("Reading source image (sharp)...");
        // Sharp handles format detection automatically
        await sharp('d:/Projects/clivon/source_icon.png')
            .png()
            .toFile('d:/Projects/clivon/source_icon_real.png');
        console.log("Conversion complete: source_icon_real.png created.");
    } catch (err) {
        console.error("Error converting image:", err);
        process.exit(1);
    }
}

convert();
