const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),D=require('../dist/data.js');
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',addEventListener(){}});return elements.get(id)};
const buttons=['value','mom','yoy'].map(sort=>({dataset:{sort},focus(){}}));
const ctx={DashboardData:D,document:{getElementById:el,querySelectorAll:s=>s==='[data-sort]'?buttons:[],querySelector:s=>buttons.find(b=>s===`[data-sort="${b.dataset.sort}"]`)},window:{addEventListener(){}},location:{hash:'#/home'},URLSearchParams,scrollY:0,scrollTo(){}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);const run=s=>vm.runInContext(s,ctx),ids=[...D.groups[0].ids,...D.groups[2].ids];
for(const [mode,start,end] of [['single','2026-09','2026-09'],['range','2026-07','2026-09'],['annual','2026-01','2026-09'],['annualRange','2025-01','2026-09']]){
 const query=`start=${start}&end=${end}&mode=${mode}`,p={start:D.monthIndex(start),end:D.monthIndex(end)};
 ctx.location.hash='#/home?'+query;run('render()');const home=el('app').innerHTML;
 for(const id of ids){
  const card=home.split('<article class="metric-tile">').find(s=>s.includes(`data-info="${id}"`));assert(card.includes('同比 '));assert(card.includes('环比 '));
  for(const selected of [D.stores,D.select('east'),[D.stores[0]]]){
   const c=D.comparisons(id,selected,p),v=D.value(id,selected,p);
   for(const [key,delta] of [['mom',-(p.end-p.start+1)],['yoy',-12]]){
    const b=D.value(id,selected,D.shift(p,delta));const expected=v===null||b===null?null:D.metrics[id].type==='percent'?v-b:b>0?(v-b)/b*100:null;
    if(expected===null)assert.equal(c[key],null);else assert(Math.abs(c[key]-expected)<1e-8);
   }
  }
  if(id==='storeCount')continue; // Dedicated store-count tests verify its three-measure page.
  for(const suffix of ['', '/east']){
   ctx.location.hash=`#/metric/${id}${suffix}?${query}`;run("sortKey='value';sort='desc';render()");
   const html=el('app').innerHTML,unit=D.metrics[id].type==='percent'?'百分点':'%';assert(html.includes(`同比（${unit}）`));assert(html.includes(`环比（${unit}）`));assert(!/NaN|Infinity|undefined/.test(html));
   if(suffix)for(const direction of ['asc','desc']){
    buttons[2].onclick();const rows=D.select('east').map(s=>({name:s.name,v:D.comparisons(id,[s],p).yoy}));
    const expected=rows.filter(r=>r.v!==null).sort((a,b)=>(direction==='asc'?1:-1)*(a.v-b.v)).concat(rows.filter(r=>r.v===null)).map(r=>r.name);
    assert.deepEqual([...el('app').innerHTML.matchAll(/class="store-name">([^<]+)</g)].map(m=>m[1]),expected);
   }
  }
 }
}
for(const id of ['cagr','growth']){
 for(const v of [-2.1,2.1]){
  const main=run(`display('${id}',${v})`),table=run(`tableValue('${id}',${v})`),compare=run(`sign(${v},'%', '${id}')`);
  assert(main.indexOf('</small>')<main.indexOf('<svg'));assert(table.indexOf(String(v))<table.indexOf('<svg'));assert(compare.indexOf('%')<compare.indexOf('<svg'));
 }
 assert(run(`display('${id}',-2.1)`).includes('rate-value down'));assert(run(`display('${id}',-2.1)`).includes('data-number="-2.1"'));
 assert(run(`display('${id}',2.1)`).includes('rate-arrow up'));assert(run(`tableValue('${id}',-2.1)`).includes('rate-arrow down'));
 for(const value of ['0','0.01','null'])assert(!run(`display('${id}',${value})`).includes('<svg'));
 assert(run(`sign(-2.1,'%', '${id}')`).includes('rate-arrow down'));assert(run(`sign(-2.1,'%', '${id}')`).includes('-2.1%'));
}
assert(!run("display('revenue',2.1)").includes('rate-arrow'));
console.log('通过：IPO四项及经营中心六项首页及穿透页同比环比、百分比/百分点口径、四种查询模式、同比排序、缺失值，以及增长率/增速正负零值箭头。');
