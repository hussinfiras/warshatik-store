(()=>{
const q=s=>document.querySelector(s);
const ADMIN_API='https://warshatik.com/api';

async function bridge(action,payload){
  const key=(q('#adminKey')?.value||settings.adminKey||'').trim();
  if(!key)throw new Error('Admin API Key غير موجود');
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),10000);
  try{
    const r=await fetch(ADMIN_API+'/admin/bridge',{
      method:'POST',
      headers:{'content-type':'text/plain;charset=UTF-8'},
      body:JSON.stringify({admin_key:key,action,payload}),
      signal:ctrl.signal
    });
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||('HTTP '+r.status));
    settings.apiBase=ADMIN_API;
    settings.adminKey=key;
    localStorage.setItem('wt_settings',JSON.stringify(settings));
    const apiInput=q('#apiBase');
    if(apiInput){apiInput.value=ADMIN_API;apiInput.readOnly=true}
    return d;
  }catch(e){
    if(e?.name==='AbortError')throw new Error('انتهت مهلة الاتصال. حاول مرة أخرى.');
    throw e;
  }finally{clearTimeout(timer)}
}
window.adminBridge=bridge;

function setText(sel,v){const el=q(sel);if(el)el.textContent=v}

function consultationDefaults(){
  return {individual:{iqd:20000,usd:15},supervision:{iqd:100000,usd:75}};
}

function updateTicketTypeLabels(prices){
  const sel=q('#ticketType');if(!sel)return;
  const p=prices||consultationDefaults();
  const ind=sel.querySelector('option[value="individual"]');
  const sup=sel.querySelector('option[value="supervision"]');
  if(ind)ind.textContent='استشارة فردية — '+Number(p.individual?.iqd??20000).toLocaleString('en-US')+' د.ع / $'+Number(p.individual?.usd??15);
  if(sup)sup.textContent='إشراف شهري — '+Number(p.supervision?.iqd??100000).toLocaleString('en-US')+' د.ع / $'+Number(p.supervision?.usd??75);
}

async function loadStoreSettings(){
  try{
    const d=await bridge('get-settings');
    const s=d.settings||{};
    window.wtStoreSettings=s;

    if(q('#homeTitle'))q('#homeTitle').value=s.home_title||'حوّل أفكارك الإلكترونية إلى مشاريع حقيقية.';
    if(q('#homeSubtitle'))q('#homeSubtitle').value=s.home_subtitle||'دورات عملية، أكواد Arduino وESP32، ملفات مشاريع واستشارات شخصية تساعدك تتعلم وتبني مشروعك بطريقة واضحة.';
    if(q('#homeImage'))q('#homeImage').value=s.home_image||'';
    if(q('#newsEnabled'))q('#newsEnabled').checked=s.news_enabled!==false;

    const banners=Array.isArray(s.home_banners)?s.home_banners:[];
    for(let i=1;i<=3;i++){
      const b=banners[i-1]||{};
      if(q('#banner'+i+'Title'))q('#banner'+i+'Title').value=b.title||'';
      if(q('#banner'+i+'Subtitle'))q('#banner'+i+'Subtitle').value=b.subtitle||'';
      if(q('#banner'+i+'Image'))q('#banner'+i+'Image').value=b.image||'';
      if(q('#banner'+i+'Link'))q('#banner'+i+'Link').value=b.link||'';
      if(q('#banner'+i+'Button'))q('#banner'+i+'Button').value=b.button||'';
    }

    const cards=s.home_card_images||{};
    if(q('#quickProductsImage'))q('#quickProductsImage').value=cards.products||'';
    if(q('#quickCoursesImage'))q('#quickCoursesImage').value=cards.courses||'';
    if(q('#quickConsultationsImage'))q('#quickConsultationsImage').value=cards.consultations||'';

    const cp=s.consultation_prices||consultationDefaults();
    if(q('#c1price'))q('#c1price').value=cp.individual?.iqd??20000;
    if(q('#c1usd'))q('#c1usd').value=cp.individual?.usd??15;
    if(q('#c2price'))q('#c2price').value=cp.supervision?.iqd??100000;
    if(q('#c2usd'))q('#c2usd').value=cp.supervision?.usd??75;
    updateTicketTypeLabels(cp);

    if(q('#defaultWarning'))q('#defaultWarning').value=s.digital_warning_default||'تنبيه: هذا منتج رقمي فقط ولا يتضمن حزمة قطع أو مكونات هاردوير كاملة.';
    if(q('#showCourses'))q('#showCourses').checked=s.show_courses!==false;
    if(q('#showProducts'))q('#showProducts').checked=s.show_products!==false;
    if(q('#showConsultations'))q('#showConsultations').checked=s.show_consultations!==false;

    window.wtStoreSections=Array.isArray(s.sections)&&s.sections.length?s.sections:[
      {id:'products',name:'المنتجات',type:'product',visible:s.show_products!==false},
      {id:'courses',name:'الدورات',type:'course',visible:s.show_courses!==false},
      {id:'consultations',name:'الاستشارات',type:'consultations',visible:s.show_consultations!==false}
    ];
    window.refreshItemSectionOptions?.();
    window.dispatchEvent(new CustomEvent('warsha:sections-loaded',{detail:window.wtStoreSections}));
    updateVisibilityButtons();

    if(q('#exchangeRate'))q('#exchangeRate').value=Number(s.exchange_rate_iqd_per_usd||1500);
    if(q('#exchangeRatePreview'))q('#exchangeRatePreview').textContent=Number(s.exchange_rate_iqd_per_usd||1500).toLocaleString('en-US');
    if(q('#waylFeePercent'))q('#waylFeePercent').value=s.wayl_fee_percent??'';
    if(q('#waylFixedIQD'))q('#waylFixedIQD').value=s.wayl_fixed_iqd??'';
    if(q('#waylFixedUSD'))q('#waylFixedUSD').value=s.wayl_fixed_usd??'';
    window.updateNetPreview?.();
  }catch(e){
    console.error(e);
    if(q('#storefrontStatus'))q('#storefrontStatus').textContent='تعذر تحميل إعدادات الواجهة: '+e.message;
  }
}

