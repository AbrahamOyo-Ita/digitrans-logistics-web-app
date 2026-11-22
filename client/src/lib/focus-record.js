export function focusRecordElement(recordId,{root=typeof document==='undefined'?null:document}={}){
 if(!root||recordId===null||recordId===undefined||recordId==='')return false;
 const wanted=String(recordId),element=[...root.querySelectorAll('[data-record-id]')].find(node=>node.dataset.recordId===wanted);
 if(!element)return false;
 element.scrollIntoView?.({behavior:'smooth',block:'center'});
 element.classList.add('outline','outline-2','outline-offset-2','outline-brand-500');
 setTimeout(()=>element.classList.remove('outline','outline-2','outline-offset-2','outline-brand-500'),2400);
 return true;
}
