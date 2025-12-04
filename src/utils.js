const { detectCurrency } = require('./extractor');

function weightedAverage(confidences, weights = null) {
    if (confidences.length === 0) return 0.0;
    
    if (!weights) {
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return 0.0;
    
    const weightedSum = confidences.reduce((sum, conf, idx) => sum + conf * weights[idx], 0);
    return weightedSum / totalWeight;
}

function buildFinalResponse(ocrResult, extracted, normalized, classified) {
    const currency = detectCurrency(ocrResult.text || '');
    
    // Build amounts with source provenance (only for non-null normalized amounts)
    const amountsWithSource = [];
    for (let idx = 0; idx < classified.amounts.length; idx++) {
        const amountDict = classified.amounts[idx];
        if (amountDict === null) continue;
        
        const { value, type } = amountDict;
        let source = '';
        
        if (idx < extracted.length) {
            const tokenInfo = extracted[idx];
            const left = (tokenInfo.left || '').trim();
            const raw = tokenInfo.raw || '';
            const right = (tokenInfo.right || '').trim();
            
            // Build a cleaner source context
            const contextParts = [];
            if (left) contextParts.push(left.split(/\s+/).slice(-3).join(' '));
            contextParts.push(raw);
            if (right) contextParts.push(right.split(/\s+/).slice(0, 3).join(' '));
            
            source = `text: '${contextParts.join(' ').trim()}'`;
        }
        
        amountsWithSource.push({ type, value, source });
    }
    
    // Calculate overall confidence
    const ocrConf = ocrResult.ocr_confidence || 1.0;
    const normConf = normalized.normalization_confidence || 0.0;
    const classConf = classified.confidence || 0.0;
    const overallConf = weightedAverage([ocrConf, normConf, classConf]);
    
    if (amountsWithSource.length === 0) {
        return {
            status: 'no_amounts_found',
            reason: 'document too noisy'
        };
    }
    
    // Include ALL raw tokens (including percentages)
    const rawTokens = extracted.map(item => item.raw || '').filter(token => token);
    
    return {
        currency: currency,
        amounts: amountsWithSource,
        status: 'ok',
        raw_tokens: rawTokens,
        overall_confidence: Math.round(overallConf * 100) / 100
    };
}

module.exports = { buildFinalResponse };