async function saveStoreSettings(extra={}){
  const payload={
    home_title:q('#homeTitle')?.value.trim()||undefined,
    home_subtitle:q('#homeSubtitle')?.value.trim()||undefined,
    home_image:q('#homeImage')?.value.trim()||'',
    news_enabled:q('#newsEnabled')?.checked??true,
    home_banners:[1,2,3].map(i=>({
      title:q('#banner'+i+'Title')?.value.trim()||'',
      subtitle:q('#banner'+i+'Subtitle')?.value.trim()||'',
      image:q('#banner'+i+'Image')?.value.trim()||'',
      link:q('#banner'+i+'Link')?.value.trim()||'',
      button:q('#banner'+i+'Button')?.value.trim()||''
    })).filter(b=>b.title||b.subtitle||b.image),
    home_card_images:{
      products:q('#quickProductsImage')?.value.trim()||'',
      courses:q('#quickCoursesImage')?.value.trim()||'',
      consultations:q('#quickConsultationsImage')?.value.trim()||''
    },
    consultation_prices:{
      individual:{iqd:Number(q('#c1price')?.value||20000),usd:Number(q('#c1usd')?.value||15)},
      supervision:{iqd:Number(q('#c2price')?.value||100000),usd:Number(q('#c2usd')?.value||75)}
    },
    digital_warning_default:q('#defaultWarning')?.value.trim()||'',
    show_courses:q('#showCourses')?.checked??true,
    show_products:q('#showProducts')?.checked??true,
    show_consultations:q('#showConsultations')?.checked??true,
    sections:window.wtStoreSections||undefined,
    wayl_fee_percent:Number(q('#waylFeePercent')?.value||0),
    wayl_fixed_iqd:Number(q('#waylFixedIQD')?.value||0),
    wayl_fixed_usd:Number(q('#waylFixedUSD')?.value||0),
    exchange_rate_iqd_per_usd:Number(q('#exchangeRate')?.value||1500),
    ...extra
  };
  const d=await bridge('save-settings',payload);
  window.wtStoreSettings=d.settings||payload;
  updateTicketTypeLabels(window.wtStoreSettings.consultation_prices||payload.consultation_prices);
  window.updateNetPreview?.();
  return d;
}
window.saveStoreSettings=saveStoreSettings;

async function loadStats(){
  try{
    const d=await bridge('stats');
    setText('#statPaidOrders',d.paid_orders||0);
    setText('#statUnitsSold',d.units_sold||0);
    setText('#statCustomers',d.customers||0);
    setText('#statPendingOrders',d.pending_orders||0);
    const ri=(d.revenue||[]).find(x=>x.currency==='IQD')?.total||0;
    const ru=(d.revenue||[]).find(x=>x.currency==='USD')?.total||0;
    setText('#statRevenueIQD',Number(ri).toLocaleString('en-US'));
    setText('#statRevenueUSD','$'+Number(ru).toFixed(2));
    window.adminSalesMap=Object.fromEntries((d.item_sales||[]).map(x=>[x.item_id,Number(x.sold||0)]));
    window.render?.();
    const top=q('#topProducts');
    if(top)top.innerHTML=(d.top_products||[]).map(x=>'<div class="recent"><strong>'+x.title+'</strong><span>'+x.sold+' مبيعات</span></div>').join('')||'<p class="hint">لا توجد مبيعات في هذه الفترة بعد.</p>';
    const period=q('#statsPeriodLabel');
    if(period)period.textContent=d.reset_at&&d.reset_at!=='1970-01-01T00:00:00Z'?'Period started: '+new Date(d.reset_at).toLocaleString('en-GB',{hour12:false}):'All-time period.';
  }catch(e){console.error(e)}
}
window.loadStats=loadStats;

