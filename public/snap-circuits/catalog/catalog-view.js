(function(root){
  const normalize=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9µ]+/g,' ').trim();
  const typeAliases={kit:'Kit',kits:'Kit',set:'Kit',sets:'Kit',manual:'Manual',manuals:'Manual',instruction:'Manual',instructions:'Manual',guide:'Manual',guides:'Manual',part:'Part',parts:'Part',piece:'Part',pieces:'Part',component:'Part',components:'Part',accessory:'Part',accessories:'Part'};
  const wordAliases={gates:'gate',batteries:'battery',wires:'wire',connectors:'connector',connections:'connection',motors:'motor',lights:'light',leds:'led',resistors:'resistor',capacitors:'capacitor',cap:'capacitor',caps:'capacitor'};
  const words=s=>normalize(s).split(/\s+/).filter(Boolean).map(w=>wordAliases[w]||w);
  const cachedText=new WeakMap();
  function textFor(r){
    if(cachedText.has(r))return cachedText.get(r);
    const identifiers=[r.number,r.code,...(r.aliases||[]),...(r.document_numbers||[]),...(r.tags?.basic_label||[]),...(r.tags?.part_number||[]),...(r.tags?.kit||[])].filter(Boolean);
    const text=words([r.number,r.code,r.name,r.display_name,...(r.filenames||[]),...(r.aliases||[]),...(r.document_numbers||[]),r.filename,...Object.values(r.tags||{}).flat(),...identifiers.map(v=>normalize(v).replaceAll(' ',''))].filter(Boolean).join(' ')).join(' ');
    cachedText.set(r,text);return text;
  }
  let lastQuery,lastParsed;
  function parseQuery(query){
    if(query===lastQuery)return lastParsed;
    const tokens=words(query),types=[...new Set(tokens.map(w=>typeAliases[w]).filter(Boolean))];
    lastQuery=query;return lastParsed={types,terms:tokens.filter(w=>!typeAliases[w])};
  }
  function searchMatches(r,query=''){
    const {types,terms}=parseQuery(query);
    if(types.length&&!types.some(t=>(r.tags?.record_type||[]).includes(t)))return false;
    const text=textFor(r);return terms.every(t=>text.includes(t));
  }
  function compareRecords(a,b){
    const rank=r=>r._kind==='Kit'?0:r._kind==='Manual'?1:2;
    const group=rank(a)-rank(b);if(group)return group;
    const id=r=>r.number||r.code||r.filenames?.[0]||r.filename||'';
    return rank(a)===2?id(b).localeCompare(id(a),'en',{numeric:true,sensitivity:'base'}):id(a).localeCompare(id(b),'en',{numeric:true,sensitivity:'base'});
  }
  function relevance(r,query=''){
    const {terms}=parseQuery(query);if(!terms.length)return 0;
    const phrase=terms.join(' '),compact=phrase.replaceAll(' ','');
    const ids=[r.number,r.code,...(r.tags?.basic_label||[])].filter(Boolean).map(x=>normalize(x).replaceAll(' ',''));
    if(ids.includes(compact))return 100;
    const name=words(r.display_name||r.name||'').join(' ');
    if(name===phrase)return 90;
    if(name.startsWith(phrase))return 80;
    if(name.includes(phrase))return 70;
    if(terms.every(t=>name.includes(t)))return 60;
    if(ids.some(id=>id.startsWith(compact)))return 50;
    return 0;
  }
  function compareSearch(a,b,query=''){return relevance(b,query)-relevance(a,query)||compareRecords(a,b)}
  function suggestions(records,query='',limit=8){
    if(normalize(query).length<2)return [];
    return records.filter(r=>searchMatches(r,query)).sort((a,b)=>compareSearch(a,b,query)).slice(0,limit);
  }
  function matches(r,selection={},query='',omitField){
    if(!searchMatches(r,query))return false;
    return Object.entries(selection).every(([field,values])=>field===omitField||!values.length||values.some(v=>(r.tags?.[field]||[]).includes(v)));
  }
  function facets(records,selection={},query=''){
    const values={};
    for(const r of records)for(const [field,tags] of Object.entries(r.tags||{})){
      if(!matches(r,selection,query,field))continue;
      const bucket=values[field]||(values[field]={});
      for(const value of new Set(tags))bucket[value]=(bucket[value]||0)+1;
    }
    return values;
  }
  const api={matches,facets,textFor,searchMatches,compareRecords,relevance,compareSearch,suggestions};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.InventoryFilters=api;
})(typeof window==='undefined'?globalThis:window);

