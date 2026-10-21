const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),D=require('../dist/data.js');
const mi=D.monthIndex,p={start:mi('2026-07'),end:mi('2026-09')},month={start:mi('2026-09'),end:mi('2026-09')},annual={start:mi('2025-01'),end:mi('2026-09')};
const fixtures=[
 {id:'existing',opened:p.start-1,closed:null},
 {id:'new-start',opened:p.start,closed:null},
 {id:'new-end',opened:p.end,closed:null},
 {id:'close-start',opened:p.start-1,closed:p.start},
 {id:'close-end',opened:p.start-1,closed:p.end},
 {id:'both',opened:p.start,closed:p.end},
 {id:'future',opened:p.end+1,closed:null}
];
assert.deepEqual(D.storeCounts(fixtures,p),{storeCount:3,storeOpened:3,storeClosed:3});
assert.deepEqual(D.storeCounts([...fixtures,fixtures[0]],p),D.storeCounts(fixtures,p));
assert.equal(D.storeCounts(fixtures,{start:p.start-1,end:p.start-1}).storeCount+3-3,3);
assert.deepEqual(D.storeCounts(D.stores,month),{storeCount:9,storeOpened:1,storeClosed:1});
assert.deepEqual(D.storeCounts(D.stores,annual),{storeCount:9,storeOpened:4,storeClosed:3});
assert.equal(D.value('storeCount',D.stores,annual),D.value('storeCount',D.stores,month));
for(const period of [p,month,annual])for(const id of ['storeCount','storeOpened','storeClosed']){
 assert.equal(D.value(id,D.stores,period),D.markets.reduce((sum,m)=>sum+D.value(id,D.select(m.id),period),0));
}
assert.equal(D.countStores.length,502);
assert.equal(new Set(D.countStores.map(s=>s.id)).size,502);
assert.equal(D.value('storeCount',D.countStores,month),499);
assert.deepEqual(D.markets.map(m=>D.value('storeCount',D.select(m.id,'storeCount'),month)),[166,166,167]);
assert.equal(D.value('storeCount',D.countStores,annual),499);
assert.equal(D.storeCounts(D.countStores,{start:annual.start-1,end:annual.start-1}).storeCount+D.value('storeOpened',D.countStores,annual)-D.value('storeClosed',D.countStores,annual),499);
assert.equal(D.stores.length,12);
assert.equal(D.format('receipts',D.value('receipts',D.stores,month)).number,'1,158.8');
assert.equal(D.format('cost',D.value('cost',D.stores,month)).number,'356.1');
assert.deepEqual(D.format('storeCount',9),{number:'9',unit:'家'});
assert.equal(D.value('storeOpened',[],month),0);
assert.equal(D.comparisons('storeOpened',D.select('east'),month).mom,null);
assert.equal(D.record(D.stores[3],mi('2026-08')),null);
assert(D.record(D.stores[2],mi('2026-09')));
assert.equal(D.record(D.stores[2],mi('2026-10')),null);
for(const selected of [D.stores,...D.markets.map(m=>D.select(m.id)),[D.stores[7]]])for(const period of [p,month,annual]){
 const current=D.value('profit',selected,period),previous=D.value('profit',selected,D.shift(period,-12));
 const expected=current===null||previous===null||previous===0?null:(current-previous)/previous*100;
 const actual=D.value('growth',selected,period);
 if(expected===null)assert.equal(actual,null);else assert(Math.abs(actual-expected)<1e-9);
}
assert.equal(D.value('growth',[D.stores[3]],month),null);
const zeroContext={module:{exports:{}}};vm.createContext(zeroContext);
vm.runInContext(fs.readFileSync('dist/data.js','utf8').replace('punchHours:n(actualHours*(1.015+(i%3)*.005))','punchHours:0,actualProfit:0'),zeroContext);
const Z=zeroContext.module.exports;assert.equal(Z.value('growth',Z.stores,month),null);

