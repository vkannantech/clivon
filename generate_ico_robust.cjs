const { execSync } = require('child_process');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const SOURCE = 'd:/Projects/clivon/source_icon_latest.png';
const ICONS_DIR = 'd:/Projects/clivon/src-tauri/icons';

async function generateIcons() {
    try {
        console.log("🔄 Starting Robust Icon Generation...");

        if (!fs.existsSync(ICONS_DIR)) {
            fs.mkdirSync(ICONS_DIR, { recursive: true });
        }

        // 1. Generate individual PNGs with strict RGBA (ensureAlpha)
        const sizes = [
            { name: '32x32.png', width: 32 },
            { name: '128x128.png', width: 128 },
            { name: '128x128@2x.png', width: 256 },
            { name: 'icon.png', width: 512 }
        ];

        for (const size of sizes) {
            console.log(`Resource: Generating ${size.name}...`);
            await sharp(SOURCE)
                .resize(size.width, size.width)
                .ensureAlpha() // CRITICAL: Forces RGBA (32-bit)
                .toFormat('png')
                .toFile(path.join(ICONS_DIR, size.name));
        }
        console.log("✅ All RGBA PNGs generated successfully.");

        // 2. Generate ICO using the newly generated high-res PNG
        console.log("Resource: Generating ICO binary...");
        // Use the strict RGBA 32x32 and 256x256 (128@2x) for the ICO to ensure compatibility
        // We capture the output buffer directly
        const buffer = execSync(`npx png-to-ico "${path.join(ICONS_DIR, '32x32.png')}" "${path.join(ICONS_DIR, '128x128@2x.png')}"`, {
            maxBuffer: 10 * 1024 * 1024,
            encoding: 'buffer'
        });

        // Validate Header (ICO header is always 00 00 01 00)
        if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
            fs.writeFileSync(path.join(ICONS_DIR, 'icon.ico'), buffer);
            console.log("✅ Valid ICO generated and written to icon.ico");
        } else {
            console.error("❌ Error: Generated data does not have a valid ICO header");
            process.exit(1);
        }

    } catch (e) {
        console.error("❌ Generation failed:", e.message);
        process.exit(1);
    }
}

generateIcons();