async function loadCatalog() {
  const read = async path => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Could not load ' + path);
    return response.json();
  };
  const [inventory, offers] = await Promise.all([
    read('catalog-data.json'),
    read('shop-offers.json').catch(error => {
      console.warn(error);
      document.querySelector('[data-tab="shop"]').disabled = true;
      return [];
    })
  ]);
  window.AUDIT = inventory;
const D=window.AUDIT,F=window.InventoryFilters;
const $=s=>document.querySelector(s),el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
let tab='all',selection={},facetQuery='';const expanded=new Set(['record_type','category','function','color']);
const shopPaths=new Set(offers.flatMap(offer=>offer.matches.map(match=>match.path)));
const primary=[...D.kits.map(r=>({...r,_kind:'Kit'})),...D.manuals.map(r=>({...r,_kind:'Manual'})),...D.parts.map(r=>({...r,_kind:'Part'}))].sort(F.compareRecords);
const shopRecords=primary.filter(record=>shopPaths.has(record.page_url));
function records(){return tab==='shop'?shopRecords:tab==='all'?primary:tab==='parts'?primary.filter(r=>r._kind==='Part'):tab==='kits'?primary.filter(r=>r._kind==='Kit'):tab==='manuals'?primary.filter(r=>r._kind==='Manual'):D.sources.map(r=>({...r,_kind:'Source'}))}
function label(r){return r.number||r.code||r.filenames?.[0]||r.filename}
function itemName(r){return r.display_name||r.name||r.filenames?.[0]?.replace(/\.pdf$/i,'').replaceAll('_',' ')||r.filename?.replace(/\.pdf$/i,'').replaceAll('_',' ')||'Name not yet confirmed'}
function status(r){return r.status||r.coverage||r.kind?.replaceAll('_',' ')||''}
function choose(field,value){if(!(selection[field]||[]).includes(value))(selection[field]||(selection[field]=[])).push(value);render()}
function toggle(field,value){const values=selection[field]||[];selection[field]=values.includes(value)?values.filter(x=>x!==value):[...values,value];render()}
for(const [n,label] of [[358,'part / accessory numbers'],[D.kits.length,'kit / model candidates'],[D.manuals.length,'manuals & module sheets'],[D.tag_summary.inventory_records,'inventory records tagged']]){const wrap=el('div');wrap.append(el('strong',n),el('span',label));$('#stats').append(wrap)}
function table(headers,rows){const wrap=el('div',undefined,'table-wrap'),table=el('table'),head=el('thead'),hr=el('tr'),body=el('tbody');if(headers[0]==='Item / Number'){table.className='inventory-table';const cols=el('colgroup');for(const name of ['item','name','type','category','review'])cols.append(el('col',undefined,'column-'+name));table.append(cols)}for(const h of headers)hr.append(el('th',h));head.append(hr);for(const row of rows){const tr=el('tr');for(const value of row){const td=el('td');if(value instanceof Node)td.append(value);else td.textContent=value??'';tr.append(td)}body.append(tr)}table.append(head,body);wrap.append(table);return wrap}
function chip(field,value,clickable=true){const b=el(clickable?'button':'span',value,'tag-chip');if(clickable){b.type='button';b.title='Filter '+(D.tag_schema.fields[field]||field)+' by '+value;b.onclick=()=>{$('#detail').close();choose(field,value)}}return b}
function evidence(list){const ul=el('ul');for(const e of list){const li=el('li');li.append(el('div',(e.source||'Source')+(e.page?' · PDF page '+e.page:'')));if(e.kind)li.append(el('div',e.kind.replaceAll('_',' '),'muted'));if(e.url){const a=el('a','Open source');a.href=e.url+(e.page&&!e.url.includes('#')?'#page='+e.page:'');a.target='_blank';a.rel='noopener';li.append(a)}if(e.excerpt)li.append(el('div',e.excerpt,'excerpt'));ul.append(li)}return ul}
function openRecord(r){$('#title').textContent=label(r);const b=$('#body');b.replaceChildren(el('p',r.display_name||r.name||status(r)));const shopLinks=CatalogShop.itemLinks(offers,r.page_url);if(shopLinks)b.append(shopLinks);if(r.warnings)for(const w of r.warnings)b.append(el('p',w,'flag'));
 if(r.page_url){const p=el('p'),a=el('a','Open item page / permanent link →');a.href=r.page_url;p.append(a);b.append(p)}
 renderMedia(r,b);
 const heading=el('h3','Tags');b.append(heading,el('p','Select any tag to filter the inventory.','muted'));
 for(const [field,values] of Object.entries(r.tags||{})){const group=el('div',undefined,'tag-group'),v=el('div',undefined,'tag-values');group.append(el('h4',D.tag_schema.fields[field]||field));for(const value of values)v.append(chip(field,value));group.append(v);b.append(group)}
 const detail=el('details'),ul=el('ul',undefined,'provenance');detail.append(el('summary','Why these tags were assigned'));
 for(const e of r.tag_evidence||[])ul.append(el('li',(D.tag_schema.fields[e.field]||e.field)+': '+e.value+' · '+e.confidence+' — '+e.basis));detail.append(ul);b.append(detail);
 if(r.evidence){b.append(el('h3','Source evidence'),evidence(r.evidence));if(r.chat_sources?.length)b.append(el('p','Earlier research: '+r.chat_sources.join('; '),'muted'))}
 else {const s=r._kind==='Source'?r:D.sources.find(x=>x.source_id===r.source_id);if(s){b.append(el('h3','Document details'),el('p','Saved names: '+s.aliases.join(', ')),el('p','PDF pages: '+s.pages+' · Parts-table pages: '+(s.parts_list_pages.join(', ')||'None located')),el('p','Document-number mentions: '+(s.manual_numbers.join(', ')||'Unknown')));for(const url of s.urls){const p=el('p'),a=el('a','Open source');a.href=url;a.target='_blank';a.rel='noopener';p.append(a);b.append(p)}}}
 $('#detail').showModal();}
