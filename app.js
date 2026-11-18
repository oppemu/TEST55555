// Completion is derived from current values, never from navigation history.
function completeSteps(){
 const text=(v,max=5000)=>typeof v==='string'&&!!v.trim()&&v.length<=max&&!v.includes('{{')&&!v.includes('}}');
 const has=keys=>keys.every(k=>text(d[k]));
 const date=v=>{try{return /^\d{4}-\d{2}-\d{2}$/.test(v)&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;}catch{return false;}};
 const amount=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&['string','number'].includes(typeof v)&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1e12&&Math.abs(Number(v)*100-Math.round(Number(v)*100))<=.0001;
 const states=[has(['title','unit','owner','position'])&&Number.isInteger(Number(d.year))&&Number(d.year)>=2400&&Number(d.year)<=2800&&months.includes(d.planStartMonth),has(['rationale','objectives','goal']),has(['location'])&&date(d.start)&&date(d.end)&&d.start<=d.end&&d.activities.length>0&&d.activities.length<=100&&d.activities.every(a=>text(a.name,1000)&&a.months.length>0&&a.months.every(m=>Number.isInteger(m)&&m>=0&&m<12)),d.budgets.length>0&&d.budgets.length<=100&&d.budgets.every(b=>text(b.name,1000)&&amount(b.amount)),has(['output','outcome','benefit','evaluation'])];
 return [...states,false]; // Review is an action, not an automatically approved step.
}
function timelineHTML(){const done=completeSteps();return steps.slice(0,5).map((s,i)=>`<button class="step ${i===step?'active':''} ${done[i]?'complete':''}" data-step="${i}" ${i===step?'aria-current="step"':''} aria-label="${s}${done[i]?' ข้อมูลครบ':i===5?' ตรวจทานก่อนส่ง':' ยังไม่ครบ'}"><b>${i+1}</b><span class="timeline-state">${done[i]?'✓':''}</span></button>`).join('')+'<div class="hint">สถานะข้อมูลครบไม่ใช่การบันทึกหรืออนุมัติ • กดบันทึกร่างเพื่อเก็บข้อมูล</div>';}
function updateTimeline(){}

