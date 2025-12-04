const { extractAmounts } = require('./src/extractor');
const { classifyAmounts } = require('./src/classifier');
const { normalizeAmounts } = require('./src/normalizer');

const input = "Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%";
console.log("Testing Input:", input);

const extracted = extractAmounts(input);
const normalized = normalizeAmounts(extracted);
const classified = classifyAmounts(extracted, normalized.normalized_amounts);

console.log("\nClassified Output:");
console.log(JSON.stringify(classified, null, 2));
