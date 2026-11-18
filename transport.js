/* Authenticated Apps Script iframe bridge. No JSONP or opaque-success writes. */
(function(root){
  'use strict';
  let frame, pinnedSource=null, targetOrigin='', nonce='', readyPromise, resolveReady, rejectReady, readyTimer;
  const awaiting=new Map();
  const random=()=>{if(!root.crypto?.getRandomValues)throw Error('เบราว์เซอร์นี้ไม่รองรับการเชื่อมต่ออย่างปลอดภัย');return [...crypto.getRandomValues(new Uint8Array(24))].map(x=>x.toString(16).padStart(2,'0')).join('');};
  function loginUrl(){
    let u;try{u=new URL(root.APP_CONFIG?.webAppUrl||'');}catch{throw Error('กรุณาตั้งลิงก์เว็บแอปใน config.js');}
    if(u.protocol!=='https:'||u.hostname!=='script.google.com'||u.username||u.password||u.search||u.hash||!/^\/(?:a\/macros\/mahidol\.ac\.th\/s|macros\/s)\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname))throw Error('ลิงก์เว็บแอปไม่ถูกต้อง ต้องใช้ลิงก์ที่ลงท้าย /exec');
    return u.href;
  }
  function googleOrigin(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.port&&(u.hostname==='script.google.com'||u.hostname==='script.googleusercontent.com'||/^[a-z0-9-]+-script\.googleusercontent\.com$/.test(u.hostname));}catch{return false;}}
  function destroy(){
    if(readyTimer)clearTimeout(readyTimer);
    awaiting.forEach(x=>{clearTimeout(x.timer);x.reject(Error('การเชื่อมต่อถูกเริ่มใหม่ กรุณาตรวจรายการเดิม'));});awaiting.clear();
    if(frame)frame.remove();frame=null;pinnedSource=null;targetOrigin='';readyPromise=null;
  }
  function connect(){
    if(readyPromise)return readyPromise;
    const u=new URL(loginUrl());
    const page=new URL(location.origin);
    const local=page.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(page.hostname);
    if(page.protocol!=='https:'&&!local)throw Error('กรุณาเปิดด้วย Live Server ใน VS Code หรือเปิดลิงก์เว็บไซต์ ไม่เปิดไฟล์ HTML โดยตรง');
    nonce=random();u.searchParams.set('origin',location.origin);u.searchParams.set('nonce',nonce);
    readyPromise=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
    frame=document.createElement('iframe');frame.title='การเชื่อมต่อข้อมูลโครงการ';frame.hidden=true;frame.src=u.href;document.body.appendChild(frame);
    readyTimer=setTimeout(()=>{rejectReady(Error('เชื่อมต่อไม่ได้ กรุณาลงชื่อเข้าใช้ Google แล้วลองอีกครั้ง'));readyPromise=null;},30000);
    return readyPromise;
  }
  root.addEventListener('message',event=>{
    const m=event.data;
    if(!frame||!event.source||!googleOrigin(event.origin)||!m||m.nonce!==nonce)return;
    if(m.type==='oppe-ready'&&!targetOrigin){targetOrigin=event.origin;pinnedSource=event.source;clearTimeout(readyTimer);resolveReady();return;}
    if(m.type!=='oppe-response'||event.source!==pinnedSource||event.origin!==targetOrigin||typeof m.id!=='string')return;
    const item=awaiting.get(m.id);if(!item)return;
    if(!m.response||typeof m.response.ok!=='boolean')return;
    awaiting.delete(m.id);clearTimeout(item.timer);
    if(m.response.ok)item.resolve(m.response.result);else{const e=Error(typeof m.response.error==='string'?m.response.error:'ดำเนินการไม่สำเร็จ');e.safeToEdit=m.response.safeToEdit===true;item.reject(e);}
  });
  async function request(request){
    await connect();
    return new Promise((resolve,reject)=>{const id=random();const timer=setTimeout(()=>{awaiting.delete(id);reject(Error('ยังยืนยันผลไม่ได้ กรุณาตรวจหรือส่งรายการเดิมอีกครั้ง'));},120000);awaiting.set(id,{resolve,reject,timer});pinnedSource.postMessage({type:'oppe-request',nonce,id,request},targetOrigin);});
  }
  root.ProjectTransport={request,loginUrl,reconnect:()=>{destroy();return connect();},random};
})(window);
