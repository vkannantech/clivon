const pngToIco = require('png-to-ico');
const fs = require('fs');

async function generate() {
    try {
        console.log("Generating ICO from source_icon_real.png...");
        const buf = await pngToIco('d:/Projects/clivon/source_icon_real.png');
        fs.writeFileSync('d:/Projects/clivon/src-tauri/icons/icon.ico', buf);
        console.log("Success: Written valid binary to src-tauri/icons/icon.ico");
    } catch (e) {
        console.error("Error generating ICO:", e);
        process.exit(1);
    }
}

generate();
