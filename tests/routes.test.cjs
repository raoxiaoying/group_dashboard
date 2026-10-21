const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),D=require('../dist/data.js');
const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',addEventListener(){},showModal(){},close(){},querySelector(){return element('child')},querySelectorAll(){return[]}});return elements.get(id)};
const ctx={DashboardData:D,document:{getElementById:element,querySelectorAll:()=>[],title:''},location:{hash:'#/home?start=2026-07&end=2026-09&mode=range'},window:{addEventListener(){}},URLSearchParams,scrollTo(){}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);const home=element('app').innerHTML;
assert.equal((home.match(/class="metric-link"/g)||[]).length,12);
const links=[...home.matchAll(/class="metric-link" href="([^"]+)"/g)].map(x=>x[1]);let count=0;
for(const link of links){ctx.location.hash=link;vm.runInContext('render()',ctx);const markets=element('app').innerHTML;assert(!/市场分析|period-note/.test(markets));assert(!ctx.document.title.includes('市场分析'));const rows=[...markets.matchAll(/class="market-row" href="([^"]+)"/g)].map(x=>x[1]);assert.equal(rows.length,3);for(const row of rows){assert(row.endsWith('start=2026-07&end=2026-09&mode=range'));ctx.location.hash=row;vm.runInContext('render()',ctx);const html=element('app').innerHTML;assert(html.includes('门店明细'));assert(!/市场分析|period-note/.test(html));assert.equal((html.match(/class="store-name"/g)||[]).length,row.includes('/storeCount/')?D.select(row.split('/')[3].split('?')[0],'storeCount').length:4);assert(!/NaN|Infinity|undefined/.test(html));count++}}
console.log(`通过：首页 12 项指标 → 3 个市场 → ${count} 个门店表，累计月份全程保持。`);

for(const mode of ['single','range']){
  ctx.location.hash=`#/metric/revenue?start=${mode==='single'?'2026-09':'2026-07'}&end=2026-09&mode=${mode}`;
  vm.runInContext('render()',ctx);
  const html=element('app').innerHTML;
  assert(html.includes('近 12 个月趋势'));
  assert.deepEqual([...html.matchAll(/class="month-tick"[^>]*>([^<]+)<\/text>/g)].map(x=>x[1]),['10月','11月','12月','1月','2月','3月','4月','5月','6月','7月','8月','9月']);
  const chart=html.match(/<svg[^>]+aria-label="收入近12个月趋势">([\s\S]*?)<\/svg>/)[1];
  assert.equal((chart.match(/<circle /g)||[]).length,12);
  assert(!/trend-points|trend-readout|data-trend-value/.test(html));
}
console.log('通过：单月与累计趋势均保留 12 个月份及数据点，月份按钮和数值说明已移除。');

const sortButtons=['value','mom'].map(key=>({dataset:{sort:key},focus(){}}));
ctx.document.querySelectorAll=selector=>selector==='[data-sort]'?sortButtons:[];
ctx.document.querySelector=selector=>sortButtons.find(b=>selector===`[data-sort="${b.dataset.sort}"]`);
ctx.scrollY=0;
const queryPeriod={start:D.monthIndex('2026-07'),end:D.monthIndex('2026-09')};
for(const id of Object.keys(D.metrics).filter(id=>id!=='storeCount')){
  ctx.location.hash=`#/metric/${id}/east?start=2026-07&end=2026-09&mode=range`;
  vm.runInContext("sortKey='value';sort='desc';render()",ctx);
  for(const button of sortButtons){
    for(const direction of ['asc','desc']){
      button.onclick();
      const html=element('app').innerHTML;
      const names=[...html.matchAll(/class="store-name">([^<]+)</g)].map(x=>x[1]);
      const key=button.dataset.sort;
      const rows=D.select('east',id).map(s=>({name:s.name,v:D.comparisons(id,[s],queryPeriod)[key]}));
      const expected=rows.filter(r=>r.v!==null).sort((a,b)=>(direction==='asc'?1:-1)*(a.v-b.v)).concat(rows.filter(r=>r.v===null)).map(r=>r.name);
      assert.deepEqual(names,expected,`${id} ${key} ${direction}`);
      assert(html.includes(`aria-sort="${direction==='asc'?'ascending':'descending'}"><button class="column-sort" data-sort="${key}"`));
      assert(!/计算明细|store-sort|class="expanded"|data-store=/.test(html));
      assert(html.indexOf('市场汇总')>html.lastIndexOf('class="store-name"'));
    }
  }
}
const originalComparisons=D.comparisons;
D.comparisons=(id,stores,p)=>stores.length===1?{value:[-2,null,10,0][D.select('east').findIndex(s=>s.id===stores[0].id)],mom:[null,-3,12,0][D.select('east').findIndex(s=>s.id===stores[0].id)],yoy:0,unit:'%'}:originalComparisons(id,stores,p);
ctx.location.hash='#/metric/revenue/east?start=2026-07&end=2026-09&mode=range';
vm.runInContext("sortKey='value';sort='desc';render()",ctx);
for(const button of sortButtons){
  for(const expectedOrder of button.dataset.sort==='value'?[[0,3,2,1],[2,3,0,1]]:[[1,3,2,0],[2,3,1,0]]){
    button.onclick();
    assert.deepEqual([...element('app').innerHTML.matchAll(/class="store-name">([^<]+)</g)].map(x=>x[1]),expectedOrder.map(i=>D.select('east')[i].name));
  }
}
D.comparisons=originalComparisons;
console.log('通过：本期与环比表头点击升降序、负数和空值排序、汇总行固定、计算明细已移除。');

for(const path of ['metric/growth','metric/growth/north']){
 ctx.location.hash='#/'+path+'?start=2026-07&end=2026-09&mode=range';vm.runInContext('render()',ctx);
 const html=element('app').innerHTML;assert(html.includes('增速'));assert(html.includes('增速指标口径'));assert(html.includes('实际利润同比增长率'));assert(!html.includes('待确认'));assert(!/复合增长|CAGR/.test(html));
 if(path!=='home')assert.equal((html.match(/data-trend-hit=/g)||[]).length,12);
}
vm.runInContext("openInfo('cagr')",ctx);assert(element('sheet').innerHTML.includes('去年同期'));assert(!element('sheet').innerHTML.includes('年数'));
vm.runInContext("openInfo('growth')",ctx);assert(element('sheet').innerHTML.includes('本期利润'));assert(!element('sheet').innerHTML.includes('待确认'));
console.log('通过：增长率与增速名称、模拟数值与趋势、利润公式已明确。');

for(const path of ['metric/cagr','metric/cagr/east']){ctx.location.hash='#/'+path+'?start=2026-09&end=2026-09&mode=single';vm.runInContext('render()',ctx);assert(element('app').innerHTML.includes('增长率指标口径'));}
