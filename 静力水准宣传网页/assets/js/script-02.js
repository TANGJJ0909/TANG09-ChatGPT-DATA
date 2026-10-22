
'use strict';
const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const assets = window.HLS_ASSETS;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed = (n, digits = 1) => (Math.abs(n) < 0.05 ? '0.0' : (n > 0 ? '+' : '−') + Math.abs(n).toFixed(digits));
function pressed(selector, element) { document.querySelectorAll(selector).forEach(b => b.setAttribute('aria-pressed', String(b === element))); }
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => $('toast').hidden = true, 3500); }

// One shared, keyboard-accessible image viewer for all source material.
function openImage(src, title, caption) {
  $('large-image').src = src; $('large-image').alt = title;
  $('image-title').textContent = title; $('image-caption').textContent = caption;
  $('image-dialog').showModal();
}
$('close-image').addEventListener('click', () => $('image-dialog').close());
$('image-dialog').addEventListener('click', e => {
  if (e.target !== $('image-dialog')) return;
  const rect = e.target.getBoundingClientRect();
  if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) e.target.close();
});
const gallery = {
  product: {title:'整机外观', type:'产品效果图', note:'一体化钵体，集成液位测量、信号采集与通讯。图片来自产品介绍 PPT。'},
  interfaces: {title:'结构与接口说明', type:'PPT 标注原图', note:'上钵体为电路腔，下钵体为液位腔。图中标注了 RJ45、电源 / CAN、水管、气管及温度传感器接口。'},
  software: {title:'监测软件界面', type:'软件资料截图', note:'新版资料介绍了主页布局优化及界面定制功能。此处为软件界面截图，不连接实际设备。'},
  circuit: {title:'主控与通讯架构', type:'电路框图', note:'PPT 中的主控与通讯模块框图。CAN、TCP 与 PoE 的接口组合需结合实际交付配置确认。'}
};
let galleryKey = 'product';
document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => {
  galleryKey = button.dataset.gallery; const item = gallery[galleryKey];
  pressed('[data-gallery]', button); $('gallery-title').textContent = item.title; $('gallery-type').textContent = item.type;
  $('gallery-image').src = assets[galleryKey]; $('gallery-image').alt = item.title; $('gallery-note').textContent = item.note;
  $('gallery-enlarge').setAttribute('aria-label', '放大查看' + item.title);
}));
$('gallery-enlarge').addEventListener('click', () => openImage(assets[galleryKey], gallery[galleryKey].title, gallery[galleryKey].note));

