const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log("Generating ICO binary...");
    // Capture stdout as a Buffer (encoding: 'buffer') is the default if not specified as string
    // We strictly want the binary output from the CLI tool
    const buffer = execSync('npx png-to-ico d:/Projects/clivon/source_icon_real.png', {
        maxBuffer: 10 * 1024 * 1024, // 10MB
        encoding: 'buffer'
    });

    console.log(`Captured ${buffer.length} bytes.`);

    // Validate Header (ICO header is always 00 00 01 00)
    if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
        console.log("Valid ICO header detected.");
        fs.writeFileSync('d:/Projects/clivon/src-tauri/icons/icon.ico', buffer);
        console.log("Successfully wrote d:/Projects/clivon/src-tauri/icons/icon.ico");
    } else {
        console.error("Error: Generated data does not have a valid ICO header:", buffer.subarray(0, 4));
        process.exit(1);
    }

} catch (e) {
    console.error("Generation failed:", e.message);
    process.exit(1);
}
