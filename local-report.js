(function(root){
 'use strict';
 let current=null,serial=0;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=v=>Number.isFinite(Number(v))?Number(v).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
 function html(d,labels,meta={}){
  const section=(h,v)=>'<section><h2'+(/^9\.[123] /.test(h)?' class="report-subheading"':'')+'>'+esc(h)+'</h2><p>'+esc(v||'—')+'</p></section>';
  const activities=Array.isArray(d.activities)?d.activities:[],budgets=Array.isArray(d.budgets)?d.budgets:[];
  let s='<header><h1>แบบเสนอแผนงานและโครงการประจำปี</h1><h1>'+esc(d.title||'—')+'</h1><p>'+esc(d.unit||'—')+'</p></header>';
  s+='<p>รหัสโครงการ '+esc(meta.projectId||'—')+(meta.version?' (รุ่น '+esc(meta.version)+')':'')+'</p>';
  s+=section('1. หลักการและเหตุผล',d.rationale)+section('2. วัตถุประสงค์',d.objectives)+section('3. เป้าหมายหลัก',d.goal)+section('4. ผู้รับผิดชอบโครงการ',(d.owner||'—')+' ตำแหน่ง '+(d.position||'—')+'\nหน่วยงาน '+(d.unit||'—')+'\nโทรศัพท์ '+(d.phone||'—')+' อีเมล '+(d.email||'—'));
  s+='<section><h2>5. วิธีการดำเนินการ</h2><ol>'+activities.map(a=>'<li>'+esc(a.name||'—')+'</li>').join('')+'</ol><div class="local-report-table"><table><thead><tr><th>กิจกรรม / เดือน</th>'+labels.map(m=>'<th>'+esc(m.month)+'<br>'+esc(m.year)+'</th>').join('')+'</tr></thead><tbody>'+activities.map((a,i)=>'<tr><td>'+esc((i+1)+'. '+(a.name||'—'))+'</td>'+labels.map((_,j)=>'<td class="'+(Array.isArray(a.months)&&a.months.includes(j)?'planned':'')+'">'+(Array.isArray(a.months)&&a.months.includes(j)?'●':'')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><p>'+esc(d.activityNote||'')+'</p></section>';
  s+=section('6. ระยะเวลาดำเนินการ',[d.start,d.end].map(v=>root.ProjectPdf?.thaiDate?root.ProjectPdf.thaiDate(v):(v||'—')).join(' ถึง '))+section('7. สถานที่',d.location);
  s+='<section><h2>8. งบประมาณ</h2><table><thead><tr><th>รายการ</th><th>จำนวนเงิน (บาท)</th></tr></thead><tbody>'+budgets.map((b,i)=>'<tr><td>'+esc((i+1)+'. '+(b.name||'—'))+'</td><td>'+esc(money(b.amount))+'</td></tr>').join('')+'<tr><th>รวม</th><th>'+esc(money(budgets.reduce((n,b)=>n+(Number(b.amount)||0),0)))+'</th></tr></tbody></table><p>หมายเหตุ '+esc(d.budgetNote||'—')+'</p></section>';
  s+='<section><h2>9. ผลผลิต / ผลลัพธ์ / ประโยชน์ที่คาดว่าจะได้รับ</h2></section>';
  s+=section('9.1 ผลผลิต',d.output)+section('9.2 ผลลัพธ์',d.outcome)+section('9.3 ประโยชน์ที่คาดว่าจะได้รับ',d.benefit)+section('10. วิธีการประเมินผลและดัชนีชี้วัดความสำเร็จของโครงการ',d.evaluation);
  s+='<section class="local-report-signature"><p>ลงชื่อ ........................................................ ผู้เสนอโครงการ</p><p>('+esc(d.proposer||'—')+')</p><p>'+esc(d.proposerPosition||'—')+'</p><p>วันที่</p></section><footer>รหัสเอกสาร (Doc. No.): OPPE-01-F-03-01 | ฉบับที่ (Rev. No.): 00 | วันที่บังคับใช้ (Effective Date): 12/11/2026</footer>';
  return s;
 }
 function status(text){if(current&&!current.view.hidden)current.status.textContent=text||'';}
 function show(){if(!current)return;current.shell.hidden=true;current.view.hidden=false;document.title='รายงานโครงการ';root.scrollTo?.(0,0);current.back.focus();}
 function restore(){if(!current)return;current.view.hidden=true;current.shell.hidden=current.wasHidden;document.title=current.title;root.scrollTo?.(0,current.scroll);current.focus?.focus?.();}
 function close(){if(!current)return;restore();if(root.history.state?.oppeLocalReport===current.token)root.history.back();}
 function dispose(){if(!current)return;restore();if(current.url)URL.revokeObjectURL(current.url);current.view.remove();current=null;}
 function open(data,labels,onDownload,meta={}){
  dispose();const shell=document.querySelector('.contractor-shell');if(!shell)throw Error('ไม่พบหน้าฟอร์ม');
  const view=document.createElement('section');view.className='pdf-report-view local-report-view';view.id='localReportView';
  const toolbar=document.createElement('div');toolbar.className='pdf-report-controls';
  const back=document.createElement('button');back.type='button';back.className='secondary';back.textContent='← กลับฟอร์ม';back.onclick=close;
  const title=document.createElement('h1');title.textContent='รายงานโครงการ';
  const download=document.createElement('button');download.type='button';download.className='pdf-report-download';download.textContent='ดาวน์โหลด PDF';toolbar.append(back,title,download);
  const note=document.createElement('p');note.className='local-report-note';note.textContent='ตัวอย่างจากข้อมูลในฟอร์ม ยังไม่ใช่ไฟล์ PDF';
  const message=document.createElement('p');message.className='local-report-message';message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const retry=document.createElement('a');retry.className='pdf-report-download';retry.textContent='ดาวน์โหลด PDF อีกครั้ง';retry.hidden=true;
  const paper=document.createElement('article');paper.className='local-report-paper';paper.innerHTML=html(data,labels,meta);
  view.append(toolbar,note,message,retry,paper);document.body.appendChild(view);
  const state={view,shell,back,status:message,focus:document.activeElement,wasHidden:shell.hidden,title:document.title,scroll:root.scrollY||0,token:'local-report-'+Date.now()+'-'+(++serial),url:null,working:false,fallbackUrl:null};current=state;
  const frame=document.createElement('iframe');frame.className='local-pdf-frame';frame.title='ตัวอย่างเอกสาร PDF A4';frame.hidden=true;view.append(frame);
  let ready=null;
  async function prepare(){
   if(ready)return ready;
   const result=await onDownload();if(!result?.pdfData)throw Error('ยังไม่ได้รับไฟล์ PDF ที่สร้างในเครื่อง');
   if(current!==state)return null;
   const pdf=root.PDFPreview.decodePdf(result.pdfData);state.url=URL.createObjectURL(pdf.blob);
   ready=pdf;retry.href=state.url;retry.download=pdf.fileName;retry.removeAttribute('target');
   frame.src=state.url+'#toolbar=0&navpanes=0&view=FitH';frame.hidden=false;paper.hidden=true;note.hidden=true;
   return pdf;
  }
  download.onclick=async()=>{
   if(state.working)return;state.working=true;download.disabled=true;download.setAttribute('aria-busy','true');
   try{if(await prepare()){retry.click();message.textContent='';}}
   catch(e){message.textContent=e.message||'ยังสร้าง PDF ไม่สำเร็จ';}
   finally{state.working=false;download.disabled=false;download.setAttribute('aria-busy','false');download.textContent='ดาวน์โหลด PDF';}
  };
  state.working=true;download.disabled=true;message.textContent='กำลังเตรียมตัวอย่าง PDF';
  Promise.resolve().then(prepare).then(()=>{if(current===state)message.textContent='';}).catch(e=>{if(current===state)message.textContent=e.message||'ยังสร้าง PDF ไม่สำเร็จ';}).finally(()=>{state.working=false;download.disabled=false;});
  try{root.history.pushState({...root.history.state,oppeLocalReport:state.token},'','#report');}catch{}
  show();
 }
 root.addEventListener('popstate',()=>{if(!current)return;if(root.history.state?.oppeLocalReport===current.token)show();else restore();});
 root.addEventListener('pagehide',()=>{if(current?.url){URL.revokeObjectURL(current.url);current.url=null;}});
 root.LocalReport={open,close,status,html};
})(window);
