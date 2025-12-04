// Enhanced keyword mapping for medical bills with proper priority
const PRIORITY_RULES = [
    // Highest priority - main bill amounts (order matters!)
    [['total', 'grand', 'final'], 'total_bill', 4],
    [['due', 'balance', 'outstanding', 'pending'], 'due', 3],
    [['paid', 'payment', 'received'], 'paid', 3],
    [['discount', '%'], 'discount', 2],
    [['tax', 'gst', 'vat'], 'tax', 2],
    
    // Medium priority - service categories
    [['consultation', 'consult', 'doctor', 'physician'], 'consultation', 2],
    [['procedure', 'surgery', 'operation', 'theatre'], 'procedure', 2],
    [['medicine', 'drug', 'pharmacy'], 'medicine', 2],
    [['test', 'lab', 'laboratory', 'investigation'], 'test', 2],
    [['admission', 'bed', 'room', 'ward'], 'accommodation', 2],
    [['therapy', 'treatment', 'physiotherapy'], 'therapy', 1],
    [['feeding', 'meal', 'diet'], 'feeding', 1],
    [['immunization', 'vaccination', 'vaccine'], 'immunization', 1]
];

function matchRule(context, detectedLabel) {
    const lowerContext = context.toLowerCase();
    const lowerLabel = detectedLabel && detectedLabel !== 'unknown' ? detectedLabel.toLowerCase() : null;

    // 1. Try to match detected label against rules
    if (lowerLabel) {
        for (const [keywords, type] of PRIORITY_RULES) {
            if (keywords.includes(lowerLabel)) {
                return type;
            }
        }
        // If label exists but not in rules, return it as is (legacy behavior)
        return lowerLabel;
    }

    // 2. Fallback to context matching against rules
    for (const [keywords, type] of PRIORITY_RULES) {
        if (keywords.some(keyword => lowerContext.includes(keyword))) {
            return type;
        }
    }
    
    return 'unknown';
}

function classifyAmounts(extracted, normalized) {
    const amounts = [];
    let matches = 0;
    let highPriorityMatches = 0;
    
    for (let idx = 0; idx < normalized.length; idx++) {
        const value = normalized[idx];
        if (value === null) {
            amounts.push(null);
            continue;
        }
        
        let label = 'unknown';
        let hasMonetaryContext = false;
        
        if (idx < extracted.length) {
            const tokenInfo = extracted[idx];
            const context = `${tokenInfo.left || ''} ${tokenInfo.raw || ''} ${tokenInfo.right || ''}`;
            
            label = matchRule(context, tokenInfo.label);
            
            hasMonetaryContext = tokenInfo.hasMonetaryContext || false;
        }
        
        if (label !== 'unknown') {
            matches++;
            if (['total_bill', 'paid', 'due'].includes(label)) {
                highPriorityMatches++;
            }
        }
        
        // Boost confidence for amounts with monetary context
        if (hasMonetaryContext && label === 'unknown') {
            matches += 0.5; // Partial credit
        }
        
        amounts.push({ type: label, value: value });
    }
    
    // Enhanced confidence calculation
    let confidence = 0;
    if (normalized.length > 0) {
        const baseConfidence = matches / normalized.length;
        const priorityBonus = highPriorityMatches > 0 ? 0.2 : 0;
        confidence = Math.min(1.0, baseConfidence + priorityBonus);
    }
    
    return {
        amounts: amounts,
        confidence: Math.round(confidence * 100) / 100
    };
}

module.exports = { classifyAmounts };