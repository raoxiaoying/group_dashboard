const D=DashboardData, app=document.getElementById('app');
let period={start:D.latest,end:D.latest,mode:'single'}, route={id:null,market:null}, sortKey='value', sort='desc', returnFocus=null;
const monthLabel=i=>D.monthKey(i).replace('-','年')+'月';
const rangeLabel=p=>p.start===p.end?monthLabel(p.start):`${monthLabel(p.start)} — ${monthLabel(p.end)}`;
const periodText=()=>rangeLabel(period);
const sign=(v,unit='%',id)=>{if(v===null)return '—';const rounded=Math.round(v*10)/10;return `${rounded>0?'+':''}${rounded.toFixed(1)}${unit}`};
const tone=v=>v===null?'':v>=0?'up':'down';
const display=(id,v)=>{const f=D.format(id,v);return `${f.number}<small>${f.unit}</small>`};
const textValue=(id,v)=>{const f=D.format(id,v);return f.number+f.unit};
const icon='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="10" y="4" width="13" height="24" rx="2"/><path d="M10 15H5v13h23V13h-5M14 10h5m-5 6h5m-5 6h5"/></svg>';
const calendar='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="14" height="12" rx="2"/><path d="M6 3v4m8-4v4M3 9h14"/></svg>';
function href(id=null,market=null,p=period){const path=id?`metric/${id}${market?'/'+market:''}`:'home';return `#/${path}?start=${D.monthKey(p.start)}&end=${D.monthKey(p.end)}&mode=${p.mode}`}
function defaultPeriod(mode){const end=D.latest,start=mode==='range'?Math.floor((end+1)/12)*12:end;return start<=end?{start,end,mode}:null}
function readRoute(){
  const [path,query='']=location.hash.replace(/^#\/?/,'').split('?'),parts=path.split('/'),q=new URLSearchParams(query);
  const defaults=defaultPeriod(q.get('mode')==='range'?'range':'single')||defaultPeriod('single');
  const start=D.monthIndex(q.get('start')||D.monthKey(defaults.start)),end=D.monthIndex(q.get('end')||D.monthKey(defaults.end));
  period=D.validPeriod(start,end)?{start,end,mode:q.get('mode')==='range'||start!==end?'range':'single'}:{start:D.latest,end:D.latest,mode:'single'};
  route={id:parts[0]==='metric'&&D.metrics[parts[1]]?parts[1]:null,market:D.markets.some(m=>m.id===parts[2])?parts[2]:null};
}
function header(){return `<header class="hero"><div class="hero-top"><div class="brand"><span class="brand-icon">${icon}</span><h1>集团看板</h1></div><span class="demo">DEMO</span></div></header><section class="query-panel" aria-label="查询条件"><div class="mode-switch" role="group" aria-label="查询方式"><button data-mode="single" aria-pressed="${period.mode==='single'}">单月</button><button data-mode="range" aria-pressed="${period.mode==='range'}">累计</button></div><div class="filters"><span class="query-label">统计月份</span><button class="date-trigger" id="date-open" aria-label="选择查询月份"><span class="date-value">${D.monthKey(period.start)}</span>${period.mode==='range'?`<span class="date-separator">至</span><span class="date-value">${D.monthKey(period.end)}</span>`:''}${calendar}</button></div></section>`}
function infoButton(id){return `<button class="info" data-info="${id}" aria-label="${D.metrics[id].group} ${D.metrics[id].name}指标口径">i</button>`}
function metricTile(id){const m=D.metrics[id],c=D.comparisons(id,D.stores,period);return `<article class="metric-tile"><div class="metric-heading"><span>${m.name}</span>${infoButton(id)}</div><a class="metric-link" href="${href(id)}" aria-label="${m.group} ${m.name}，${textValue(id,c.value)}，查看市场"><div class="number">${display(id,c.value)}<span class="jump-icon" aria-hidden="true">↗</span></div><p class="metric-caption">${m.caption}</p><span class="metric-compare">${m.type==='percent'?'较上期':'环比'} <b class="${tone(c.mom)}">${sign(c.mom,c.unit,id)}</b></span></a></article>`}
const groupIcons={
  'IPO 数据':'<path d="M4 3v17h17"/><rect x="7" y="12" width="3" height="5" rx=".6"/><rect x="12" y="8" width="3" height="9" rx=".6"/><rect x="17" y="4" width="3" height="13" rx=".6"/>',
  '管理数据':'<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1" fill="#edf4ff"/><path d="m8 11 1 1 2-2m2 1h3m-8 5 1 1 2-2m2 1h3"/>',
  '经营中心':'<path d="M4 10v10h16V10M3 7l2-4h14l2 4v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V7Z"/><path d="M3 7h18M9 7V3m6 4V3m-1 17v-6h-4v6"/>'
};
function groupCard(g){return `<section class="card metric-panel"><div class="card-heading"><h3><span class="mini-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false">${groupIcons[g.name]}</svg></span>${g.name}</h3></div><div class="metric-grid ${g.ids.length===6?'six':''}">${g.ids.map(metricTile).join('')}</div></section>`}
function sectionTitle(no,title,desc=''){return `<div class="section-title"><h2>${title}</h2>${desc?`<small>${desc}</small>`:''}</div>`}
function placeholder(title,note){return `<div class="placeholder"><div><h3>${title}</h3><p>${note}</p></div><span class="reserved">预留</span></div>`}
function home(){return `<main class="home-content">${sectionTitle('01','经营指标')}<div class="operating-grid">${D.groups.slice(0,2).map(groupCard).join('')}</div>${sectionTitle('02','业务板块')}${groupCard(D.groups[2])}<div class="placeholder-grid">${placeholder('市场营销','本期暂不开发')}${placeholder('人力板块','指标待补充')}</div><div class="reserved-grid"><section>${sectionTitle('03','资金看板')}${placeholder('集团资金看板','本期暂不开发')}</section><section>${sectionTitle('04','集团会员')}${placeholder('集团会员','本期暂不开发')}</section></div></main>`}
function breadcrumb(){const m=D.metrics[route.id],market=D.markets.find(x=>x.id===route.market);return `<nav class="breadcrumb" aria-label="页面路径"><a href="${href()}">集团首页</a><span>/</span>${market?`<a href="${href(route.id)}">${m.name} · 市场</a><span>/</span><span>${market.name}</span>`:`<span>${m.name} · 市场</span>`}</nav>`}
function summary(id,stores,label){const m=D.metrics[id],c=D.comparisons(id,stores,period);return `<section class="card summary-card"><div class="card-heading"><h3>${label} · ${m.name}</h3>${infoButton(id)}</div><div class="summary-body"><p class="caption">${m.caption}</p><div class="summary-number">${display(id,c.value)}</div><div class="comparison-grid"><div><span>${m.type==='percent'?'较上期变化':'环比'}</span><b class="${tone(c.mom)}">${sign(c.mom,c.unit,id)}</b></div><div><span>${m.type==='percent'?'较去年同期变化':'同比'}</span><b class="${tone(c.yoy)}">${sign(c.yoy,c.unit,id)}</b></div></div></div></section>`}
function trend(id,stores){
  const len=period.end-period.start+1,months=Array.from({length:12},(_,i)=>period.end-11+i),vals=months.map(end=>D.value(id,stores,{start:end-len+1,end})),valid=vals.filter(v=>v!==null),m=D.metrics[id],factor=m.type==='money'?10000:1;
  let min=Math.min(0,...valid)/factor,max=Math.max(0,...valid)/factor;if(max===min)max=min+1;const pad=(max-min)*.13;max+=pad;if(min<0)min-=pad;
  const coords=vals.map((v,i)=>({x:54+i*255/(months.length-1),y:v===null?null:154-(v/factor-min)/(max-min)*124}));
  let path='',inLine=false;coords.forEach(p=>{if(p.y===null){inLine=false;return}path+=`${inLine?'L':'M'}${p.x} ${p.y} `;inLine=true});
  const tick=v=>Math.abs(v)>=10000?(v/10000).toFixed(1)+'万':Math.abs(v)>=1000?Math.round(v).toLocaleString('zh-CN'):v.toFixed(Math.abs(v)<10?1:0);
  return `<section class="card trend-card"><div class="card-heading"><h3>近 12 个月趋势</h3><span class="caption">${len>1?'滚动 '+len+' 个月':'按单月'} · ${D.format(id,0).unit}</span></div><div class="chart-container"><svg viewBox="0 0 340 204" role="group" aria-label="${m.name}近12个月趋势">${[0,1,2].map(i=>`<line x1="54" x2="312" y1="${30+i*62}" y2="${30+i*62}" stroke="#e9eff8" stroke-dasharray="3 3"/><text x="45" y="${34+i*62}" text-anchor="end">${tick(max-(max-min)*i/2)}</text>`).join('')}<path d="${path}" fill="none" stroke="#3370ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${coords.map((p,i)=>`${p.y===null?'':`<circle data-point="${i}" cx="${p.x}" cy="${p.y}" r="3.5" stroke="#3370ff" stroke-width="2" fill="white"/>`}<text class="month-tick" x="${p.x}" y="176" text-anchor="end" transform="rotate(-45 ${p.x} 176)">${months[i]%12+1}月</text>`).join('')}${coords.map((p,i)=>`<rect class="trend-hit" data-trend-hit="${i}" data-x="${p.x}" data-y="${p.y??90}" data-label="${monthLabel(months[i])}${len>1?' · 滚动'+len+'个月':''}" data-value="${textValue(id,vals[i])}" x="${p.x-255/22}" y="22" width="${255/11}" height="136" fill="transparent" tabindex="0" role="button" aria-label="${monthLabel(months[i])}，${textValue(id,vals[i])}"/>`).join('')}<line class="trend-guide" x1="0" x2="0" y1="22" y2="154" stroke="#91caff" stroke-dasharray="3 3" visibility="hidden"/><g class="trend-tooltip" visibility="hidden" aria-hidden="true"><rect width="184" height="48" rx="7"/><text class="tooltip-month" x="10" y="18"></text><text class="tooltip-value" x="10" y="37"></text></g></svg></div></section>`
}
function showTrendValue(target){
  const svg=target.closest('svg'),tip=svg.querySelector('.trend-tooltip'),x=Number(target.dataset.x),y=Number(target.dataset.y);
  svg.querySelectorAll('[data-point]').forEach(dot=>{const active=dot.dataset.point===target.dataset.trendHit;dot.setAttribute('r',active?'5':'3.5');dot.setAttribute('fill',active?'#3370ff':'white')});
  const guide=svg.querySelector('.trend-guide');guide.setAttribute('x1',x);guide.setAttribute('x2',x);guide.setAttribute('visibility','visible');
  tip.querySelector('.tooltip-month').textContent=target.dataset.label;
  tip.querySelector('.tooltip-value').textContent=target.dataset.value;
  tip.setAttribute('transform',`translate(${Math.max(4,Math.min(152,x-92))} ${y>82?y-60:y+12})`);
  tip.setAttribute('visibility','visible');tip.setAttribute('aria-hidden','false');
}
function marketAnalysis(){const id=route.id,m=D.metrics[id],rows=D.markets.map(x=>({...x,c:D.comparisons(id,D.select(x.id),period)}));return `<main class="detail-content">${breadcrumb()}<div class="page-heading"><div><h2>${m.name} · 市场</h2></div><span class="level-tag">市场</span></div><div class="analysis-grid">${summary(id,D.stores,'集团')}${trend(id,D.stores)}</div><section class="card markets-card"><div class="card-heading"><h3>市场对比</h3><span class="caption">单位：${D.format(id,0).unit}</span></div><div class="table-wrap"><table><thead><tr><th>市场</th><th>本期</th><th>${m.type==='percent'?'较上期变化':'环比'}</th></tr></thead><tbody>${rows.map(r=>`<tr><td><a class="market-row" href="${href(id,r.id)}">${r.name}<span class="jump-icon" aria-hidden="true">↗</span></a></td><td><a class="market-value" href="${href(id,r.id)}" aria-label="${r.name} ${m.name}，查看门店">${D.format(id,r.c.value).number}</a></td><td class="${tone(r.c.mom)}">${sign(r.c.mom,m.type==='percent'?'pp':'%',id)}</td></tr>`).join('')}<tr class="total"><td>集团合计</td><td>${D.format(id,D.value(id,D.stores,period)).number}</td><td class="${tone(D.comparisons(id,D.stores,period).mom)}">${sign(D.comparisons(id,D.stores,period).mom,m.type==='percent'?'pp':'%',id)}</td></tr></tbody></table></div></section></main>`}
function sortHeading(key,label){return `<th aria-sort="${sortKey===key?(sort==='asc'?'ascending':'descending'):'none'}"><button class="column-sort" data-sort="${key}" aria-label="${label}，点击按数值${sortKey===key&&sort==='asc'?'降序':'升序'}排序">${label}<span aria-hidden="true">${sortKey===key?(sort==='asc'?'↑':'↓'):'↕'}</span></button></th>`}
function storesAnalysis(){
  const id=route.id,m=D.metrics[id],market=D.markets.find(x=>x.id===route.market),selected=D.select(route.market),rows=selected.map(s=>({...s,c:D.comparisons(id,[s],period)})).sort((a,b)=>{const av=a.c[sortKey],bv=b.c[sortKey];return av===null?(bv===null?0:1):bv===null?-1:(sort==='desc'?-1:1)*(av-bv)});
  return `<main class="detail-content">${breadcrumb()}<div class="page-heading"><div><h2>${market.name} · ${m.name}</h2></div><span class="level-tag">门店</span></div><div class="analysis-grid">${summary(id,selected,market.name)}${trend(id,selected)}</div><section class="card store-card"><div class="card-heading"><h3>门店明细</h3><span class="caption">单位：${D.format(id,0).unit}</span></div><div class="table-wrap"><table><thead><tr><th>门店</th>${sortHeading('value','本期')}${sortHeading('mom',m.type==='percent'?'较上期变化':'环比')}</tr></thead><tbody>${rows.map(s=>`<tr><td><span class="store-name">${s.name}</span></td><td>${D.format(id,s.c.value).number}</td><td class="${tone(s.c.mom)}">${sign(s.c.mom,m.type==='percent'?'pp':'%',id)}</td></tr>`).join('')}<tr class="total"><td>市场汇总</td><td>${D.format(id,D.value(id,selected,period)).number}</td><td class="${tone(D.comparisons(id,selected,period).mom)}">${sign(D.comparisons(id,selected,period).mom,m.type==='percent'?'pp':'%',id)}</td></tr></tbody></table></div></section></main>`
}
function render(){readRoute();app.className=route.id?'detail-view':'home-view';app.innerHTML=header()+(route.id?(route.market?storesAnalysis():marketAnalysis()):home())+'<footer>全部为模拟数据 · 未连接业务系统<br>集团 / 市场 / 门店口径一致</footer>';document.title=(route.id?D.metrics[route.id].name+(route.market?' · 门店明细':' · 市场'):'集团看板')+' · 移动端 Demo';bind()}
function bind(){
  document.getElementById('date-open').onclick=()=>openPeriod(period.mode);
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>openPeriod(b.dataset.mode,true));
  document.querySelectorAll('[data-info]').forEach(b=>b.onclick=()=>openInfo(b.dataset.info,b));
  document.querySelectorAll('[data-trend-hit]').forEach(target=>{target.onclick=()=>showTrendValue(target);target.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showTrendValue(target)}}});
  document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{const y=scrollY,key=b.dataset.sort;sort=sortKey===key&&sort==='asc'?'desc':'asc';sortKey=key;render();scrollTo(0,y);document.querySelector(`[data-sort="${key}"]`).focus({preventScroll:true})});
}
const dialog=document.getElementById('sheet');
function showDialog(content,title,focus){returnFocus=focus||document.activeElement;dialog.innerHTML=`<div class="sheet-handle"></div><div class="sheet-head"><h2 id="sheet-title">${title}</h2><button type="button" class="close" aria-label="关闭">×</button></div>${content}`;dialog.querySelector('.close').onclick=()=>dialog.close();dialog.showModal()}
dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus()});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
function openInfo(id,focus){const m=D.metrics[id];showDialog(`<span class="sheet-tag">${m.group}</span><h3 class="formula-label">${m.caption}</h3><p class="formula">${m.formula}</p>${m.note?`<p class="sheet-note">${m.note}</p>`:''}<h3 class="formula-label">数据来源</h3><p class="sheet-note">${m.source}</p><p class="demo-note">当前为模拟数据，未连接业务系统。</p>`,m.name+' · 指标说明',focus)}
function openPeriod(mode,reset=false){
  const initial=reset||mode!==period.mode?defaultPeriod(mode):period;
  if(!initial){showDialog('<p class="sheet-note">当年暂无已结束的完整月份，累计查询从2月起可用。</p>','选择统计月份');return}
  let {start,end}=initial,active='start',year=Math.floor(end/12);
  showDialog(`<form id="period-form"><div class="sheet-modes" role="group" aria-label="月份查询模式"><button type="button" data-draft-mode="single" aria-pressed="${mode==='single'}">单月查询</button><button type="button" data-draft-mode="range" aria-pressed="${mode==='range'}">累计月份</button></div><div class="date-range-fields"><button type="button" id="pick-start" class="date-endpoint" aria-label="${mode==='single'?'查询月份':'开始月份'}"></button>${mode==='range'?'<span class="date-separator">至</span><button type="button" id="pick-end" class="date-endpoint" aria-label="结束月份"></button>':''}${calendar}</div><div class="month-calendar"><div class="calendar-year"><button type="button" id="year-prev" aria-label="上一年">‹</button><strong id="calendar-year"></strong><button type="button" id="year-next" aria-label="下一年">›</button></div><div id="calendar-months" class="calendar-months" role="group" aria-label="选择月份"></div></div><p class="form-error" id="period-error" role="alert"></p><div class="sheet-actions"><button type="button" class="secondary" id="last-month">恢复默认</button><button class="primary" type="submit">查询</button></div></form>`,'选择统计月份');
  function draw(){
    document.getElementById('pick-start').textContent=D.monthKey(mode==='single'?end:start);
    document.getElementById('pick-start').setAttribute('aria-pressed',active==='start');
    if(mode==='range'){document.getElementById('pick-end').textContent=D.monthKey(end);document.getElementById('pick-end').setAttribute('aria-pressed',active==='end')}
    document.getElementById('calendar-year').textContent=year+'年';
    document.getElementById('year-prev').disabled=year<=Math.floor(D.earliest/12);
    document.getElementById('year-next').disabled=year>=Math.floor(D.latest/12);
    document.getElementById('calendar-months').innerHTML=Array.from({length:12},(_,i)=>{const m=year*12+i,selected=m===start||m===end;return `<button type="button" data-pick-month="${m}" aria-label="${monthLabel(m)}" aria-pressed="${selected}" class="${mode==='range'&&m>start&&m<end?'in-range':''}" ${m<D.earliest||m>D.latest?'disabled':''}>${i+1}月</button>`}).join('');
    dialog.querySelectorAll('[data-pick-month]').forEach(b=>b.onclick=()=>{const m=Number(b.dataset.pickMonth);if(mode==='single'){start=end=m}else if(active==='start'){start=m;if(end<start)end=start;active='end'}else{end=m;if(start>end)start=end;active='start'}draw();b=dialog.querySelector(`[data-pick-month="${m}"]`);b.focus()});
  }
  document.getElementById('pick-start').onclick=()=>{active='start';year=Math.floor(start/12);draw()};
  if(mode==='range')document.getElementById('pick-end').onclick=()=>{active='end';year=Math.floor(end/12);draw()};
  document.getElementById('year-prev').onclick=()=>{year--;draw()};document.getElementById('year-next').onclick=()=>{year++;draw()};
  dialog.querySelectorAll('[data-draft-mode]').forEach(b=>b.onclick=()=>{const focus=returnFocus;dialog.close();openPeriod(b.dataset.draftMode,true);returnFocus=focus});
  document.getElementById('last-month').onclick=()=>{const defaults=defaultPeriod(mode);if(defaults)applyPeriod(defaults)};
  document.getElementById('period-form').onsubmit=e=>{e.preventDefault();if(!D.validPeriod(start,end)){document.getElementById('period-error').textContent='请选择有效月份，开始月份不能晚于结束月份。';return}applyPeriod({start,end,mode})};
  draw();
}
function applyPeriod(p){const next=href(route.id,route.market,p);dialog.close();if(location.hash===next){period=p;render()}else location.hash=next}
window.addEventListener('hashchange',()=>{render();scrollTo(0,0)});render();
