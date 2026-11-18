export const DEFAULT_WEIGHTS={industry:30,function:30,alumni:15,size:10,opportunity:15};
export const FACTORS={industry:'Industry fit',function:'Job function',alumni:'BU alumni',size:'Organization size',opportunity:'Opportunity signal'};
export function classify(person){
const h=person.headline.normalize('NFKC').toLowerCase();
const bu=/boston university|\bbu (cfa|spark|adlab)\b/.test(h),alumni=bu&&/alumn|alumi/.test(h)?true:null;
const talent=/recruit|talent|headhunt|executive search|human resource|\bhr(bp|d|m)?\b|猎头|招聘|人力资源/.test(h);
const student=/student|candidate|intern\b|学生|在读|rising.*senior|(?:senior|junior|sophomore|freshman) at .*university/.test(h);
const creative=/design|creative|art direct|illustrat|branding|typograph|animation|motion|视觉|设计/.test(h);
const motion=/motion|animation|animator|cgi|vfx|film|multimedia|video|production|producer/.test(h);
const brand=/brand|graphic|packag|visual|typograph|editorial|publication|illustrat|communication design/.test(h);
const product=/ux|ui\b|product design|web design|interaction|digital design/.test(h);
const marketing=/marketing|strateg|advertis|communication|public relations|\bpr\b|account|client/.test(h);
const leadership=/director|\bhead\b|principal|founder|partner|\bchief\b|\bceo\b|\bvp\b|president|总监|总经理/.test(h);
let level=0,levelLabel='Unclear';
const ownTitle=talent?h.split(/hiring[!:]?|seeking|looking for/)[0]:h;
if(student){level=1;levelLabel='Student / early career';}
else if(/\b(ceo|cfo|cto|cmo|coo|cpo)\b|chief|founder|president|\bvp\b|vice president|managing partner|owner|总经理/.test(ownTitle)){level=6;levelLabel='Executive / founder';}
else if(/director|\bhead\b|principal|总监/.test(ownTitle)){level=5;levelLabel='Director / head / principal';}
else if(/\blead\b|manager|partner|professor|经理/.test(ownTitle)){level=4;levelLabel='Lead / manager / faculty';}
else if(/senior|\bsr\.?\b|资深/.test(ownTitle)){level=3;levelLabel='Senior individual contributor';}
else if(/designer|specialist|consultant|engineer|strategist|recruiter|analyst|artist|设计师/.test(ownTitle)){level=2;levelLabel='Individual contributor';}
const cluster=talent?'Talent & recruiting':student&&bu&&!creative?'BU community':creative&&leadership&&!student?'Creative leadership':motion?'Motion & media':brand||creative&&!product?'Brand & graphic':product?'Product & digital':marketing?'Marketing & strategy':bu?'BU community':'Other disciplines';
const industry=creative||/design|brand consult|advertis|agency|wpp|elmwood|cowan|monks|stoltze|trivium/.test(h)?1:marketing?.75:talent?.65:/finance|bank|insurance|engineer|industrial|医药|银行/.test(h)?.2:null;
const fn=talent?.9:brand||motion?1:product?.8:creative?.9:marketing?.65:student&&bu?.5:null;
const opp=talent&&creative?1:talent?.85:creative&&leadership&&!student?.85:creative&&!student?.65:student?.35:null;
const signals={industry,function:fn,alumni:alumni===true?1:null,size:null,opportunity:opp};return {...person,bu,alumni,level,levelLabel,cluster,baseSignals:{...signals},signals};
}
export function scorePerson(p,weights=DEFAULT_WEIGHTS,overrides={},sizePreference='all'){
const signals={...(p.baseSignals||p.signals)};if(overrides.alumni==='yes')signals.alumni=1;else if(overrides.alumni==='no')signals.alumni=0;
const size=overrides.size||p.orgSize;if(size&&size!=='unknown')signals.size=sizePreference==='all'?1:(size===sizePreference?1:.25);
if(overrides.opportunity!==undefined&&overrides.opportunity!=='unknown')signals.opportunity=Number(overrides.opportunity);
let total=0,sum=0,known=0;for(const k of Object.keys(DEFAULT_WEIGHTS)){const w=Number(weights[k])||0;total+=w;sum+=w*(signals[k]??.5);if(signals[k]!==null)known+=w;}
return {score:total?Math.round(sum/total*100):50,coverage:total?Math.round(known/total*100):0,signals};}