// Quasi-static communicating-vessel model. Downward settlement s is positive.
// Equal cross-sections, constant liquid volume, negligible pipe-volume changes:
// common level shift is mean(s), Δd_i = mean(s) - s_i; Δz_i-r = Δd_i - Δd_r.
// Geometry is intentionally exaggerated, while numeric readouts retain μm units.
const stages = [
  ['连通液面建立共同基准','同一种液体、气压平衡且液路畅通时，各容器的自由液面处于同一重力等位面。在局部示意中，液面表现为水平线。'],
  ['容器与电极随测点一起移动','测点下沉时，钵体和电极一起下移。液体在容器间重新分配，达到新的共同液面；电极与液面的间距随之改变。'],
  ['电容读出微小间距变化','用平行板近似理解：C ≈ εA / d。间距 d 减小时电容增大，经电容数字转换、标定及补偿，得到各测点的间距读数。'],
  ['测点差分得到相对高程变化','将测点与基准点的间距变化相减，消除共同液位项。以向上为正，B 点相对 R 下沉 40 μm，对应高程变化 −40 μm。']
];
let demoMode = 'single', currentStage = 0, settlement = 0, playing = false, playTime = 0, lastFrame = 0, raf = 0, lastNumeric = '';
const playDuration = 20000;
function setStage(index) {
  currentStage = index;
  document.querySelectorAll('[data-stage]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.stage === index)));
  $('stage-title').textContent = '0' + (index + 1) + ' / ' + stages[index][0];
  $('stage-description').textContent = stages[index][1];
  if (index === 3 && (demoMode !== 'single' || Math.abs(settlement - 40) > .1)) $('stage-description').textContent = '将测点与基准点的间距变化相减，消除共同液位项。以向上为正，下沉对应负的相对高程变化。整体等量下沉时，点间相对高程不变。';
}
function modelValues(value, mode) {
  const s = mode === 'common' ? [value,value,value] : mode === 'multiple' ? [0,value,-value/2] : [0,value,0];
  const mean = s.reduce((a,b) => a+b,0) / 3;
  return {s, mean, gaps:s.map(n => mean-n), relative:s.map(n => -n+s[0])};
}
function drawDemo() {
  const {s, mean, gaps, relative} = modelValues(settlement, demoMode);
  const scale = .55, level = 250 + mean * scale, centers = [175,410,645], names = ['R · 基准点','B · 测点','C · 测点'];
  let markup = '';
  centers.forEach((x,i) => {
    const offset = s[i]*scale, top=162+offset, bottom=332+offset, electrode=185+offset;
    $('clip-'+i).setAttribute('y', top);
    const active = currentStage === 2 ? '#b17b29' : '#9d7842';
    markup += `<g><rect x="${x-65}" y="${top}" width="130" height="170" rx="3" fill="#ffffffb8"/><rect x="${x-65}" y="${level}" width="130" height="${Math.max(0,bottom-level)}" fill="url(#water)" clip-path="url(#pot-clip-${i})"/><path d="M${x-65} ${top}V${bottom}H${x+65}V${top}" fill="none" stroke="#7c91a4" stroke-width="2"/><rect x="${x-74}" y="${146+offset}" width="148" height="18" rx="4" fill="url(#metal)" stroke="#8fa0b1"/><rect x="${x-74}" y="${bottom}" width="148" height="10" rx="3" fill="url(#metal)" stroke="#8fa0b1"/><path d="M${x} ${164+offset}V${electrode}" stroke="#8a7251" stroke-width="4"/><rect x="${x-34}" y="${electrode}" width="68" height="8" rx="2" fill="${active}"/><path d="M${x+34} ${electrode+14}V${level-6}" stroke="#b17b29" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/><text x="${x+43}" y="${(electrode+level)/2+5}" class="svg-gap">d${i===0?'R':i===1?'B':'C'}</text><line x1="${x-64}" x2="${x+64}" y1="${level}" y2="${level}" stroke="#337eaf" stroke-width="2"/><rect x="${x-58}" y="${bottom+15}" width="116" height="9" rx="2" fill="#cbd5df"/><text x="${x}" y="60" text-anchor="middle" class="svg-pot-title">${names[i]}</text><text x="${x}" y="${bottom-19}" text-anchor="middle" class="svg-reading">Δd ${signed(gaps[i])} μm</text></g>`;
  });
  $('pots').innerHTML = markup;
  $('air-pipe').setAttribute('d',`M175 ${146+s[0]*scale}V95H645V${146+s[2]*scale}`);
  $('air-branch').setAttribute('d',`M410 95V${146+s[1]*scale}`);
  $('water-pipe').setAttribute('d',`M175 ${314+s[0]*scale}V380H645V${314+s[2]*scale}`);
  $('water-branch').setAttribute('d',`M410 ${314+s[1]*scale}V380`);
  $('level-line').setAttribute('y1',level); $('level-line').setAttribute('y2',level);
  $('settlement-value').textContent = (settlement === 0 ? '0' : (settlement>0?'+':'−')+Math.abs(settlement).toFixed(0)) + ' μm';
  const numericKey = [gaps[0],gaps[1],relative[1]].map(n=>n.toFixed(1)).join();
  if (numericKey !== lastNumeric) {
    $('r-reading').innerHTML = `${signed(gaps[0])} <small>μm</small>`;
    $('b-reading').innerHTML = `${signed(gaps[1])} <small>μm</small>`;
    $('height-reading').innerHTML = `${signed(relative[1])} <small>μm</small>`; lastNumeric=numericKey;
  }
  $('result-note').textContent = demoMode==='common' ? '各点同沉，相对高程不变。' : Math.abs(relative[1])<.05 ? '基准状态，B 与 R 无相对变化。' : `B 相对 R ${relative[1]<0?'下沉':'抬升'} ${Math.abs(relative[1]).toFixed(1)} μm。`;
  $('scene-desc').textContent = `${demoMode==='common'?'所有测点同步移动。': 'B 点相对基准点 R 移动。'}B相对R高程变化${signed(relative[1])}微米。共同液面始终绘制为水平线。`;
}
function pauseDemo() {
  playing=false; cancelAnimationFrame(raf); lastFrame=0;
  $('play').innerHTML='<span aria-hidden="true">▶</span> '+(playTime>0 && playTime<playDuration?'继续讲解':'播放讲解');
  $('play').setAttribute('aria-label',playTime>0 && playTime<playDuration?'继续原理讲解':'播放原理讲解');
}
function tick(time) {
  if (!playing) return;
  if (!lastFrame) lastFrame=time;
  const dt=Math.min(70,time-lastFrame);lastFrame=time;
  playTime+=dt*Number($('speed').value); const p=Math.min(1,playTime/playDuration);
  const stage=Math.min(3,Math.floor(p*4));
  const move=Math.max(0,Math.min(1,(p-.25)/.2)); const eased=move*move*(3-2*move);
  settlement=40*eased; $('settlement').value=String(Math.round(settlement));
  if(currentStage!==stage)setStage(stage);
  $('progress').style.width=(p*100)+'%'; drawDemo();
  if(p>=1){pauseDemo();$('play').innerHTML='<span aria-hidden="true">↺</span> 重新播放';}else raf=requestAnimationFrame(tick);
}
$('play').addEventListener('click', () => {
  if(playing){pauseDemo();return;}
  if(playTime>=playDuration){playTime=0;settlement=0;setStage(0);drawDemo();}
  if(reducedMotion.matches){
    playTime=playDuration; settlement=40; $('settlement').value='40';setStage(3);drawDemo();$('progress').style.width='100%';
    toast('已按减少动态效果设置显示最终状态，可点击步骤逐项阅读。');return;
  }
  playing=true;lastFrame=0;$('play').innerHTML='<span aria-hidden="true">Ⅱ</span> 暂停讲解';$('play').setAttribute('aria-label','暂停原理讲解');raf=requestAnimationFrame(tick);
});
function resetDemo() {pauseDemo();playTime=0;settlement=0;$('settlement').value='0';$('progress').style.width='0%';setStage(0);drawDemo();$('play').innerHTML='<span aria-hidden="true">▶</span> 播放讲解';}
$('reset-demo').addEventListener('click',resetDemo);
$('settlement').addEventListener('input',e=>{pauseDemo();playTime=0;settlement=Number(e.target.value);setStage(3);$('progress').style.width='100%';drawDemo();});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
  pauseDemo();demoMode=b.dataset.mode;pressed('[data-mode]',b);playTime=0;
  $('scene-heading').textContent=b.textContent;$('settlement-label').textContent=demoMode==='common'?'各测点共同沉降量':'B 点沉降量';
  $('range-explanation').textContent=demoMode==='multiple'?'B 按滑块位移，C 取反向的一半，R 保持不动。':demoMode==='common'?'R、B、C 同步同向移动，比较相对读数。':'正值表示下沉，负值表示抬升。';
  settlement=40;$('settlement').value='40';setStage(3);drawDemo();$('progress').style.width='100%';
}));
document.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{
  pauseDemo();const index=Number(b.dataset.stage);playTime=index*playDuration/4;
  settlement=index===0?0:40;$('settlement').value=String(settlement);setStage(index);drawDemo();$('progress').style.width=((index+1)*25)+'%';
}));
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&playing)pauseDemo();},{threshold:.05}).observe($('hls-scene'));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pauseDemo();});
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches&&playing)pauseDemo();});

