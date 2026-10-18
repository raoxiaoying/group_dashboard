const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),D=require('../dist/data.js');
const app={innerHTML:''},stub={addEventListener(){}};
const ctx={DashboardData:D,document:{getElementById:id=>id==='app'?app:stub,querySelectorAll:()=>[]},location:{hash:'#/home'},window:{addEventListener(){}},URLSearchParams};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);
let charts=0;
for(const id of Object.keys(D.metrics))for(const market of [null,...D.markets.map(m=>m.id)])for(const [mode,start,end,count] of [
 ['single','2025-01','2025-01',12],['single','2026-09','2026-09',12],['range','2025-01','2026-09',12],['annualRange','2025-01','2026-09',2]
]){
 ctx.location.hash=`#/metric/${id}${market?'/'+market:''}?start=${start}&end=${end}&mode=${mode}`;vm.runInContext('render()',ctx);
 const points=[...app.innerHTML.matchAll(/data-label="([^"]+)" data-value="([^"]+)"/g)];
 assert.equal(points.length,count);assert.equal((app.innerHTML.match(/<circle data-point=/g)||[]).length,count,`${id}/${market}/${mode}: missing points`);
 assert.equal((app.innerHTML.match(/class="(?:month|year)-tick"/g)||[]).length,count);
 assert(points.every(p=>!/[—]|NaN|Infinity/.test(p[2])),`${id}/${market}/${mode}: missing values`);charts++;
}
assert(!D.validPeriod(D.monthIndex('2024-01'),D.monthIndex('2024-12')));
assert.equal(D.record(D.stores.at(-1),D.monthIndex('2025-04')),null);
assert.equal(D.value('cagr',D.stores,{start:D.monthIndex('2017-01'),end:D.monthIndex('2017-12')}),null);
console.log(`通过：${charts} 张趋势图的每个横坐标均有模拟数据点，覆盖全部指标、集团/市场、最早可查月份、跨年累计和年度；查询下界及开业前空值保留。`);
