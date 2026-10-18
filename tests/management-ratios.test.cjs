const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),D=require('../dist/data.js');
const ids=['grossMargin','foodRate','laborRate','profitRate'];
assert.deepEqual(D.groups[1].ids,ids);
assert.deepEqual(ids.map(id=>D.metrics[id].name),['毛利率','食材成本率','人工成本率','利润率']);
const close=(a,b)=>a===null||b===null?assert.equal(a,b):assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const expected=a=>!a.records?Object.fromEntries(ids.map(id=>[id,null])):({grossMargin:(a.grossRevenue-a.grossFood)/a.grossRevenue*100,foodRate:a.grossFood/a.grossRevenue*100,laborRate:a.labor/a.grossRevenue*100,profitRate:a.actualProfit/a.grossRevenue*100});
for(const selected of [D.stores,...D.markets.map(m=>D.select(m.id)),...D.stores.map(s=>[s])]){
  for(const [start,end] of [['2026-09','2026-09'],['2026-07','2026-09'],['2026-01','2026-09']]){
    const p={start:D.monthIndex(start),end:D.monthIndex(end)},a=D.aggregate(selected,p.start,p.end),v=expected(a);
    close(D.value('profit',selected,p),a.records?a.actualProfit:null);
    for(const id of ids){
      const c=D.comparisons(id,selected,p);close(c.value,v[id]);assert.equal(c.unit,'个百分点');
      for(const [key,shift] of [['mom',-(p.end-p.start+1)],['yoy',-12]]){
        const prev=D.shift(p,shift);
        const b=expected(D.aggregate(selected,prev.start,prev.end));close(c[key],v[id]===null||b[id]===null?null:v[id]-b[id]);
      }
    }
    if(a.records)close(v.grossMargin+v.foodRate,100);
  }
}
const p={start:D.monthIndex('2026-07'),end:D.monthIndex('2026-09')};
assert.notEqual(D.value('laborRate',D.stores,p),D.stores.reduce((sum,s)=>sum+D.value('laborRate',[s],p),0)/D.stores.length);
assert(D.value('profitRate',[D.stores[7]],{start:D.monthIndex('2025-09'),end:D.monthIndex('2025-09')})<0);
for(const id of ids){
  assert.equal(D.value(id,[],p),null);
  const c=D.comparisons(id,D.stores,{start:D.monthIndex('2017-01'),end:D.monthIndex('2017-01')});assert.equal(c.mom,null);assert.equal(c.yoy,null);
}
const elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',addEventListener(){},querySelectorAll(){return[]}});return elements.get(id)};
const buttons=['value','mom','yoy'].map(sort=>({dataset:{sort},focus(){}}));
const ctx={DashboardData:D,document:{getElementById:element,querySelectorAll:q=>q==='[data-sort]'?buttons:[],querySelector:q=>buttons.find(b=>q===`[data-sort="${b.dataset.sort}"]`)},location:{hash:'#/home?start=2026-07&end=2026-09&mode=range'},window:{addEventListener(){}},URLSearchParams,scrollY:0,scrollTo(){}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);
const home=element('app').innerHTML;
for(const id of ids){
 const card=home.split('<article class="metric-tile">').find(x=>x.includes(`data-info="${id}"`));
 assert(card.includes('环比 '));assert(card.includes('同比 '));assert(card.includes('百分点（pp）'));assert(card.indexOf('环比 ')<card.indexOf('同比 '));
 for(const market of ['', '/east']){
  ctx.location.hash=`#/metric/${id}${market}?start=2026-07&end=2026-09&mode=range`;vm.runInContext('render()',ctx);
  const html=element('app').innerHTML;assert(html.includes('环比（百分点）'));assert(html.includes('同比（百分点）'));
  if(market)for(const direction of ['asc','desc']){
   buttons[2].onclick();const names=[...element('app').innerHTML.matchAll(/class="store-name">([^<]+)</g)].map(x=>x[1]);
   const rows=D.select('east').map(s=>({name:s.name,v:D.comparisons(id,[s],p).yoy}));
   assert.deepEqual(names,rows.filter(r=>r.v!==null).sort((a,b)=>(direction==='asc'?1:-1)*(a.v-b.v)).concat(rows.filter(r=>r.v===null)).map(r=>r.name));
  }
 }
}
console.log('通过：管理数据四项含税公式、金额加权汇总、单月/累计/年度百分点同比环比、缺失基期、负利润、首页/穿透页双比较及同比排序。');
