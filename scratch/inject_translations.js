const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, '../constants.tsx');
let content = fs.readFileSync(constantsPath, 'utf8');

const arHi = require('./ar_hi_translations.js');
const arString = JSON.stringify(arHi.ar, null, 4).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'");
const hiString = JSON.stringify(arHi.hi, null, 4).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'");

// Inject newSupplier and addStockLog to EN
if (!content.includes("newSupplier: 'New Supplier'")) {
    content = content.replace(
        "stockLogs: 'Stock Logs',",
        "stockLogs: 'Stock Logs',\n    newSupplier: 'New Supplier',\n    addStockLog: 'Add Stock Log',"
    );
}

// Inject newSupplier and addStockLog to UR
if (!content.includes("newSupplier: 'مورد جديد'")) {
    content = content.replace(
        "stockLogs: 'اسٹاک لاگز',",
        "stockLogs: 'اسٹاک لاگز',\n    newSupplier: 'نیا سپلائر',\n    addStockLog: 'نیا اسٹاک لاگ',"
    );
}

// Inject ar and hi
if (!content.includes('ar: {') && content.includes('ur: {')) {
    // Find the end of ur block which is roughly `  }` before `};`
    content = content.replace(
        "  }\n};",
        "  },\n  ar: " + arString + ",\n  hi: " + hiString + "\n};"
    );
}

fs.writeFileSync(constantsPath, content, 'utf8');
console.log('Translations updated successfully.');
