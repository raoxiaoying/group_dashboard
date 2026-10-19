/* All records below are deterministic demo data, not connected business data. */
(function(root){
  const n=val=>Math.round(val*100)/100;
  const monthKey=i=>`${Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`;
  const monthIndex=s=>{const [y,m]=s.split('-').map(Number);return y*12+m-1};
  function lastMonth(date=new Date()){
    const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit'}).formatToParts(date);
    return Number(p.find(x=>x.type==='year').value)*12+Number(p.find(x=>x.type==='month').value)-2;
  }
  const latest=lastMonth(), earliest=monthIndex('2025-01');
  const markets=[{id:'east',name:'东区市场'},{id:'south',name:'南区市场'},{id:'north',name:'北区市场'}];
  const storeNames=[['上海静安店','上海徐汇店','杭州西湖店','南京新街口店'],['深圳南山店','广州天河店','厦门思明店','佛山千灯湖店'],['北京朝阳店','北京海淀店','天津和平店','济南历下店']];
  const stores=markets.flatMap((m,j)=>storeNames[j].map((name,k)=>({id:`s${j*4+k+1}`,name,market:m.id,index:j*4+k,tables:38+k*8+j*3,opened:j===2&&k===3?monthIndex('2025-05'):monthIndex('2017-01')})));
  // Simulated opening and closing months; a closing month is the last operating month.
  const openings={s4:'2026-09',s7:'2026-06',s10:'2025-09'},closings={s3:'2026-09',s6:'2026-08',s9:'2025-09'};
  stores.forEach(s=>{if(openings[s.id])s.opened=monthIndex(openings[s.id]);s.closed=closings[s.id]?monthIndex(closings[s.id]):null});
  // Store counts use a separate simulated directory; financial samples stay unchanged.
  const countStores=[...stores,...markets.flatMap((market,j)=>Array.from({length:j===2?164:163},(_,k)=>({
    id:`directory-${market.id}-${k+1}`,name:`${market.name.replace('市场','')}示例门店${String(k+1).padStart(3,'0')}`,market:market.id,
    opened:k<120?monthIndex('2024-01')+k%12:monthIndex('2025-01')+((k-120)*7+j*3)%21,closed:null
  })))];
  // Historical samples support complete demo trends and comparison baselines; the query UI still starts in 2025.
  const historyStart=Math.min(...stores.map(s=>s.opened));
  const laborFormula='人力成本 = 人工成本 + 社保补贴实发 + 企业社保金额 + 企业公积金金额';
  const metrics={
    storeCount:{name:'门店数',caption:'期末在营门店数',group:'IPO 数据',type:'count',source:'模拟门店档案；正式门店主数据来源待确认',formula:'统计期末已开业且尚未闭店的门店去重数量',note:'开业月份不晚于期末，闭店月份为空或晚于期末。闭店月份为最后营业月，期末已计入闭店。同比、环比按数量相对变化百分比计算；基期为0或缺失显示“—”。'},
    storeOpened:{name:'新开门店数量',caption:'期间新开门店数',group:'IPO 数据',type:'count',source:'模拟门店档案；正式门店主数据来源待确认',formula:'开业月份在所选起止月份内的门店去重数量',note:'包含期间新开后又闭店的门店。月度趋势逐月统计，年度趋势逐年统计；同比、环比基期为0或缺失显示“—”。'},
    storeClosed:{name:'闭店门店数量',caption:'期间闭店门店数',group:'IPO 数据',type:'count',source:'模拟门店档案；正式门店主数据来源待确认',formula:'闭店月份在所选起止月份内的门店去重数量',note:'包含期间新开后又闭店的门店。月度趋势逐月统计，年度趋势逐年统计；同比、环比基期为0或缺失显示“—”。'},
    revenue:{name:'收入',caption:'除税收入',group:'IPO 数据',type:'money',source:'企迈收银系统',formula:'所选期间除税收入合计',field:'netRevenue'},
    turnover:{name:'翻台率',caption:'日翻台率合计 / 营业天数',group:'IPO 数据',type:'turns',source:'企迈收银系统',formula:'翻台率 = Σ(日翻台率) / 营业天数',note:'日翻台率 = 当日堂食客流量 ÷ 当日可用桌数。集团及市场按每日客流与桌数汇总计算；累计期间按营业天数加权。演示数据按各门店整月营业处理。'},
    cagr:{name:'收入增长率',caption:'除税收入同比',group:'IPO 数据',type:'percent',source:'企迈收银系统',formula:'(本期除税收入 − 去年同期除税收入) ÷ 去年同期除税收入 × 100%',note:'单月对比去年同月；累计月份对比去年相同起止月份。基期缺失或不大于 0 时显示“—”。'},
    growth:{name:'利润增速',caption:'实际利润同比增长率',group:'IPO 数据',type:'percent',source:'金蝶财务系统',formula:'(本期利润 − 去年同期利润) ÷ 去年同期利润 × 100%',note:'利润使用运营中心的实际利润字段；集团、市场先汇总利润再计算。去年同期利润为0或缺失时显示“—”；负基期按公式保留分母符号。同比、环比为相较去年同期和前一等长期间增速的百分点差值。'},
    grossMargin:{name:'毛利率',caption:'含税毛利 / 含税收入',group:'管理数据',type:'percent',source:'含税收入：企迈收银系统；含税食材成本：奥琦玮供应链系统',formula:'(含税收入 − 含税食材成本) ÷ 含税收入 × 100%'},
    foodRate:{name:'食材成本率',caption:'含税食材成本 / 含税收入',group:'管理数据',type:'percent',source:'含税食材成本：奥琦玮供应链系统；含税收入：企迈收银系统',formula:'含税食材成本 ÷ 含税收入 × 100%'},
    laborRate:{name:'人工成本率',caption:'人工成本 / 含税收入',group:'管理数据',type:'percent',source:'人工成本：红海云人事系统；含税收入：企迈收银系统',formula:'人工成本 ÷ 含税收入 × 100%',note:'沿用原确认单成本范围：工资 + 社保补贴实发 + 企业社保金额 + 企业公积金金额，不对人工成本另行加税。'},
    profitRate:{name:'利润率',caption:'实际利润 / 含税收入',group:'管理数据',type:'percent',source:'实际利润：金蝶财务系统；含税收入：企迈收银系统',formula:'实际利润 ÷ 含税收入 × 100%',note:'与运营中心“利润”共用实际利润字段；当前为模拟数据，正式字段需由财务确认。'},
    receipts:{name:'收入',caption:'含税实收金额',group:'运营中心',type:'money',source:'企迈收银系统',formula:'所选期间含税实收金额合计',field:'grossRevenue'},
    cost:{name:'成本',caption:'含税食材成本',group:'运营中心',type:'money',source:'奥琦玮供应链系统',formula:'所选期间含税食材成本合计',field:'grossFood'},
    labor:{name:'人力',caption:'人力成本',group:'运营中心',type:'money',source:'红海云人事系统',formula:laborFormula,field:'labor'},
    profitAmount:{name:'利润额',caption:'实际利润',group:'IPO 数据',type:'money',source:'金蝶财务系统',formula:'所选期间实际利润合计',field:'actualProfit',note:'实际利润使用独立模拟字段，不以收入减去食材、人工成本简化计算；正式字段需由财务确认。'},
    profit:{name:'利润',caption:'实际利润',group:'运营中心',type:'money',source:'金蝶财务系统',formula:'所选期间实际利润合计',field:'actualProfit',note:'实际利润使用独立模拟字段，不以收入减去食材、人工成本简化计算；正式字段需由财务确认。'},
    attendance:{name:'排班',caption:'排班出勤率',group:'运营中心',type:'percent',source:'红海云人事系统',formula:'实际出勤工时 ÷ 排班出勤工时 × 100%'},
    hourly:{name:'人时',caption:'人时成本',group:'运营中心',type:'hourly',source:'红海云人事系统',formula:'人时成本 = 人力成本 ÷ 实际打卡工时',note:laborFormula+'。实际出勤工时与实际打卡工时独立取数。'}
  };
  const groups=[{name:'IPO 数据',ids:['storeCount','turnover','revenue','profitAmount','cagr','growth']},{name:'管理数据',ids:['grossMargin','foodRate','laborRate','profitRate']},{name:'运营中心',ids:['receipts','cost','labor','profit','attendance','hourly']}];
  function record(store,month){
    if(month<historyStart||month>latest||month<store.opened||(store.closed!=null&&month>store.closed))return null;
    const i=store.index,t=month-monthIndex('2023-01');
    const season=1+0.09*Math.sin((month%12)/12*Math.PI*2+i*.18)+.025*Math.cos(month*.9+i);
    const netRevenue=n((640000+i*43000)*Math.pow(1.005+(i%4)*.0009,t)*season);
    const foodNet=n(netRevenue*(.285+(i%5)*.012+.007*Math.sin(month+i)));
    const wage=n(121000+i*7600+t*950+(Math.sin(month+i)+1)*6000);
    const subsidy=n(1200+i*160),social=n(wage*.128),fund=n(wage*.046);
    const plannedHours=n(4200+i*210+(month%12)*15),actualHours=n(plannedHours*(.915+(i%4)*.018+.009*Math.sin(month+i)));
    return {netRevenue,grossRevenue:n(netRevenue*1.06),foodNet,grossFood:n(foodNet*1.06),wage,subsidy,social,fund,labor:n(wage+subsidy+social+fund),actualProfit:n(netRevenue*(.14+(i%4)*.012-.17*(i===7?1:0)+.025*Math.sin(month*.4+i))),guests:Math.round(netRevenue/(98+i*3)*.68),tables:store.tables,plannedHours,actualHours,punchHours:n(actualHours*(1.015+(i%3)*.005))};
  }
  const fields=['netRevenue','grossRevenue','foodNet','grossFood','wage','subsidy','social','fund','labor','actualProfit','guests','plannedHours','actualHours','punchHours'];
  function aggregate(selected,start,end){
    const out=Object.fromEntries(fields.map(k=>[k,0]));out.tables=0;out.records=0;
    for(const store of selected){let active=false;for(let m=start;m<=end;m++){const r=record(store,m);if(!r)continue;active=true;out.records++;for(const k of fields)out[k]+=r[k]}if(active)out.tables+=store.tables}
    return out;
  }
  const ratio=(a,b,factor=100)=>b>0?a/b*factor:null;
  const change=(a,b)=>a!==null&&b>0?(a-b)/b*100:null;
  const shift=(p,delta)=>({start:p.start+delta,end:p.end+delta});
  function storeCounts(selected,p){
    const unique=[...new Map(selected.map(s=>[s.id,s])).values()];
    return {storeCount:unique.filter(s=>s.opened<=p.end&&(s.closed==null||s.closed>p.end)).length,storeOpened:unique.filter(s=>s.opened>=p.start&&s.opened<=p.end).length,storeClosed:unique.filter(s=>s.closed!=null&&s.closed>=p.start&&s.closed<=p.end).length};
  }
  function value(id,selected,p){
    if(!validHistoryPeriod(p.start,p.end))return null;
    if(metrics[id].type==='count')return storeCounts(selected,p)[id];
    const a=aggregate(selected,p.start,p.end);if(!a.records)return null;
    const meta=metrics[id];if(meta.field)return a[meta.field];
    if(id==='turnover'){
      let dailyTurnoverSum=0,businessDays=0;
      for(let month=p.start;month<=p.end;month++){
        const current=aggregate(selected,month,month);if(!current.records||current.tables<=0)continue;
        dailyTurnoverSum+=current.guests/current.tables;
        businessDays+=new Date(Date.UTC(Math.floor(month/12),month%12+1,0)).getUTCDate();
      }
      return ratio(dailyTurnoverSum,businessDays,1);
    }
    if(id==='grossMargin')return ratio(a.grossRevenue-a.grossFood,a.grossRevenue);
    if(id==='foodRate')return ratio(a.grossFood,a.grossRevenue);
    if(id==='laborRate')return ratio(a.labor,a.grossRevenue);
    if(id==='profitRate')return ratio(a.actualProfit,a.grossRevenue);
    if(id==='attendance')return ratio(a.actualHours,a.plannedHours);
    if(id==='hourly')return ratio(a.labor,a.punchHours,1);
    const delta=-12;
    if(!validHistoryPeriod(p.start+delta,p.end+delta))return null;
    const b=aggregate(selected,p.start+delta,p.end+delta);
    if(!b.records)return null;
    if(id==='growth')return b.actualProfit!==0?(a.actualProfit-b.actualProfit)/b.actualProfit*100:null;
    if(b.netRevenue<=0)return null;
    return change(a.netRevenue,b.netRevenue);
  }
  function comparisons(id,selected,p){const v=value(id,selected,p),prev=value(id,selected,shift(p,-(p.end-p.start+1))),year=value(id,selected,shift(p,-12));const diff=b=>v===null||b===null?null:metrics[id].type==='percent'?v-b:change(v,b);return {value:v,prev,year,mom:diff(prev),yoy:diff(year),unit:metrics[id].type==='percent'?'个百分点':'%'}}
  function format(id,v){if(v===null||!Number.isFinite(v))return {number:'—',unit:''};const type=metrics[id].type;return {number:(type==='money'?v/10000:v).toLocaleString('zh-CN',{minimumFractionDigits:type==='count'?0:1,maximumFractionDigits:type==='count'?0:1}),unit:type==='count'?'家':type==='money'?'万元':type==='percent'?'%':type==='hourly'?'元/小时':'次'}}
  const select=(market,id)=>{const source=metrics[id]?.type==='count'?countStores:stores;return market?source.filter(s=>s.market===market):source};
  function validHistoryPeriod(start,end){return Number.isInteger(start)&&Number.isInteger(end)&&start>=historyStart&&end<=latest&&start<=end}
  function validPeriod(start,end){return Number.isInteger(start)&&Number.isInteger(end)&&start>=earliest&&end<=latest&&start<=end}
  const api={monthKey,monthIndex,lastMonth,latest,earliest,markets,stores,countStores,metrics,groups,record,aggregate,storeCounts,value,comparisons,format,shift,change,select,validPeriod};
  if(typeof module!=='undefined')module.exports=api;else root.DashboardData=api;
})(typeof window!=='undefined'?window:globalThis);
