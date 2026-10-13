const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),D=require('../dist/data.js');
const node=(dataset={})=>({dataset,attrs:{},textContent:'',setAttribute(k,v){this.attrs[k]=v}});
const app={innerHTML:''},dialog={addEventListener(){}},date={};let targets=[];
const ctx={DashboardData:D,document:{getElementById:id=>id==='app'?app:id==='sheet'?dialog:date,querySelectorAll:s=>s==='[data-trend-hit]'?targets:[],title:''},location:{hash:'#/home'},window:{addEventListener(){}},URLSearchParams};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);
let checks=0;
for(const id of Object.keys(D.metrics))for(const market of [null,...D.markets.map(m=>m.id)])for(const mode of ['single','range']){
  ctx.location.hash=`#/metric/${id}${market?'/'+market:''}?start=${mode==='single'?'2026-09':'2026-07'}&end=2026-09&mode=${mode}`;
  targets=[];vm.runInContext('render()',ctx);
  if(id==='growth'){assert(app.innerHTML.includes('待确认'));assert(!app.innerHTML.includes('data-trend-hit'));continue}
  const title=node(),value=node(),tip=node();tip.querySelector=s=>s==='.tooltip-month'?title:value;
  const dots=[...app.innerHTML.matchAll(/<circle data-point="(\d+)"/g)].map(m=>node({point:m[1]}));
  const svg={querySelector:()=>tip,querySelectorAll:()=>dots};
  const markup=[...app.innerHTML.matchAll(/<rect class="trend-hit"([^>]+)>/g)];assert.equal(markup.length,12);
  targets=markup.map(m=>{const a=Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));const t=node({trendHit:a['data-trend-hit'],x:a['data-x'],y:a['data-y'],label:a['data-label'],value:a['data-value']});t.closest=()=>svg;return t});
  vm.runInContext('bind()',ctx);
  targets.forEach((t,i)=>{
    t.onclick();const end=D.monthIndex('2026-09')-11+i,p={start:end-(mode==='single'?0:2),end};
    const f=D.format(id,D.value(id,market?D.select(market):D.stores,p));
    assert.equal(value.textContent,f.number+f.unit);
    assert(title.textContent.startsWith(D.monthKey(end).replace('-','年')+'月'));
    assert.equal(tip.attrs.visibility,'visible');
    const [x,y]=tip.attrs.transform.match(/[\d.]+/g).map(Number);assert(x>=0&&x+184<=340&&y>=0&&y+48<=204);
    dots.forEach(dot=>assert.equal(dot.attrs.r,dot.dataset.point===String(i)?'5':'3.5'));
    checks++;
  });
  let prevented=false;targets[0].onkeydown({key:'Enter',preventDefault(){prevented=true}});assert(prevented);assert.equal(title.textContent,targets[0].dataset.label);
}
console.log(`通过：${checks} 个月份点击提示，覆盖全部指标、集团/市场、单月/累计，提示数值、单位、高亮及边界正确。`);
