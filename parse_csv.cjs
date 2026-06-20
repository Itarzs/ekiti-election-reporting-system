const fs = require('fs');
const content = fs.readFileSync('Ekiti State Gov Irev Results 2026 - PU Results .csv', 'utf8');
const lines = content.split('\n');

let startParsing = false;
let tuples = [];

// Papa parse would be better, but let's do a simple parse
// actually, let's use a regex to handle quotes in CSV

function parseCsvLine(text) {
  let ret = [''], i = 0, p = '', s = true;
  for (let l in text) {
    l = text[l];
    if ('"' === l) {
      s = !s;
      if ('"' === p) {
        ret[i] += '"';
        l = '-';
      } else if (p === '') {
        l = '-';
      }
    } else if (s && ',' === l) {
      l = ret[++i] = '';
    } else {
      ret[i] += l;
    }
    p = l;
  }
  return ret;
}

let count = 0;
for (const line of lines) {
  if (line.startsWith('LGA,WARD')) {
    startParsing = true;
    continue;
  }
  if (startParsing) {
    if (!line.trim() || line.startsWith(',SUM')) continue;
    const cols = parseCsvLine(line.trim());
    if (cols.length >= 5) {
      const lga = cols[0];
      const ward = cols[1];
      const wardCode = cols[2];
      const puName = cols[3];
      const puCode = cols[4];
      if (lga) {
        tuples.push(`  [${JSON.stringify(lga)}, ${JSON.stringify(ward)}, ${JSON.stringify(wardCode)}, ${JSON.stringify(puName)}, ${JSON.stringify(puCode)}, 0]`);
        count++;
      }
    }
  }
}

const out = `import { PollingUnitResult } from "../types";

export const EKITI_RAW_TUPLES: [string, string, string, string, string, number][] = [
${tuples.join(',\n')}
];

export const PREFILLED_VOTES_DEMO: { [puIndex: number]: { accredited: number; votes: Record<string, number> } } = {};
`;

fs.writeFileSync('src/data/ekitiPUs.ts', out);
console.log('Parsed', count, 'PUs');