function renderFacets(base){const container=$('#facet-fields');container.replaceChildren();const counts=F.facets(base,selection,$('#search').value);
 const order=['record_type','category','function','color','light_color','basic_label','part_number','kit_family','kit','connection_type','physical_role','variant','availability','verification','review',...Object.keys(D.tag_schema.fields)];
 for(const field of [...new Set(order)]){const bucket=counts[field]||{};for(const v of selection[field]||[])bucket[v]=bucket[v]||0;let options=Object.keys(bucket).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));if(facetQuery&&!((D.tag_schema.fields[field]||field).toLowerCase().includes(facetQuery)))options=options.filter(v=>v.toLowerCase().includes(facetQuery));if(!options.length)continue;
  const details=el('details');details.open=expanded.has(field)||!!facetQuery;details.addEventListener('toggle',()=>{if(details.open)expanded.add(field);else expanded.delete(field)});const selected=(selection[field]||[]).length;details.append(el('summary',(D.tag_schema.fields[field]||field)+(selected?' · '+selected+' selected':'')));const values=el('div',undefined,'facet-options');for(const value of options){const row=el('label',undefined,'facet-option'+(value==='Unknown'||value==='Misc'||value==='Other'?' facet-unknown':'')),input=el('input');input.type='checkbox';input.checked=(selection[field]||[]).includes(value);input.addEventListener('change',()=>toggle(field,value));row.append(input,el('span',value),el('small',bucket[value]));values.append(row)}details.append(values);container.append(details)}
}
function renderActive(){const box=$('#active-tags');box.replaceChildren();for(const [field,values] of Object.entries(selection))for(const value of values){const b=el('button',(D.tag_schema.fields[field]||field)+': '+value+' ×','tag-chip');b.type='button';b.onclick=()=>toggle(field,value);box.append(b)}}
function render(){const content=$('#content');content.replaceChildren();const query=$('#search').value.trim().toLowerCase();const isGaps=tab==='gaps';$('.inventory-layout').classList.toggle('gap-layout',isGaps);$('#facet-panel').hidden=isGaps;$('#download').hidden=isGaps||tab==='shop';
 if(isGaps){const gaps=D.gaps.filter(g=>[g.id,g.finding,g.cause,g.action,g.status].join(' ').toLowerCase().includes(query));for(const g of gaps){const card=el('article',undefined,'gap');card.append(el('div',g.status,'muted'),el('h3',g.id),el('p',g.finding),el('p','Why: '+g.cause),el('p','Decision: '+g.action));content.append(card)}$('#count').textContent=gaps.length+' findings';$('#active-tags').replaceChildren();return}
 const base=records(),rows=base.filter(r=>F.matches(r,selection,query)).sort((a,b)=>F.compareSearch(a,b,query));renderFacets(base);renderActive();
 if(tab==='shop'){
   const count=CatalogShop.renderShop(content,offers,rows,query,Object.values(selection).some(values=>values.length));
   $('#count').textContent=count+' of '+offers.length+' Amazon listings';
   return;
 }
$('#count').textContent=rows.length+' of '+base.length+' records';
 content.append(table(['Item / Number','Name','Type','Category','Functions / review'],rows.map(r=>{const b=el('button',label(r),'row-button number');b.type='button';b.onclick=()=>openRecord(r);const categories=el('div',undefined,'tag-preview');for(const c of r.tags.category||[])categories.append(chip('category',c));const info=el('div');info.append(el('div',(r.tags.function||[]).slice(0,5).join(' · ')),el('div',r.tags.review?.join(' · ')||status(r),'muted'));const item=el('div',undefined,'catalog-item');item.append(thumbnail(r),b);return[item,el('span',itemName(r),'item-name'),r.tags.record_type.join(', '),categories,info]})));
 if(!rows.length)content.append(el('p','No matching items. Remove a selected tag or clear the search.','empty'));
}
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{
 const keepFilters=tab==='shop'||b.dataset.tab==='shop';
 tab=b.dataset.tab;
 if(!keepFilters){selection={};$('#search').value=''}
 hideSuggestions();
 const url=new URL(location.href);
 if(tab==='shop')url.searchParams.set('tab','shop');else url.searchParams.delete('tab');
 if($('#search').value)url.searchParams.set('q',$('#search').value);else url.searchParams.delete('q');
 history.replaceState(null,'',url);
for(const x of document.querySelectorAll('[data-tab]'))x.setAttribute('aria-selected',String(x===b));$('#download').href=tab==='sources'?'source-ledger.csv':'tagged-inventory.csv';render()};
const suggestBox=$('#search-suggestions');let suggested=[],activeSuggestion=-1;
function hideSuggestions(){suggestBox.hidden=true;$('#search').setAttribute('aria-expanded','false');$('#search').removeAttribute('aria-activedescendant');activeSuggestion=-1}
function selectSuggestion(record){
 hideSuggestions();
 if(tab==='shop'){$('#search').value=label(record);render();return}
 openRecord(record);
}
function updateSuggestions(){
 suggested=F.suggestions(records().filter(r=>F.matches(r,selection)), $('#search').value);activeSuggestion=-1;suggestBox.replaceChildren();
 for(const [i,r] of suggested.entries()){const option=el('div',itemName(r)+' · '+label(r)+' · '+(r.tags?.record_type||[r._kind]).join(', '),'search-option');option.id='suggestion-'+i;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.addEventListener('mousedown',e=>e.preventDefault());option.onclick=()=>selectSuggestion(r);suggestBox.append(option)}
 suggestBox.hidden=!suggested.length;$('#search').setAttribute('aria-expanded',String(!!suggested.length));
}
$('#search').addEventListener('input',()=>{render();updateSuggestions()});$('#search').addEventListener('focus',updateSuggestions);$('#search').addEventListener('blur',hideSuggestions);
$('#search').addEventListener('keydown',e=>{
 if(e.key==='Escape'){hideSuggestions();return}
 if(!suggestBox.hidden&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();activeSuggestion=(activeSuggestion+(e.key==='ArrowDown'?1:-1)+suggested.length)%suggested.length;for(const [i,node] of [...suggestBox.children].entries())node.setAttribute('aria-selected',String(i===activeSuggestion));$('#search').setAttribute('aria-activedescendant','suggestion-'+activeSuggestion)}
 if(e.key==='Enter'&&!suggestBox.hidden&&activeSuggestion>=0){e.preventDefault();const r=suggested[activeSuggestion];selectSuggestion(r)}
});
$('#facet-search').addEventListener('input',()=>{facetQuery=$('#facet-search').value.trim().toLowerCase();renderFacets(records())});$('#clear-tags').onclick=()=>{selection={};$('#search').value='';facetQuery='';$('#facet-search').value='';hideSuggestions();render()};$('#close').onclick=()=>$('#detail').close();$('#stage-table').append(table(['Source pass','Number records','Added'],D.summary.stages.map(s=>[s.stage,s.total,s.added])));$('#search').value=new URLSearchParams(location.search).get('q')||'';
if(new URLSearchParams(location.search).get('tab')==='shop'){
 tab='shop';
 for(const button of document.querySelectorAll('[data-tab]'))button.setAttribute('aria-selected',String(button.dataset.tab==='shop'));
}
render();