// Only source figures and stated PPT results are used here. No synthetic test data.
const tests={
  resolution:{title:'分辨率测试',description:'PPT 第 7 页：步距分布散点图与统计分析图。',charts:[['resolution-step','分辨率步距分布散点图'],['resolution-stat','分辨率统计分析图']],conclusion:'测试结论：全部静力水准分辨率 ≤2 μm，1.2 μm 附近分布较多。',field:[['test-precision','精度测试平台'],['test-consistency','多台仪器一致性测试']]},
  accuracy:{title:'精度测试',description:'PPT 第 8 页：测量精度与线性精度统计原图。',charts:[['accuracy-points','测量精度统计分析图'],['accuracy-stat','线性精度统计分析图']],conclusion:'PPT 明确结论：精度 ≤5 μm，正文记录最大精度误差为 4.86 μm。',field:[['test-precision','精度测试平台'],['test-system','系统精度测试']]},
  range:{title:'量程测试',description:'PPT 第 9 页：量程统计分析原图。',charts:[['range-stat','量程测试统计分析图']],conclusion:'PPT 记录：总量程主要集中于 12.2–12.3 mm，最小值 12.09 mm，双向量程大于 ±6 mm。',field:[['test-system','系统测试现场'],['test-vibration','振动测试现场']]}
};
let testKey='resolution',testDisplay='charts';
function renderTest(){
  const item=tests[testKey];$('test-title').textContent=item.title;$('test-description').textContent=item.description;$('test-conclusion').textContent=item.conclusion;
  $('test-charts').classList.toggle('single',item.charts.length===1);
  $('test-charts').innerHTML=item.charts.map(([key,title])=>`<figure><button class="chart-button" data-source-image="${key}" data-source-title="${esc(title)}"><img src="${assets[key]}" alt="${esc(title)}，来自${esc(item.description)}" width="900" height="660" loading="lazy"><span>${esc(title)} · 点击放大 ↗</span></button></figure>`).join('');
  $('test-field').innerHTML=item.field.map(([key,title])=>`<figure><button class="chart-button" data-source-image="${key}" data-source-title="${esc(title)}"><img src="${assets[key]}" alt="${esc(title)}，产品PPT第6页原始照片" width="1200" height="900" loading="lazy"><span>查看大图 ↗</span></button><p>${esc(title)} · PPT 第 6 页</p></figure>`).join('');
  $('test-charts').hidden=testDisplay!=='charts';$('test-field').hidden=testDisplay!=='field';
}
document.querySelectorAll('[data-test]').forEach(b=>b.addEventListener('click',()=>{testKey=b.dataset.test;pressed('[data-test]',b);renderTest();}));
$('show-charts').addEventListener('click',()=>{testDisplay='charts';$('show-charts').setAttribute('aria-pressed','true');$('show-field').setAttribute('aria-pressed','false');renderTest();});
$('show-field').addEventListener('click',()=>{testDisplay='field';$('show-charts').setAttribute('aria-pressed','false');$('show-field').setAttribute('aria-pressed','true');renderTest();});
$('test-charts').addEventListener('click',sourceImageClick);$('test-field').addEventListener('click',sourceImageClick);
function sourceImageClick(e){const b=e.target.closest('[data-source-image]');if(b)openImage(assets[b.dataset.sourceImage],b.dataset.sourceTitle,'来自用户提供的产品介绍 PPT 原始图表或照片；未重建实测数据。');}
let compensationKey='compensation';
const compTitles={longterm:'长期采集数据',compensation:'温度与补偿前后对比',compensated:'补偿后结果'};
document.querySelectorAll('[data-comp]').forEach(b=>b.addEventListener('click',()=>{compensationKey=b.dataset.comp;pressed('[data-comp]',b);$('compensation-image').src=assets[compensationKey];$('compensation-image').alt=compTitles[compensationKey];$('compensation-enlarge').setAttribute('aria-label','放大'+compTitles[compensationKey]);}));
$('compensation-enlarge').addEventListener('click',()=>openImage(assets[compensationKey],compTitles[compensationKey],'PPT 第 10 页补偿修正资料。图中结果仅对应原资料测试工况。'));

