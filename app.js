const STATUS_TEXT={normal:'عادي',new:'جديد',sale:'خصم',sold:'نفد',featured:'مميز',coming:'قريباً',free:'مجاني'};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let products=[],courses=[],allItems=[],editing=null,currentImages=[],currentFiles=[],dragIndex=null;
function readLocalJson(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){console.warn('Bad local storage:',key,e);return null}}
let consultations=readLocalJson('wt_consults')||{c1:{price:20000,desc:'مكالمة فيديو لمدة ساعة.'},c2:{price:100000,desc:'متابعة شهرية + 4 مكالمات.'}};
let settings=readLocalJson('wt_settings')||{storeName:'ورشة تك | warshaTik',telegram:'https://t.me/HW2DMbot',whatsapp:'+964 786 741 9185',currency:'IQD',apiBase:'https://warshatik.com/api',adminKey:''};
const ADMIN_API='https://warshatik.com/api';
const api=()=>ADMIN_API;
const currentAdminKey=()=>String(document.querySelector('#adminKey')?.value||settings.adminKey||'').trim();
function badge(s){return'badge '+(s||'normal')}function label(x){return x.statusText||STATUS_TEXT[x.status]||'عادي'}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
async function apiCall(path,opt={}){
  const headers={...(opt.headers||{})};if(opt.body&&!(opt.body instanceof FormData)&&!headers['content-type'])headers['content-type']='application/json';
  const key=currentAdminKey();if(key)headers['x-admin-key']=key;
  const primary=ADMIN_API;
  const bases=[primary];
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
async function loadCatalog(){try{const d=await apiCall('/catalog',{method:'GET'});products=d.products||[];courses=d.courses||[];allItems=d.items||[...products,...courses];render();window.dispatchEvent(new CustomEvent('warsha:admin-catalog',{detail:allItems}))}catch(e){console.error(e);toast('تعذر الاتصال بقاعدة البيانات - تحقق من رابط API')}}
function rows(list){const sales=window.adminSalesMap||{};return list.map(x=>`<tr><td><strong>${x.title}</strong><br><small>${x.category}</small></td><td>${Number(x.price_iqd).toLocaleString()}</td><td>${x.price_usd}</td><td><span class="${badge(x.status)}">${label(x)}</span></td><td><strong>${Number(sales[x.id]||0).toLocaleString('en-US')}</strong></td><td><button class="mini" onclick="editItem('${x.type}','${x.id}')">تعديل</button> <button class="mini" onclick="delItem('${x.type}','${x.id}')">حذف</button></td></tr>`).join('')}
function matchesAdminSearch(x,q){
  if(!q)return true;
  return [x.title,x.category,x.short,x.description,...(x.keywords||[])].filter(Boolean).join(' ').toLowerCase().includes(q);
}
function render(){
  const qv=($('#search')?.value||'').trim().toLowerCase();
  const pr=$('#productRows'),cr=$('#courseRows');
  if(pr)pr.innerHTML=rows(products.filter(x=>matchesAdminSearch(x,qv)));
  if(cr)cr.innerHTML=rows(courses.filter(x=>matchesAdminSearch(x,qv)));
  if($('#statProducts'))$('#statProducts').textContent=products.length;
  if($('#statCourses'))$('#statCourses').textContent=courses.length;
  if($('#statSold'))$('#statSold').textContent=allItems.filter(x=>x.status==='sold').length;
  if($('#statActive'))$('#statActive').textContent=allItems.filter(x=>x.active).length;
  if($('#recent'))$('#recent').innerHTML=allItems.slice(0,5).map(x=>`<div class="recent"><strong>${x.title}</strong> — <span class="${badge(x.status)}">${label(x)}</span></div>`).join('');
}
function renderImages(){const wrap=$('#imageList');wrap.innerHTML=currentImages.map((img,i)=>`<div class="image-item" draggable="true" data-i="${i}"><img src="${img.url||''}" alt=""><small>${i===0?'★ الصورة الرئيسية':'اسحب للترتيب'}</small><button type="button" data-remove-image="${i}">حذف</button></div>`).join('');wrap.querySelectorAll('.image-item').forEach(el=>{el.addEventListener('dragstart',()=>{dragIndex=Number(el.dataset.i);el.classList.add('dragging')});el.addEventListener('dragend',()=>el.classList.remove('dragging'));el.addEventListener('dragover',e=>e.preventDefault());el.addEventListener('drop',e=>{e.preventDefault();const to=Number(el.dataset.i);if(dragIndex===null||dragIndex===to)return;const[m]=currentImages.splice(dragIndex,1);currentImages.splice(to,0,m);dragIndex=null;renderImages()})});wrap.querySelectorAll('[data-remove-image]').forEach(b=>b.onclick=async()=>{const i=Number(b.dataset.removeImage),x=currentImages[i];if(!confirm('حذف هذه الصورة؟'))return;try{if(x?.key)await deleteAsset(x.key);currentImages.splice(i,1);renderImages();toast('تم حذف الصورة')}catch(e){alert(e.message)}})}
function humanSize(n=0){if(n<1024)return n+' B';if(n<1048576)return(n/1024).toFixed(1)+' KB';return(n/1048576).toFixed(1)+' MB'}
function renderFiles(){const wrap=$('#fileList');wrap.innerHTML=currentFiles.map((f,i)=>`<div class="file-item"><div><strong>${f.name||'ملف'}</strong><small>${humanSize(f.size||0)}</small></div><button type="button" data-remove-file="${i}">حذف</button></div>`).join('');wrap.querySelectorAll('[data-remove-file]').forEach(b=>b.onclick=async()=>{const i=Number(b.dataset.removeFile),x=currentFiles[i];if(!confirm('حذف هذا الملف؟'))return;try{if(x?.key)await deleteAsset(x.key);currentFiles.splice(i,1);renderFiles();toast('تم حذف الملف')}catch(e){alert(e.message)}})}
function setStatusText(status,force=true){const input=$('#statusText');if(force||!input.value)input.value=STATUS_TEXT[status]||'عادي';input.readOnly=true;$('#editStatusText').textContent='✎'}
function syncSaleFields(){
  const sale=$('#status')?.value==='sale';
  const a=$('#oldIqdWrap'),b=$('#oldUsdWrap');
  if(a)a.style.display=sale?'flex':'none';
  if(b)b.style.display=sale?'flex':'none';
}

function syncPackageFields(){
  const wrap=$('#packageEditor');if(!wrap)return;
  const enabled=$('#packageEnabled')?.checked;
  const type=$('#itemSection')?.value||$('#editType')?.value;
  wrap.hidden=!(enabled&&type==='product');
}
$('#packageEnabled')?.addEventListener('change',syncPackageFields);
$('#itemSection')?.addEventListener('change',syncPackageFields);
function refreshItemSectionOptions(selected){const sel=$('#itemSection');if(!sel)return;const secs=(window.wtStoreSections||[{id:'products',name:'المنتجات',type:'product'},{id:'courses',name:'الدورات',type:'course'}]).filter(s=>s.type!=='consultations');sel.innerHTML=secs.map(s=>`<option value="${s.type}">${s.name}</option>`).join('');if(selected&&[...sel.options].some(o=>o.value===selected))sel.value=selected}window.refreshItemSectionOptions=refreshItemSectionOptions;
function openEditor(type,item=null){editing=item?.id||(type+'-'+Date.now());currentImages=[...(item?.images||[])].map(x=>typeof x==='string'?{url:x,name:x}:x);currentFiles=[...(item?.files||[])];$('#modalTitle').textContent=item?'تعديل':'إضافة';$('#editType').value=type;refreshItemSectionOptions(item?.type||type);$('#title').value=item?.title||'';$('#category').value=item?.category||'';$('#price_iqd').value=item?.price_iqd||'';$('#price_usd').value=item?.price_usd||'';$('#old_iqd').value=item?.old_iqd??item?.old_price_iqd??'';$('#old_usd').value=item?.old_usd??item?.old_price_usd??'';$('#status').value=item?.status||'normal';$('#statusText').value=item?.statusText||STATUS_TEXT[$('#status').value];$('#statusText').readOnly=true;$('#editStatusText').textContent='✎';$('#short').value=item?.short||'';$('#description').value=item?.description||'';$('#features').value=(item?.features||[]).join('\n');$('#keywords').value=(item?.keywords||[]).join(', ');$('#digitalOnly').checked=item?.digitalOnly??true;$('#packageEnabled').checked=!!item?.packageEnabled;$('#software_price_iqd').value=item?.software_price_iqd??item?.price_iqd??'';$('#software_price_usd').value=item?.software_price_usd??item?.price_usd??'';$('#hardware_price_iqd').value=item?.hardware_price_iqd??item?.price_iqd??'';$('#hardware_price_usd').value=item?.hardware_price_usd??item?.price_usd??'';$('#softwareFeatures').value=(item?.softwareFeatures||item?.features||[]).join('\n');$('#hardwareFeatures').value=(item?.hardwareFeatures||[]).join('\n');syncPackageFields();$('#iraqOnly').checked=!!item?.iraqOnly;$('#youtube').value=item?.youtube||'';$('#active').checked=item?.active??true;renderImages();renderFiles();syncSaleFields();updateNetPreview();$('#modal').classList.add('open')}
function editItem(type,id){openEditor(type,allItems.find(x=>x.id===id)||[...products,...courses].find(x=>x.id===id))}
async function delItem(type,id){if(!confirm('حذف؟'))return;try{await apiCall('/items/'+encodeURIComponent(id),{method:'DELETE'});allItems=allItems.filter(x=>x.id!==id);products=allItems.filter(x=>x.type==='product');courses=allItems.filter(x=>x.type==='course');render();window.dispatchEvent(new CustomEvent('warsha:admin-catalog',{detail:allItems}));toast('تم الحذف من المتجر')}catch(e){alert(e.message==='Unauthorized'?'تحقق من Admin API Key في الإعدادات':e.message)}}
function close(){ $('#modal').classList.remove('open') }
function updateNetPreview(){
  const free=$('#status')?.value==='free';
  const iqd=Number($('#price_iqd')?.value||0);
  const usd=Number($('#price_usd')?.value||0);
  const LOCAL_PCT=2.5, INTERNATIONAL_PCT=3.5, FIXED_IQD=600, IQD_PER_USD=currentExchangeRate();
  const fixedUsd=FIXED_IQD/IQD_PER_USD;
  if(free){if($('#netIQD'))$('#netIQD').textContent='مجاني — لا توجد رسوم Wayl';if($('#netUSD'))$('#netUSD').textContent='مجاني — لا توجد رسوم Wayl';return}
  if($('#netIQD')){
    const fee=iqd?iqd*LOCAL_PCT/100+FIXED_IQD:0;
    const net=Math.max(0,iqd-fee);
    $('#netIQD').textContent=iqd
      ? 'Wayl: '+Math.round(fee).toLocaleString('en-US')+' د.ع • الصافي: '+Math.round(net).toLocaleString('en-US')+' د.ع'
      : 'الصافي: —';
  }
  if($('#netUSD')){
    const fee=usd?usd*INTERNATIONAL_PCT/100+fixedUsd:0;
    const net=Math.max(0,usd-fee);
    $('#netUSD').textContent=usd
      ? 'Wayl: $'+fee.toFixed(2)+' • الصافي: $'+net.toFixed(2)
      : 'الصافي: —';
  }
}
window.updateNetPreview=updateNetPreview;

function currentExchangeRate(){return Number(window.wtStoreSettings?.exchange_rate_iqd_per_usd||document.querySelector('#exchangeRate')?.value||1500)||1500}
function convertUsdToIqd(usd){return Math.round(Number(usd||0)*currentExchangeRate())}
$('#price_iqd')?.addEventListener('input',updateNetPreview);
$('#price_usd')?.addEventListener('input',()=>{const v=$('#price_usd').value;if(v!=='')$('#price_iqd').value=convertUsdToIqd(v);updateNetPreview()});
$('#old_usd')?.addEventListener('input',()=>{const v=$('#old_usd').value;if(v!=='')$('#old_iqd').value=convertUsdToIqd(v)});
$('#software_price_usd')?.addEventListener('input',()=>{const v=$('#software_price_usd').value;if(v!=='')$('#software_price_iqd').value=convertUsdToIqd(v)});
$('#hardware_price_usd')?.addEventListener('input',()=>{const v=$('#hardware_price_usd').value;if(v!=='')$('#hardware_price_iqd').value=convertUsdToIqd(v)});
$('#status').addEventListener('change',e=>{setStatusText(e.target.value,true);syncSaleFields();updateNetPreview()});
$('#editStatusText').addEventListener('click',()=>{
  const input=$('#statusText');
  input.readOnly=!input.readOnly;
  $('#editStatusText').textContent=input.readOnly?'✎':'✓';
  if(!input.readOnly){input.focus();input.select()}
});

function readImageSize(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{const out={width:img.naturalWidth,height:img.naturalHeight};URL.revokeObjectURL(url);resolve(out)};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('تعذر قراءة أبعاد الصورة'))};
    img.src=url;
  });
}
async function validateProductImage(file){
  const {width,height}=await readImageSize(file);
  const ratio=width/height;
  const minWidth=1000,minHeight=625,minRatio=1.45,maxRatio=1.75;
  if(width<minWidth||height<minHeight){
    throw new Error('أبعاد الصورة صغيرة. الحد الأدنى 1000 × 625 بكسل، والمقاس المقترح 1600 × 1000.');
  }
  if(ratio<minRatio||ratio>maxRatio){
    throw new Error('نسبة أبعاد الصورة غير مناسبة. استخدم صورة قريبة من 16:10 مثل 1600 × 1000 بكسل.');
  }
  return {width,height};
}

