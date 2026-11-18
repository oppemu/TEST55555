/* Formatting only; the model stores an ungrouped decimal string, never commas. */
(function(root){
 const plain=v=>String(v??'').replace(/,/g,'');
 function format(value){const raw=plain(value);if(!/^\d*(?:\.\d*)?$/.test(raw))return raw;const [integer,fraction]=raw.split('.');return integer.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction===undefined?'':'.'+fraction);}
 function edit(value,caret){const raw=plain(value),count=plain(value.slice(0,caret)).length,display=format(raw);let pos=0,n=0;while(pos<display.length&&n<count){if(display[pos]!==',')n++;pos++;}return {raw,display,caret:pos};}
 function bind(input,save){
  const update=()=>{const result=edit(input.value,input.selectionStart??input.value.length);input.value=result.display;input.setSelectionRange(result.caret,result.caret);input.setCustomValidity(result.raw!==''&&!/^\d+(?:\.\d{0,2})?$/.test(result.raw)?'กรุณากรอกจำนวนเงินไม่ติดลบและทศนิยมไม่เกิน 2 ตำแหน่ง':'');save(result.raw);};
  input.oninput=event=>{if(!event?.isComposing)update();};input.addEventListener('compositionend',update);
  input.addEventListener('beforeinput',event=>{const p=input.selectionStart;if(p!==input.selectionEnd)return;let start,end;if(event.inputType==='deleteContentBackward'&&input.value[p-1]===','){start=Math.max(0,p-2);end=p;}else if(event.inputType==='deleteContentForward'&&input.value[p]===','){start=p;end=p+2;}else return;event.preventDefault();input.value=input.value.slice(0,start)+input.value.slice(end);input.setSelectionRange(start,start);update();});
 }
 root.BudgetFormat={plain,format,edit,bind};
})(typeof window==='undefined'?globalThis:window);
