const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),base=require('../dist/data.js');
const D={...base,latest:base.monthIndex('2026-09')};
D.validPeriod=(start,end)=>Number.isInteger(start)&&Number.isInteger(end)&&start>=D.earliest&&end<=D.latest&&start<=end;
const elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{innerHTML:'',className:'',attrs:{},getBoundingClientRect(){return {left:90,bottom:164}},setAttribute(k,v){this.attrs[k]=v},addEventListener(){},showModal(){},close(){},querySelector(){return element('child')},querySelectorAll(){return[]}});return elements.get(id)}
const plainTable=html=>html.replace(/<span class="rate-value table-rate[^"]*">([\s\S]*?)<\/span>/g,(_,content)=>content.replace(/<svg[\s\S]*?<\/svg>/g,''));
const ctx={DashboardData:D,innerWidth:320,innerHeight:568,document:{getElementById:element,querySelectorAll:()=>[],title:''},location:{hash:'#/home?mode=annual'},window:{addEventListener(){}},URLSearchParams};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);const run=s=>vm.runInContext(s,ctx),idx=base.monthIndex;
assert.equal(run('period.mode'),'annualRange');assert.equal(run('period.start'),idx('2025-01'));assert.equal(run('period.end'),idx('2026-09'));
run("changeDate('end',2025)");assert.equal(ctx.location.hash,'#/home?start=2025-01&end=2025-12&mode=annualRange');run('render()');
const links=[...element('app').innerHTML.matchAll(/class="metric-link" href="([^"]+)"/g)].map(m=>m[1]);assert.equal(links.length,16);
for(const link of links){
 ctx.location.hash=link;run('render()');let html=plainTable(element('app').innerHTML);
 assert(html.includes('年度趋势'));assert.equal((html.match(/class="year-tick"/g)||[]).length,1);assert(!html.includes('month-tick'));assert(!/NaN|Infinity/.test(html));
 const rows=[...html.matchAll(/class="market-row" href="([^"]+)"/g)].map(m=>m[1]);assert.equal(rows.length,3);
 for(const row of rows){assert(row.endsWith('start=2025-01&end=2025-12&mode=annualRange'));ctx.location.hash=row;run('render()');assert(element('app').innerHTML.includes('年度趋势'));assert(!element('app').innerHTML.includes('month-tick'));}
}
for(const id of Object.keys(base.metrics).filter(id=>id!=='storeCount'))for(const market of [null,...base.markets.map(m=>m.id)]){
 ctx.location.hash=`#/metric/${id}${market?'/'+market:''}?start=2026-01&end=2026-09&mode=annual`;run('render()');
 const html=plainTable(element('app').innerHTML),selected=base.select(market,id);
 assert(html.includes('年度趋势'));assert(html.includes('累计'));assert(!/month-tick|data-trend-view|近12个月|近 12 个月|NaN|Infinity/.test(html));
 assert.deepEqual([...html.matchAll(/class="year-tick"[^>]*>([^<]+)</g)].map(m=>m[1]),['2026年']);
 const points=[...html.matchAll(/data-label="([^"]+)" data-value="([^"]+)"/g)];assert.equal(points.length,1);
 const f=base.format(id,base.value(id,selected,{start:idx('2026-01'),end:idx('2026-09')}));
 assert.equal(points[0][1],'2026年（1–9月）');assert.equal(points[0][2],f.number+f.unit);assert(html.includes('data-number="'+f.number+'"'));
 if(market){for(const store of selected){const f=base.format(id,base.value(id,[store],{start:idx('2026-01'),end:idx('2026-09')}));assert(html.includes('<span class="store-name">'+store.name+'</span></td><td>'+f.number+'</td>'));}}
 else{for(const m of base.markets){const f=base.format(id,base.value(id,base.select(m.id,id),{start:idx('2026-01'),end:idx('2026-09')}));assert(html.includes('aria-label="'+m.name+' '+base.metrics[id].name+'，查看门店">'+f.number+'</a>'));}}
}
for(const mode of ['single','range','annual']){ctx.location.hash=`#/home?start=2024-01&end=2024-12&mode=${mode}`;run('readRoute()');assert(run('period.start')>=idx('2025-01'));}
assert.equal(base.earliest,idx('2025-01'));assert(base.record(base.stores[0],idx('2024-12')));
for(const id of Object.keys(base.metrics))assert.equal(base.value(id,base.stores,{start:idx('2016-12'),end:idx('2017-01')}),null);
const p={start:idx('2025-01'),end:idx('2025-12')};assert(Number.isFinite(base.comparisons('revenue',base.stores,p).yoy));assert(Number.isFinite(base.comparisons('revenue',base.stores,p).mom));
assert(Number.isFinite(base.value('growth',base.stores,p)));
const value=base.value('revenue',base.stores,p),sum=Array.from({length:12},(_,i)=>base.value('revenue',base.stores,{start:p.start+i,end:p.start+i})).reduce((a,b)=>a+b,0);assert(Math.abs(value-sum)<1e-6);
// Select and preserve a cumulative year interval, including after a page reload.
ctx.location.hash='#/home?mode=annual';run('render()');
assert(element('app').innerHTML.includes('开始年度'));assert(element('app').innerHTML.includes('结束年度'));
assert(element('app').innerHTML.includes('数据截至 2026-09'));
const rangeLinks=[...element('app').innerHTML.matchAll(/class="metric-link" href="([^"]+)"/g)].map(m=>m[1]);assert.equal(rangeLinks.length,16);
const rangePeriod={start:idx('2025-01'),end:idx('2026-09')};
for(const link of rangeLinks.filter(link=>!link.includes('/storeCount?'))){
 ctx.location.hash=link;run('render()');const id=run('route.id'),html=plainTable(element('app').innerHTML);
 const f=base.format(id,base.value(id,base.stores,rangePeriod));assert(html.includes('data-number="'+f.number+'"'));
 assert.deepEqual([...html.matchAll(/class="year-tick"[^>]*>([^<]+)</g)].map(m=>m[1]),['2025年','2026年']);assert(html.includes('累计</th>'));
 const rows=[...html.matchAll(/class="market-row" href="([^"]+)"/g)].map(m=>m[1]);
 for(const row of rows){
  assert(row.endsWith('start=2025-01&end=2026-09&mode=annualRange'));ctx.location.hash=row;run('render()');
  const market=run('route.market'),detail=plainTable(element('app').innerHTML);assert(!/month-tick|NaN|Infinity/.test(detail));
  for(const store of base.select(market,id)){const value=base.format(id,base.value(id,[store],rangePeriod));assert(detail.includes('<span class="store-name">'+store.name+'</span></td><td>'+value.number+'</td>'));}
  const points=[...detail.matchAll(/data-label="([^"]+)" data-value="([^"]+)"/g)];assert.equal(points.length,2);
  for(let i=0;i<2;i++){const yearly={start:idx((2025+i)+'-01'),end:idx(i?'2026-09':'2025-12')},f=base.format(id,base.value(id,base.select(market,id),yearly));assert.equal(points[i][2],f.number+f.unit);}
 }
}
const totals=base.aggregate(base.stores,rangePeriod.start,rangePeriod.end);
assert(Math.abs(base.value('laborRate',base.stores,rangePeriod)-totals.labor/totals.grossRevenue*100)<1e-8);
assert(Math.abs(base.value('receipts',base.stores,rangePeriod)-base.value('receipts',base.stores,{start:idx('2025-01'),end:idx('2025-12')})-base.value('receipts',base.stores,{start:idx('2026-01'),end:idx('2026-09')}))<1e-6);
for(const [start,end] of [['2026-01','2025-12'],['2024-01','2026-09'],['2025-01','2027-12']]){ctx.location.hash=`#/home?start=${start}&end=${end}&mode=annualRange`;run('readRoute()');assert.equal(run('period.start'),idx('2025-01'));assert.equal(run('period.end'),idx('2026-09'));}
ctx.location.hash='#/home?start=2026-01&end=2026-09&mode=annualRange';run('render()');assert.deepEqual([...element('app').innerHTML.matchAll(/class="metric-link" href="([^"]+)"/g)].map(m=>m[1]).length,16);
ctx.location.hash='#/metric/revenue?start=2026-01&end=2026-09&mode=annualRange';run('render()');assert.equal((element('app').innerHTML.match(/class="year-tick"/g)||[]).length,1);
run("changeDate('end',2025)");assert(ctx.location.hash.includes('start=2025-01&end=2025-12'));run('render()');
element('query-reset').onclick();assert(ctx.location.hash.endsWith('start=2025-01&end=2026-09&mode=annualRange'));
console.log('通过：年度累计年份选择、反向选择、刷新、恢复默认、16项指标穿透保留跨年区间、金额累计和比率重算、逐年趋势数值及非法年份边界。');
D.latest=idx('2026-12');assert.equal(run('defaultPeriod("annual").start'),idx('2026-01'));assert.equal(run('defaultPeriod("annual").end'),idx('2026-12'));
console.log('通过：年度默认与选年、16项指标穿透保留年度、年度趋势与年度数值一致、单年点位正常、移除年度模式月度切换、2025下界、缺失基期、年度汇总与跨年边界。');

D.latest=idx('2027-01');assert.equal(run('defaultPeriod("annualRange").start'),idx('2026-01'));assert.equal(run('defaultPeriod("annualRange").end'),idx('2027-01'));
D.latest=idx('2026-11');assert.equal(run('defaultPeriod("annualRange").start'),idx('2025-01'));assert.equal(run('defaultPeriod("annualRange").end'),idx('2026-11'));
ctx.location.hash='#/home?mode=annualRange';run('render()');assert(element('app').innerHTML.includes('年度累计'));assert(!/单年查询|data-year-mode/.test(element('app').innerHTML));assert.equal(run('period.start'),idx('2025-01'));assert.equal(run('period.end'),idx('2026-11'));
console.log('通过：年度仅累计入口，默认上年度至当前年度、恢复默认及一月跨年边界。');