const applications={
  line:{title:'加速器与光束线',tag:'连续高程监测',description:'沿隧道或光束线设置多个测点，连续监测基础与支撑结构的相对高程变化，为准直调整提供数据。',image:'accelerator',caption:'加速器现场布设 · PPT 第 4 页',facts:[['公开研究布点','7 台 / 60 m'],['研究点间距','10 m']],provenance:'公开研究中，合肥光源直线段使用 7 台创谱传感器，间隔 10 m 布设。此处布局可按项目需求调整。',count:7,network:'直线布设示意'},
  ring:{title:'储存环姿态监测',tag:'环形多点布设',description:'围绕储存环分布测点，跟踪基础、支撑与设备安装位置的相对高程变化，为长期稳定运行和准直维护提供依据。',image:'ring',caption:'合肥先进光源加速器与储存环示意 · PPT 第 3 页',facts:[['监测对象','基础 / 支撑'],['布设方式','沿环分布']],provenance:'PPT 列有合肥先进光源与重庆超瞬态光源加速器、储存环应用。下方默认 12 点仅用于展示环形方案。',count:12,network:'环形布设示意'},
  turbine:{title:'汽轮机轴系测量',tag:'平台标高相对变化',description:'实时监测各标志位置的相对标高变化，为转子轴系靠背轮中心偏差调整提供数据支撑。',image:'turbine',caption:'汽轮机组轴系应用现场 · PPT 第 4 页',facts:[['资料平台尺寸','50 m × 20 m'],['资料测量点数','约 20 点']],provenance:'PPT 第 11 页方案以阳江电厂基础平台为例，两排各约 10 个测点。实际布设需结合设备和标高条件。',count:20,network:'汽轮机平台双排布设示意'},
  multi:{title:'多维联合监测',tag:'高程与振动联合采集',description:'在施工或安装影响监测中，将静力水准与纵向、横向振动传感器联合使用，分别观察相对高程变化与振动事件。',image:'multidimensional',caption:'堆芯安装影响监测应用资料 · PPT 第 12 页',facts:[['静力水准','4 台'],['振动通道','2 路']],provenance:'PPT 提供了 4 台静力水准、2 路振动及数据采集装置方案。振动数据来自独立振动传感器。',count:4,network:'高程与振动联合监测示意'}
};
let applicationKey='line';
function setApplication(key){
  applicationKey=key;const item=applications[key];
  document.querySelectorAll('[data-app]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.app===key)));
  $('application-tag').textContent=item.tag;$('application-title').textContent=item.title;$('application-description').textContent=item.description;
  $('application-image').src=assets[item.image];$('application-image').alt=item.caption;$('application-image').style.objectFit=key==='ring'?'contain':'cover';
  $('application-photo-caption').textContent=item.caption;$('application-provenance').textContent=item.provenance;
  $('application-facts').innerHTML=item.facts.map(([name,value])=>`<div><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`).join('');
  $('application-enlarge').setAttribute('aria-label','放大'+item.caption);
  $('point-count').value=String(item.count);$('point-count').disabled=key==='multi';
  $('point-count-note').textContent=key==='multi'?'按资料方案：4 台静力水准 + 2 路独立振动通道。':'含 1 个基准测点；这里的 2–24 点仅为演示范围。';
  renderPlan();
}
document.querySelectorAll('[data-app]').forEach(b=>b.addEventListener('click',()=>setApplication(b.dataset.app)));
$('application-enlarge').addEventListener('click',()=>{const item=applications[applicationKey];openImage(assets[item.image],item.title,item.caption);});
function drawNetwork(count){
  const lineColor='#69a2c9';let points=[],paths='',extras='';
  if(applicationKey==='ring'){
    points=Array.from({length:count},(_,i)=>{const a=(i/count)*Math.PI*2-Math.PI/2;return [410+275*Math.cos(a),164+105*Math.sin(a)];});
    paths=`<ellipse cx="410" cy="164" rx="275" ry="105" fill="none" stroke="${lineColor}" stroke-width="3"/><text x="410" y="158" text-anchor="middle" class="svg-pot-title">储存环</text><text x="410" y="181" text-anchor="middle" class="svg-small">环形测点示意</text>`;
  }else if(applicationKey==='turbine'){
    const top=Math.ceil(count/2),bottom=count-top;
    for(let i=0;i<top;i++)points.push([75+i*(670/Math.max(1,top-1)),80]);
    for(let i=0;i<bottom;i++)points.push([75+i*(670/Math.max(1,bottom-1)),244]);
    paths=`<rect x="52" y="55" width="716" height="214" rx="4" fill="white" stroke="#cbd6e1"/><path d="M75 80H745V244H75" fill="none" stroke="${lineColor}" stroke-width="3"/><rect x="200" y="133" width="420" height="60" rx="22" fill="#e1e8ef" stroke="#bbcbd9"/><line x1="150" y1="163" x2="670" y2="163" stroke="#8da4ba" stroke-width="3"/><text x="410" y="170" text-anchor="middle" class="svg-pot-title">汽轮机轴系 / 平台</text>`;
  }else if(applicationKey==='multi'){
    points=[[190,100],[630,100],[190,235],[630,235]];
    paths=`<path d="M190 100H630V235H190Z" fill="none" stroke="${lineColor}" stroke-width="3"/><rect x="320" y="125" width="180" height="80" rx="5" fill="white" stroke="#bdcbd9"/><text x="410" y="156" text-anchor="middle" class="svg-pot-title">数据采集装置</text><text x="410" y="181" text-anchor="middle" class="svg-small">高程 + 独立振动通道</text>`;
    extras=`<g stroke="#a87529" fill="#faf1e4"><path d="M270 265l10 18h-20zM550 265l10 18h-20z"/></g><text x="280" y="307" text-anchor="middle" class="svg-label">纵向振动</text><text x="550" y="307" text-anchor="middle" class="svg-label">横向振动</text><path d="M280 264L365 205M550 264L455 205" stroke="#a87529" stroke-dasharray="4 4" fill="none"/>`;
  }else{
    const cols=Math.min(8,count),rows=Math.ceil(count/cols);
    for(let i=0;i<count;i++){const row=Math.floor(i/cols),col=i%cols;points.push([70+col*(680/Math.max(1,cols-1)),rows===1?153:83+row*85]);}
    for(let row=0;row<rows;row++){
      const group=points.slice(row*cols,(row+1)*cols),y=group[0][1];paths+=`<path d="M${group[0][0]} ${y}H${group[group.length-1][0]}" stroke="${lineColor}" stroke-width="3" fill="none"/>`;
      if(row<rows-1){const x=group[group.length-1][0];paths+=`<path d="M${x} ${y}V${y+42}H70V${y+85}" fill="none" stroke="${lineColor}" stroke-width="2"/>`;}
    }
    extras=`<text x="410" y="312" text-anchor="middle" class="svg-label">沿隧道 / 光束线设置测点</text>`;
  }
  let dots=points.map(([x,y],i)=>`<g><circle cx="${x}" cy="${y}" r="13" fill="white" stroke="${i===0?'#a87529':'#175eb5'}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="5" fill="${i===0?'#a87529':'#175eb5'}"/><text x="${x}" y="${y-22}" text-anchor="middle" class="svg-small">${i===0?'R':String(i).padStart(2,'0')}</text></g>`).join('');
  $('network').innerHTML=`<rect width="820" height="340" fill="#f5f7f9"/>${paths}${extras}${dots}`;
  $('network').setAttribute('aria-label',applications[applicationKey].network+'，'+count+'个静力水准测点，金色测点R为基准点。'+(applicationKey==='multi'?'另有纵向及横向振动各一路。':''));
}
function planData(){return {scene:applications[applicationKey].title,count:Number($('point-count').value),communication:$('communication').value,interval:$('sample-interval').value,temperature:$('temperature').checked,vibration:applicationKey==='multi'?2:0};}
function renderPlan(){
  const data=planData();$('point-count-output').textContent=data.count+' 台';$('network-title').textContent=applications[applicationKey].network;
  $('network-count').textContent=data.count+' 个静力水准测点'+(data.vibration?' + 2 路振动':'');
  $('plan-summary').textContent=`${data.count} 台静力水准仪 · ${data.communication} · ${data.interval}${data.temperature?' · 环境测温':''}${data.vibration?' · 2 路振动':''}`;
  drawNetwork(data.count);
}
['point-count','communication','sample-interval','temperature'].forEach(id=>$(id).addEventListener('input',renderPlan));
$('reset-plan').addEventListener('click',()=>{$('communication').value='以太网';$('sample-interval').value='30 s';$('temperature').checked=true;setApplication(applicationKey);toast('已恢复当前场景的默认方案。');});
$('export-plan').addEventListener('click',()=>{
  const data=planData();const txt=[
    '创谱科技 · 静力水准监测方案草案',
    '导出时间：'+new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',dateStyle:'medium',timeStyle:'short'}).format(new Date()),
    '', '应用场景：'+data.scene,'布设形式：'+applications[applicationKey].network,
    '静力水准仪：'+data.count+' 台（含 1 个基准测点 R）','通讯需求：'+data.communication,'采集间隔：'+data.interval,
    '环境温度采集：'+(data.temperature?'需要（PT100 等，具体配置确认）':'未选择'),
    ...(data.vibration?['独立振动通道：2 路（纵向 1 路、横向 1 路）']:[]),
    '', '需进一步确认：','1. 安装标高与现场稳定基准。','2. 连通管路长度、走向、排气与初始液位。','3. 供电、通讯布线、数据采集装置与软件需求。','4. 接口组合、设备数量和最终性能验收条件。',
    '', '说明：本清单为需求沟通草案，不是报价、采购订单或最终工程设计。演示点数范围不代表产品系统容量。',
    '参数参考：PPT 分辨率 ≤2 μm、精度 ≤5 μm、总量程大于12 mm；正式交付以确认文件为准。',
    '联系人：sales@specreation.com','产品资料：https://www.specreation.com/product/385.html'
  ].join('\r\n');
  const blob=new Blob(['\ufeff'+txt],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='创谱静力水准_方案清单_'+data.scene+'.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('方案清单已生成，请查看浏览器下载记录。');
});
$('print-page').addEventListener('click',()=>window.print());
const sections=[...document.querySelectorAll('#overview,#principle,#test-data,#applications')];
const navLinks=[...document.querySelectorAll('.header nav a')];
let scrollQueued=false;
function updateNavigation(){const offset=document.querySelector('.header').offsetHeight+80;let current=sections[0].id;sections.forEach(s=>{if(s.getBoundingClientRect().top<=offset)current=s.id;});navLinks.forEach(a=>{if(a.getAttribute('href')==='#'+current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});scrollQueued=false;}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateNavigation);}},{passive:true});
setStage(0);drawDemo();renderTest();setApplication('line');updateNavigation();
