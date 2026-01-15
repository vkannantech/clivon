const Jimp = require('jimp');

async function convert() {
    try {
        console.log("Reading source image...");
        const image = await Jimp.read('d:/Projects/clivon/source_icon.png');
        console.log("Converting to PNG...");
        await image.writeAsync('d:/Projects/clivon/source_icon_real.png');
        console.log("Conversion complete: source_icon_real.png created.");
    } catch (err) {
        console.error("Error converting image:", err);
        process.exit(1);
    }
}

convert();