const fullMonthNames=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const months=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
function planMonths(){const start=Math.max(0,months.indexOf(d.planStartMonth||'ม.ค.'));return Array.from({length:12},(_,i)=>({month:months[(start+i)%12],year:Number(d.year)+Math.floor((start+i)/12)}));}
function ganttTable(){const labels=planMonths();return '<div class="scroll gantt-scroll"><table class="gantt" aria-label="แผนดำเนินงานรายเดือน"><thead><tr><th class="activity-col">กิจกรรม</th>'+labels.map(x=>'<th>'+esc(x.month)+'<br><small>'+x.year+'</small></th>').join('')+'</tr></thead><tbody>'+d.activities.map((a,i)=>'<tr><td class="activity-col">'+(i+1)+'. '+esc(a.name||'—')+'</td>'+labels.map((x,j)=>'<td class="gantt-cell '+(a.months.includes(j)?'scheduled':'')+'" aria-label="'+esc(x.month+' '+x.year+': '+(a.months.includes(j)?'ดำเนินการ':'ไม่ดำเนินการ'))+'">'+(a.months.includes(j)?'<span class="gantt-bar" aria-hidden="true"></span>':'')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'; }
const steps=['ข้อมูลโครงการ','เหตุผลและเป้าหมาย','แผนดำเนินงาน','งบประมาณ','ผลที่คาดหวัง','ตรวจทาน'];
let session=null, projectId='', version=0, savedData='', busy=false, pending=null;
let readyPdf=null; // Session-local: never reuse across owner, project, revision or edits.
const identityKeys=['unit','owner','position','email','proposer','proposerPosition'];
function applyIdentity(){if(session)Object.assign(d,{personId:session.id,unit:session.unit,owner:session.name,position:session.position,email:session.email,proposer:session.name,proposerPosition:session.position});}
let step=0;let d={title:'',unit:'',owner:'',position:'',phone:'',email:'',proposer:'',proposerPosition:'',year:'2570',planStartMonth:'ม.ค.',rationale:'',objectives:'',goal:'',start:'',end:'',location:'',output:'',outcome:'',benefit:'',evaluation:'',budgetNote:'',activityNote:'',activities:[{name:'',months:[]}],budgets:[{name:'',amount:''}]};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const money=n=>Number(n||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});const total=()=>d.budgets.reduce((s,b)=>s+Number(b.amount||0),0);
const fieldHelp={"planStartMonth":"เลือกเดือนเริ่มแผน โดยปีด้านบนเป็นปีของเดือนแรก ระบบเรียง 12 เดือนและข้ามปีให้อัตโนมัติ","activityNote":"ระบุรายละเอียดเพิ่มเติมของวิธีการดำเนินการ ถ้าไม่มีให้เว้นว่าง","title": "ระบุชื่อแผนงานหรือโครงการให้สั้น ชัดเจน และตรงกับเรื่องที่ขออนุมัติ", "year": "เลือกปี พ.ศ. ที่ดำเนินโครงการ", "unit": "เติมจากข้อมูล “งาน” ของบัญชีที่ยืนยันแล้วในฐานบุคลากรของโค้ด", "owner": "ชื่อผู้รับผิดชอบโครงการ เติมจากบัญชีผู้ใช้อัตโนมัติ", "position": "ตำแหน่งผู้รับผิดชอบ เติมจากข้อมูลบุคลากรอัตโนมัติ", "email": "อีเมลติดต่อผู้รับผิดชอบ เติมจากบัญชีผู้ใช้อัตโนมัติ", "proposer": "ชื่อผู้เสนอโครงการ เติมจากบัญชีผู้ใช้ ไม่ใช่การลงนาม", "proposerPosition": "ตำแหน่งของผู้เสนอโครงการ เติมให้อัตโนมัติ", "rationale": "อธิบายปัญหา ความจำเป็น หรือที่มาว่าทำไมจึงต้องจัดโครงการนี้", "objectives": "ระบุสิ่งที่ต้องการให้เกิดขึ้นจากโครงการ เขียนเป็นข้อสั้น ๆ", "goal": "ระบุกลุ่มเป้าหมาย จำนวน หรือระดับความสำเร็จที่ต้องการ", "start": "เลือกวันเริ่มดำเนินโครงการ", "end": "เลือกวันสิ้นสุดโครงการ โดยไม่ก่อนวันเริ่ม", "location": "ระบุสถานที่ อาคาร ห้อง หรือช่องทางออนไลน์ที่จัดกิจกรรม", "budgetNote": "รายละเอียดเพิ่มเติม เช่น ขอถัวเฉลี่ยจ่ายข้ามรายการ หรือถ้าไม่มีให้เว้นว่าง", "output": "ระบุผลงานที่ได้โดยตรง เช่น จำนวนกิจกรรม ผู้เข้าร่วม หรือชิ้นงาน", "outcome": "ระบุการเปลี่ยนแปลงหลังโครงการ เช่น ความรู้ ทักษะ หรือประสิทธิภาพที่เพิ่มขึ้น", "benefit": "อธิบายว่าใครได้รับประโยชน์ และได้รับประโยชน์อย่างไร", "evaluation": "ระบุวิธีวัดผล ตัวชี้วัด และเกณฑ์ความสำเร็จ เช่น คะแนนประเมินไม่น้อยกว่าร้อยละ 80"};
function field(id,label,type='text',opts=[]){if(['output','outcome','benefit','evaluation','rationale','objectives','goal','start'].includes(id))label=label.replace(/^\d+(?:\.\d+)?\.?\s+/,'');let control=type==='textarea'?`<textarea ${id==='activityNote'?'placeholder="กำหนดการอาจมีการเปลี่ยนแปลงได้"':''} id="${id}" data-key="${id}">${esc(d[id])}</textarea>`:type==='select'?`<select id="${id}" data-key="${id}"><option value="">เลือกรายการ</option>${opts.map(x=>`<option value="${esc(x)}" ${d[id]===x?'selected':''}>${esc(id==='planStartMonth'?fullMonthNames[months.indexOf(x)]||x:x)}</option>`).join('')}</select>`:`<input id="${id}" data-key="${id}" type="${type}" value="${esc(d[id])}">`;return `<div class="field ${type==='textarea'||id==='title'?'full':''}"><label for="${id}">${label}</label>${control}</div>`}
function render(){const pdfTools=document.querySelector('#pdfToolbar');pdfTools.innerHTML='';if(session){const pdfButton=document.createElement('button');pdfButton.textContent='รายงาน';pdfButton.onclick=()=>generateProject();pdfTools.appendChild(pdfButton);}if(!session){document.querySelector('.side').innerHTML='';document.querySelector('.actions').classList.add('hidden');document.querySelector('#screen').innerHTML='<h2>เริ่มกรอกโครงการ</h2><p class="intro">ใช้บัญชีมหาวิทยาลัยที่ได้รับสิทธิ์ ข้อมูลผู้รับผิดชอบจะเติมจากบัญชีที่เข้าสู่ระบบ</p><div class="subcard"><button id="connect">เข้าใช้งานด้วยบัญชีมหาวิทยาลัย</button></div>';document.querySelector('#connect').onclick=connect;return;}document.querySelector('.actions').classList.remove('hidden');document.querySelector('.side').innerHTML='';let h=`<div class="eyebrow">ขั้นตอน ${step+1} / 5</div><h2>${steps[step]}</h2>`;
h=step===5?sectionHTML(5):profileHTML()+[0,1,2,3,4].map(i=>'<section class="continuous-section" id="section-'+i+'">'+sectionHTML(i)+'</section>').join('');
document.querySelector('#screen').innerHTML=h;document.querySelector('#back').classList.add('hidden');document.querySelector('#next').classList.add('hidden');document.querySelector('#status').textContent='';bind();identityKeys.forEach(k=>{const e=document.getElementById(k);if(e){e.readOnly=true;e.style.background='#eef3f5';e.removeAttribute('data-key');}});applyLock();}

// The backend is authoritative for identity, ownership, totals and versions.
const pendingKey='oppe-project-pending-v1';
const clone=x=>JSON.parse(JSON.stringify(x));
const blank=clone(d);
function message(text){document.querySelector('#status').textContent=text;if(typeof LocalReport!=='undefined')LocalReport.status(text);}
function changeStep(n){if(busy||pending)return;step=n;render();window.scrollTo({top:0,behavior:'smooth'});}
function applyLock(){
  const locked=busy||!!pending;
  const saveButton=document.getElementById('save');if(saveButton){const sending=busy&&pending?.request?.action==='save';saveButton.setAttribute('aria-busy',String(sending));saveButton.innerHTML=sending?'<span class="mu-send-spinner" aria-hidden="true"></span><span>กำลังบันทึกข้อมูล</span>':'ส่งข้อมูล';}

  document.querySelectorAll('#screen input,#screen textarea,#screen select,#screen button,.actions button,.side button,#projectToolbar button,#projectToolbar select,#pdfToolbar button').forEach(e=>e.disabled=locked);
  document.querySelectorAll('#pdfToolbar button').forEach(b=>{b.setAttribute('aria-busy','false');b.textContent='รายงาน';});
  const box=document.querySelector('#pendingActions');box.innerHTML='';
  if(saveButton&&!busy&&pending?.request?.action==='save')saveButton.disabled=false;
  document.querySelectorAll('#pdfToolbar button').forEach(b=>b.disabled=!session); // Local report never waits for network or validation.
}
function downloadJson(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function normalizeData(data){if(!data||!Array.isArray(data.activities)||!Array.isArray(data.budgets))throw Error('ข้อมูลที่ได้รับไม่ครบ');return {...clone(blank),...data};}
function persistPending(value){
  if(value){sessionStorage.setItem(pendingKey,JSON.stringify(value));if(sessionStorage.getItem(pendingKey)!==JSON.stringify(value))throw Error('เก็บรหัสรายการในเบราว์เซอร์ไม่ได้ จึงยังไม่ส่งข้อมูล');}
  else sessionStorage.removeItem(pendingKey);
  pending=value;
}
function documents(result){
 const box=document.querySelector('#documents');box.innerHTML='';if(!result?.pdfUrl)return;
 if(typeof PDFPreview!=='undefined'){PDFPreview.open(result.pdfUrl,{pdfData:result.pdfData,pdfTransferError:result.pdfTransferError});return;}
 const u=new URL(result.pdfUrl);if(u.protocol!=='https:'||u.hostname!=='drive.google.com')return;
 const a=document.createElement('a');a.href=u.href;a.textContent='เปิดตัวอย่าง PDF / ดาวน์โหลด';a.target='_blank';a.rel='noopener';box.appendChild(a);
}

async function connect(){
 if(busy)return;busy=true;applyLock();message('กำลังตรวจบัญชีผู้ใช้งาน');
 try{
  await ProjectTransport.reconnect();
  const person=await ProjectTransport.request({action:'identity',data:{}});
  if(!person||!person.id||!person.email||!person.name||person.formSchema!=='oppe-source-20261116')throw Error('ยังเปิดแบบฟอร์มไม่ได้ กรุณาตรวจรุ่นระบบและบัญชีผู้ใช้');
  session=person;applyIdentity();
  const raw=sessionStorage.getItem(pendingKey);
  if(raw){let old;try{old=JSON.parse(raw);}catch{throw Error('พบรายการค้างที่อ่านไม่ได้ กรุณาติดต่อผู้ดูแล');}if(old.email!==session.email)throw Error('มีรายการค้างของอีกบัญชี กรุณาเข้าด้วยบัญชีเดิม');pending=old;if(pending.request.action==='save'){d=normalizeData(pending.request.data);projectId=pending.request.projectId||'';version=pending.request.expectedVersion;applyIdentity();}}
  render();try{await refreshList();message('');}catch{message('เปิดบัญชีแล้ว แต่ยังอ่านรายการโครงการไม่ได้ กรุณาติดต่อผู้ดูแล');}
 }catch(e){session=null;message(e.message||'ยังเปิดบัญชีไม่ได้');}
 finally{busy=false;applyLock();}
}
async function refreshList(){
  if(!session)return;
  const items=await ProjectTransport.request({action:'list'});if(!Array.isArray(items))throw Error('อ่านรายการไม่ได้');
  const box=document.querySelector('#projectToolbar');box.innerHTML='';
  const select=document.createElement('select');select.setAttribute('aria-label','โครงการของฉัน');const first=document.createElement('option');first.value='';first.textContent='เลือกโครงการที่บันทึกไว้';select.appendChild(first);
  for(const item of items){const o=document.createElement('option');o.value=item.projectId;o.textContent=item.title+' (รุ่น '+item.version+')';select.appendChild(o);}select.value=projectId;select.onchange=()=>{if(select.value)loadProject(select.value);};box.appendChild(select);
  const add=document.createElement('button');add.className='secondary';add.textContent='โครงการใหม่';add.onclick=()=>{if(busy||pending)return;if(JSON.stringify(d)!==savedData&&d.title&&!confirm('เปิดโครงการใหม่? ข้อมูลที่ยังไม่บันทึกจะไม่ถูกเก็บ'))return;d=clone(blank);applyIdentity();projectId='';version=0;savedData='';step=0;documents(null);render();};box.appendChild(add);applyLock();
}
async function loadProject(id){
  if(busy||pending)return;if(d.title&&JSON.stringify(d)!==savedData&&!confirm('เปิดโครงการนี้? ข้อมูลที่ยังไม่บันทึกจะไม่ถูกเก็บ'))return;
  busy=true;applyLock();
  try{const result=await ProjectTransport.request({action:'load',projectId:id});d=normalizeData(result.data);projectId=result.projectId;version=result.version;applyIdentity();savedData=JSON.stringify(d);step=0;documents(null);render();message('เปิดข้อมูลที่บันทึกไว้แล้ว');}catch(e){message(e.message);}finally{busy=false;applyLock();}
}
async function runPending(){
  if(busy||!pending)return false;
  busy=true;applyLock();message('');const current=pending;
  try{
    const result=await ProjectTransport.request(current.request);
    if(!result||result.projectId==null||!Number.isInteger(result.version))throw Error('ยังไม่ได้รับหลักฐานยืนยันผลที่ครบถ้วน');
    if(current.request.action==='save'){projectId=result.projectId;version=result.version;d=normalizeData(current.request.data);applyIdentity();savedData=JSON.stringify(d);}
    else {if(!result.docUrl||!result.pdfUrl)throw Error('ยังไม่ได้รับลิงก์เอกสารครบ กรุณาตรวจรายการเดิม');projectId=result.projectId;version=result.version;}
    if(['generate','generateEmbedded'].includes(current.request.action))readyPdf={email:session.email,projectId,version,data:JSON.stringify(d),renderer:result.pdfRenderer||'',result};
    persistPending(null);render();
    message('');
    void refreshList().catch(()=>{/* List refresh must not hold the confirmed operation or PDF flow. */});
    return true;
  }catch(e){
    if(e.safeToEdit===true){persistPending(null);message(e.message||'ยังไม่ได้บันทึก กรุณาตรวจข้อมูล');}else message((e.message?e.message+' — ':'')+'ยังยืนยันผลไม่ได้ กรุณากด'+(current.request.action==='save'?'ส่งข้อมูล':'รายงาน')+'อีกครั้งเพื่อตรวจคำขอเดิม');
    return false;
  }finally{busy=false;applyLock();}
}
async function saveProject(){
  if(busy)return false;
  if(pending)return pending.request.action==='save'?runPending():false;
  if(!session)return false;
  try{persistPending({email:session.email,request:{action:'save',requestId:ProjectTransport.random(),projectId,expectedVersion:version,data:clone(d)}});}catch(e){message(e.message);return false;}
  return runPending();
}
function checkPdfFields(){
 const labels={title:'ชื่อโครงการ',unit:'หน่วยงาน',owner:'ผู้รับผิดชอบ',position:'ตำแหน่ง',rationale:'หลักการและเหตุผล',objectives:'วัตถุประสงค์',goal:'เป้าหมายหลัก',start:'วันที่เริ่ม',end:'วันที่สิ้นสุด',location:'สถานที่',output:'ผลผลิต',outcome:'ผลลัพธ์',benefit:'ประโยชน์ที่คาดว่าจะได้รับ',evaluation:'วิธีประเมินและตัวชี้วัด'};
 for(const k of Object.keys(labels)){if(!String(d[k]||'').trim()){message('กรุณากรอก'+labels[k]+'ก่อนดาวน์โหลด PDF');const el=document.getElementById(k);if(el){el.scrollIntoView?.({block:'center'});el.focus?.();}return false;}}
 if(!completeSteps().slice(0,5).every(Boolean)){message('กรุณาตรวจวันที่ กิจกรรม เดือนดำเนินการ และงบประมาณให้ครบก่อนดาวน์โหลด PDF');return false;}return true;
}
function generateProject(){
  const snapshot=clone(d),fingerprint=JSON.stringify(d),owner=session?.email;
  LocalReport.open(snapshot,planMonths(),()=>{if(JSON.stringify(d)!==fingerprint||session?.email!==owner)throw Error('ข้อมูลในฟอร์มเปลี่ยนแล้ว กรุณากลับฟอร์มและเปิดรายงานอีกครั้ง');return downloadReport();},{projectId,version});
}
async function downloadReport(){
  // Local-only download. Do not inspect, retry, clear or send any pending backend request here.
  if(typeof ProjectPdf==='undefined')throw Error('โหลดเครื่องมือสร้าง PDF ไม่ครบ กรุณาเปิดหน้าฟอร์มใหม่');
  const snapshot=clone(d),localTime=new Date().toISOString();
  const meta={localOnly:true,projectId:projectId||'ฉบับร่างยังไม่บันทึก',version:Number(version)>0?Number(version):1,createdAt:localTime,proposedDate:''};
  let renderTimer;
  const pdfData=await Promise.race([ProjectPdf.create(snapshot,meta),new Promise((_,reject)=>{renderTimer=setTimeout(()=>reject(Error('สร้าง PDF ในเครื่องไม่สำเร็จภายในเวลาที่กำหนด กรุณาลองอีกครั้ง')),60000);})]).finally(()=>clearTimeout(renderTimer));
  PDFPreview.decodePdf(pdfData);
  return {pdfData,localOnly:true};
}

function bind(){
  document.querySelectorAll('[data-step]').forEach(e=>e.onclick=()=>changeStep(+e.dataset.step));
  document.querySelectorAll('[data-key]').forEach(e=>e.oninput=()=>{d[e.dataset.key]=e.value;if(['year','planStartMonth'].includes(e.dataset.key)){/* Month indexes intentionally remain relative to the first plan month. */}});
  document.querySelectorAll('[data-act]').forEach(e=>e.oninput=()=>d.activities[+e.dataset.act].name=e.value);
  document.querySelectorAll('[data-month]').forEach(e=>e.onchange=()=>{const[i,j]=e.dataset.month.split(',').map(Number);d.activities[i].months=e.checked?[...new Set([...d.activities[i].months,j])].sort((a,b)=>a-b):d.activities[i].months.filter(x=>x!==j);});
  document.querySelectorAll('[data-del-act]').forEach(e=>e.onclick=()=>{d.activities.splice(+e.dataset.delAct,1);render();});
  document.querySelectorAll('[data-budget-name]').forEach(e=>e.oninput=()=>d.budgets[+e.dataset.budgetName].name=e.value);
  document.querySelectorAll('[data-budget-amount]').forEach(e=>BudgetFormat.bind(e,raw=>{d.budgets[+e.dataset.budgetAmount].amount=raw;document.querySelector('#sum').textContent=money(total())+' บาท';}));
  document.querySelectorAll('[data-del-budget]').forEach(e=>e.onclick=()=>{d.budgets.splice(+e.dataset.delBudget,1);render();});
  document.querySelectorAll('[data-key],[data-act],[data-month],[data-budget-name],[data-budget-amount]').forEach(e=>{for(const event of ['oninput','onchange']){const original=e[event];if(original)e[event]=function(...args){original.apply(this,args);updateTimeline();};}});
  const on=(id,fn)=>{const e=document.getElementById(id);if(e)e.onclick=fn;};
  on('logout',()=>{if(busy||pending)return;session=null;d=clone(blank);step=0;projectId='';version=0;savedData='';document.querySelector('#projectToolbar').innerHTML='';documents(null);render();message('ปิดข้อมูลในหน้านี้แล้ว บัญชี Google ยังลงชื่อเข้าใช้อยู่');});
  on('addAct',()=>{if(d.activities.length>=100)return message('รองรับกิจกรรมสูงสุด 100 รายการ');d.activities.push({name:'',months:[]});render();});
  on('addBudget',()=>{if(d.budgets.length>=100)return message('รองรับงบประมาณสูงสุด 100 รายการ');d.budgets.push({name:'',amount:''});render();});
  on('sample',()=>{
    if(busy||pending)return;
    if(!confirm('แทนที่ช่องเนื้อหาปัจจุบันด้วยข้อมูลตัวอย่าง? ข้อมูลนี้ยังไม่บันทึกจนกว่าจะกดบันทึก'))return;
    Object.assign(d,{title:'ตัวอย่าง: โครงการพัฒนาทักษะการทำงาน',rationale:'ตัวอย่างเพื่อทดลองการกรอกข้อมูล ไม่ใช่โครงการจริง',objectives:'เพิ่มทักษะการทำงานของผู้เข้าร่วม',goal:'ผู้เข้าร่วมตัวอย่าง 30 คน',activities:[{name:'เตรียมโครงการ',months:[0,1]},{name:'จัดกิจกรรม',months:[2]}],budgets:[{name:'ค่าวัสดุตัวอย่าง',amount:1500},{name:'ค่าใช้จ่ายตัวอย่าง',amount:2500}],output:'จัดกิจกรรม 1 ครั้ง',outcome:'ผู้เข้าร่วมมีทักษะเพิ่มขึ้น',benefit:'พัฒนาการทำงานร่วมกัน',evaluation:'แบบประเมินก่อนและหลังกิจกรรม'});
    applyIdentity();render();message('เติมข้อมูลตัวอย่างแล้ว ยังไม่ได้บันทึก');
  });
  on('restore',async()=>{if(busy||pending)return;try{await refreshList();message('เลือกโครงการที่บันทึกไว้จากรายการด้านบน');}catch(e){message(e.message||'ยังเปิดรายการไม่ได้');}});
  on('refreshList',()=>refreshList().catch(e=>message(e.message)));on('generate',generateProject);on('print',()=>window.print());on('download',()=>downloadJson(d,'project-draft.json'));
}
document.querySelector('#back').onclick=()=>changeStep(Math.max(0,step-1));
document.querySelector('#next').onclick=()=>{if(step===0&&!d.title.trim())return message('กรุณากรอกชื่อโครงการ');if(step===2&&d.start&&d.end&&d.start>d.end)return message('วันสิ้นสุดต้องไม่ก่อนวันเริ่ม');changeStep(Math.min(5,step+1));};
document.querySelector('#save').onclick=saveProject;
window.addEventListener('beforeunload',e=>{if(pending||busy||(session&&d.title&&JSON.stringify(d)!==savedData)){e.preventDefault();e.returnValue='';}});
render();

function sectionHTML(step){let h=`<h2>${step+2}. ${steps[step]}</h2>`;
if(step===0)h+='<div class="fields">'+field('title','ชื่อโครงการ *')+field('year','ปีดำเนินโครงการ (พ.ศ.)','select',['2569','2570','2571'])+field('planStartMonth','เดือนแรกของแผน 12 เดือน','select',months)+field('unit','หน่วยงาน')+field('owner','ชื่อผู้รับผิดชอบ')+field('position','ตำแหน่งผู้รับผิดชอบ')+field('email','อีเมล')+field('proposer','ผู้เสนอโครงการ')+field('proposerPosition','ตำแหน่งผู้เสนอ')+'</div>';
if(step===1)h+='<div class="fields">'+field('rationale','1. หลักการและเหตุผล','textarea')+field('objectives','2. วัตถุประสงค์','textarea')+field('goal','3. เป้าหมายหลัก','textarea')+'</div>';
if(step===2){h+=''+d.activities.map((a,i)=>`<div class="subcard"><div class="subhead"><b>กิจกรรม ${i+1}</b><div class="activity-actions">${i===d.activities.length-1?'<button class="secondary" id="addAct">+ เพิ่มกิจกรรม</button>':''}<button class="secondary remove" data-del-act="${i}">ลบกิจกรรม</button></div></div><label for="act${i}">ชื่อกิจกรรม</label><input id="act${i}" data-act="${i}" value="${esc(a.name)}"><div class="scroll"><div class="months">${planMonths().map((m,j)=>`<label>${m.month}<input type="checkbox" data-month="${i},${j}" ${a.months.includes(j)?'checked':''}></label>`).join('')}</div></div></div>`).join('')+(d.activities.length?'':'<button class="secondary" id="addAct">+ เพิ่มกิจกรรม</button>')+field('activityNote','หมายเหตุ','textarea')+'<div class="fields" style="margin-top:24px">'+field('start','6. วันที่เริ่ม','date')+field('end','วันที่สิ้นสุด','date')+field('location','7. สถานที่')+'</div>'}
if(step===3)h+=''+d.budgets.map((b,i)=>`<div class="subcard budget"><div><label for="bn${i}">รายการ ${i+1}</label><input id="bn${i}" data-budget-name="${i}" value="${esc(b.name)}"></div><div><label for="ba${i}">จำนวนเงิน (บาท)</label><input id="ba${i}" data-budget-amount="${i}" type="text" inputmode="decimal" value="${esc(typeof BudgetFormat!=='undefined'?BudgetFormat.format(b.amount):b.amount)}"></div><div class="budget-actions">${i===d.budgets.length-1?'<button class="secondary" id="addBudget">+ เพิ่มรายการงบประมาณ</button>':''}<button class="secondary remove" data-del-budget="${i}">ลบ</button></div></div>`).join('')+(d.budgets.length?'':'<div class="toolbar"><button class="secondary" id="addBudget">+ เพิ่มรายการงบประมาณ</button></div>')+'<div class="total"><span>รวมงบประมาณ</span><span id="sum">'+money(total())+' บาท</span></div><div style="margin-top:20px">'+field('budgetNote','หมายเหตุงบประมาณ','textarea')+'</div>';
if(step===4)h+='<div class="fields">'+field('output','9.1 ผลผลิต (Output)','textarea')+field('outcome','9.2 ผลลัพธ์ (Outcome)','textarea')+field('benefit','9.3 ประโยชน์ที่คาดว่าจะได้รับ','textarea')+field('evaluation','10. วิธีประเมินและตัวชี้วัด','textarea')+'</div>';
if(step===5)h='<h2 class="no-print">ตรวจทานก่อนนำไปใช้</h2><p class="intro no-print">ตรวจข้อมูลก่อนบันทึกและสร้างเอกสาร เอกสารนี้ยังไม่ถือเป็นการอนุมัติ</p><div class="toolbar"><button id="generate">รายงาน</button></div><div class="review"><h2 class="print-title">ร่างแบบเสนอโครงการ</h2><p class="pill">ร่าง • ยังไม่ได้เสนออนุมัติ</p><h2>'+esc(d.title||'ยังไม่ได้ระบุชื่อโครงการ')+'</h2><p>หน่วยงาน: '+esc(d.unit||'—')+' · ปี '+esc(d.year)+'</p>'+[['1. หลักการและเหตุผล',d.rationale],['2. วัตถุประสงค์',d.objectives],['3. เป้าหมายหลัก',d.goal],['4. ผู้รับผิดชอบ',[d.owner,d.position,d.phone,d.email].filter(Boolean).join(' · ')]].map(([a,b])=>`<section><h3>${a}</h3><p>${esc(b||'—')}</p></section>`).join('')+'<section><h3>5. แผนดำเนินงาน 12 เดือน</h3>'+ganttTable()+(d.activityNote?'<p>หมายเหตุ: '+esc(d.activityNote)+'</p>':'')+'</section><section><h3>6. ระยะเวลา / 7. สถานที่</h3><p>'+esc(d.start||'—')+' ถึง '+esc(d.end||'—')+'</p><p>'+esc(d.location||'—')+'</p></section><section><h3>8. งบประมาณ</h3><table>'+d.budgets.map(b=>'<tr><td>'+esc(b.name||'—')+'</td><td>'+money(b.amount)+' บาท</td></tr>').join('')+'<tr><th>รวม</th><th>'+money(total())+' บาท</th></tr></table><p>'+esc(d.budgetNote)+'</p></section>'+[['9.1 ผลผลิต',d.output],['9.2 ผลลัพธ์',d.outcome],['9.3 ประโยชน์',d.benefit],['10. วิธีประเมินและตัวชี้วัด',d.evaluation]].map(([a,b])=>`<section><h3>${a}</h3><p>${esc(b||'—')}</p></section>`).join('')+'<section><h3>ผู้เสนอโครงการ</h3><p>'+esc(d.proposer)+' · '+esc(d.proposerPosition)+'</p><p>ไม่ใช่ลายมือชื่อหรือการอนุมัติ</p></section></div>';
return h;}

const formOpenedAt=new Date();
function profileHTML(){if(!session)return '';const date=formOpenedAt.toLocaleDateString('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'long',year:'numeric'});return '<section class="filler-profile"><h2>1. ข้อมูลผู้กรอกแบบฟอร์ม</h2><dl>'+[['วันที่เปิดแบบฟอร์ม',date],['ชื่อ-นามสกุล',session.name],['ตำแหน่ง',session.position],['หน่วยงาน',session.unit],['E-Mail',session.email]].map(([label,value])=>'<div><dt>'+esc(label)+' :</dt><dd>'+esc(value||'—')+'</dd></div>').join('')+'</dl></section>';}
