const assert=require('node:assert/strict');
const D=require('../dist/data.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const p={start:D.monthIndex('2026-07'),end:D.monthIndex('2026-09')};
assert.equal(D.monthKey(D.lastMonth(new Date('2026-01-15T00:00:00Z'))),'2025-12');
assert.equal(D.monthKey(D.lastMonth(new Date('2026-10-12T00:00:00Z'))),'2026-09');
assert.equal(D.monthKey(D.lastMonth(new Date('2026-09-30T16:00:00Z'))),'2026-09');
assert(!D.validPeriod(D.latest,D.latest-1));assert(!D.validPeriod(D.latest,D.latest+1));assert(D.validPeriod(D.latest,D.latest));
const a=D.aggregate(D.stores,p.start,p.end),b=D.aggregate(D.stores,p.start-3,p.end-3),y=D.aggregate(D.stores,p.start-12,p.end-12);
close(D.value('revenue',D.stores,p),D.markets.reduce((sum,m)=>sum+D.value('revenue',D.select(m.id),p),0));
for(const id of ['revenue','receipts','cost','labor','profit','profitAmount']){close(D.value(id,D.stores,p),D.stores.reduce((sum,s)=>sum+D.value(id,[s],p),0));close(D.value(id,D.stores,p),[p.start,p.start+1,p.end].reduce((sum,month)=>sum+D.value(id,D.stores,{start:month,end:month}),0))}
close(D.value('foodRate',D.stores,p),a.grossFood/a.grossRevenue*100);
close(D.value('laborRate',D.stores,p),a.labor/a.grossRevenue*100);
close(D.value('attendance',D.stores,p),a.actualHours/a.plannedHours*100);
close(D.value('hourly',D.stores,p),a.labor/a.punchHours);
close(D.value('turnover',D.stores,p),[p.start,p.start+1,p.end].reduce((sum,m)=>{const r=D.aggregate(D.stores,m,m);return sum+r.guests/r.tables},0)/92);
const turnoverMonth=(stores,key,days)=>{const month=D.monthIndex(key),r=D.aggregate(stores,month,month);close(D.value('turnover',stores,{start:month,end:month}),r.guests/r.tables/days)};
turnoverMonth(D.stores,'2026-09',30);
turnoverMonth([D.stores[0]],'2026-07',31);
turnoverMonth(D.stores,'2024-02',29);
turnoverMonth(D.stores,'2025-02',28);
const opening={start:D.monthIndex('2025-04'),end:D.monthIndex('2025-05')};
const apr=D.aggregate(D.stores,opening.start,opening.start),may=D.aggregate(D.stores,opening.end,opening.end);
close(D.value('turnover',D.stores,opening),(apr.guests/apr.tables+may.guests/may.tables)/61);
const newStore=D.stores.at(-1);
close(D.value('turnover',[newStore],opening),D.value('turnover',[newStore],{start:opening.end,end:opening.end}));
assert.equal(D.value('turnover',[newStore],{start:opening.start,end:opening.start}),null);
assert.equal(D.format('turnover',1).unit,'次');
close(a.labor,a.wage+a.subsidy+a.social+a.fund);
close(D.value('cagr',D.stores,p),(a.netRevenue-y.netRevenue)/y.netRevenue*100);
assert.equal(D.metrics.cagr.name,'收入增长率');assert.equal(D.metrics.growth.name,'利润增速');
for(const selected of [D.stores,...D.markets.map(m=>D.select(m.id)),...D.stores.map(s=>[s])]){
  for(const window of [p,{start:p.end,end:p.end},opening]){
    const prior=D.value('revenue',selected,D.shift(window,-12)),current=D.value('revenue',selected,window);
    if(prior===null||current===null||prior===0)assert.equal(D.value('cagr',selected,window),null);else close(D.value('cagr',selected,window),(current-prior)/prior*100);
    const v=D.value('growth',selected,window),profit=D.value('profit',selected,window),priorProfit=D.value('profit',selected,D.shift(window,-12));
    if(profit===null||priorProfit===null||priorProfit===0)assert.equal(v,null);else close(v,(profit-priorProfit)/priorProfit*100);
    assert.equal(v,D.value('growth',selected,window));
  }
}
assert.equal(D.format('growth',null).number,'—');
assert.notEqual(D.value('growth',D.stores,p),D.value('growth',D.stores,{start:p.end,end:p.end}));
assert.equal(D.value('growth',[newStore],{start:opening.start,end:opening.start}),null);
assert.equal(D.format('cagr',null).number,'—');
assert.notEqual(D.value('revenue',D.stores,p),D.value('receipts',D.stores,p));
assert.notEqual(D.value('revenue',D.stores,p),D.value('revenue',D.stores,{start:p.end,end:p.end}));
for(const id of Object.keys(D.metrics)){for(const market of [undefined,...D.markets.map(m=>m.id)]){for(const window of [p,{start:p.end,end:p.end}]){const v=D.value(id,D.select(market),window);assert(v===null||Number.isFinite(v));assert(D.format(id,v).number!=='NaN')}}}
console.log('通过：16 项口径、集团/市场/门店汇总、月份累计、等长环比、同比、实际利润增速、缺失基期和日期边界。');
