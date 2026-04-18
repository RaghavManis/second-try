const fs = require('fs');
const content = fs.readFileSync('src/pages/LiveMatch.tsx', 'utf8');

let divStack = 0;
let fragStack = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let dO = (line.match(/<div/g) || []).length;
    let dC = (line.match(/<\/div>/g) || []).length;
    let fO = (line.match(/<>/g) || []).length;
    let fC = (line.match(/<\/>/g) || []).length;
    
    divStack += dO - dC;
    fragStack += fO - fC;
    
    if (i >= 350 && i <= 650) {
        console.log(`${i + 1}: Div:${divStack} Frag:${fragStack} | ${line.trim()}`);
    }
}
