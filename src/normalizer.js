// Mapping of common OCR mis-recognitions to correct digits
const CHAR_MAP = {
    'O': '0', 'o': '0', 'l': '1', 'I': '1', 'i': '1',
    'S': '5', 's': '5', 'B': '8', 'D': '0'
};

function fixOcrErrors(token) {
    return token.split('').map(ch => CHAR_MAP[ch] || ch).join('');
}

function cleanNumber(token) {
    return token.replace(/[,%]/g, '').trim();
}

function normalizeAmounts(extracted) {
    const normalized = [];
    let successfulNormalizations = 0;
    let monetaryContextCount = 0;
    
    for (const item of extracted) {
        const raw = item.raw || '';
        if (!raw) {
            normalized.push(null);
            continue;
        }
        
        // Skip percentages in normalized output (but keep them in raw_tokens)
        if (raw.includes('%')) {
            normalized.push(null);
            continue;
        }
        
        const fixed = fixOcrErrors(raw);
        const cleaned = cleanNumber(fixed);
        
        // Check if it's a valid number
        if (!/^\d+(\.\d+)?$/.test(cleaned)) {
            normalized.push(null);
            continue;
        }
        
        try {
            const value = parseInt(parseFloat(cleaned));
            
            // Filter out unrealistic amounts for medical bills
            if (value < 1 || value > 10000000) {
                normalized.push(null);
                continue;
            }
            
            normalized.push(value);
            successfulNormalizations++;
            
            // Count items with monetary context for confidence boost
            if (item.hasMonetaryContext) {
                monetaryContextCount++;
            }
            
        } catch (error) {
            normalized.push(null);
        }
    }
    
    // Enhanced confidence calculation
    let confidence = 0;
    if (extracted.length > 0) {
        const baseConfidence = successfulNormalizations / extracted.length;
        const contextBonus = monetaryContextCount > 0 ? (monetaryContextCount / extracted.length) * 0.3 : 0;
        confidence = Math.min(1.0, baseConfidence + contextBonus);
    }
    
    return {
        normalized_amounts: normalized,
        normalization_confidence: Math.round(confidence * 100) / 100
    };
}

module.exports = { normalizeAmounts };