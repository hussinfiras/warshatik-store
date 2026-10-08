(()=>{
const q=s=>document.querySelector(s);
const defaultSections=()=>[
  {id:'products',name:'المنتجات',type:'product',description:'أكواد وملفات ومشاريع.',visible:true,locked:true},
  {id:'courses',name:'الدورات',type:'course',description:'دورات تعليمية.',visible:true,locked:true},
  {id:'consultations',name:'الاستشارات',type:'consultations',description:'حجز الاستشارات.',visible:true,locked:true}
];
function slugify(v){
  const base=String(v||'').trim().toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g,'-').replace(/^-+|-+$/g,'');
  return base||('section-'+Date.now());
}
function sections(){return Array.isArray(window.wtStoreSections)&&window.wtStoreSections.length?window.wtStoreSections:defaultSections()}
function render(){
  const wrap=q('#storeSectionList');if(!wrap)return;
  const list=sections();window.wtStoreSections=list;
  wrap.innerHTML=list.map((s,i)=>`<div class="section-manager-row" data-section-index="${i}">
    <input class="section-name" value="${String(s.name||'').replace(/"/g,'&quot;')}" placeholder="اسم القسم">
    <input class="section-description" value="${String(s.description||'').replace(/"/g,'&quot;')}" placeholder="وصف مختصر">
    <label class="check"><input class="section-visible" type="checkbox" ${s.visible!==false?'checked':''}> يظهر</label>
    <div style="display:flex;gap:6px">
      ${s.type!=='consultations'?'<button type="button" class="mini section-add-item">+ عنصر</button>':''}
      ${['products','courses','consultations'].includes(s.id)?'':'<button type="button" class="mini section-delete">حذف</button>'}
    </div>
    <div class="section-items">
      ${s.type==='consultations'?'':((window.allAdminItems?.()||[]).filter(x=>x.type===s.type).map(x=>'<button type="button" class="section-item-edit" data-item-id="'+x.id+'">'+x.title+'</button>').join('')||'<span class="hint">لا توجد عناصر في هذا القسم.</span>')}
    </div>
  </div>`).join('');
  wrap.querySelectorAll('.section-manager-row').forEach(row=>{
    const i=Number(row.dataset.sectionIndex),s=list[i];
    row.querySelector('.section-name').addEventListener('input',e=>{s.name=e.target.value});
    row.querySelector('.section-description').addEventListener('input',e=>{s.description=e.target.value});
    row.querySelector('.section-visible').addEventListener('change',e=>{s.visible=e.target.checked});
    row.querySelector('.section-add-item')?.addEventListener('click',()=>window.openEditor?.(s.type));
    row.querySelector('.section-delete')?.addEventListener('click',()=>{if(confirm('حذف هذا القسم من القائمة؟ العناصر لن تُحذف تلقائياً.')){list.splice(i,1);render()}});
    row.querySelectorAll('.section-item-edit').forEach(b=>b.addEventListener('click',()=>window.editItem?.(s.type,b.dataset.itemId)));
  });
  window.refreshItemSectionOptions?.();
}
async function save(){
  const list=sections();
  const p=list.find(s=>s.id==='products'),c=list.find(s=>s.id==='courses'),co=list.find(s=>s.id==='consultations');
  const d=await window.adminBridge('save-settings',{
    sections:list,
    show_products:p?p.visible!==false:true,
    show_courses:c?c.visible!==false:true,
    show_consultations:co?co.visible!==false:true
  });
  window.wtStoreSections=Array.isArray(d.settings?.sections)?d.settings.sections:list;
  if(typeof toast==='function')toast('تم حفظ الأقسام');
  render();
}
q('#addStoreSection')?.addEventListener('click',async()=>{
  const name=prompt('اسم القسم الجديد');
  if(!name)return;
  const list=sections();
  let id=slugify(name),n=2;
  while(list.some(s=>s.id===id)){id=slugify(name)+'-'+n++}
  const type='section:'+id;
  list.push({id,name:name.trim(),type,description:'',visible:true});
  window.wtStoreSections=list;render();
  try{await save()}catch(e){alert(e.message)}
});
q('#storeSectionList')?.addEventListener('change',()=>{});
const saveBtn=document.createElement('button');
saveBtn.type='button';saveBtn.className='primary';saveBtn.id='saveStoreSections';saveBtn.textContent='حفظ الأقسام';
q('.section-manager-box')?.appendChild(saveBtn);
saveBtn.addEventListener('click',async()=>{saveBtn.disabled=true;try{await save()}catch(e){alert(e.message)}finally{saveBtn.disabled=false}});
window.addEventListener('warsha:sections-loaded',()=>render());window.addEventListener('warsha:admin-catalog',()=>render());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();