q('#resetStats')?.addEventListener('click',async()=>{
  if(!confirm('بدء فترة إحصائية جديدة؟ إجمالي الإيرادات التاريخية لن يُحذف.'))return;
  const btn=q('#resetStats');btn.disabled=true;
  try{await bridge('reset-stats');await loadStats();toast('تم تصفير إحصائيات الفترة')}
  catch(e){alert(e.message)}
  finally{btn.disabled=false}
});

q('#saveStorefront')?.addEventListener('click',async()=>{
  const status=q('#storefrontStatus'),btn=q('#saveStorefront');
  const key=(q('#adminKey')?.value||settings.adminKey||'').trim();
  if(!key){if(status)status.textContent='❌ أدخل Admin API Key في الإعدادات أولاً.';return}
  settings.adminKey=key;settings.apiBase=ADMIN_API;localStorage.setItem('wt_settings',JSON.stringify(settings));
  if(status)status.textContent='جاري الحفظ...';if(btn)btn.disabled=true;
  try{await saveStoreSettings();if(status)status.textContent='✅ تم الحفظ بنجاح.';toast('تم حفظ واجهة المتجر')}
  catch(e){if(status)status.textContent='❌ '+(e.message||'فشل الحفظ');toast('فشل الحفظ')}
  finally{if(btn)btn.disabled=false}
});

async function saveConsultationPrices(){
  const prices={
    individual:{iqd:Number(q('#c1price')?.value||20000),usd:Number(q('#c1usd')?.value||15)},
    supervision:{iqd:Number(q('#c2price')?.value||100000),usd:Number(q('#c2usd')?.value||75)}
  };
  const d=await bridge('save-settings',{consultation_prices:prices});
  window.wtStoreSettings={...(window.wtStoreSettings||{}),consultation_prices:d.settings?.consultation_prices||prices};
  updateTicketTypeLabels(window.wtStoreSettings.consultation_prices);
}
q('#saveC1')?.addEventListener('click',async()=>{
  try{await saveConsultationPrices();toast('تم حفظ أسعار الاستشارة الفردية')}catch(e){alert(e.message)}
});
q('#saveC2')?.addEventListener('click',async()=>{
  try{await saveConsultationPrices();toast('تم حفظ أسعار باقة الإشراف')}catch(e){alert(e.message)}
});

q('#clearHomeImage')?.addEventListener('click',()=>{if(q('#homeImage'))q('#homeImage').value=''});

async function uploadImage(file,itemId){
  if(!file)return null;
  if(file.size>10*1024*1024)throw new Error('الصورة أكبر من 10MB');
  const headers={
    'content-type':file.type||'application/octet-stream',
    'x-admin-key':(q('#adminKey')?.value||settings.adminKey||'').trim(),
    'x-file-name':encodeURIComponent(file.name),
    'x-file-kind':'image',
    'x-item-id':itemId
  };
  const r=await fetch(ADMIN_API+'/uploads',{method:'POST',headers,body:file});
  const d=await r.json();if(!r.ok)throw new Error(d.error||('HTTP '+r.status));return d;
}

q('#homeImageInput')?.addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  try{const d=await uploadImage(file,'home');q('#homeImage').value=d.url||'';toast('تم رفع صورة الواجهة')}catch(err){alert(err.message)}
});

[1,2,3].forEach(i=>q('#banner'+i+'Upload')?.addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  try{const d=await uploadImage(file,'home-banner-'+i);q('#banner'+i+'Image').value=d.url||'';toast('تم رفع صورة البنر')}catch(err){alert(err.message)}
}));

