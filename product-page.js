document.addEventListener('DOMContentLoaded',async()=>{
  const root=document.getElementById('detailRoot');
  try{
    const storefront=window.storefrontReady?await window.storefrontReady:{digital_warning_default:'تنبيه: هذا منتج رقمي فقط ولا يتضمن حزمة قطع أو مكونات هاردوير كاملة.',show_products:true,show_courses:true};
    let data=window.WARSHA_DATA||{products:[],courses:[],items:[]};
    let params=new URLSearchParams(location.search);
    const id=params.get('id');
    let initialAll=window.allCatalogItems?window.allCatalogItems():[...(data.products||[]),...(data.courses||[]),...(data.items||[])];
    if(!initialAll.some(x=>x.id===id)&&window.catalogRefresh){
      const fresh=await window.catalogRefresh;
      if(fresh)data=window.WARSHA_DATA=fresh;
    }
    const region=window.regionReady?await window.regionReady:{country:'XX',is_iraq:false};
    const type=params.get('type')||'product';
    const all=window.allCatalogItems?window.allCatalogItems():[...(data.products||[]),...(data.courses||[]),...(data.items||[])];
    const item=all.find(x=>x.id===id);

    if(!item){
      root.innerHTML='<div class="empty-card"><h1>المنتج غير موجود</h1><p>قد يكون الرابط قديماً أو تم إخفاء المنتج.</p><a class="btn btn-primary" href="products.html">الرجوع للمنتجات</a></div>';
      return;
    }
    if((item.type==='product'&&storefront.show_products===false)||(item.type==='course'&&storefront.show_courses===false)||!window.isItemSectionVisible?.(item)){
      location.replace('index.html');return;
    }

    const moneyLocal=(i,old=false)=>{
      const cur=localStorage.getItem('warsha-currency')||'IQD';
      const usd=cur==='USD';
      const n=usd?(old?i.old_price_usd:i.price_usd):(old?i.old_price_iqd:i.price_iqd);
      if(n==null)return '';
      return usd?'$'+Number(n).toFixed(Number(n)%1?2:0):Number(n).toLocaleString('en-US')+' د.ع';
    };
    const statusClassLocal=s=>'flag flag-'+(s||'normal');

    document.title=item.title+' | ورشة تك';
    const blockedByRegion=!!item.iraqOnly&&!region.is_iraq;
    const disabled=['sold','coming'].includes(item.status)||blockedByRegion;
    const imgs=(item.images||[]).map(x=>typeof x==='string'?{url:x,name:x}:x).filter(x=>x?.url);
    const main=imgs[0]?.url||'';

    root.innerHTML=`<div class="reveal">
      <div class="gallery-main" id="mainGallery">
        ${item.statusText?`<span class="${statusClassLocal(item.status)}">${item.statusText}</span>`:''}
        ${main?`<img class="gallery-photo" id="mainProductImage" src="${main}" alt="${item.title}">`:`<div class="big-chip">${String(item.category||'').toUpperCase()}</div>`}
      </div>
      ${imgs.length?`<div class="thumbs">${imgs.map((x,i)=>`<button class="thumb ${i===0?'active':''}" type="button" data-image="${x.url}"><img src="${x.url}" alt="${x.name||item.title}"></button>`).join('')}</div>`:''}
      ${item.youtube?`<div class="video-box"><strong>فيديو / معاينة</strong><p>فيديو توضيحي للمنتج أو الدورة.</p><a href="${item.youtube}" target="_blank" rel="noopener">فتح الفيديو ↗</a></div>`:''}
    </div>
    <div class="detail reveal">
      <span class="category">${item.category||''}</span>
      <h1>${item.title}</h1>
      <p class="desc">${item.description||''}</p>
      <div class="detail-price">${item.status==='sale'&&item.old_price_iqd?`<small class="old-price">${moneyLocal(item,true)}</small>`:''}${item.status==='free'?'<span class="free-price detail-free"><b>مجاني</b></span>':moneyLocal(item)}</div>
      <ul class="feature-list">${(item.features||[]).map(x=>`<li>${x}</li>`).join('')}</ul>
      ${item.digitalOnly!==false?`<div class="digital-warning"><strong>تنبيه</strong><span>${storefront.digital_warning_default||'تنبيه: هذا منتج رقمي فقط ولا يتضمن حزمة قطع أو مكونات هاردوير كاملة.'}</span></div>`:''}
      ${item.iraqOnly?`<div class="iraq-warning"><strong>العراق فقط</strong><span>هذا المنتج متاح للشراء داخل العراق فقط.</span></div>`:''}
      ${(item.files||[]).length?`<div class="download-note">يتضمن هذا المنتج ${item.files.length} ملف/ملفات رقمية. ${item.status==='free'?'أدخل بريدك لإكمال الطلب واستلام الملفات مباشرة.':'تصبح روابط التحميل متاحة بعد إكمال الدفع.'}</div>`:''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px">
        <button id="addCartBtn" class="btn btn-primary" ${disabled?'disabled style="opacity:.45;cursor:not-allowed"':''}>${blockedByRegion?'متاح داخل العراق فقط':(disabled?(item.status==='sold'?'غير متوفر حالياً':'قريباً'):(item.status==='free'?'احصل عليه مجاناً':'أضف للسلة'))}</button>
        <a class="btn btn-ghost" href="${item.type==='course'?'courses.html':item.type==='product'?'products.html':'section.html?id='+encodeURIComponent((storefront.sections||[]).find(s=>s.type===item.type)?.id||'')}">رجوع</a>
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
      const existed=window.cartIds?window.cartIds().includes(item.id):false;
      if(window.addToCart)window.addToCart(item.id);
      document.getElementById('cartMessage').innerHTML=existed?'المنتج موجود بالفعل في السلة. <a href="cart.html">فتح السلة ←</a>':'تمت الإضافة إلى السلة. <a href="cart.html">فتح السلة ←</a>';
      btn.textContent='تمت الإضافة ✓';
    };

    if(window.recommendItems&&window.recommendationCards){
      const recs=window.recommendItems([item],3);
      if(recs.length){
        document.getElementById('recommendGrid').innerHTML=window.recommendationCards(recs);
        document.getElementById('recommendSection').hidden=false;
      }
    }
    if(window.reveal)window.reveal();
    else document.querySelectorAll('.reveal').forEach(x=>x.classList.add('visible'));
  }catch(err){
    console.error(err);
    root.innerHTML='<div class="empty-card"><h1>تعذر تحميل المنتج</h1><p>حدث خطأ أثناء تحميل البيانات. حاول تحديث الصفحة.</p></div>';
  }
});