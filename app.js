const STATUS_TEXT={normal:'عادي',new:'جديد',sale:'خصم',sold:'نفد',featured:'مميز',coming:'قريباً'};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let products=[],courses=[],editing=null,currentImages=[],currentFiles=[],dragIndex=null;
let consultations=JSON.parse(localStorage.getItem('wt_consults')||'null')||{c1:{price:20000,desc:'مكالمة فيديو لمدة ساعة.'},c2:{price:100000,desc:'متابعة شهرية + 4 مكالمات.'}};
let settings=JSON.parse(localStorage.getItem('wt_settings')||'null')||{storeName:'ورشة تك | warshaTik',telegram:'https://t.me/HW2DMbot',whatsapp:'+964 786 741 9185',currency:'IQD',apiBase:'https://warshatik-store2.hussainfiras23.workers.dev/api',adminKey:''};
const api=()=>((document.querySelector('#apiBase')?.value||settings.apiBase||'https://warshatik.com/api').trim().replace(/\/$/,''));
const currentAdminKey=()=>String(document.querySelector('#adminKey')?.value||settings.adminKey||'').trim();
function badge(s){return'badge '+(s||'normal')}function label(x){return x.statusText||STATUS_TEXT[x.status]||'عادي'}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
async function apiCall(path,opt={}){
  const headers={...(opt.headers||{})};if(opt.body&&!(opt.body instanceof FormData)&&!headers['content-type'])headers['content-type']='application/json';
  const key=currentAdminKey();if(key)headers['x-admin-key']=key;
  const primary=api();
  const fallback='https://warshatik-store2.hussainfiras23.workers.dev/api';
  const bases=[primary,...(primary!==fallback?[fallback]:[])];
  let lastErr=null;
  for(const base of bases){
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),10000);
    try{
      const r=await fetch(base+path,{...opt,headers,signal:ctrl.signal});
      let data={};try{data=await r.json()}catch{}
      if(!r.ok)throw new Error(data.error||('HTTP '+r.status));
      if(base!==primary){
        settings.apiBase=base;
        localStorage.setItem('wt_settings',JSON.stringify(settings));
        const input=document.querySelector('#apiBase');if(input)input.value=base;
      }
      return data;
    }catch(e){
      lastErr=e;
      if(e.message==='Unauthorized'||/^HTTP \d+/.test(e.message))throw e;
    }finally{clearTimeout(timer)}
  }
  if(lastErr?.name==='AbortError')throw new Error('انتهت مهلة الاتصال. حاول مرة أخرى.');
  throw new Error(lastErr?.message||'فشل الاتصال بالخادم');
}
async function uploadAsset(file,kind){const key=currentAdminKey();if(!key)throw new Error('تحقق من Admin API Key في الإعدادات');const itemId=editing||'draft';const headers={'content-type':file.type||'application/octet-stream','x-admin-key':key,'x-file-name':encodeURIComponent(file.name),'x-file-kind':kind,'x-item-id':itemId};const r=await fetch(api()+'/uploads',{method:'POST',headers,body:file});let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.error||('HTTP '+r.status));return data}
async function deleteAsset(key){if(!key)return;await apiCall('/uploads?key='+encodeURIComponent(key),{method:'DELETE'})}
async function loadCatalog(){try{const d=await apiCall('/catalog',{method:'GET'});products=d.products||[];courses=d.courses||[];render()}catch(e){console.error(e);toast('تعذر الاتصال بقاعدة البيانات - تحقق من رابط API')}}
function rows(list){return list.map(x=>`<tr><td><strong>${x.title}</strong><br><small>${x.category}</small></td><td>${Number(x.price_iqd).toLocaleString()}</td><td>$${x.price_usd}</td><td><span class="${badge(x.status)}">${label(x)}</span></td><td><button class="mini" onclick="editItem('${x.type}','${x.id}')">تعديل</button> <button class="mini" onclick="delItem('${x.type}','${x.id}')">حذف</button></td></tr>`).join('')}
function render(){const q=($('#search')?.value||'').toLowerCase();$('#productRows').innerHTML=rows(products.filter(x=>x.title.toLowerCase().includes(q)));$('#courseRows').innerHTML=rows(courses);$('#statProducts').textContent=products.length;$('#statCourses').textContent=courses.length;$('#statSold').textContent=[...products,...courses].filter(x=>x.status==='sold').length;$('#statActive').textContent=[...products,...courses].filter(x=>x.active).length;$('#recent').innerHTML=[...products,...courses].slice(0,5).map(x=>`<div class="recent"><strong>${x.title}</strong> — <span class="${badge(x.status)}">${label(x)}</span></div>`).join('')}
function renderImages(){const wrap=$('#imageList');wrap.innerHTML=currentImages.map((img,i)=>`<div class="image-item" draggable="true" data-i="${i}"><img src="${img.url||''}" alt=""><small>${i===0?'★ الصورة الرئيسية':'اسحب للترتيب'}</small><button type="button" data-remove-image="${i}">حذف</button></div>`).join('');wrap.querySelectorAll('.image-item').forEach(el=>{el.addEventListener('dragstart',()=>{dragIndex=Number(el.dataset.i);el.classList.add('dragging')});el.addEventListener('dragend',()=>el.classList.remove('dragging'));el.addEventListener('dragover',e=>e.preventDefault());el.addEventListener('drop',e=>{e.preventDefault();const to=Number(el.dataset.i);if(dragIndex===null||dragIndex===to)return;const[m]=currentImages.splice(dragIndex,1);currentImages.splice(to,0,m);dragIndex=null;renderImages()})});wrap.querySelectorAll('[data-remove-image]').forEach(b=>b.onclick=async()=>{const i=Number(b.dataset.removeImage),x=currentImages[i];if(!confirm('حذف هذه الصورة؟'))return;try{if(x?.key)await deleteAsset(x.key);currentImages.splice(i,1);renderImages();toast('تم حذف الصورة')}catch(e){alert(e.message)}})}
function humanSize(n=0){if(n<1024)return n+' B';if(n<1048576)return(n/1024).toFixed(1)+' KB';return(n/1048576).toFixed(1)+' MB'}
function renderFiles(){const wrap=$('#fileList');wrap.innerHTML=currentFiles.map((f,i)=>`<div class="file-item"><div><strong>${f.name||'ملف'}</strong><small>${humanSize(f.size||0)}</small></div><button type="button" data-remove-file="${i}">حذف</button></div>`).join('');wrap.querySelectorAll('[data-remove-file]').forEach(b=>b.onclick=async()=>{const i=Number(b.dataset.removeFile),x=currentFiles[i];if(!confirm('حذف هذا الملف؟'))return;try{if(x?.key)await deleteAsset(x.key);currentFiles.splice(i,1);renderFiles();toast('تم حذف الملف')}catch(e){alert(e.message)}})}
function setStatusText(status,force=true){const input=$('#statusText');if(force||!input.value)input.value=STATUS_TEXT[status]||'عادي';input.readOnly=true;$('#editStatusText').textContent='✎'}
function openEditor(type,item=null){editing=item?.id||(type+'-'+Date.now());currentImages=[...(item?.images||[])].map(x=>typeof x==='string'?{url:x,name:x}:x);currentFiles=[...(item?.files||[])];$('#modalTitle').textContent=item?'تعديل':'إضافة';$('#editType').value=type;$('#title').value=item?.title||'';$('#category').value=item?.category||'';$('#price_iqd').value=item?.price_iqd||'';$('#price_usd').value=item?.price_usd||'';$('#old_iqd').value=item?.old_iqd??item?.old_price_iqd??'';$('#old_usd').value=item?.old_usd??item?.old_price_usd??'';$('#status').value=item?.status||'normal';$('#statusText').value=item?.statusText||STATUS_TEXT[$('#status').value];$('#statusText').readOnly=true;$('#editStatusText').textContent='✎';$('#short').value=item?.short||'';$('#description').value=item?.description||'';$('#features').value=(item?.features||[]).join('\n');$('#warningText').value=item?.warningText||item?.warning_text||'';$('#youtube').value=item?.youtube||'';$('#active').checked=item?.active??true;renderImages();renderFiles();updateNetPreview();$('#modal').classList.add('open')}
function editItem(type,id){const a=type==='course'?courses:products;openEditor(type,a.find(x=>x.id===id))}
async function delItem(type,id){if(!confirm('حذف؟'))return;try{await apiCall('/items/'+encodeURIComponent(id),{method:'DELETE'});await loadCatalog();toast('تم الحذف من المتجر')}catch(e){alert(e.message==='Unauthorized'?'تحقق من Admin API Key في الإعدادات':e.message)}}
function close(){ $('#modal').classList.remove('open') }
function updateNetPreview(){
  const s=window.wtStoreSettings||{};
  const pct=Number(s.wayl_fee_percent||0);
  const iqd=Number($('#price_iqd')?.value||0);
  const usd=Number($('#price_usd')?.value||0);
  const fiqd=Number(s.wayl_fixed_iqd||0);
  const fusd=Number(s.wayl_fixed_usd||0);
  if($('#netIQD'))$('#netIQD').textContent=iqd?'الصافي التقريبي: '+Math.max(0,iqd-(iqd*pct/100)-fiqd).toLocaleString('en-US')+' د.ع':'الصافي: —';
  if($('#netUSD'))$('#netUSD').textContent=usd?'الصافي التقريبي: $'+Math.max(0,usd-(usd*pct/100)-fusd).toFixed(2):'الصافي: —';
}
window.updateNetPreview=updateNetPreview;
$('#price_iqd')?.addEventListener('input',updateNetPreview);
$('#price_usd')?.addEventListener('input',updateNetPreview);
$('#status').addEventListener('change',e=>setStatusText(e.target.value,true));$('#editStatusText').addEventListener('click',()=>{const input=$('#statusText');input.readOnly=!input.readOnly;$('#editStatusText').textContent=input.readOnly?'✎':'✓';if(!input.readOnly){input.focus();input.select()}});
$('#imageInput').addEventListener('change',async e=>{const files=[...e.target.files];e.target.value='';for(const file of files){if(!file.type.startsWith('image/'))continue;if(file.size>10*1024*1024){alert(file.name+' أكبر من 10MB');continue}try{toast('جاري رفع '+file.name+' ...');const x=await uploadAsset(file,'image');currentImages.push(x);renderImages();toast('تم رفع الصورة')}catch(err){alert(err.message)}}});
$('#fileInput').addEventListener('change',async e=>{const files=[...e.target.files];e.target.value='';for(const file of files){if(file.size>100*1024*1024){alert(file.name+' أكبر من 100MB');continue}try{toast('جاري رفع '+file.name+' ...');const x=await uploadAsset(file,'file');currentFiles.push(x);renderFiles();toast('تم رفع الملف')}catch(err){alert(err.message)}}});
$('#form').onsubmit=async e=>{e.preventDefault();const type=$('#editType').value;const x={id:editing,type,title:$('#title').value,category:$('#category').value,price_iqd:Number($('#price_iqd').value),price_usd:Number($('#price_usd').value),old_iqd:$('#old_iqd').value?Number($('#old_iqd').value):null,old_usd:$('#old_usd').value?Number($('#old_usd').value):null,status:$('#status').value,statusText:$('#statusText').value||STATUS_TEXT[$('#status').value],short:$('#short').value,description:$('#description').value,features:$('#features').value.split('\n').map(x=>x.trim()).filter(Boolean),warningText:$('#warningText').value.trim(),youtube:$('#youtube').value,images:currentImages,files:currentFiles,active:$('#active').checked};try{await apiCall('/items',{method:'POST',body:JSON.stringify(x)});close();await loadCatalog();toast('تم حفظ التغيير في المتجر')}catch(err){alert(err.message==='Unauthorized'?'تحقق من Admin API Key في الإعدادات':err.message)}};
$$('.nav').forEach(b=>b.onclick=()=>{$$('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.view').forEach(v=>v.classList.remove('active'));$('#'+b.dataset.view).classList.add('active');$('#pageTitle').textContent=b.textContent.trim()});$('#quickAdd').onclick=()=>openEditor('product');$('#addProduct').onclick=()=>openEditor('product');$('#addCourse').onclick=()=>openEditor('course');$('#close').onclick=close;$('#cancel').onclick=close;$('#search').oninput=render;
$('#c1price').value=consultations.c1.price;$('#c1desc').value=consultations.c1.desc;$('#c2price').value=consultations.c2.price;$('#c2desc').value=consultations.c2.desc;$('#saveC1').onclick=()=>{consultations.c1={price:Number($('#c1price').value),desc:$('#c1desc').value};localStorage.setItem('wt_consults',JSON.stringify(consultations))};$('#saveC2').onclick=()=>{consultations.c2={price:Number($('#c2price').value),desc:$('#c2desc').value};localStorage.setItem('wt_consults',JSON.stringify(consultations))};
$('#storeName').value=settings.storeName;$('#telegram').value=settings.telegram;$('#whatsapp').value=settings.whatsapp;$('#currency').value=settings.currency;$('#apiBase').value=settings.apiBase;$('#adminKey').value=settings.adminKey;
$('#saveSettings').onclick=()=>{settings={storeName:$('#storeName').value,telegram:$('#telegram').value,whatsapp:$('#whatsapp').value,currency:$('#currency').value,apiBase:$('#apiBase').value.trim(),adminKey:$('#adminKey').value};localStorage.setItem('wt_settings',JSON.stringify(settings));toast('تم حفظ الإعدادات');loadCatalog()};
$('#sendTestEmail').onclick=async()=>{const email=$('#testEmail').value.trim(),status=$('#testEmailStatus'),btn=$('#sendTestEmail');if(!email){status.textContent='اكتب البريد الإلكتروني أولاً.';return}if(!settings.adminKey){status.textContent='احفظ Admin API Key أولاً.';return}btn.disabled=true;status.textContent='جاري إرسال رسالة الاختبار...';try{const d=await apiCall('/admin/test-email',{method:'POST',body:JSON.stringify({email})});status.textContent=d.ok?'✅ تم إرسال الرسالة. افحص البريد الوارد و Spam.':'تعذر الإرسال';toast('تم إرسال رسالة الاختبار')}catch(err){status.textContent='❌ '+err.message}finally{btn.disabled=false}};
loadCatalog();