import fs from 'fs';
import vm from 'vm';

// The exported helpers from the package return duplicates; instead, read the
// bundled data object directly so counts align with the official total (14,837).
const bundle = fs.readFileSync('node_modules/rwanda/dist/rwanda.umd.cjs', 'utf8');
const match = bundle.match(/const a=\{[\s\S]*?\};function/);
if (!match) {
  throw new Error('Could not locate data blob in rwanda package');
}
const objSrc = match[0].replace(/;function.*/, ''); // strip trailing code
const dataObject = vm.runInNewContext(objSrc + '; a;');

const districtCounts = [];
let total = 0;

for (const [province, provinceData] of Object.entries(dataObject)) {
  for (const [district, districtData] of Object.entries(provinceData)) {
    let districtTotal = 0;
    for (const sectorData of Object.values(districtData)) {
      for (const cellVillages of Object.values(sectorData)) {
        districtTotal += cellVillages.length;
      }
    }
    districtCounts.push({ province, district, villages: districtTotal });
    total += districtTotal;
  }
}

console.log('Provinces:', Object.keys(dataObject));
console.log('Total villages (official bundle):', total);
console.log('Villages per district:');
districtCounts.forEach(({ province, district, villages }) => {
  console.log(`${province} - ${district}: ${villages}`);
});
