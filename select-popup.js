/* Progressive enhancement: original selects remain the data source and fallback. */
(()=>{
 'use strict';
 if(typeof HTMLDialogElement==='undefined')return;
 const enhanced=new WeakMap();
 function enhance(select){
  if(enhanced.has(select)||select.multiple)return;
  const button=document.createElement('button');button.type='button';button.className='select-popup-trigger';button.setAttribute('aria-haspopup','dialog');
  const label=()=>select.labels?.[0]?.textContent?.trim()||select.getAttribute('aria-label')||'เลือกรายการ';
  const sync=()=>{button.textContent=(select.selectedOptions[0]?.textContent||'เลือกรายการ')+' ▾';button.disabled=select.disabled;button.setAttribute('aria-label',label()+': '+(select.selectedOptions[0]?.textContent||''));};
  select.insertAdjacentElement('afterend',button);select.classList.add('popup-source');select.tabIndex=-1;select.setAttribute('aria-hidden','true');enhanced.set(select,{button,sync});sync();
  select.addEventListener('change',sync);select.addEventListener('input',sync);
  button.addEventListener('click',()=>{
   if(select.disabled)return;
   const dialog=document.createElement('dialog');dialog.className='select-popup';
   const title=document.createElement('h2');title.textContent=label();title.id='select-popup-title';dialog.setAttribute('aria-labelledby',title.id);
   const choices=document.createElement('div');choices.className='select-popup-choices'+(select.id==='planStartMonth'?' month-popup-grid':'');let monthIndex=0;
   const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='ยกเลิก';
   let active;
   [...select.options].forEach(option=>{
    const choice=document.createElement('button');choice.type='button';choice.textContent=option.textContent;choice.disabled=option.disabled||option.parentElement?.disabled===true;choice.className='select-popup-choice';if(select.id==='planStartMonth'){if(option.value===''){choice.style.gridColumn='1 / -1';choice.style.gridRow='1';}else{choice.style.gridColumn=String(Math.floor(monthIndex/6)+1);choice.style.gridRow=String(monthIndex%6+2);monthIndex++;}}
    if(option.selected){choice.setAttribute('aria-pressed','true');active=choice;}
    else choice.setAttribute('aria-pressed','false');
    choice.addEventListener('click',()=>{if(select.disabled||!select.isConnected)return dialog.close();select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));sync();dialog.close();});choices.appendChild(choice);
   });
   close.onclick=()=>dialog.close();dialog.append(title,choices,close);document.body.appendChild(dialog);
   dialog.addEventListener('close',()=>{dialog.remove();if(button.isConnected)button.focus();},{once:true});
   dialog.addEventListener('keydown',event=>{const items=[...choices.querySelectorAll('button:not(:disabled)')];const index=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)&&items.length){event.preventDefault();let next=event.key==='Home'?0:event.key==='End'?items.length-1:event.key==='ArrowDown'?(index+1)%items.length:(index-1+items.length)%items.length;items[next].focus();}});
   dialog.showModal();(active&&!active.disabled?active:choices.querySelector('button:not(:disabled)')||close).focus();
  });
 }
 function scan(){document.querySelectorAll('select').forEach(select=>{enhance(select);enhanced.get(select)?.sync();});}
 // Watch only original select attributes/options and additions, not generated button text.
 new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'&&r.target.tagName==='SELECT'||r.type==='childList'&&[...r.addedNodes].some(n=>n.nodeType===1&&(n.tagName==='SELECT'||n.querySelector?.('select')))))scan();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled']});
 scan();
})();
