# Test Cases for Bill Amount Extractor

This document contains comprehensive test cases to validate the amount extraction functionality.

## Sample curl/Postman Requests to Test Your Endpoints

### Postman Requests:

**1. Text Extraction:**
```
Method: POST
URL: https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts
Body: form-data
  Key: text
  Value: Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%
```

**2. Image Upload with OCR:**
```
Method: POST
URL: https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts
Body: form-data
  Key: file
  Value: [Select medical bill image file]
```

### cURL Requests:

**1. Text Extraction:**
```bash
curl -X POST https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts \
  -F "text=Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%"
```

**2. Image Upload with OCR:**
```bash
curl -X POST https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts \
  -F "file=@/path/to/your/medical-bill.jpg"
```

**Note:** First request may take 30-60 seconds due to cold start. Subsequent requests are fast.

---

## Test Input Examples

### 1. Basic Text Extraction
```
Input: "Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%"
Expected Output:
{
  "currency": "INR",
  "amounts": [
    {"type": "total_bill", "value": 1200, "source": "text: 'Total: INR 1200'"},
    {"type": "paid", "value": 1000, "source": "text: 'Paid: 1000'"},
    {"type": "due", "value": 200, "source": "text: 'Due: 200'"}
  ],
  "status": "ok",
  "raw_tokens": ["1200", "1000", "200", "10%"],
  "overall_confidence": 0.95
}
```

### 2. OCR Error Correction
```
Input: "T0tal: Rs l200 | Pald: 1OOO | Due: 2OO | Tax: 5O"
Expected: System should correct O→0, l→1, etc.
```

### 3. Multiple Currencies
```
Input: "Bill: $150 | Tax: €20 | Total: ₹12000 | Paid: £100"
Expected: Should detect all amounts and use the most prominent currency
```

### 4. Complex Medical Bill
```
Input: "Consultation Fee: Rs 500 | Lab Tests: INR 800 | Medicine: 300 | Total Bill: 1600 | Insurance Paid: 1200 | Patient Due: 400 | Discount Applied: 10%"
Expected: Should classify each amount type correctly
```

### 5. Edge Cases

#### Percentages Only
```
Input: "Discount: 15% | Tax Rate: 18%"
Expected: Should capture percentages in raw_tokens but not normalize them
```

#### No Amounts
```
Input: "This is a test document with no monetary values"
Expected: {"status": "no_amounts_found", "reason": "document too noisy"}
```

#### Large Numbers
```
Input: "Surgery Cost: Rs 125,000 | Insurance Coverage: 1,00,000"
Expected: Should handle Indian number formatting
```

## Running Tests

### Manual Testing

**Using Postman:**
- Method: POST
- URL: https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts
- Body: form-data
- Key: text or file
- Value: [Use any input from test cases above]

**Using cURL:**
```bash
curl -X POST https://ai-powered-amount-detection-in-medical-wwxb.onrender.com/extract-amounts \
  -F "text=[Use any input from test cases above]"
```

### Expected Response Format

All successful responses should follow this structure:

```json
{
  "currency": "INR|USD|EUR|GBP",
  "amounts": [
    {
      "type": "total_bill|paid|due|tax|discount|fee|consultation|procedure|medicine|test|accommodation|therapy|feeding|immunization|unknown",
      "value": 1200,
      "source": "text: 'contextual text around the amount'"
    }
  ],
  "status": "ok",
  "raw_tokens": ["1200", "1000", "200", "10%"],
  "overall_confidence": 0.95
}
```

### Error Response Format

```json
{
  "status": "no_amounts_found",
  "reason": "document too noisy"
}
```

Or:

```json
{
  "error": "Error message describing what went wrong"
}
```

## Validation Checklist

- [ ] All numeric tokens are captured in raw_tokens (including percentages)
- [ ] Only valid monetary amounts are normalized (percentages excluded)
- [ ] Currency is correctly detected from context
- [ ] Amount types are properly classified based on surrounding keywords
- [ ] OCR errors are corrected (O→0, l→1, S→5, etc.)
- [ ] Source context is provided for each amount
- [ ] Confidence scores are reasonable (0.0 to 1.0)
- [ ] Edge cases are handled gracefully
- [ ] Response format matches specification

## Performance Benchmarks

- Text processing: < 50ms
- Image OCR processing: 2-5 seconds
- Memory usage: < 100MB
- Accuracy: > 90% for clear text, > 70% for OCR

## Common Issues and Solutions

1. **Missing amounts**: Check if regex patterns cover all number formats
2. **Wrong classification**: Verify keyword matching in classifier
3. **OCR errors**: Ensure error correction mappings are comprehensive
4. **Performance issues**: Optimize regex patterns and processing pipeline