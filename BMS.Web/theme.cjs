const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file === 'node_modules') continue;
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css') || fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updatedContent = content
                // Replace colors
                .replace(/indigo-/g, 'red-')
                .replace(/violet-/g, 'yellow-')
                .replace(/blue-/g, 'yellow-')
                .replace(/slate-/g, 'gray-')
                
                // Replace text and branding
                .replace(/Ayansh Enterprise/gi, 'AYANSH ENTERPRISES')
                .replace(/>Enterprise</g, '>ENTERPRISES<')
                .replace(/Enterprise Console/g, 'ENTERPRISES Console');
                
            // In Login.tsx, update the dark background specifically
            if (file === 'Login.tsx') {
                updatedContent = updatedContent.replace(/bg-\[#0f172a\]/g, 'bg-gray-900');
            }

            if (content !== updatedContent) {
                fs.writeFileSync(fullPath, updatedContent);
                console.log('Updated', fullPath);
            }
        }
    }
}
processDir('./src');
processDir('./'); // To catch index.html