function thumbnail(r){
 const holder=el('div',undefined,'catalog-thumbnail'),image=el('img'),media=r.image||{path:'images/placeholder.svg',kind:'Placeholder'};
 image.src=media.path;image.alt=media.kind+' — '+label(r);image.width=120;image.height=90;image.loading='lazy';holder.append(image);
 if(!['Manual illustration','Product image','Catalog image'].includes(media.kind))holder.append(el('small',media.kind));
 return holder;
}
function renderMedia(r,b){
 const media=r.image;
 if(media){
  const figure=el('figure',undefined,'detail-media'),image=el('img');image.src=media.path;image.alt=media.kind+' — '+label(r);image.width=320;image.height=240;figure.append(image);
  const caption=el('figcaption');caption.append(el('span',media.kind+(media.credit?' · '+media.credit:'')));
  if(media.note)caption.append(el('strong',media.note));
  if(media.source){const a=el('a','Image source ↗');a.href=media.source+(media.page?'#page='+media.page:'');a.target='_blank';a.rel='noopener';caption.append(a)}
  for(const source of media.sources||[]){const a=el('a',source.title+' source ↗');a.href=source.url+(source.page?'#page='+source.page:'');a.target='_blank';a.rel='noopener';caption.append(a)}
  figure.append(caption);b.append(figure);
 }
 const panel=el('section',undefined,'official-manuals');panel.append(el('h3','Elenco manuals & references'));
 const links=r.manual_links||[];
 if(links.length){for(const link of links){const p=el('p'),a=el('a',link.title+(link.page?' · PDF page '+link.page:'')+' ↗');a.href=link.url+(link.page&&!link.url.includes('#')?'#page='+link.page:'');a.target='_blank';a.rel='noopener';p.append(a);panel.append(p)}}
 else{const p=el('p'),a=el('a','Find a manual in Elenco’s official library ↗');a.href='https://www.elenco.com/new-manuals/';a.target='_blank';a.rel='noopener';p.append(a);panel.append(p)}
 b.append(panel);
}

}
loadCatalog().catch(error => {
  console.error(error);
  document.querySelector('#count').textContent = 'The catalog could not load. Refresh to try again.';
});
