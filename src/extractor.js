// Simple and reliable patterns for monetary amounts and percentages
const AMOUNT_PATTERN = /\b[lIOoSsBD]?\d+%|\b[lIOoSsBD]?\d+\b/g;
const CURRENCY_PATTERN = /(?:INR|Rs|₹|USD|\$|EUR|€|GBP|£)/i;

function captureContext(text, start, end, window = 15) {
    const leftStart = Math.max(0, start - window);
    const rightEnd = Math.min(text.length, end + window);
    const left = text.substring(leftStart, start);
    const right = text.substring(end, rightEnd);
    return { left, right };
}

function extractAmounts(rawText) {
    const results = [];
    let match;
    
    // Reset regex lastIndex
    AMOUNT_PATTERN.lastIndex = 0;
    
    while ((match = AMOUNT_PATTERN.exec(rawText)) !== null) {
        const token = match[0];
        const context = captureContext(rawText, match.index, match.index + token.length);
        
        results.push({
            raw: token,
            ...context
        });
    }
    
    return results;
}

function detectCurrency(rawText) {
    const match = rawText.match(CURRENCY_PATTERN);
    if (!match) return 'INR';
    
    const currency = match[0].toUpperCase();
    // Normalize currency symbols to standard codes
    if (currency === 'RS' || currency === '₹') return 'INR';
    if (currency === '$') return 'USD';
    if (currency === '€') return 'EUR';
    if (currency === '£') return 'GBP';
    
    return currency;
}

module.exports = { extractAmounts, detectCurrency };