// Only extract role/employer text explicitly present in the captured profile data.
export function currentRole(person){
 const headline=String(person.headline||'').trim(),roleWord=/designer|design director|director|professor|principal|founder|owner|partner|president|chief|\b[cv]eo\b|\b[cv]to\b|\bvp\b|vice president|manager|recruiter|talent|specialist|consultant|engineer|strategist|analyst|artist|animator|illustrator|producer|writer|editor|student|intern|assistant|lead|head|developer|architect|coordinator|executive|officer|设计师|总监|经理/i;
 let title=String(person.currentTitle||person.title||'').trim(),company=String(person.currentCompany||person.company||person.organization||'').trim();
 const chunks=headline.split(/\s*[|•·\n]\s*/).filter(Boolean);
 for(const chunk of chunks){const match=chunk.match(/^(.+?)\s+(?:at\s+|@\s*)(.+)$/i);if(match&&roleWord.test(match[1])){title||=match[1].trim();company||=match[2].split(/\s+(?:and|&)\s+(?=(?:principal|founder|owner|director|professor|student|intern)\b)|,\s*(?=(?:student|intern)\b)/i)[0].trim();break;}}
 if(!title){const first=chunks[0]||'';const comma=first.match(/^((?:co[- ]?)?(?:founder|owner|president|chief[^,]*|creative director|managing partner))\s*,\s*(.+)$/i);if(comma){title=comma[1];company||=comma[2];}else if(roleWord.test(first)&&first.length<150&&!/^(?:i\b|helping\b|we\b)/i.test(first)){title=first;}}
 return{title:title||null,company:company||null,source:'Captured LinkedIn headline; not live-verified'};
}

