import fs from 'node:fs';
const file='dist/data.json',data=JSON.parse(fs.readFileSync(file));const {categoryDetails}=await import('./dist/model.mjs');
const counts={};let overlap=0;
for(const n of data.nodes){Object.assign(n,categoryDetails(n));for(const c of n.categories)counts[c]=(counts[c]||0)+1;if(n.categories.length>1)overlap++;}
data.meta.categoryReview={date:'2026-11-17',profiles:data.nodes.length,source:'All captured LinkedIn headlines and available organization fields',method:'Nonexclusive professional/BU memberships with per-person evidence; general design and insufficient detail are marked; not live-verified',counts,overlappingProfiles:overlap};
fs.writeFileSync(file,JSON.stringify(data)+'\n');
const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/category-review.csv',[['ID','Name','Captured headline','Categories','Evidence / confidence'].map(quote).join(','),...data.nodes.map(n=>[n.id,n.name,n.headline,n.categories.join('; '),n.categoryEvidence.map(e=>`${e.category}: ${e.evidence} (${e.confidence})`).join('; ')].map(quote).join(','))].join('\n')+'\n');console.log({counts,overlap});
