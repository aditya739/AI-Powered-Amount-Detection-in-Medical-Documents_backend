const Tesseract = require('tesseract.js');

async function processImage(imageBuffer) {
    try {
        const { data: { text, confidence } } = await Tesseract.recognize(imageBuffer, 'eng', {
            logger: m => {} // Disable logging
        });
        
        return {
            text: text,
            ocr_confidence: confidence / 100 // Convert to 0-1 scale
        };
    } catch (error) {
        return {
            text: '',
            ocr_confidence: 0.0,
            error: error.message
        };
    }
}

module.exports = { processImage };