// Category hues from the colour-notation reference; dim/desaturated to bright/saturated relevance endpoints.
export const CATEGORY_PALETTE={
 'Brand & graphic':{light:'#25f4a0',dark:'#25372f'},
 'Creative leadership':{light:'#20eee2',dark:'#253735'},
 'Motion & media':{light:'#27dcff',dark:'#253438'},
 'Product & digital':{light:'#4b9fff',dark:'#28303d'},
 'Talent & recruiting':{light:'#b457ff',dark:'#33293b'},
 'Marketing & strategy':{light:'#ee49ff',dark:'#392b3c'},
 'BU community':{light:'#ff61b7',dark:'#3b2e34'},
 'Other disciplines':{light:'#ff5a77',dark:'#3b2e30'}
};
export function categoryColor(score,category='Other disciplines'){const p=CATEGORY_PALETTE[category]||CATEGORY_PALETTE['Other disciplines'],t=Math.max(0,Math.min(1,(Number(score)||0)/100)),rgb=c=>c.slice(1).match(/../g).map(v=>parseInt(v,16)),a=rgb(p.dark),b=rgb(p.light);return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('');}
export function categoryDetails(person){
 const text=String(person.headline||'').normalize('NFKC'),h=text.toLowerCase(),evidence=[];
 const talentPattern=/recruit\w*|talent\s*(?:acquisition|advis\w*|manager|management|director|search|scout|solution|leader|development)|headhunt\w*|executive search|human resources?|human capital|\bhr(?:bp|d|m|\s*(?:manager|director|head|executive|specialist|coe|operations|management|consulting|auditor))?\b|people (?:and|&|director|capability)|workforce planning|\bta (?:manager|lead|leader|&)|猎头|招聘|人力资源|人才发展|薪酬|gestión y desarrollo de personas/i;
 const talent=talentPattern.test(h);
 // Advertised vacancies and the sectors a recruiter serves are not their own disciplines.
 const own=talent?h.split(/hiring[!:]?|we are hiring|recruiting for|recruit\/source|speciali[sz](?:ed|ing|t) (?:in|for)|(?:executive search|recruitment) (?:in|for)/)[0]:h;
 const role=talent?(currentRole({...person,headline:own}).title||own).toLowerCase():own;
 const add=(category,regex,source=h,confidence='explicit')=>{const match=source.match(regex);if(match)evidence.push({category,evidence:match[0],confidence});return !!match;};
 const talentRole=talent?role.split(/\s+for\s+|\s+at\s+|\s+@\s+/)[0]:role;
 if(talent)add('Talent & recruiting',talentPattern);
 const professional=h.split('|').map(part=>part.split(/\s+(?:at|@)\s+/)[0]).join(' | ');
 const designText=talent?own.split('|').filter(part=>/designer|art director|creative director|illustrator|animator|photographer/.test(part)&&!/recruit|search|hiring|talent|headhunt/.test(part)).join(' | '):professional;
 const design=/graphic|brand(?:ing)? (?:design|identity)|(?:design(?:ing)?|designer) (?:brands|identit)|visual (?:design|artist|art|communication)|packag(?:ing|e) (?:design|specialist)|typograph|illustrat|art direct|editorial|publication design|communication design|视觉|平面|包装设计/;
 const product=/\bux\b|\bui\b|user experience|experience design|user interface|product (?:design|manager|experience)|digital product|interact(?:ion|ive)|computer science|human computer interaction|web (?:design|develop)|websites|front[ -]?end|backend develop|software engineer|python engineer|solutions? architect|enterprise architect|产品设计|前端开发/;
 const motion=/motion (?:design|graphic)|\bmotion designer|animat|\bcgi\b|\bvfx\b|\bfilm\b|\bvideo\b|photograph|multimedia|media producer|content producer|executive producer|\bproducer\b|podcast|youtuber|digital artist|new media|cross media|integrated production|show production|content editor|publishing|journalist|copywriter|published author|\bphotograhy\b|摄影|动画/;
 const creative=/design|creative|art direct|illustrat|visual art|artist|typograph|animation|motion|出版|设计|视觉/;
 let brand=add('Brand & graphic',design,designText);
 const isProduct=add('Product & digital',product,designText),isMotion=add('Motion & media',motion,designText);
 // General designers belong in the design category, with ambiguity recorded, rather than discarded.
 if(!brand&&!isProduct&&!isMotion&&/\bdesigner\b|\bdesign\b|freelance creative|creative problem.solver|brand creative|designing things|\bartist\b|设计师|\bvisuals?\b/.test(designText)){evidence.push({category:'Brand & graphic',evidence:designText.match(/designer|design|creative|artist|visuals?|设计师/)[0],confidence:'broad design discipline'});brand=true;}
 const leader=/art direct|creative direct|creative lead|creative operations|creative (?:direction|management)|design (?:director|lead|manager)|\blead designer|principal(?:,|\s+)(?:experience |graphic |product |senior )?designer|found(?:er|ing partner)|\bowner\b|own creative agency|solopreneur|managing partner|\bprincipal\b|\bchief\b|\bvice president\b|\bvp\b|\bpresident\b|program lead|head of|总监/;
 if(creative.test(designText)&&leader.test(talent?designText:h))add('Creative leadership',leader,talent?designText:h);
 const marketing=/marketing|\bmarketer\b|brand (?:strateg|build|manager|director|consultant|marketer|position|executive)|branding strateg|brand(?:ing)?\s*[|&/]\s*marketing|advertis|public relations|\bpr\b|communicat(?!ion design)|copywrit|copy director|creative (?:planner|strategist)|client (?:lead|partner|growth|manager|partnership)|accounts? (?:director|manager|executive)|head of account|consumer (?:choice|insight)|growth (?:strateg|at)|go.to.market|\bstrategy\b|\bstrategist\b|attract clients|win clients|branding pm|strategic consultant|ecommerce|e-commerce|social media|商务|市场|品牌策略/;
 add('Marketing & strategy',marketing,(talent?talentRole:professional).replace(/visual communication|(?:brand )?communication design/g,''));
 add('BU community',/boston university|\bbu\s+(?:cfa|spark|adlab)\b/,h+' '+String(person.organization||'').toLowerCase());
 if(!talent)add('Other disciplines',/financial|accountant|\bfinance\b|\bbank(?:ing)?\b|insurance|legal|case manager|physiotherap|life science|energy|industrial|manufactur|procurement|supply chain|forklift|construction|scada|project manag|program manag|treasury|税|财务|银行|酒店/,professional);
 // Subject-specific memberships supplement BU; BU alone is a complete, supported affiliation.
 if(!evidence.length)evidence.push({category:'Other disciplines',evidence:h&&h!=='--'?text:'No professional detail in captured headline',confidence:'insufficient discipline evidence'});
 const ordered=Object.keys(CATEGORY_PALETTE).filter(c=>evidence.some(e=>e.category===c));
 return{categories:ordered,categoryEvidence:evidence};
}
export function memberships(person,annotation={}){const categories=[...(person.categories||categoryDetails(person).categories)];if(annotation.alumni==='yes'&&!categories.includes('BU community'))categories.push('BU community');return categories;}

export function eligibleExternal(discovery,ownerId,directNodes,weights=DEFAULT_WEIGHTS,annotations={},sizePreference='all'){
 const canonical=url=>String(url).replace(/\?.*$/,'').replace(/\/$/,'').toLowerCase(),direct=new Set(directNodes.map(n=>canonical(n.url))),linked=new Map((discovery?.links||[]).filter(e=>e.source===ownerId&&/^https:\/\/www.linkedin.com\//.test(e.evidence||'')).map(e=>[e.target,e])),seen=new Set();
 return(discovery?.nodes||[]).flatMap(person=>{if(!linked.has(person.id)||person.observedDegree!==2||direct.has(canonical(person.url))||seen.has(canonical(person.url)))return[];seen.add(canonical(person.url));const score=scorePerson(person,weights,annotations[person.id],sizePreference);if(score.score<=60)return[];return[{...person,...score,viaOwner:ownerId,external:true,displayCategories:memberships(person,annotations[person.id]),evidence:linked.get(person.id).evidence}];}).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}
