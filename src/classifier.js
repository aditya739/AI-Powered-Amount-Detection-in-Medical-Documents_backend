// Enhanced keyword mapping for medical bills
const PRIORITY_RULES = [
    // High priority - main bill amounts
    [['total', 'grand', 'final'], 'total_bill', 3],
    [['paid', 'payment', 'received'], 'paid', 3],
    [['due', 'balance', 'outstanding', 'pending'], 'due', 3],
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

function matchRule(context) {
    const lowered = context.toLowerCase();
    let bestMatch = { label: 'unknown', priority: 0 };
    
    for (const [keywords, label, priority] of PRIORITY_RULES) {
        for (const keyword of keywords) {
            if (lowered.includes(keyword)) {
                if (priority > bestMatch.priority) {
                    bestMatch = { label, priority };
                }
            }
        }
    }
    
    return bestMatch.label;
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
            label = matchRule(context);
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