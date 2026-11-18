(function(root){
 'use strict';
 const VERSION='oppe-local-th18px-v1',FONT='THSarabunNew';
 const MM=72/25.4,LEFT=30*MM,RIGHT=20*MM,TOP=20*MM,OUTER_BOTTOM=5*MM,BODY_BOTTOM=40;
 const TABLE_WIDTH=160*MM,GANTT_FIRST=58,GANTT_MONTH=(TABLE_WIDTH-13*4-14*.5-GANTT_FIRST)/12;
 const MONTHS=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
 const FULL_MONTHS=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
 function thaiDate(value){const raw=String(value||'');if(!raw)return '—';const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);if(!m)return raw;const y=Number(m[1]),mo=Number(m[2]),day=Number(m[3]),dt=new Date(Date.UTC(y,mo-1,day));if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==mo-1||dt.getUTCDate()!==day)return raw;return day+' '+FULL_MONTHS[mo-1]+' '+(y+543);}
 const text=v=>String(v==null?'':v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
 const amount=v=>{const n=Number(v);if(!Number.isFinite(n)||n<0)throw Error('งบประมาณไม่ถูกต้อง');return n;};
 const money=v=>amount(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 function definition(input,meta){
  if(!input||!meta||!meta.projectId||!Number.isInteger(Number(meta.version))||Number(meta.version)<1||!meta.createdAt||!Number.isFinite(Date.parse(meta.createdAt)))throw Error(meta?.localOnly?'ข้อมูลวันที่สร้างไฟล์หรือรหัสรายงานไม่ถูกต้อง':'ต้องใช้ข้อมูลรุ่นโครงการและวันที่จากหลังบ้านที่ยืนยันแล้ว');
  const d=JSON.parse(JSON.stringify(input)),created=new Date(meta.createdAt);
  if(!Array.isArray(d.activities)||!Array.isArray(d.budgets)||d.activities.length>100||d.budgets.length>100)throw Error('ข้อมูลตารางโครงการไม่ถูกต้อง');
  const start=MONTHS.indexOf(d.planStartMonth),year=Number(d.year);
  if(start<0||!Number.isInteger(year))throw Error('เดือนและปีแผนไม่ถูกต้อง');
  const labels=Array.from({length:12},(_,i)=>MONTHS[(start+i)%12]+' '+(year+Math.floor((start+i)/12)));
  const content=[],p=(v,opt)=>content.push(Object.assign({text:text(v),margin:[0,0,0,0]},opt||{})),heading=v=>p(v,{bold:true,color:'#000000',headlineLevel:1,margin:[0,/^9\.[123] /.test(v)?0:15.525,0,0]});
  p('แบบเสนอแผนงานและโครงการประจำปี',{alignment:'center',bold:true,color:'#000000'});
  p(d.title,{alignment:'center'});p(d.unit,{alignment:'center'});
  const id=meta.reportId||meta.revisionId||meta.projectId;
  p('รหัสโครงการ '+text(id),{margin:[0,5,0,9]});
  [['1. หลักการและเหตุผล',d.rationale],['2. วัตถุประสงค์',d.objectives],['3. เป้าหมายหลัก',d.goal]].forEach(([h,v])=>{heading(h);p(v);});
  heading('4. ผู้รับผิดชอบโครงการ');p(text(d.owner)+'  ตำแหน่ง '+text(d.position));p('หน่วยงาน '+text(d.unit));p('โทรศัพท์ '+text(d.phone)+'  อีเมล '+text(d.email));
  heading('5. วิธีการดำเนินการ');
  d.activities.forEach((a,i)=>{if(!Array.isArray(a.months)||a.months.some(m=>!Number.isInteger(m)||m<0||m>11))throw Error('ข้อมูลเดือนกิจกรรมไม่ถูกต้อง');p((i+1)+'. '+text(a.name)+' — '+a.months.map(m=>labels[m]).join(', '));});
  if(d.activityNote)p('หมายเหตุ: '+text(d.activityNote));
  p('แผนดำเนินงาน 12 เดือน',{bold:true,color:'#000000'});
  const gantt=[['กิจกรรม / เดือนปี',...labels.map(s=>s.replace(' ','\n'))].map(text=>({text,bold:true,color:'#000000',alignment:'center'}))];
  d.activities.forEach((a,i)=>gantt.push([{text:String(i+1),alignment:'center'},...labels.map((_,j)=>({text:'',fillColor:a.months.includes(j)?'#38761D':'#FFFFFF'}))]));
  content.push({table:{headerRows:1,widths:[GANTT_FIRST,...Array(12).fill(GANTT_MONTH)],body:gantt},layout:{paddingLeft:()=>2,paddingRight:()=>2,paddingTop:()=>3,paddingBottom:()=>3,hLineWidth:()=>.5,vLineWidth:()=>.5},margin:[0,0,0,0]});
  heading('6. ระยะเวลาดำเนินการ');p(thaiDate(d.start)+' ถึง '+thaiDate(d.end));heading('7. สถานที่');p(d.location);
  heading('8. งบประมาณ');
  const budgets=[['รายการ','งบประมาณ (บาท)'].map(text=>({text,bold:true,color:'#000000',alignment:'center'})),...d.budgets.map((b,i)=>[{text:text((i+1)+'. '+b.name),alignment:'center'},{text:money(b.amount),alignment:'right'}])];
  budgets.push([{text:'รวม',bold:false,alignment:'center'},{text:money(d.budgets.reduce((n,b)=>n+amount(b.amount),0)),alignment:'right',bold:false}]);
  content.push({table:{headerRows:1,widths:['*','*'],body:budgets},layout:{hLineWidth:()=>.5,vLineWidth:()=>.5},margin:[0,0,0,0]});
  p('หมายเหตุ '+text(d.budgetNote));
  heading('9. ผลผลิต / ผลลัพธ์ / ประโยชน์ที่คาดว่าจะได้รับ');
  [['9.1 ผลผลิต',d.output],['9.2 ผลลัพธ์',d.outcome],['9.3 ประโยชน์ที่คาดว่าจะได้รับ',d.benefit],['10. วิธีการประเมินผลและดัชนีชี้วัดความสำเร็จของโครงการ',d.evaluation]].forEach(([h,v])=>{heading(h);p(v);});
  const signature={unbreakable:true,margin:[0,15,0,0],columns:[{width:'*',text:''},{width:300,stack:[
   {text:'ลงชื่อ ........................................................ ผู้เสนอโครงการ',alignment:'left'},
   {text:'('+text(d.proposer)+')',alignment:'center'},
   {text:text(d.proposerPosition),alignment:'center'},
   {text:'วันที่',alignment:'left'}
  ]},{width:'*',text:''}]};
  if(text(d.evaluation).length<=500){const finalSection=content.splice(-2);content.push({unbreakable:true,stack:[...finalSection,signature]});}else content.push(signature);
  return {pageSize:'A4',pageMargins:[LEFT,TOP,RIGHT,BODY_BOTTOM],defaultStyle:{font:FONT,fontSize:13.5,lineHeight:1.15},
   info:{title:text(d.title),author:'',subject:'OPPE-01-F-03-01',creator:VERSION,producer:VERSION,creationDate:created,modDate:created},
   footer:(page)=>({id:'oppe-footer-'+page,text:'รหัสเอกสาร (Doc. No.): OPPE-01-F-03-01 | ฉบับที่ (Rev. No.): 00 | วันที่บังคับใช้ (Effective Date): 12/11/2026 | '+page,font:FONT,fontSize:13.5,alignment:'right',lineHeight:1.15,margin:[LEFT,BODY_BOTTOM-OUTER_BOTTOM-17.5635,RIGHT,0]}),
   pageBreakBefore:(currentNode,followingNodesOnPage)=>currentNode.headlineLevel===1&&followingNodesOnPage.filter(n=>!String(n.id||'').startsWith('oppe-footer-')).length===0,content};
 }
 async function create(data,meta){
  if(!root.pdfMake||!root.OPPE_PDF_VFS)throw Error('โหลดเครื่องมือสร้าง PDF หรือฟอนต์ไม่ครบ');
  const fonts={[FONT]:{normal:'THSarabunNew.ttf',bold:'THSarabunNewBold.ttf',italics:'THSarabunNew.ttf',bolditalics:'THSarabunNewBold.ttf'}};
  const dd=definition(data,meta),pdf=root.pdfMake.createPdf(dd,{},fonts,root.OPPE_PDF_VFS);
  const base64=await new Promise((resolve,reject)=>{try{pdf.getBase64(resolve);}catch(e){reject(e);}});
  if(typeof base64!=='string'||!base64.startsWith('JVBERi0'))throw Error('สร้างไฟล์ PDF ไม่สำเร็จ');
  const byteLength=Math.floor(base64.length*3/4)-(base64.endsWith('==')?2:base64.endsWith('=')?1:0);
  if(byteLength>2*1024*1024)throw Error('ไฟล์ PDF เกินขนาด 2 MiB ที่ระบบรองรับ');
  const fileName=(text(meta.reportId||meta.revisionId||meta.projectId)+' '+text(data.title)).replace(/[\\/:*?"<>|\u0000-\u001F]/g,' ').slice(0,160)+'.pdf';
  return {base64,mimeType:'application/pdf',fileName,rendererVersion:VERSION};
 }
 root.ProjectPdf={create,definition,thaiDate,version:VERSION};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.ProjectPdf;
})(typeof window!=='undefined'?window:globalThis);