$('#imageInput').addEventListener('change',async e=>{
  const files=[...e.target.files];e.target.value='';
  for(const file of files){
    if(!file.type.startsWith('image/'))continue;
    if(file.size>10*1024*1024){alert(file.name+' أكبر من 10MB');continue}
    try{
      await validateProductImage(file);
      toast('جاري رفع '+file.name+' ...');
      const x=await uploadAsset(file,'image');
      currentImages.push(x);renderImages();toast('تم رفع الصورة');
    }catch(err){alert(err.message)}
  }
});

$('#fileInput').addEventListener('change',async e=>{
  const files=[...e.target.files];e.target.value='';
  for(const file of files){
    if(file.size>100*1024*1024){alert(file.name+' أكبر من 100MB');continue}
    try{
      toast('جاري رفع '+file.name+' ...');
      const x=await uploadAsset(file,'file');
      currentFiles.push(x);renderFiles();toast('تم رفع الملف');
    }catch(err){alert(err.message)}
  }
});

$('#form').onsubmit=async e=>{
  e.preventDefault();
  const type=$('#itemSection')?.value||$('#editType').value;
  const x={
    id:editing,type,title:$('#title').value,category:$('#category').value,
    price_iqd:Number($('#price_iqd').value),price_usd:Number($('#price_usd').value),
    old_iqd:$('#old_iqd').value?Number($('#old_iqd').value):null,
    old_usd:$('#old_usd').value?Number($('#old_usd').value):null,
    status:$('#status').value,statusText:$('#statusText').value||STATUS_TEXT[$('#status').value],
    short:$('#short').value,description:$('#description').value,
    features:$('#features').value.split('\n').map(x=>x.trim()).filter(Boolean),
    keywords:$('#keywords').value.split(/[,#\n]/).map(x=>x.trim()).filter(Boolean),
     digitalOnly:$('#digitalOnly').checked,packageEnabled:$('#packageEnabled').checked,software_price_iqd:$('#software_price_iqd').value?Number($('#software_price_iqd').value):null,software_price_usd:$('#software_price_usd').value?Number($('#software_price_usd').value):null,hardware_price_iqd:$('#hardware_price_iqd').value?Number($('#hardware_price_iqd').value):null,hardware_price_usd:$('#hardware_price_usd').value?Number($('#hardware_price_usd').value):null,softwareFeatures:$('#softwareFeatures').value.split('\n').map(x=>x.trim()).filter(Boolean),hardwareFeatures:$('#hardwareFeatures').value.split('\n').map(x=>x.trim()).filter(Boolean),iraqOnly:$('#iraqOnly').checked,
    youtube:$('#youtube').value,images:currentImages,files:currentFiles,active:$('#active').checked
  };
  try{
    const d=await apiCall('/items',{method:'POST',body:JSON.stringify(x)});
    const saved=d.item||x;
    const i=allItems.findIndex(v=>v.id===saved.id);
    if(i>=0)allItems[i]=saved;else allItems.push(saved);
    products=allItems.filter(v=>v.type==='product');
    courses=allItems.filter(v=>v.type==='course');
    render();window.dispatchEvent(new CustomEvent('warsha:admin-catalog',{detail:allItems}));
    close();toast('تم حفظ التغيير في المتجر');
  }catch(err){alert(err.message==='Unauthorized'?'تحقق من Admin API Key في الإعدادات':err.message)}
};

$$('.nav').forEach(b=>b.onclick=()=>{
  $$('.nav').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  $$('.view').forEach(v=>v.classList.remove('active'));
  $('#'+b.dataset.view).classList.add('active');
  $('#pageTitle').textContent=b.textContent.trim();
});
$('#quickAdd').onclick=()=>openEditor('product');
$('#addProduct').onclick=()=>openEditor('product');
$('#addCourse').onclick=()=>openEditor('course');
$('#close').onclick=close;
$('#cancel').onclick=close;
$('#search').oninput=render;

$('#c1price').value=consultations.c1.price;
$('#c1desc').value=consultations.c1.desc;
$('#c2price').value=consultations.c2.price;
$('#c2desc').value=consultations.c2.desc;
$('#saveC1').onclick=()=>{consultations.c1={price:Number($('#c1price').value),desc:$('#c1desc').value};localStorage.setItem('wt_consults',JSON.stringify(consultations))};
$('#saveC2').onclick=()=>{consultations.c2={price:Number($('#c2price').value),desc:$('#c2desc').value};localStorage.setItem('wt_consults',JSON.stringify(consultations))};

$('#storeName').value=settings.storeName;
$('#telegram').value=settings.telegram;
$('#whatsapp').value=settings.whatsapp;
$('#apiBase').value=ADMIN_API;$('#apiBase').readOnly=true;settings.apiBase=ADMIN_API;
$('#adminKey').value=settings.adminKey;
$('#saveSettings').onclick=()=>{
  settings={
    storeName:$('#storeName').value,
    telegram:$('#telegram').value,
    whatsapp:$('#whatsapp').value,
    apiBase:ADMIN_API,
    adminKey:$('#adminKey').value
  };
  localStorage.setItem('wt_settings',JSON.stringify(settings));
  toast('تم حفظ الإعدادات');
  loadCatalog();
};

$('#sendTestEmail').onclick=async()=>{
  const email=$('#testEmail').value.trim(),status=$('#testEmailStatus'),btn=$('#sendTestEmail');
  if(!email){status.textContent='اكتب البريد الإلكتروني أولاً.';return}
  if(!currentAdminKey()){status.textContent='احفظ Admin API Key أولاً.';return}
  btn.disabled=true;status.textContent='جاري إرسال رسالة الاختبار...';
  try{
    const d=await apiCall('/admin/test-email',{method:'POST',body:JSON.stringify({email})});
    status.textContent=d.ok?'✅ تم إرسال الرسالة. افحص البريد الوارد و Spam.':'تعذر الإرسال';
    toast('تم إرسال رسالة الاختبار');
  }catch(err){status.textContent='❌ '+err.message}
  finally{btn.disabled=false}
};

loadCatalog();

window.openEditor=openEditor;window.editItem=editItem;window.delItem=delItem;

window.loadCatalog=loadCatalog;window.allAdminItems=()=>allItems;window.render=render;
