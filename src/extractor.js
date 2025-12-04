// Pattern to capture Label: [Currency] Number (handles multi-word labels)
const AMOUNT_PATTERN = /([A-Za-z]+(?:\s+[A-Za-z]+)*):\s*(?:INR|Rs\.?|₹|USD|\$|EUR|€|GBP|£)?\s*([lIOoSsBD]?\d+(?:,\d{3})*)(%)?/gi;
const CURRENCY_PATTERN = /(?:INR|Rs|₹|USD|\$|EUR|€|GBP|£)/i;

function extractAmounts(rawText) {
    const results = [];
    let match;
    
    // Reset regex lastIndex
    AMOUNT_PATTERN.lastIndex = 0;
    
    while ((match = AMOUNT_PATTERN.exec(rawText)) !== null) {
        if (match[1] && match[2]) {
            const label = match[1].toLowerCase();
            const token = match[2] + (match[3] || ''); // Add % if present
            
            results.push({
                raw: token,
                left: `${label}: `,
                right: '',
                label: label
            });
        }
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