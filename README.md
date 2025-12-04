# Intelligent Amount Detection in Medical Bills (Node.js)

A robust Node.js/Express backend service that extracts, normalizes, and classifies monetary values from medical bills using advanced pattern recognition and rule-based processing. Supports both image processing (via OCR) and direct text input with systematic error correction and context-aware classification.

## Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Project Flow](#-project-flow)
3. [System Architecture](#-system-architecture)
4. [Features](#-features)
5. [Project Structure](#-project-structure)
6. [Quick Start](#-quick-start)
7. [API Testing Guide](#-api-testing-guide)
8. [API Response Format](#-api-response-format)
9. [Technical Implementation](#️-technical-implementation)
10. [Error Handling & Troubleshooting](#-error-handling--troubleshooting)
11. [Integration Examples](#-integration-examples)
12. [Use Cases](#-use-cases)
13. [Development & Customization](#️-development--customization)
14. [License & Support](#-license--support)

## Problem Statement

Design a service that extracts financial amounts from medical bills or receipts (typed or scanned, possibly crumpled or partially visible). The system uses regex-based pattern matching, systematic OCR error correction, rule-based classification by context, and produces structured JSON with provenance tracking.

## Project Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   INPUT DATA    │    │   PROCESSING     │    │     OUTPUT      │
│                 │    │    PIPELINE     │    │                 │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Text Input    │───►│ Step 1: Extract  │───►│ • Currency      │
│ • Image Upload  │    │ Step 2: Normalize│    │ • Amounts Array │
│ • OCR Text      │    │ Step 3: Classify │    │ • Confidence    │
└─────────────────┘    │ Step 4: Response │    │ • Provenance    │
                       └──────────────────┘    └─────────────────┘
```

### Processing Pipeline Details:

**Step 1 - OCR/Text Extraction**
- Extract raw numeric tokens from bills/receipts
- Input: `"Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%"`
- Output: `{"raw_tokens": ["1200","1000","200","10%"], "currency_hint": "INR"}`

**Step 2 - Normalization** 
- Fix OCR digit errors and map to numbers
- Input: `"T0tal: Rs l200 | Pald: 1000 | Due: 200"` (OCR errors)
- Output: `{"normalized_amounts": [1200,1000,200], "normalization_confidence": 0.82}`

**Step 3 - Classification by Context**
- Use surrounding text to label amounts
- Output: `{"amounts": [{"type":"total_bill","value":1200}, {"type":"paid","value":1000}]}`

**Step 4 - Final Output**
- Return labeled amounts with currency and provenance
- Complete structured JSON with confidence scores

## System Architecture

### Complete Processing Flow

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    CLIENT REQUEST                           │
                    │                                                             │
                    │  POST /extract-amounts                                      │
                    │  ┌─────────────────┐    ┌─────────────────┐                │
                    │  │   Text Input    │ OR │  Image Upload   │                │
                    │  │ "Total: 1200"   │    │   bill.jpg      │                │
                    │  └─────────────────┘    └─────────────────┘                │
                    └─────────────────────────┬───────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                   EXPRESS.JS SERVER                         │
                    │                     (server.js)                            │
                    │                                                             │
                    │  ┌─────────────────┐    ┌─────────────────┐                │
                    │  │  Multer Upload  │    │  Request Router │                │
                    │  │   Middleware    │    │   & Validator   │                │
                    │  └─────────────────┘    └─────────────────┘                │
                    └─────────────────────────┬───────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                 PROCESSING PIPELINE                         │
                    └─────────────────────────┬───────────────────────────────────┘
                                              │
                    ┌─────────────────────────▼───────────────────────────────────┐
                    │                    STEP 1: OCR/EXTRACTION                   │
                    │                      (src/ocr.js)                          │
                    │                   (src/extractor.js)                       │
                    │                                                             │
                    │  Image Input ──► Tesseract.js ──► Raw Text                 │
                    │  Text Input  ──────────────────► Raw Text                  │
                    │                                                             │
                    │  Raw Text ──► Regex Pattern ──► Token Extraction           │
                    │                                                             │
                    │  Output: ["1200", "1000", "200", "10%"]                    │
                    │  Currency: "INR"                                            │
                    └─────────────────────────┬───────────────────────────────────┘
                                              │
                    ┌─────────────────────────▼───────────────────────────────────┐
                    │                   STEP 2: NORMALIZATION                     │
                    │                    (src/normalizer.js)                     │
                    │                                                             │
                    │  Raw Tokens ──► OCR Error Fix ──► Clean Numbers            │
                    │                                                             │
                    │  "l200" ──► "1200" ──► 1200                                │
                    │  "1OOO" ──► "1000" ──► 1000                                │
                    │  "10%"  ──► Skip   ──► null                                │
                    │                                                             │
                    │  Output: [1200, 1000, 200]                                 │
                    │  Confidence: 0.95                                           │
                    └─────────────────────────┬───────────────────────────────────┘
                                              │
                    ┌─────────────────────────▼───────────────────────────────────┐
                    │                  STEP 3: CLASSIFICATION                     │
                    │                   (src/classifier.js)                      │
                    │                                                             │
                    │  Context Analysis:                                          │
                    │  "Total: 1200" ──► total_bill                              │
                    │  "Paid: 1000"  ──► paid                                    │
                    │  "Due: 200"    ──► due                                     │
                    │                                                             │
                    │  Rule Matching ──► Type Assignment                          │
                    │                                                             │
                    │  Output: [{type: "total_bill", value: 1200}, ...]          │
                    └─────────────────────────┬───────────────────────────────────┘
                                              │
                    ┌─────────────────────────▼───────────────────────────────────┐
                    │                 STEP 4: RESPONSE BUILDING                   │
                    │                     (src/utils.js)                         │
                    │                                                             │
                    │  Combine Results ──► Add Provenance ──► Calculate Confidence│
                    │                                                             │
                    │  Final JSON Structure:                                      │
                    │  {                                                          │
                    │    "currency": "INR",                                       │
                    │    "amounts": [...],                                        │
                    │    "status": "ok",                                          │
                    │    "raw_tokens": [...],                                     │
                    │    "overall_confidence": 0.95                               │
                    │  }                                                          │
                    └─────────────────────────┬───────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    JSON RESPONSE                            │
                    │                                                             │
                    │  HTTP 200 OK                                                │
                    │  Content-Type: application/json                             │
                    │                                                             │
                    │  {                                                          │
                    │    "currency": "INR",                                       │
                    │    "amounts": [                                             │
                    │      {"type": "total_bill", "value": 1200, "source": "..."} │
                    │    ],                                                       │
                    │    "status": "ok"                                           │
                    │  }                                                          │
                    └─────────────────────────────────────────────────────────────┘
```

### Data Flow Example

```
Input: "Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%"
                                    │
                                    ▼
Step 1 - Extraction:
├─► Raw Tokens: ["1200", "1000", "200", "10%"]
├─► Currency: "INR"
├─► Context: [
│     {"raw": "1200", "left": "Total: INR ", "right": " | Paid"},
│     {"raw": "1000", "left": "Paid: ", "right": " | Due"},
│     {"raw": "200", "left": "Due: ", "right": " | Discount"},
│     {"raw": "10%", "left": "Discount: ", "right": ""}
│   ]
                                    │
                                    ▼
Step 2 - Normalization:
├─► Normalized: [1200, 1000, 200, null]  # 10% skipped
├─► Confidence: 0.75  # 3/4 successfully normalized
                                    │
                                    ▼
Step 3 - Classification:
├─► Context Analysis:
│   ├─► "Total: INR 1200" → "total_bill"
│   ├─► "Paid: 1000" → "paid"
│   ├─► "Due: 200" → "due"
│   └─► "Discount: 10%" → "discount" (but value is null)
├─► Results: [
│     {"type": "total_bill", "value": 1200},
│     {"type": "paid", "value": 1000},
│     {"type": "due", "value": 200}
│   ]
├─► Confidence: 1.0  # All non-null values classified
                                    │
                                    ▼
Step 4 - Response:
├─► Add Provenance Sources
├─► Calculate Overall Confidence: (1.0 + 0.75 + 1.0) / 3 = 0.92
├─► Build Final JSON
                                    │
                                    ▼
Final Output:
{
  "currency": "INR",
  "amounts": [
    {"type": "total_bill", "value": 1200, "source": "text: 'Total: INR 1200 | Paid'"},
    {"type": "paid", "value": 1000, "source": "text: 'Paid: 1000 | Due'"},
    {"type": "due", "value": 200, "source": "text: 'Due: 200 | Discount'"}
  ],
  "status": "ok",
  "raw_tokens": ["1200", "1000", "200", "10%"],
  "overall_confidence": 0.92
}
```

### Module Dependencies

```
server.js
├── src/ocr.js (Tesseract.js)
├── src/extractor.js (Regex patterns)
├── src/normalizer.js (Error correction)
├── src/classifier.js (Rule-based classification)
└── src/utils.js (Response building)
    └── src/extractor.js (Currency detection)
```

## Features

### Core Capabilities
- **OCR Processing**: Text extraction from medical bill images using Tesseract.js
- **Pattern Recognition**: Advanced regex-based matching for amounts, currencies, and percentages
- **Error Correction**: Systematic normalization of common OCR errors (e.g., 'O'→'0', 'l'→'1', 'S'→'5')
- **Context Classification**: Rule-based categorization using keyword matching (Total, Paid, Due, Tax, Discount, etc.)
- **Confidence Scoring**: Mathematical assessment of extraction reliability
- **REST API**: Clean, structured JSON responses with comprehensive metadata

### Supported Formats
- **Images**: PNG, JPG, JPEG, GIF, BMP, TIFF
- **Text**: Direct text input with flexible formatting
- **Currencies**: INR, USD, EUR, GBP, and symbol-based detection (₹, $, €, £)
- **Amount Types**: Bills, payments, dues, taxes, discounts, fees, charges

## Project Structure

```
bill-amount-extractor/
├── src/
│   ├── classifier.js    # Context-based amount classification
│   ├── extractor.js     # Regex patterns and token extraction
│   ├── normalizer.js    # OCR error correction and normalization
│   ├── ocr.js          # Image processing with Tesseract.js
│   └── utils.js        # Response building and utilities
├── server.js           # Main Express.js server
├── package.json        # Node.js dependencies and scripts
├── start.bat          # Windows startup script
├── Medical Bill.jpg   # Sample test image
├── TEST_CASES.md      # Comprehensive test cases and validation
└── README.md          # This documentation
```

## Live Demo & Deployment

### Production Deployment (Vercel - Text Only)

**Base URL:** `https://ai-powered-amount-detection-in-medi-rho.vercel.app`

**Available Endpoints:**
- **Health Check:** `GET https://ai-powered-amount-detection-in-medi-rho.vercel.app/health`
- **Text Extraction:** `POST https://ai-powered-amount-detection-in-medi-rho.vercel.app/extract-amounts`

**Important - Vercel Deployment Notes:**

| Feature | Status | Details |
|---------|--------|----------|
| Text Extraction | Fully Working | Fast, reliable, < 1 second response |
| Image Upload/OCR | Disabled | See explanation below |
| Uptime | 24/7 | Production-ready |
| Rate Limiting | None | Free tier |

**Why is OCR Disabled on Vercel?**

Vercel is a serverless platform optimized for fast, lightweight functions. OCR processing has technical limitations:

1. **Timeout Constraint:** Vercel free tier has 10-second function timeout
2. **OCR Processing Time:** Tesseract.js takes 30-60 seconds to process images
3. **Cold Start Penalty:** First request adds 10-20 seconds delay
4. **File System:** Serverless environment has read-only filesystem
5. **Memory Limits:** OCR requires significant memory allocation

**Result:** Text extraction works perfectly, but image OCR exceeds platform limits.

---

### Full Feature Deployment (Render - Text + OCR)

**Base URL:** `https://ai-powered-amount-detection-in-medical-wwxb.onrender.com`

**Available Endpoints:**
- **Health Check:** `GET https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/health`
- **Text Extraction:** `POST https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts`
- **Image Upload with OCR:** `POST https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts`

**Full Feature Support:**

| Feature | Status | Performance |
|---------|--------|-------------|
| Text Extraction | Working | < 100ms |
| Image OCR | Working | 2-5 seconds |
| File Uploads | Working | Supported |
| Timeout | None | No limits |
| Uptime | 24/7 | Production-ready |

**Note:** First request may take 30-60 seconds due to cold start (free tier). Subsequent requests are fast.

---

## Quick Start

### Prerequisites
- **Node.js** (v14 or higher): Download from https://nodejs.org/
- **npm** (comes with Node.js)

### Installation & Setup

1. **Clone/Download** the project to your local machine

2. **Install Dependencies**
   ```bash
   npm install
   ```
   This installs:
   - `express` - Web framework
   - `multer` - File upload handling
   - `tesseract.js` - OCR processing
   - `cors` - Cross-origin requests

3. **Start the Server**
   ```bash
   # Option 1: Use the batch file (Windows)
   start.bat
   
   # Option 2: Use npm command
   npm start
   
   # Option 3: Direct node command
   node server.js
   ```

4. **Verify Installation**
   - Server starts at: `http://localhost:8000`
   - Check console for "Server running on http://localhost:8000"
   - API endpoint: `POST /extract-amounts`

## API Testing Guide

### Endpoint Overview

**Choose your deployment:**

| Deployment | Base URL | Text Support | Image/OCR Support |
|------------|----------|--------------|-------------------|
| **Vercel (Text Only)** | `https://ai-powered-amount-detection-in-medi-rho.vercel.app` | Yes | No (timeout issues) |
| **Render (Full Features)** | `https://ai-powered-amount-detection-in-medical-wwxb.onrender.com` | Yes | Yes (full support) |
| **Local Development** | `http://localhost:8000` | Yes | Yes (full support) |

**Main Endpoints:**
- `GET /health` - Health check
- `POST /extract-amounts` - Extract amounts from text/image

**Content-Type:** `multipart/form-data`

### Testing with Postman

#### Test 1: Basic Text Extraction (Works on All Deployments)

**Vercel (Text Only):**
```http
POST https://ai-powered-amount-detection-in-medi-rho.vercel.app/extract-amounts
Content-Type: multipart/form-data

Form Data:
- text: "Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%"
```

**Render (Full Features):**
```http
POST https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts
Content-Type: multipart/form-data

Form Data:
- text: "Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%"
```

**Local Development:**
```http
POST http://localhost:8000/extract-amounts
Content-Type: multipart/form-data

Form Data:
- text: "Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%"
```

#### Test 2: Image Upload & OCR (Render/Local Only)

**Not available on Vercel deployment** (use Render or local server)

**Render (Recommended for Production):**
```http
POST https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts
Content-Type: multipart/form-data

Form Data:
- file: [Upload your medical bill image]
```

**Local Development:**
```http
POST http://localhost:8000/extract-amounts
Content-Type: multipart/form-data

Form Data:
- file: [Upload your medical bill image]
```

**Supported formats**: PNG, JPG, JPEG, GIF, BMP, TIFF
**Processing time**: 2-5 seconds (depending on image size)

#### Test 3: OCR Error Correction
```http
POST http://localhost:8000/extract-amounts
Content-Type: multipart/form-data

Form Data:
- text: "T0tal: Rs l200 | Pald: 1OOO | Due: 2OO | Tax: 5O"
```
*Tests the system's ability to fix common OCR mistakes*

#### Test 4: Multiple Currencies
```http
POST http://localhost:8000/extract-amounts
Content-Type: multipart/form-data

Form Data:
- text: "Bill: $150 | Tax: €20 | Total: ₹12000 | Paid: £100"
```

#### Test 5: Complex Medical Bill
```http
POST http://localhost:8000/extract-amounts
Content-Type: multipart/form-data

Form Data:
- text: "Consultation Fee: Rs 500 | Lab Tests: INR 800 | Medicine: 300 | Total Bill: 1600 | Insurance Paid: 1200 | Patient Due: 400 | Discount Applied: 10%"
```

### Testing with cURL

**Vercel (Text-only):**
```bash
curl -X POST https://ai-powered-amount-detection-in-medi-rho.vercel.app/extract-amounts \
  -F "text=Total: INR 1200 | Paid: 1000 | Due: 200"
```

**Render (Full Features):**
```bash
# Text extraction
curl -X POST https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts \
  -F "text=Total: INR 1200 | Paid: 1000 | Due: 200"

# Image upload with OCR
curl -X POST https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts \
  -F "file=@/path/to/your/bill.jpg"
```

**Local Development:**
```bash
# Text extraction
curl -X POST http://localhost:8000/extract-amounts \
  -F "text=Total: INR 1200 | Paid: 1000 | Due: 200"

# Image upload
curl -X POST http://localhost:8000/extract-amounts \
  -F "file=@/path/to/your/bill.jpg"
```

### Comprehensive Testing

For detailed test cases and validation scenarios, see **[TEST_CASES.md](TEST_CASES.md)** which includes:
- 5+ test scenarios with expected outputs
- Edge case handling
- Performance benchmarks
- Validation checklist
- Common issues and solutions

## API Response Format

### Successful Response
```json
{
  "currency": "INR",
  "amounts": [
    {
      "type": "total_bill",
      "value": 1200,
      "source": "text: 'Total: INR 1200'"
    },
    {
      "type": "paid",
      "value": 1000,
      "source": "text: 'Paid: 1000'"
    },
    {
      "type": "due",
      "value": 200,
      "source": "text: 'Due: 200'"
    }
  ],
  "status": "ok",
  "raw_tokens": ["1200", "1000", "200"],
  "overall_confidence": 0.95
}
```

### Response Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `currency` | string | Detected currency (INR, USD, EUR, GBP) |
| `amounts` | array | List of extracted monetary values |
| `amounts[].type` | string | Classification (total_bill, paid, due, tax, discount) |
| `amounts[].value` | number | Normalized amount as integer |
| `amounts[].source` | string | Original text context where amount was found |
| `status` | string | Processing status (ok, no_amounts_found) |
| `raw_tokens` | array | All numeric tokens found before classification |
| `overall_confidence` | number | Average confidence across all extractions |

### Error Response
```json
{
  "error": "Either an image file or text must be provided"
}
```

### No Amounts Found Response
```json
{
  "status": "no_amounts_found",
  "reason": "document too noisy"
}
```

## Technical Implementation

### Amount Classification Rules

The system uses rule-based keyword matching to classify extracted amounts:

| Type | Keywords | Examples |
|------|----------|----------|
| `total_bill` | total, bill, amount, sum | "Total: 1200", "Bill Amount: 500" |
| `paid` | paid, payment, received | "Paid: 1000", "Payment: 800" |
| `due` | due, balance, pending, outstanding | "Due: 200", "Balance: 150" |
| `tax` | tax, gst, vat, service | "Tax: 50", "GST: 18%" |
| `discount` | discount, off, reduction | "Discount: 10%", "50 off" |

### OCR Error Correction

Common OCR mistakes automatically corrected:

| OCR Error | Correction | Context |
|-----------|------------|----------|
| `O` → `0` | Letter O to zero | In numeric contexts |
| `l` → `1` | Lowercase L to one | In numeric contexts |
| `S` → `5` | Letter S to five | In numeric contexts |
| `B` → `8` | Letter B to eight | In numeric contexts |
| `I` → `1` | Letter I to one | In numeric contexts |
| `D` → `0` | Letter D to zero | In numeric contexts |

### Currency Detection

| Currency | Symbols | Keywords |
|----------|---------|----------|
| INR | ₹, Rs, Rs. | INR, Rupees, Indian |
| USD | $, USD | Dollar, US |
| EUR | €, EUR | Euro, European |
| GBP | £, GBP | Pound, British |

## Error Handling & Troubleshooting

### Common Issues

1. **"Either an image file or text must be provided"**
   - Ensure you're sending either `file` or `text` in form-data
   - Check Content-Type is `multipart/form-data`

2. **OCR processing takes too long**
   - Image size may be too large
   - Try resizing image to 800-1200px width

3. **Low confidence scores**
   - Image resolution too low
   - Text is blurry or distorted
   - Complex backgrounds interfering with OCR

### Performance Metrics

| Metric | Text Input | Image Input |
|--------|------------|-------------|
| **Processing Time** | ~50ms | 2-5 seconds |
| **Accuracy** | >95% | >70% (depends on quality) |
| **Memory Usage** | <50MB | <200MB |
| **Supported Formats** | UTF-8 text | PNG, JPG, JPEG, GIF, BMP, TIFF |

## Integration Examples

### JavaScript/Fetch
```javascript
// Text extraction
const formData = new FormData();
formData.append('text', 'Total: INR 1200 | Paid: 1000');

fetch('http://localhost:8000/extract-amounts', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));

// Image upload
const fileInput = document.getElementById('fileInput');
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8000/extract-amounts', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```


## Use Cases

### Healthcare Providers
- Automated bill processing
- Insurance claim verification
- Payment reconciliation
- Audit trail maintenance

### Insurance Companies
- Claim amount validation
- Fraud detection support
- Automated reimbursement processing
- Document digitization

### Patients/Consumers
- Bill verification
- Expense tracking
- Insurance submission
- Personal finance management

## Development & Customization

### Adding New Amount Types
Modify the classification rules in `src/classifier.js`:

```javascript
const PRIORITY_RULES = [
    ['copay', 'copay'],           // Add new rule
    ['deductible', 'deductible'], // Add new rule
    ['total', 'total_bill'],
    // ... existing rules
];
```

### Extending Currency Support
Add new currency patterns in `src/extractor.js`:

```javascript
const CURRENCY_PATTERN = /(?:INR|Rs|₹|USD|\$|CAD|C\$)/i;
```

### Custom OCR Preprocessing
Enhance image processing in `src/ocr.js`:

```javascript
// Add image preprocessing before OCR
const preprocessImage = (imageBuffer) => {
    // Implement custom image enhancement
    return enhancedImageBuffer;
};
```

## License & Support

- **License**: MIT License
- **Node.js Version**: 14+ recommended
- **Dependencies**: See `package.json`
- **Issues**: Check console logs for detailed error messages

## Quick Demo

### Option 1: Test Production Deployment (Vercel - Text Only)

```bash
curl -X POST https://ai-powered-amount-detection-in-medi-rho.vercel.app/extract-amounts \
  -F "text=Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%"
```

### Option 2: Test Full Features (Render - Text + OCR)

```bash
# Text extraction
curl -X POST https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts \
  -F "text=Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%"

# Image upload with OCR
curl -X POST https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts \
  -F "file=@/path/to/your/bill.jpg"
```

**Expected Response:**
```json
{
  "currency": "INR",
  "amounts": [
    {"type": "total_bill", "value": 1200, "source": "text: 'total: 1200'"},
    {"type": "paid", "value": 1000, "source": "text: 'paid: 1000'"},
    {"type": "due", "value": 200, "source": "text: 'due: 200'"}
  ],
  "status": "ok",
  "raw_tokens": ["1200", "1000", "200", "10%"],
  "overall_confidence": 0.85
}
```

---

## For Recruiters

### Quick Testing Guide

**1. Test Text Extraction (Vercel - Fast):**
- Open Postman
- Method: `POST`
- URL: `https://ai-powered-amount-detection-in-medi-rho.vercel.app/extract-amounts`
- Body: form-data
  - Key: `text`
  - Value: `Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%`
- Click Send
- Response time: < 1 second

**2. Test Full Features with OCR (Render):**
- Open Postman
- Method: `POST`
- URL: `https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts`
- Body: form-data
  - Key: `file`
  - Value: [Upload medical bill image]
- Click Send
- Response time: 2-5 seconds (first request may take 30-60 seconds due to cold start)

**3. Why Two Deployments?**

| Feature | Vercel | Render |
|---------|--------|--------|
| **Text Extraction** | Fast & Reliable | Fast & Reliable |
| **Image OCR** | Disabled (timeout) | Fully Supported |
| **Uptime** | 24/7 | 24/7 |
| **Speed** | < 1 second | 2-5 seconds (OCR) |
| **Best For** | Production text API | Full feature demo |

**Technical Reason for Vercel Limitation:**
- Vercel serverless functions have a 10-second timeout (free tier)
- Tesseract.js OCR processing takes 30-60 seconds
- Cold starts add 10-20 seconds delay
- Solution: Use Render for OCR support (no timeout limits)

---

**Ready to extract amounts from your medical bills?** 

**Next Steps:**
1. Test the live Vercel API for text extraction
2. Test the Render API for full OCR features
3. Check [TEST_CASES.md](TEST_CASES.md) for comprehensive testing
4. Run locally with `npm start` for development

