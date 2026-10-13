/* All records below are deterministic demo data, not connected business data. */
(function(root){
  const n=val=>Math.round(val*100)/100;
  const monthKey=i=>`${Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`;
  const monthIndex=s=>{const [y,m]=s.split('-').map(Number);return y*12+m-1};
  function lastMonth(date=new Date()){
    const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit'}).formatToParts(date);
    return Number(p.find(x=>x.type==='year').value)*12+Number(p.find(x=>x.type==='month').value)-2;
  }
  const latest=lastMonth(), earliest=latest-23;
  const markets=[{id:'east',name:'东区市场'},{id:'south',name:'南区市场'},{id:'north',name:'北区市场'}];
  const storeNames=[['上海静安店','上海徐汇店','杭州西湖店','南京新街口店'],['深圳南山店','广州天河店','厦门思明店','佛山千灯湖店'],['北京朝阳店','北京海淀店','天津和平店','济南历下店']];
  const stores=markets.flatMap((m,j)=>storeNames[j].map((name,k)=>({id:`s${j*4+k+1}`,name,market:m.id,index:j*4+k,tables:38+k*8+j*3,opened:j===2&&k===3?monthIndex('2025-05'):monthIndex('2017-01')})));
  const laborFormula='人力成本 = 人工成本 + 社保补贴实发 + 企业社保金额 + 企业公积金金额';
  const metrics={
    revenue:{name:'收入',caption:'除税收入',group:'IPO 数据',type:'money',source:'企迈收银系统',formula:'所选期间除税收入合计',field:'netRevenue'},
    turnover:{name:'翻台率',caption:'日翻台率合计 / 营业天数',group:'IPO 数据',type:'turns',source:'企迈收银系统',formula:'翻台率 = Σ(日翻台率) / 营业天数',note:'日翻台率 = 当日堂食客流量 ÷ 当日可用桌数。集团及市场按每日客流与桌数汇总计算；累计期间按营业天数加权。演示数据按各门店整月营业处理。'},
    cagr:{name:'同比',caption:'除税收入同比',group:'IPO 数据',type:'percent',source:'企迈收银系统',formula:'(本期除税收入 − 去年同期除税收入) ÷ 去年同期除税收入 × 100%',note:'单月对比去年同月；累计月份对比去年相同起止月份。基期缺失或不大于 0 时显示“—”。'},
    growth:{name:'可比同比',caption:'除税收入可比同比',group:'IPO 数据',type:'percent',pending:true,source:'企迈收银系统',formula:'待确认',note:'可比门店范围及计算口径待确认，暂不展示数值。'},
    mom:{name:'收入环比',caption:'除税收入环比',group:'管理数据',type:'percent',source:'企迈收银系统',formula:'(本期除税收入 − 上期除税收入) ÷ 上期除税收入 × 100%',note:'单月与上月比较；累计月份与前一等长期间比较。'},
    yoy:{name:'收入同比',caption:'除税收入同比',group:'管理数据',type:'percent',source:'企迈收银系统',formula:'(本期除税收入 − 去年同期除税收入) ÷ 去年同期除税收入 × 100%'},
    foodRate:{name:'食材成本率',caption:'除税食材成本 / 除税收入',group:'管理数据',type:'percent',source:'食材成本：供应链系统；除税收入：企迈收银系统',formula:'除税食材成本 ÷ 除税收入 × 100%'},
    laborRate:{name:'人力成本率',caption:'人力成本 / 除税收入',group:'管理数据',type:'percent',source:'人力成本：红海云人事系统；除税收入：企迈收银系统',formula:'人力成本 ÷ 除税收入 × 100%',note:laborFormula},
    receipts:{name:'收入',caption:'含税实收金额',group:'经营中心',type:'money',source:'企迈收银系统',formula:'所选期间含税实收金额合计',field:'grossRevenue'},
    cost:{name:'成本',caption:'含税食材成本',group:'经营中心',type:'money',source:'奥琦玮供应链系统',formula:'所选期间含税食材成本合计',field:'grossFood'},
    labor:{name:'人力',caption:'人力成本',group:'经营中心',type:'money',source:'红海云人事系统',formula:laborFormula,field:'labor'},
    profit:{name:'利润',caption:'息税前利润 EBIT',group:'经营中心',type:'money',source:'金蝶财务系统',formula:'门店利润额 = 息税前利润 EBIT；所选期间汇总',field:'ebit',note:'以财务系统 EBIT 字段为准，不以收入减去食材、人力成本简化计算。'},
    attendance:{name:'排班',caption:'排班出勤率',group:'经营中心',type:'percent',source:'红海云人事系统',formula:'实际出勤工时 ÷ 排班出勤工时 × 100%'},
    hourly:{name:'人时',caption:'人时成本',group:'经营中心',type:'hourly',source:'红海云人事系统',formula:'人时成本 = 人力成本 ÷ 实际打卡工时',note:laborFormula+'。实际出勤工时与实际打卡工时独立取数。'}
  };
  const groups=[{name:'IPO 数据',ids:['revenue','turnover','cagr','growth']},{name:'管理数据',ids:['mom','yoy','foodRate','laborRate']},{name:'经营中心',ids:['receipts','cost','labor','profit','attendance','hourly']}];
  function record(store,month){
    if(month<store.opened)return null;
    const i=store.index,t=month-monthIndex('2023-01');
    const season=1+0.09*Math.sin((month%12)/12*Math.PI*2+i*.18)+.025*Math.cos(month*.9+i);
    const netRevenue=n((640000+i*43000)*Math.pow(1.005+(i%4)*.0009,t)*season);
    const foodNet=n(netRevenue*(.285+(i%5)*.012+.007*Math.sin(month+i)));
    const wage=n(121000+i*7600+t*950+(Math.sin(month+i)+1)*6000);
    const subsidy=n(1200+i*160),social=n(wage*.128),fund=n(wage*.046);
    const plannedHours=n(4200+i*210+(month%12)*15),actualHours=n(plannedHours*(.915+(i%4)*.018+.009*Math.sin(month+i)));
    return {netRevenue,grossRevenue:n(netRevenue*1.06),foodNet,grossFood:n(foodNet*1.06),wage,subsidy,social,fund,labor:n(wage+subsidy+social+fund),ebit:n(netRevenue*(.14+(i%4)*.012-.17*(i===7?1:0)+.025*Math.sin(month*.4+i))),guests:Math.round(netRevenue/(98+i*3)*.68),tables:store.tables,plannedHours,actualHours,punchHours:n(actualHours*(1.015+(i%3)*.005))};
  }
  const fields=['netRevenue','grossRevenue','foodNet','grossFood','wage','subsidy','social','fund','labor','ebit','guests','plannedHours','actualHours','punchHours'];
  function aggregate(selected,start,end){
    const out=Object.fromEntries(fields.map(k=>[k,0]));out.tables=0;out.records=0;
    for(const store of selected){let active=false;for(let m=start;m<=end;m++){const r=record(store,m);if(!r)continue;active=true;out.records++;for(const k of fields)out[k]+=r[k]}if(active)out.tables+=store.tables}
    return out;
  }
  const ratio=(a,b,factor=100)=>b>0?a/b*factor:null;
  const change=(a,b)=>a!==null&&b>0?(a-b)/b*100:null;
  const shift=(p,delta)=>({start:p.start+delta,end:p.end+delta});
  function value(id,selected,p){
    if(metrics[id].pending)return null;
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
    if(id==='foodRate')return ratio(a.foodNet,a.netRevenue);
    if(id==='laborRate')return ratio(a.labor,a.netRevenue);
    if(id==='attendance')return ratio(a.actualHours,a.plannedHours);
    if(id==='hourly')return ratio(a.labor,a.punchHours,1);
    const delta=id==='cagr'||id==='yoy'?-12:-(p.end-p.start+1);
    const b=aggregate(selected,p.start+delta,p.end+delta);
    if(!b.records||b.netRevenue<=0)return null;
    return change(a.netRevenue,b.netRevenue);
  }
  function comparisons(id,selected,p){const v=value(id,selected,p),prev=value(id,selected,shift(p,-(p.end-p.start+1))),year=value(id,selected,shift(p,-12));const diff=b=>v===null||b===null?null:metrics[id].type==='percent'?v-b:change(v,b);return {value:v,prev,year,mom:diff(prev),yoy:diff(year),unit:metrics[id].type==='percent'?'个百分点':'%'}}
  function format(id,v){if(v===null||!Number.isFinite(v))return {number:metrics[id].pending?'待确认':'—',unit:''};const type=metrics[id].type;return {number:(type==='money'?v/10000:v).toLocaleString('zh-CN',{minimumFractionDigits:1,maximumFractionDigits:1}),unit:type==='money'?'万元':type==='percent'?'%':type==='hourly'?'元/小时':'次'}}
  const select=market=>market?stores.filter(s=>s.market===market):stores;
  function validPeriod(start,end){return Number.isInteger(start)&&Number.isInteger(end)&&start>=earliest&&end<=latest&&start<=end}
  const api={monthKey,monthIndex,lastMonth,latest,earliest,markets,stores,metrics,groups,record,aggregate,value,comparisons,format,shift,change,select,validPeriod};
  if(typeof module!=='undefined')module.exports=api;else root.DashboardData=api;
})(typeof window!=='undefined'?window:globalThis);
