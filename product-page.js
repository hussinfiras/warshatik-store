document.addEventListener('DOMContentLoaded',async()=>{
  try{
    await window.catalogReady;
    if(window.catalogRefresh) await window.catalogRefresh;
    const storefront=window.storefrontReady?await window.storefrontReady:{digital_warning_default:'تنبيه: هذا منتج رقمي فقط ولا يتضمن حزمة قطع أو مكونات هاردوير كاملة.'};
    const p=new URLSearchParams(location.search),id=p.get('id'),type=p.get('type')||'product';
    const all=[...(window.WARSHA_DATA?.products||[]),...(window.WARSHA_DATA?.courses||[])];
    const item=all.find(x=>x.id===id),root=document.getElementById('detailRoot');
    if(!item){
      root.innerHTML='<div class="empty-card"><h1>المنتج غير موجود</h1><p>قد يكون الرابط قديماً أو تم إخفاء المنتج.</p><a class="btn btn-primary" href="products.html">الرجوع للمنتجات</a></div>';
      return;
    }
    document.title=item.title+' | ورشة تك';
    const disabled=['sold','coming'].includes(item.status);
    const imgs=(item.images||[]).map(x=>typeof x==='string'?{url:x,name:x}:x).filter(x=>x?.url);
    const main=imgs[0]?.url||'';
    root.innerHTML=`<div class="reveal">
      <div class="gallery-main" id="mainGallery">
        ${item.statusText?`<span class="${statusClass(item.status)}">${item.statusText}</span>`:''}
        ${main?`<img class="gallery-photo" id="mainProductImage" src="${main}" alt="${item.title}">`:`<div class="big-chip">${String(item.category||'').toUpperCase()}</div>`}
      </div>
      ${imgs.length?`<div class="thumbs">${imgs.map((x,i)=>`<button class="thumb ${i===0?'active':''}" type="button" data-image="${x.url}"><img src="${x.url}" alt="${x.name||item.title}"></button>`).join('')}</div>`:''}
      ${item.youtube?`<div class="video-box"><strong>فيديو / معاينة</strong><p>فيديو توضيحي للمنتج أو الدورة.</p><a href="${item.youtube}" target="_blank" rel="noopener">فتح الفيديو ↗</a></div>`:''}
    </div>
    <div class="detail reveal">
      <span class="category">${item.category||''}</span>
      <h1>${item.title}</h1>
      <p class="desc">${item.description||''}</p>
      <div class="detail-price">${item.old_price_iqd?`<small class="old-price">${money(item,true)}</small>`:''}${money(item)}</div>
      <ul class="feature-list">${(item.features||[]).map(x=>`<li>${x}</li>`).join('')}</ul>
      ${(item.warningText||storefront.digital_warning_default)?`<div class="digital-warning"><strong>تنبيه</strong><span>${item.warningText||storefront.digital_warning_default}</span></div>`:''}
      ${(item.files||[]).length?`<div class="download-note">يتضمن هذا المنتج ${item.files.length} ملف/ملفات رقمية. تصبح روابط التحميل متاحة بعد إكمال الدفع.</div>`:''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px">
        <button id="addCartBtn" class="btn btn-primary" ${disabled?'disabled style="opacity:.45;cursor:not-allowed"':''}>${disabled?(item.status==='sold'?'غير متوفر حالياً':'قريباً'):'أضف للسلة'}</button>
        <a class="btn btn-ghost" href="${type==='course'?'courses.html':'products.html'}">رجوع</a>
      </div>
      <p id="cartMessage" style="color:#8055c2;font-weight:700;margin-top:12px"></p>
    </div>`;

    document.querySelectorAll('[data-image]').forEach(b=>b.onclick=()=>{
      const img=document.getElementById('mainProductImage');
      if(img)img.src=b.dataset.image;
      document.querySelectorAll('[data-image]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    });
    const btn=document.getElementById('addCartBtn');
    if(btn&&!disabled)btn.onclick=()=>{
      const existed=cartIds().includes(item.id);
      addToCart(item.id);
      document.getElementById('cartMessage').innerHTML=existed?'المنتج موجود بالفعل في السلة. <a href="cart.html">فتح السلة ←</a>':'تمت الإضافة إلى السلة. <a href="cart.html">فتح السلة ←</a>';
      btn.textContent='تمت الإضافة ✓';
    };
    const recs=recommendItems([item],3);
    if(recs.length){
      document.getElementById('recommendGrid').innerHTML=recommendationCards(recs);
      document.getElementById('recommendSection').hidden=false;
    }
    reveal();
  }catch(err){
    console.error(err);
    const root=document.getElementById('detailRoot');
    if(root)root.innerHTML='<div class="empty-card"><h1>تعذر تحميل المنتج</h1><p>حدث خطأ أثناء تحميل البيانات. حاول تحديث الصفحة.</p></div>';
  }
});