const ids=['storeCount','storeOpened','storeClosed'],buttons=ids.map(id=>({dataset:{countTrend:id},focus(){}})),elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',addEventListener(){}});return elements.get(id)};
const ctx={DashboardData:D,document:{getElementById:element,querySelectorAll:q=>q==='[data-count-trend]'?buttons:[],querySelector:q=>buttons.find(b=>q===`[data-count-trend="${b.dataset.countTrend}"]`)},location:{hash:'#/home'},window:{addEventListener(){}},URLSearchParams,scrollY:0,scrollTo(){}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);
for(const [mode,start,end] of [['single','2026-09','2026-09'],['range','2026-07','2026-09'],['annualRange','2025-01','2026-09']])for(const market of ['', '/east']){
 const query=`start=${start}&end=${end}&mode=${mode}`,period={start:mi(start),end:mi(end)},selected=D.select(market?market.slice(1):null,'storeCount');
 ctx.location.hash=`#/metric/storeCount${market}?${query}`;vm.runInContext('render()',ctx);
 const html=element('app').innerHTML;
 assert(html.includes(`class="back-link" href="#/${market?'metric/storeCount':'home'}?${query}"`));
 for(const title of ['在营门店数量','新开门店数量','闭店门店数量'])assert(html.includes(title));
 assert.equal((html.match(/class="card summary-card"/g)||[]).length,3);
 assert(html.includes('门店分布地图'));assert(html.includes('不代表门店地址'));
 const counts=D.storeCounts(selected,period);assert(html.includes(`<strong>${counts.storeOpened-counts.storeClosed}家</strong>`));
 const map=html.split('class="store-map"')[1].split('</svg>')[0];
 const mapMarkets=market?D.markets.filter(m=>m.id===market.slice(1)):D.markets;
 assert.equal((map.match(/<a href=/g)||[]).length,mapMarkets.length);
 for(const m of mapMarkets){assert(map.includes(`href="#/metric/storeCount/${m.id}?${query}"`));assert(map.includes(`${m.name}，在营${D.value('storeCount',D.select(m.id,'storeCount'),period)}家`));}

 if(!market){
  const table=html.split('<table class="store-count-table">')[1].split('</table>')[0];
  assert.equal((table.match(/<th>同比<\/th>/g)||[]).length,3);assert.equal((table.match(/<th>环比<\/th>/g)||[]).length,3);
  for(const m of D.markets){
   assert(table.includes(`href="#/metric/storeCount/${m.id}?${query}"`));
   const row=table.split(`>${m.name}</a></td>`)[1].split('</tr>')[0];
   const cells=[...row.matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(x=>x[1]);
   assert.equal(cells.length,9);
   ids.forEach((id,i)=>{const c=D.comparisons(id,D.select(m.id,id),period);assert.equal(cells[i*3],D.format(id,c.value).number);for(const [j,key] of [[1,'mom'],[2,'yoy']]){ctx.testNumber=c[key];assert.equal(cells[i*3+j],vm.runInContext('sign(testNumber)',ctx))}});
  }
 }else{assert(html.includes('期末状态'));assert.equal((html.match(/class="store-name"/g)||[]).length,selected.length)}
 for(const b of buttons){
  b.onclick();const updated=element('app').innerHTML;
  assert(updated.includes(`data-count-trend="${b.dataset.countTrend}" aria-pressed="true"`));
  const points=[...updated.matchAll(/data-label="([^"]+)" data-value="([^"]+)"/g)];
  assert.equal(points.length,mode==='annualRange'?2:12);
  points.forEach((point,i)=>{const end=mode==='annualRange'?Math.min((2025+i)*12+11,period.end):period.end-11+i,start=mode==='annualRange'?(2025+i)*12:end;const f=D.format(b.dataset.countTrend,D.value(b.dataset.countTrend,selected,{start,end}));assert.equal(point[2],f.number+f.unit)});
 }
}
for(const id of ['receipts','cost'])for(const market of ['', '/east']){
 const query='start=2025-01&end=2026-09&mode=annualRange';ctx.location.hash=`#/metric/${id}${market}?${query}`;vm.runInContext('render()',ctx);
 const html=element('app').innerHTML;assert(html.includes('同比（%）'));assert(html.includes('环比（%）'));assert(html.includes('单位：万元'));
 assert(html.includes(`class="back-link" href="#/${market?'metric/'+id:'home'}?${query}"`));
}
// Old shared URLs must not silently retain the removed demo scope filter.
for(const scope of ['multi','south']){
 const query='start=2026-07&end=2026-09&mode=range';
 for(const id of D.groups.flatMap(g=>g.ids)){
  ctx.location.hash=`#/metric/${id}?${query}&scope=${scope}`;vm.runInContext('render()',ctx);const html=element('app').innerHTML;
  assert.equal((html.match(/class="market-row"/g)||[]).length,D.markets.length);
  assert(!html.includes('demo-scope'));assert(!html.includes('负责范围'));assert(!html.includes('&scope='));
  assert(html.includes('集团合计'));assert(html.includes(`href="#/home?${query}"`));
  assert(html.includes(`data-number="${D.format(id,D.value(id,D.select(null,id),p)).number}"`));
 }
 ctx.location.hash=`#/metric/storeCount/south?${query}&scope=${scope}`;vm.runInContext('render()',ctx);
 assert(element('app').innerHTML.includes('深圳南山店'));
 assert(element('app').innerHTML.includes(`href="#/metric/storeCount?${query}"`));
}
ctx.location.hash='#/home?start=2026-09&end=2026-09&mode=single&scope=south';vm.runInContext('render()',ctx);
assert(element('app').innerHTML.includes('data-number="499"'));
console.log('通过：门店统计与穿透、旧范围链接恢复集团汇总499家、三个市场齐全、负责人筛选移除、返回保留日期。');
