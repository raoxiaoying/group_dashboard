const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),D=require('../dist/data.js');
assert.deepEqual(D.groups[0].ids,['storeCount','turnover','revenue','profitAmount']);
assert.equal(D.metrics.profitAmount.name,'利润');assert.equal(D.groups[2].name,'运营中心');
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',addEventListener(){}});return elements.get(id)};
const buttons=['value','mom','yoy'].map(sort=>({dataset:{sort},focus(){}}));
const ctx={DashboardData:D,document:{getElementById:el,querySelectorAll:s=>s==='[data-sort]'?buttons:[],querySelector:s=>buttons.find(b=>s===`[data-sort="${b.dataset.sort}"]`)},window:{addEventListener(){}},location:{hash:'#/home'},URLSearchParams,scrollY:0,scrollTo(){}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);const run=s=>vm.runInContext(s,ctx),ids=[...D.groups[0].ids,...D.groups[2].ids];
for(const [mode,start,end] of [['single','2026-09','2026-09'],['range','2026-07','2026-09'],['annual','2026-01','2026-09'],['annualRange','2025-01','2026-09']]){
 const query=`start=${start}&end=${end}&mode=${mode}`,p={start:D.monthIndex(start),end:D.monthIndex(end)};
 ctx.location.hash='#/home?'+query;run('render()');const home=el('app').innerHTML;
 assert(!home.includes('经营中心'));
 const tileIds=[...home.matchAll(/data-info="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(tileIds.slice(0,4),D.groups[0].ids);
 for(const selected of [D.stores,...D.markets.map(m=>D.select(m.id)),...D.stores.map(s=>[s])]){assert.deepEqual(D.comparisons('profitAmount',selected,p),D.comparisons('profit',selected,p));const total=D.aggregate(selected,p.start,p.end);assert.equal(D.value('revenue',selected,p),total.records?total.netRevenue:null);}

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
console.log('通过：IPO四项及运营中心六项首页及穿透页同比环比、百分比/百分点口径、四种查询模式、同比排序、缺失值，以及增长率/增速正负零值箭头。');
// Related rates follow the parent metric's period and market instead of remaining on the homepage.
for(const [mode,start,end] of [['single','2026-09','2026-09'],['range','2026-07','2026-09'],['annualRange','2025-01','2026-09']]){
 const query=`start=${start}&end=${end}&mode=${mode}`,p={start:D.monthIndex(start),end:D.monthIndex(end)};
 ctx.location.hash='#/home?'+query;run('render()');const home=el('app').innerHTML;
 assert.deepEqual([...home.matchAll(/data-info="([^"]+)"/g)].map(x=>x[1]),D.groups.flatMap(g=>g.ids));
 for(const id of ['cagr','growth','grossMargin','profitRate'])assert(!home.includes(`data-info="${id}"`));
 assert(home.includes('含集团会员，等待需求补充'));assert(!home.includes('<h2>集团会员</h2>'));assert(home.includes('<h3>人力资源</h3>'));assert(home.includes('<h2>资金看板</h2>'));
 for(const [parent,ids] of [['revenue',['cagr']],['profitAmount',['growth','grossMargin']],['profit',['growth','grossMargin']]])for(const market of [null,...D.markets.map(m=>m.id)]){
  ctx.location.hash=`#/metric/${parent}${market?'/'+market:''}?${query}`;run('render()');const html=el('app').innerHTML;
  const related=html.split('<div class="related-metrics"')[1].split('<section class="card '+(market?'store-card':'markets-card')+'">')[0];
  assert.deepEqual([...related.matchAll(/data-info="([^"]+)"/g)].map(x=>x[1]),ids);
  for(const id of ids){const block=related.split('data-info="'+id+'"')[1].split('</section>')[0],c=D.comparisons(id,D.select(market,id),p);assert(block.includes(`data-number="${D.format(id,c.value).number}"`));for(const key of ['mom','yoy']){ctx.relatedNumber=c[key];assert(block.includes(run("sign(relatedNumber,'pp')")));}}
  assert(html.includes(mode==='annualRange'?'年度趋势':'近 12 个月趋势'));
 }
}
console.log('通过：管理两项成本率、增长率/利润增速/毛利率归入相应穿透页，并按月份、年度和市场重算；会员归营销，资金预留。');
