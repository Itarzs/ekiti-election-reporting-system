const fs = require('fs');
let content = fs.readFileSync('src/data/ekitiPUs.ts', 'utf8');

content = content.replace(/"GBONYIN"/g, '"GBOYIN"');
content = content.replace(/"IDO \/ OSI"/g, '"IDO OSI"');
content = content.replace(/"IJERO"/g, '"IJERO EKITI"');
content = content.replace(/"IKERE"/g, '"IKERE EKITI"');
content = content.replace(/"ISE \/ORUN"/g, '"ISE/ORUN"');

fs.writeFileSync('src/data/ekitiPUs.ts', content);
console.log("Updated ekitiPUs.ts");
