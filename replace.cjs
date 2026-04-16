const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// replace the hook definition
code = code.replace(/const \[showErrorAlert, setShowErrorAlert\] = useState<string \| null>\(null\);/, 'const { showToast } = useToast();\n  const [showErrorAlert, setShowErrorAlert] = useState<string | null>(null);'); // keeping showErrorAlert for any that were missed by regex

// replace the blocks
code = code.replace(/setShowErrorAlert\(([`'"])(.*?)\1\);\s*setTimeout\(\(\) => setShowErrorAlert\(null\), 3000\);/g, 'showToast($1$2$1, "error");');

fs.writeFileSync('App.tsx', code);
console.log('done');
