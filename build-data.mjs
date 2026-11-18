import fs from 'node:fs';
import {classify,scorePerson} from './dist/model.mjs';
const raw=JSON.parse(fs.readFileSync('connections-raw.json','utf8')),pages=JSON.parse(fs.readFileSync('mutual-pages.json','utf8'));
const norm=u=>u.replace(/\?.*$/,'').replace(/\/$/,'').toLowerCase();
const nodes=raw.connections.map((r,i)=>classify({...r,id:'p'+i,headline:r.headline.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig,'').replace(/\+\d[\d ()-]{8,}\d/g,'').trim()}));
const byUrl=new Map(nodes.map(n=>[norm(n.url),n])),edgeMap=new Map();
function add(a,b,source){a=byUrl.get(norm(a));b=byUrl.get(norm(b));if(!a||!b||a.id===b.id)return;const key=[a.id,b.id].sort().join('|');if(!edgeMap.has(key))edgeMap.set(key,{source:a.id,target:b.id,evidence:source});}
for(const page of pages)for(const card of page.cards){add(page.owner,card.url,page.source);for(const m of card.mutuals)add(card.url,m,page.source);}
add('https://www.linkedin.com/in/adkelley/','https://www.linkedin.com/in/kirsten-holmes-94508b11/','https://www.linkedin.com/in/adkelley/');
const companies=[{match:/trivium interactive/i,name:'Trivium Interactive',size:'small',range:'11–50 employees',industry:'Design Services',url:'https://www.linkedin.com/company/trivium-interactive-llc'},{match:/stoltze design/i,name:'Stoltze Design Group',size:'small',range:'11–50 employees',industry:'Graphic Design',url:'https://www.linkedin.com/company/stoltze-design'},{match:/workshop\/apd/i,name:'Workshop/APD',size:'medium',range:'51–200 employees',industry:'Architecture and Planning',url:'https://www.linkedin.com/company/workshop-apd'}];
for(const n of nodes){const c=companies.find(c=>c.match.test(n.headline));if(c){n.organization=c.name;n.orgSize=c.size;n.orgSizeRange=c.range;n.orgSource=c.url;n.orgIndustry=c.industry;}}
const existingDiscovery=fs.existsSync('dist/data.json')?JSON.parse(fs.readFileSync('dist/data.json')).discovery:undefined;
const data={discovery:existingDiscovery,meta:{reportedTotal:603,availableTotal:nodes.length,unavailableTotal:603-nodes.length,capturedDate:'2026-11-16',source:raw.source,profile:'Andi Zhang',focus:'Graphic & motion design',method:'Headline-based estimates; six profile spot checks and verified mutual-result pages. No exhaustive profile or mutual-graph audit.',mutualCoverage:'Partial: six mutual lists plus Adam Kelley’s visible mutual connection.',companyCoverage:'Three company pages checked; all other organization sizes unknown.'},nodes,edges:[...edgeMap.values()]};fs.writeFileSync('dist/data.json',JSON.stringify(data));
const counts={};for(const n of nodes)counts[n.cluster]=(counts[n.cluster]||0)+1;console.log(JSON.stringify({nodes:nodes.length,edges:data.edges.length,clusters:counts,buTies:nodes.filter(n=>n.bu).length,explicitAlumni:nodes.filter(n=>n.alumni===true).length,knownOrgSizes:nodes.filter(n=>n.orgSize).length,top:nodes.map(n=>({name:n.name,score:scorePerson(n).score})).sort((a,b)=>b.score-a.score).slice(0,10)},null,2));

await import('./review-categories.mjs');
