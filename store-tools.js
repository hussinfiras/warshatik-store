(function(){
const q=s=>document.querySelector(s);
function setText(id,v){const el=q(id);if(el)el.textContent=v}
async function loadStoreSettings(){
  try{
    const d=await apiCall('/admin/settings',{method:'GET'});
    const s=d.settings||{};window.wtStoreSettings=s;
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
    if(q('#defaultWarning'))q('#defaultWarning').value=s.digital_warning_default||'تنبيه: هذا منتج رقمي فقط ولا يتضمن حزمة قطع أو مكونات هاردوير كاملة.';
    if(q('#waylFeePercent'))q('#waylFeePercent').value=s.wayl_fee_percent??'';
    if(q('#waylFixedIQD'))q('#waylFixedIQD').value=s.wayl_fixed_iqd??'';
    if(q('#waylFixedUSD'))q('#waylFixedUSD').value=s.wayl_fixed_usd??'';
    if(window.updateNetPreview)window.updateNetPreview();
  }catch(e){console.error(e);if(q('#storefrontStatus'))q('#storefrontStatus').textContent='تعذر تحميل إعدادات الواجهة: '+e.message}
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
    digital_warning_default:q('#defaultWarning')?.value.trim()||'',
    wayl_fee_percent:Number(q('#waylFeePercent')?.value||0),
    wayl_fixed_iqd:Number(q('#waylFixedIQD')?.value||0),
    wayl_fixed_usd:Number(q('#waylFixedUSD')?.value||0),
    ...extra
  };
  const d=await apiCall('/admin/settings',{method:'POST',body:JSON.stringify(payload)});
  window.wtStoreSettings=d.settings||payload;
  if(window.updateNetPreview)window.updateNetPreview();
  return d;
}
async function loadStats(){
  try{
    const d=await apiCall('/admin/stats',{method:'GET'});
    setText('#statPaidOrders',d.paid_orders||0);setText('#statUnitsSold',d.units_sold||0);setText('#statCustomers',d.customers||0);setText('#statPendingOrders',d.pending_orders||0);
    const ri=(d.revenue||[]).find(x=>x.currency==='IQD')?.total||0,ru=(d.revenue||[]).find(x=>x.currency==='USD')?.total||0;
    setText('#statRevenueIQD',Number(ri).toLocaleString('en-US'));setText('#statRevenueUSD','$'+Number(ru).toFixed(2));
    const top=q('#topProducts');if(top)top.innerHTML=(d.top_products||[]).map(x=>'<div class="recent"><strong>'+x.title+'</strong><span>'+x.sold+' مبيعات</span></div>').join('')||'<p class="hint">لا توجد مبيعات مدفوعة بعد.</p>';
  }catch(e){console.error(e)}
}
q('#saveStorefront')?.addEventListener('click',async()=>{
  const status=q('#storefrontStatus');
  const key=(q('#adminKey')?.value||settings.adminKey||'').trim();
  if(!key){if(status)status.textContent='❌ أدخل Admin API Key في الإعدادات أولاً.';return}
  settings.adminKey=key;
  if(!settings.apiBase)settings.apiBase='https://warshatik-store2.hussainfiras23.workers.dev/api';
  localStorage.setItem('wt_settings',JSON.stringify(settings));
  if(q('#apiBase'))q('#apiBase').value=settings.apiBase;
  if(status)status.textContent='جاري الحفظ...';
  const btn=q('#saveStorefront');if(btn)btn.disabled=true;
  try{
    await saveStoreSettings();
    if(status)status.textContent='✅ تم الحفظ بنجاح. حدّث المتجر خلال ثوانٍ لرؤية التغييرات.';
    toast('تم حفظ واجهة المتجر');
  }catch(e){
    const msg=e.message==='Unauthorized'?'Admin API Key غير صحيح أو لا يطابق Cloudflare.':(e.message||'فشل الاتصال بالخادم');
    if(status)status.textContent='❌ '+msg;
    toast('فشل الحفظ');
  }finally{if(btn)btn.disabled=false}
});
q('#clearHomeImage')?.addEventListener('click',()=>{if(q('#homeImage'))q('#homeImage').value=''});
q('#homeImageInput')?.addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(file.size>10*1024*1024){alert('الصورة أكبر من 10MB');return}
  try{
    const headers={'content-type':file.type||'application/octet-stream','x-admin-key':(q('#adminKey')?.value||settings.adminKey||'').trim(),'x-file-name':encodeURIComponent(file.name),'x-file-kind':'image','x-item-id':'home'};
    const r=await fetch(api()+'/uploads',{method:'POST',headers,body:file});const d=await r.json();if(!r.ok)throw new Error(d.error||('HTTP '+r.status));
    q('#homeImage').value=d.url||'';toast('تم رفع صورة الواجهة');
  }catch(err){alert(err.message)}
});
q('#saveSettings')?.addEventListener('click',async()=>{try{await saveStoreSettings();toast('تم حفظ إعدادات الرسوم')}catch(e){console.error(e)}});
['#waylFeePercent','#waylFixedIQD','#waylFixedUSD'].forEach(id=>q(id)?.addEventListener('input',()=>{window.wtStoreSettings={...(window.wtStoreSettings||{}),wayl_fee_percent:Number(q('#waylFeePercent')?.value||0),wayl_fixed_iqd:Number(q('#waylFixedIQD')?.value||0),wayl_fixed_usd:Number(q('#waylFixedUSD')?.value||0)};if(window.updateNetPreview)window.updateNetPreview()}));

async function uploadBannerImage(file,index){
  if(!file)return;
  if(file.size>10*1024*1024){alert('الصورة أكبر من 10MB');return}
  try{
    const headers={'content-type':file.type||'application/octet-stream','x-admin-key':settings.adminKey,'x-file-name':encodeURIComponent(file.name),'x-file-kind':'image','x-item-id':'home-banner-'+index};
    const r=await fetch(api()+'/uploads',{method:'POST',headers,body:file});
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||('HTTP '+r.status));
    const input=q('#banner'+index+'Image');if(input)input.value=d.url||'';
    toast('تم رفع صورة البنر');
  }catch(err){alert(err.message)}
}
[1,2,3].forEach(i=>q('#banner'+i+'Upload')?.addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';await uploadBannerImage(file,i);
}));

loadStoreSettings();loadStats();
})();