[
  ['quickProductsUpload','quickProductsImage','home-card-products'],
  ['quickCoursesUpload','quickCoursesImage','home-card-courses'],
  ['quickConsultationsUpload','quickConsultationsImage','home-card-consultations']
].forEach(([uploadId,inputId,itemId])=>{
  q('#'+uploadId)?.addEventListener('change',async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return;
    try{
      const d=await uploadImage(file,itemId);
      q('#'+inputId).value=d.url||'';
      const images={
        products:q('#quickProductsImage')?.value.trim()||'',
        courses:q('#quickCoursesImage')?.value.trim()||'',
        consultations:q('#quickConsultationsImage')?.value.trim()||''
      };
      const saved=await bridge('save-settings',{home_card_images:images});
      const confirmed=saved.settings?.home_card_images||images;
      window.wtStoreSettings={...(window.wtStoreSettings||{}),home_card_images:confirmed};
      const expected=images[itemId==='home-card-products'?'products':itemId==='home-card-courses'?'courses':'consultations'];
      const actual=confirmed[itemId==='home-card-products'?'products':itemId==='home-card-courses'?'courses':'consultations']||'';
      if(expected&&actual!==expected)throw new Error('تم رفع الصورة لكن لم يتم حفظ رابطها في الإعدادات.');
      toast('تم رفع وحفظ خلفية القسم');
    }catch(err){alert(err.message)}
  });
});

document.querySelectorAll('[data-clear-card]').forEach(btn=>btn.addEventListener('click',()=>{
  const map={products:'#quickProductsImage',courses:'#quickCoursesImage',consultations:'#quickConsultationsImage'};
  const el=q(map[btn.dataset.clearCard]);if(el)el.value='';
}));

function updateVisibilityButtons(){
  [['#toggleProducts','#showProducts'],['#toggleCourses','#showCourses'],['#toggleConsultations','#showConsultations']].forEach(([btnSel,checkSel])=>{
    const btn=q(btnSel),check=q(checkSel);if(!btn||!check)return;
    btn.textContent=check.checked?'إخفاء القسم':'إظهار القسم';
    btn.classList.toggle('is-hidden',!check.checked);
  });
}

async function toggleSection(checkSel,btnSel){
  const check=q(checkSel),btn=q(btnSel);if(!check||!btn)return;
  const previous=check.checked;check.checked=!previous;updateVisibilityButtons();btn.disabled=true;
  try{await saveStoreSettings();toast(check.checked?'تم إظهار القسم':'تم إخفاء القسم')}
  catch(e){check.checked=previous;updateVisibilityButtons();alert(e.message)}
  finally{btn.disabled=false}
}
q('#toggleProducts')?.addEventListener('click',()=>toggleSection('#showProducts','#toggleProducts'));
q('#toggleCourses')?.addEventListener('click',()=>toggleSection('#showCourses','#toggleCourses'));
q('#toggleConsultations')?.addEventListener('click',()=>toggleSection('#showConsultations','#toggleConsultations'));

async function checkSystemHealth(){
  const detail=q('#healthDetail');if(detail)detail.textContent='جاري الفحص...';
  try{
    const d=await bridge('health');
    const set=(id,ok)=>{const el=q(id);if(el){el.textContent=ok?'يعمل ✓':'مشكلة ✕';el.className=ok?'health-ok':'health-bad'}};
    set('#healthDb',!!d.db);set('#healthR2',!!d.r2);set('#healthEmail',!!d.email?.resend_key&&!!d.email?.from);set('#healthWayl',!!d.wayl?.token&&!!d.wayl?.webhook_secret);set('#healthAdmin',!!d.admin_auth?.email&&!!d.admin_auth?.password);
    if(detail)detail.textContent=(!d.email?.resend_key?'RESEND_API_KEY غير موجود. ':'')+(!d.email?.from?'EMAIL_FROM غير موجود. ':'')+(!d.wayl?.token?'WAYL_API_TOKEN غير موجود. ':'')+(!d.wayl?.webhook_secret?'WAYL_WEBHOOK_SECRET غير موجود. ':'')+(!d.admin_auth?.email?'ADMIN_EMAIL غير موجود. ':'')+(!d.admin_auth?.password?'ADMIN_PASSWORD غير موجود. ':'')+(!d.admin_auth?.email?'ADMIN_EMAIL غير موجود. ':'')+(!d.admin_auth?.password?'ADMIN_PASSWORD غير موجود. ':'')+(d.wayl?.env?'Wayl env: '+d.wayl.env+'. ':'')+(d.email?.from_value?'Sender: '+d.email.from_value:'');
  }catch(e){if(detail)detail.textContent='❌ '+e.message}
}
q('#checkSystemHealth')?.addEventListener('click',checkSystemHealth);
window.checkSystemHealth=checkSystemHealth;

q('#exchangeRate')?.addEventListener('input',e=>{const n=Number(e.target.value||1500);if(q('#exchangeRatePreview'))q('#exchangeRatePreview').textContent=n.toLocaleString('en-US')});
q('#saveSettings')?.addEventListener('click',async()=>{
  try{await saveStoreSettings();toast('تم حفظ الإعدادات')}catch(e){alert(e.message)}
});

loadStoreSettings();
loadStats();
checkSystemHealth();
})();