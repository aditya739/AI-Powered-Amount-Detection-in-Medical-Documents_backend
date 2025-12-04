const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { extractAmounts, detectCurrency } = require('./src/extractor');
const { normalizeAmounts } = require('./src/normalizer');
const { classifyAmounts } = require('./src/classifier');
const { processImage } = require('./src/ocr');
const { buildFinalResponse } = require('./src/utils');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Bill Amount Extractor API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.post('/extract-amounts', upload.single('file'), async (req, res) => {
    try {
        // Input validation
        if (!req.file && !req.body.text) {
            return res.status(400).json({ 
                error: 'Either an image file or text must be provided' 
            });
        }

        let rawText = '';
        let ocrResult = {};

        if (req.file) {
            // Process image with OCR
            ocrResult = await processImage(req.file.buffer);
            if (ocrResult.error) {
                return res.status(500).json({ error: ocrResult.error });
            }
            rawText = ocrResult.text || '';
        } else if (req.body.text) {
            // Use provided text directly
            rawText = req.body.text.trim();
            if (!rawText) {
                return res.status(400).json({ 
                    error: 'Text input cannot be empty' 
                });
            }
            ocrResult = { text: rawText, ocr_confidence: 1.0 };
        }

        // Processing pipeline
        const extracted = extractAmounts(rawText);
        const normalized = normalizeAmounts(extracted);
        const classified = classifyAmounts(extracted, normalized.normalized_amounts);
        const finalResponse = buildFinalResponse(ocrResult, extracted, normalized, classified);

        res.json(finalResponse);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('📋 API endpoints:');
    console.log('   GET  /health - Health check');
    console.log('   POST /extract-amounts - Extract amounts from text/image');
    console.log('\n🧪 Run tests: node test-extraction.js');
});