const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),base=require('../dist/data.js');
const D={...base},app={innerHTML:''},stub={addEventListener(){}};
const ctx={DashboardData:D,document:{getElementById:id=>id==='app'?app:stub,querySelectorAll:()=>[]},location:{hash:'#/home'},window:{addEventListener(){}},URLSearchParams};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);const run=s=>vm.runInContext(s,ctx);
for(const value of [0,-0,0.01,-0.01,0.049,-0.049,-0.05]){
 assert.equal(run(`tone(${value})`),'neutral');assert.equal(run(`sign(${value})`),'0.0%');
 D.comparisons=(...args)=>({...base.comparisons(...args),mom:value,yoy:value});
 for(const route of ['home',...Object.keys(D.metrics).flatMap(id=>[`metric/${id}`,`metric/${id}/east`])]){
  ctx.location.hash=`#/${route}?start=2026-09&end=2026-09&mode=single`;run('render()');
  const comparisons=[...app.innerHTML.matchAll(/<(b|td) class="([^"]*)">(0\.0(?:%|pp|个百分点)?)<\/(?:b|td)>/g)];
  assert(comparisons.length>0);assert(comparisons.every(m=>m[2]==='neutral'),`${route}: zero color`);
 }
}
for(const value of [0.05,0.1,1])assert.equal(run(`tone(${value})`),'up');
for(const value of [-0.051,-0.1,-1])assert.equal(run(`tone(${value})`),'down');
assert.equal(run('tone(null)'),'');assert.equal(run('sign(null)'),'—');
console.log('通过：精确零、正负微小值及舍入边界在首页、市场和门店同环比中统一中性色，正负非零和空值保持原显示。');
