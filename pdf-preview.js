(function(root){
 'use strict';
 const MAX_PDF_BYTES=8*1024*1024;
 let active=null,serial=0;
 function pdfLinks(value){const u=new URL(value);const m=u.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)\/(?:view|preview)$/);if(u.protocol!=='https:'||u.hostname!=='drive.google.com'||!m)throw Error('ลิงก์ PDF ไม่ถูกต้อง');return {preview:'https://drive.google.com/file/d/'+m[1]+'/preview',download:'https://drive.google.com/uc?export=download&id='+m[1],view:u.href};}
 function decodePdf(data){
  if(!data||data.mimeType!=='application/pdf'||typeof data.base64!=='string')throw Error('ข้อมูลไฟล์ PDF ไม่ถูกต้อง');
  const encoded=data.base64;
  if(!encoded.length||encoded.length>4*Math.ceil(MAX_PDF_BYTES/3)||encoded.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw Error('ข้อมูลไฟล์ PDF ไม่ถูกต้องหรือมีขนาดเกิน 8 MB');
  let raw;try{raw=root.atob(encoded);}catch{throw Error('อ่านข้อมูลไฟล์ PDF ไม่ได้');}
  if(raw.length<5||raw.length>MAX_PDF_BYTES||raw.slice(0,5)!=='%PDF-')throw Error('ไฟล์ที่ได้รับไม่ใช่ PDF หรือมีขนาดเกิน 8 MB');
  const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  let name=String(data.fileName||'project.pdf').replace(/[\\/:*?"<>|\x00-\x1f\x7f]/g,'_').trim().slice(0,180)||'project.pdf';if(!/\.pdf$/i.test(name))name+='.pdf';
  return {blob:new Blob([bytes],{type:'application/pdf'}),fileName:name};
 }
 function revoke(){if(active?.blobUrl){URL.revokeObjectURL(active.blobUrl);active.blobUrl=null;}}
 function bindFile(){
  if(!active)return;
  if(active.pdf){if(!active.blobUrl)active.blobUrl=URL.createObjectURL(active.pdf.blob);active.frame.src=active.blobUrl;active.download.href=active.blobUrl;active.download.download=active.pdf.fileName;}
 }
 function show(){if(!active)return;bindFile();active.shell.hidden=true;active.view.hidden=false;document.title='รายงานโครงการ PDF';root.scrollTo?.(0,0);active.back.focus();}
 function restore(){if(!active)return;active.view.hidden=true;active.shell.hidden=active.wasHidden;document.title=active.title;root.scrollTo?.(0,active.scrollY);if(active.focus?.isConnected)active.focus.focus();revoke();}
 function close(){if(!active)return;restore();if(active.pushed&&root.history.state?.oppePdfReport===active.token)root.history.back();}
 function open(value,options={}){
  const links=pdfLinks(value),shell=document.querySelector('.contractor-shell');if(!shell)throw Error('ไม่พบหน้าฟอร์มสำหรับเปิดรายงาน');
  let pdf=null,transferError=String(options.pdfTransferError||'');
  if(options.pdfData){try{pdf=decodePdf(options.pdfData);}catch(e){transferError=e.message;}}
  if(active){restore();active.view.remove();}
  const focus=document.activeElement,view=document.createElement('section');view.id='pdfReportView';view.className='pdf-report-view';view.setAttribute('aria-label','หน้ารายงานโครงการ PDF');
  const toolbar=document.createElement('div');toolbar.className='pdf-report-controls';
  const back=document.createElement('button');back.type='button';back.className='secondary';back.textContent='← กลับฟอร์ม';back.onclick=close;
  const title=document.createElement('h1');title.textContent='รายงานโครงการ';
  const download=document.createElement('a');download.className='pdf-report-download';download.textContent='ดาวน์โหลด PDF';
  if(!pdf){download.href=links.download;download.target='_blank';download.rel='noopener';}
  toolbar.append(back,title,download);
  const paper=document.createElement('div');paper.className='pdf-report-paper';
  const frame=document.createElement('iframe');frame.title='ตัวอย่างเอกสาร PDF ที่สร้างจริง';frame.src=pdf?'about:blank':links.preview;frame.className='pdf-report-frame';paper.append(frame);
  const fallback=document.createElement('div');fallback.className='pdf-report-fallback';
  const help=document.createElement('p');help.textContent=pdf?'หากตัวอย่างไม่แสดง ยังสามารถกดดาวน์โหลด PDF ได้':(transferError?transferError+' — ':'')+'ยังไม่ได้รับไฟล์สำหรับดาวน์โหลดโดยตรง ปุ่มดาวน์โหลดจะเปิด Google Drive กรุณาใช้บัญชีที่มีสิทธิ์';
  const external=document.createElement('a');external.href=links.view;external.target='_blank';external.rel='noopener';external.textContent='เปิดไฟล์ PDF ใน Google Drive';fallback.append(help,external);
  frame.addEventListener('error',()=>{help.textContent='โหลดตัวอย่างไม่ได้ กรุณากดดาวน์โหลด PDF หรือเปิดไฟล์ใน Google Drive';});
  view.append(toolbar,paper,fallback);document.body.appendChild(view);
  active={view,shell,back,frame,download,pdf,blobUrl:null,focus,wasHidden:shell.hidden,title:document.title,scrollY:root.scrollY||0,token:'oppe-pdf-'+(++serial),pushed:false};
  if(root.history?.pushState){try{root.history.pushState({...root.history.state,oppePdfReport:active.token},'','#pdf-report');active.pushed=true;}catch{/* Back restores the form even when history is unavailable. */}}
  show();
 }
 root.addEventListener('popstate',()=>{if(!active)return;if(root.history.state?.oppePdfReport===active.token)show();else restore();});
 root.addEventListener('pagehide',revoke);
 root.addEventListener('pageshow',()=>{if(active&&!active.view.hidden)bindFile();});
 root.PDFPreview={open,pdfLinks,close,decodePdf};
})(window);
