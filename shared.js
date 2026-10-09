let W=window.WARSHA_DATA,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
document.head.insertAdjacentHTML('beforeend',`<style>.product-main-image{width:100%;height:100%;object-fit:cover;display:block}.gallery-photo{width:100%;height:100%;object-fit:cover;background:#f1edf5}.thumb{position:relative;overflow:hidden}.thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:13px}.thumb.active{outline:2px solid #8055c2;outline-offset:2px}.download-note{margin-top:18px;padding:13px 15px;border-radius:14px;background:#f2ecfa;color:#655570;font-size:13px}.cart-nav{position:relative;min-width:46px}.cart-count{position:absolute;top:-7px;left:-7px;min-width:20px;height:20px;padding:0 5px;border-radius:20px;background:#8055c2;color:#fff;font:800 11px/20px Cairo;text-align:center}</style>`);
const CATALOG_CACHE_KEY='warsha-catalog-v1';
function readCatalogCache(){try{const x=JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY)||'null');return x&&x.products&&x.courses?x:null}catch{return null}}
function saveCatalogCache(data){try{localStorage.setItem(CATALOG_CACHE_KEY,JSON.stringify(data))}catch{}}
const cachedCatalog=readCatalogCache();
if(cachedCatalog)W=window.WARSHA_DATA=cachedCatalog;
window.catalogReady=Promise.resolve(W);
window.catalogRefresh=(async()=>{try{const r=await fetch('/api/catalog?fresh=1',{cache:'no-store'});if(r.ok){const fresh=await r.json();W=window.WARSHA_DATA=fresh;saveCatalogCache(fresh);window.dispatchEvent(new CustomEvent('warsha:catalog-updated'));return fresh}}catch(e){console.warn('Using cached/fallback catalog',e)}return W})();
const STOREFRONT_CACHE_KEY='warsha-storefront-v1';
const STOREFRONT_FALLBACK={news_items:[],news_enabled:true,digital_warning_default:'تنبيه: هذا منتج رقمي فقط ولا يتضمن حزمة قطع أو مكونات هاردوير كاملة.',home_card_images:{},consultation_prices:{individual:{iqd:20000,usd:15},supervision:{iqd:100000,usd:75}},show_courses:true,show_products:true,show_consultations:true,sections:[{id:'products',name:'المنتجات',type:'product',visible:true},{id:'courses',name:'الدورات',type:'course',visible:true},{id:'consultations',name:'الاستشارات',type:'consultations',visible:true}]};
function readStorefrontCache(){try{return JSON.parse(localStorage.getItem(STOREFRONT_CACHE_KEY)||'null')}catch{return null}}
function saveStorefrontCache(data){try{localStorage.setItem(STOREFRONT_CACHE_KEY,JSON.stringify(data))}catch{}}
const cachedStorefront=readStorefrontCache();
window.storefrontReady=Promise.resolve(cachedStorefront||STOREFRONT_FALLBACK);
window.storefrontRefresh=(async()=>{try{const r=await fetch('/api/storefront?fresh=1',{cache:'no-store'});if(r.ok){const fresh=await r.json();saveStorefrontCache(fresh);window.applyStoreVisibility?.(fresh);window.dispatchEvent(new CustomEvent('warsha:storefront-updated',{detail:fresh}));return fresh}}catch(e){console.warn('Storefront settings unavailable',e)}return cachedStorefront||STOREFRONT_FALLBACK})();
let AUTO_CURRENCY=sessionStorage.getItem('warsha-auto-currency')||'IQD';
window.regionReady=(async()=>{
  try{
    const r=await fetch('/api/region',{cache:'no-store'});
    if(r.ok){
      const data=await r.json(),next=data.is_iraq?'IQD':'USD';
      AUTO_CURRENCY=next;sessionStorage.setItem('warsha-auto-currency',next);
      window.dispatchEvent(new CustomEvent('warsha:currency-ready',{detail:{currency:next,region:data}}));
      return data;
    }
  }catch(e){console.warn('Region detection unavailable',e)}
  return {country:'XX',is_iraq:AUTO_CURRENCY==='IQD'}
})();


const WARSHA_LOGO_SVG=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="260 250 720 500" role="img" aria-label="WarshaTik">
<defs>
  <linearGradient id="wtg" x1="297" y1="464" x2="950" y2="288" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#5f22a5"/>
    <stop offset=".5" stop-color="#7d2bc0"/>
    <stop offset="1" stop-color="#8d36d2"/>
  </linearGradient>
</defs>
<path d="M297 464 388 705 422 705 532 560 485 465 450 514 427 464Z" fill="url(#wtg)"/>
<path d="M950 288 790 288 626 529 563 399 511 455 621 705 650 702Z" fill="url(#wtg)"/>
</svg>`;
function applyWarshaLogo(){
  document.querySelectorAll('.logo').forEach(el=>{el.classList.add('warsha-logo');el.innerHTML=WARSHA_LOGO_SVG});document.querySelectorAll('.brand small').forEach(el=>el.remove());
  if(!document.querySelector('link[data-warsha-favicon]')){
    const l=document.createElement('link');l.rel='icon';l.type='image/svg+xml';l.dataset.warshaFavicon='1';
    l.href='data:image/svg+xml,'+encodeURIComponent(WARSHA_LOGO_SVG);document.head.appendChild(l);
  }
}
function animatedWarshaMark(){
  return `<svg viewBox="260 250 720 500" class="wt-loader-mark" aria-label="WarshaTik">
  <defs>
    <linearGradient id="wtLoaderGrad" x1="297" y1="705" x2="950" y2="288" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#5f22a5"/>
      <stop offset=".52" stop-color="#8055c2"/>
      <stop offset="1" stop-color="#9637da"/>
    </linearGradient>
    <mask id="wtLeftMask" maskUnits="userSpaceOnUse" x="260" y="250" width="330" height="480">
      <rect x="260" y="705" width="330" height="0" fill="white">
        <animate attributeName="y" from="705" to="430" dur=".82s" begin=".04s" fill="freeze"/>
        <animate attributeName="height" from="0" to="300" dur=".82s" begin=".04s" fill="freeze"/>
      </rect>
    </mask>
    <mask id="wtTickMask" maskUnits="userSpaceOnUse" x="490" y="250" width="480" height="500">
      <path d="M548 438 L635 658 L873 327"
            fill="none" stroke="white" stroke-width="154"
            stroke-linecap="butt" stroke-linejoin="miter"
            pathLength="1" stroke-dasharray="1" stroke-dashoffset="1">
        <animate attributeName="stroke-dashoffset" from="1" to="0" dur=".52s" begin=".96s" fill="freeze"/>
      </path>
    </mask>
  </defs>
  <path class="wt-left-ghost" d="M297 464 388 705 422 705 532 560 485 465 450 514 427 464Z"/>
  <path d="M297 464 388 705 422 705 532 560 485 465 450 514 427 464Z" fill="url(#wtLoaderGrad)" mask="url(#wtLeftMask)"/>
  <g class="wt-tick-group" style="opacity:0">
    <path d="M950 288 790 288 626 529 563 399 511 455 621 705 650 702Z"
          fill="url(#wtLoaderGrad)" mask="url(#wtTickMask)"/>
  </g>
  </svg>`;
}
function armWarshaTick(overlay){
  const tick=overlay?.querySelector('.wt-tick-group');
  if(tick)setTimeout(()=>{tick.style.opacity='1'},950);
}
function setupWarshaLoader(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(sessionStorage.getItem('warsha-loader-seen'))return;
  sessionStorage.setItem('warsha-loader-seen','1');
  const overlay=document.createElement('div');
  overlay.className='wt-brand-loader';
  overlay.innerHTML=`<div class="wt-loader-inner">${animatedWarshaMark()}</div>`;
  document.body.appendChild(overlay);
  armWarshaTick(overlay);
  const minVisible=(matchMedia('(pointer:coarse)').matches||innerWidth<700)?2100:1700;
  setTimeout(()=>{overlay.classList.add('done');setTimeout(()=>overlay.remove(),320)},minVisible);
}
window.showWarshaLoader=()=>{const old=document.querySelector('.wt-brand-loader');if(old)return old;const overlay=document.createElement('div');overlay.className='wt-brand-loader wt-inline-wait';overlay.innerHTML=`<div class="wt-loader-inner">${animatedWarshaMark()}</div>`;document.body.appendChild(overlay);armWarshaTick(overlay);return overlay};
window.hideWarshaLoader=()=>{const overlay=document.querySelector('.wt-brand-loader');if(overlay){overlay.classList.add('done');setTimeout(()=>overlay.remove(),380)}};

const currency=()=>AUTO_CURRENCY;window.currency=currency;
function money(i,old=false){const usd=currency()==='USD',n=usd?(old?i.old_price_usd:i.price_usd):(old?i.old_price_iqd:i.price_iqd);if(n==null)return'';return usd?`$${Number(n).toFixed(n%1?2:0)}`:`${Number(n).toLocaleString('en-US')} د.ع`}
function statusClass(s){return`flag flag-${s||'normal'}`}
function imageUrl(x){if(!x)return'';return typeof x==='string'?x:(x.url||'')}
window.storeVisibility={show_courses:true,show_products:true,show_consultations:true,sections:STOREFRONT_FALLBACK.sections};
function isItemSectionVisible(item){
  if(!item)return false;
  if(item.type==='course')return window.storeVisibility.show_courses!==false;
  if(item.type==='product')return window.storeVisibility.show_products!==false;
  const sec=(window.storeVisibility.sections||[]).find(s=>s.type===item.type);if(sec)return sec.visible!==false;
  if(String(item.type||'').startsWith('section:'))return false;
  return true;
}
window.isItemSectionVisible=isItemSectionVisible;
function applyStoreVisibility(s={}){
  const sections=Array.isArray(s.sections)&&s.sections.length?s.sections:STOREFRONT_FALLBACK.sections;
  window.storeVisibility={
    show_courses:s.show_courses!==false,
    show_products:s.show_products!==false,
    show_consultations:s.show_consultations!==false,
    sections
  };
  const defaults={products:s.show_products!==false,courses:s.show_courses!==false,consultations:s.show_consultations!==false};
  sections.forEach(sec=>{if(sec.id in defaults)defaults[sec.id]=sec.visible!==false});
  const rules=[['courses',defaults.courses],['products',defaults.products],['consultations',defaults.consultations]];
  sections.forEach(sec=>{
    if(['products','courses','consultations'].includes(sec.id)){
      document.querySelectorAll('a[data-page="'+sec.id+'"],a[href="'+sec.id+'.html"]').forEach(el=>{el.textContent=sec.name||el.textContent});
      if(document.body?.dataset?.page===sec.id){
        const kicker=document.querySelector('.page-hero .kicker');if(kicker)kicker.textContent=sec.name||kicker.textContent;
        if(sec.description){const p=document.querySelector('.page-hero p');if(p)p.textContent=sec.description}
      }
    }
  });
  for(const [page,show] of rules){
    document.querySelectorAll('a[data-page="'+page+'"],a[href="'+page+'.html"]').forEach(el=>{el.style.display=show?'':'none'});
    const bodyPage=document.body?.dataset?.page;
    if(bodyPage===page&&!show){location.replace('index.html');return}
  }
  const nav=document.querySelector('#navLinks');
  if(nav){
    nav.querySelectorAll('[data-custom-section]').forEach(x=>x.remove());
    sections.filter(sec=>!['products','courses','consultations'].includes(sec.id)&&sec.visible!==false).forEach(sec=>{
      const a=document.createElement('a');a.dataset.customSection=sec.id;a.href='section.html?id='+encodeURIComponent(sec.id);a.textContent=sec.name||sec.id;nav.appendChild(a);
    });
  }
}
window.applyStoreVisibility=applyStoreVisibility;
window.storefrontReady.then(applyStoreVisibility);window.storefrontRefresh?.then(applyStoreVisibility);

function cartIds(){try{return JSON.parse(localStorage.getItem('warsha-cart')||'[]')}catch{return[]}}
function parseCartEntry(entry){const s=String(entry||''),p=s.split('::');return {entry:s,id:p[0],packageType:['software','hardware'].includes(p[1])?p[1]:null}}
function cartEntry(id,packageType){return packageType?String(id)+'::'+packageType:String(id)}
function saveCart(ids){localStorage.setItem('warsha-cart',JSON.stringify([...new Set(ids.map(String))]));updateCartCount()}
function updateCartCount(){const c=cartIds().length;$('[data-cart-count]').forEach(x=>{x.textContent=c;x.style.display=c?'block':'none'})}
function allCatalogItems(){const legacy=[...(W?.products||[]),...(W?.courses||[])];const extra=(W?.items||[]).filter(x=>!legacy.some(y=>y.id===x.id));return [...legacy,...extra]}
window.allCatalogItems=allCatalogItems;
function addToCart(id,packageType=null){const all=allCatalogItems(),item=all.find(x=>x.id===id);if(!item||!isItemSectionVisible(item)||item.active===false||['sold','coming'].includes(item.status))return false;const entry=cartEntry(id,item.packageEnabled?(packageType||'software'):null);let ids=cartIds();if(item.packageEnabled)ids=ids.filter(x=>parseCartEntry(x).id!==String(id));if(!ids.includes(entry))ids.push(entry);saveCart(ids);return true}
function removeFromCart(entry){saveCart(cartIds().filter(x=>x!==entry))}
function clearCart(){saveCart([])}
function itemWords(i){
  const raw=[i.title,i.category,i.short,i.description,...(i.features||[]),...(i.keywords||[])].filter(Boolean).join(' ').toLowerCase();
  return new Set(raw.replace(/[\\/•,:;()\[\]{}|_-]+/g,' ').split(/\s+/).filter(x=>x.length>2));
}
function recommendItems(baseItems,limit=4){
  const all=allCatalogItems().filter(x=>isItemSectionVisible(x)&&x.active&&!['sold','coming'].includes(x.status));
  const baseIds=new Set((baseItems||[]).map(x=>x.id)),baseWords=new Set();
  (baseItems||[]).forEach(x=>itemWords(x).forEach(w=>baseWords.add(w)));
  const baseKeywords=new Set((baseItems||[]).flatMap(b=>(b.keywords||[]).map(k=>String(k).trim().toLowerCase())).filter(Boolean));
  const ranked=all.filter(x=>!baseIds.has(x.id)).map(x=>{
    let score=0;
    if((baseItems||[]).some(b=>b.category&&x.category&&b.category.toLowerCase()===x.category.toLowerCase()))score+=6;
    itemWords(x).forEach(w=>{if(baseWords.has(w))score+=1});
    (x.keywords||[]).forEach(k=>{if(baseKeywords.has(String(k).trim().toLowerCase()))score+=8});
    if(x.status==='featured')score+=2;if(x.status==='new')score+=1;
    return {x,score};
  }).sort((a,b)=>b.score-a.score);
  const matched=ranked.filter(v=>v.score>0).slice(0,limit).map(v=>v.x);
  if(matched.length>=limit)return matched;
  const used=new Set(matched.map(x=>x.id));
  const fallback=ranked.filter(v=>!used.has(v.x.id)).sort((a,b)=>{
    const rank=s=>s==='featured'?3:s==='new'?2:s==='sale'?1:0;
    return rank(b.x.status)-rank(a.x.status);
  }).slice(0,limit-matched.length).map(v=>v.x);
  return [...matched,...fallback];
}
function recommendationCards(items){
  return items.map(i=>card(i).replace('product-card reveal','product-card visible')).join('');
}
window.recommendItems=recommendItems;window.recommendationCards=recommendationCards;

window.addToCart=addToCart;window.removeFromCart=removeFromCart;window.clearCart=clearCart;window.cartIds=cartIds;window.parseCartEntry=parseCartEntry;window.cartEntry=cartEntry;

function renderHomeQuickCards(settings){
  if(document.body?.dataset?.page!=='home')return;
  const names={courses:'الدورات',products:'المنتجات',consultations:'الاستشارات'};
  const images=settings?.home_card_images||{};
  document.querySelectorAll('.quick-card').forEach(card=>{
    let key=card.dataset.quickCard;
    if(!key){
      const href=card.getAttribute('href')||'';
      key=href.includes('courses')?'courses':href.includes('products')?'products':'consultations';
      card.dataset.quickCard=key;
    }
    const title=names[key]||'القسم';
    const image=String(images[key]||'').trim();
    card.classList.add('quick-card-v2','visible');card.classList.remove('reveal');
    card.innerHTML=(image?'<img class="quick-bg-image-v2" src="'+image.replace(/"/g,'&quot;')+'" alt="">':'<div class="quick-pattern-v2 quick-pattern-v2-'+key+'"></div>')+
      '<div class="quick-title-v2">'+title+'</div>';
  });
}
function setupHomeQuickCards(){
  if(document.body?.dataset?.page!=='home')return;
  window.storefrontReady?.then(renderHomeQuickCards);
  window.storefrontRefresh?.then(fresh=>{if(fresh)renderHomeQuickCards(fresh)});
}
function renderHomeCatalogSections(){
  if(document.body?.dataset?.page!=='home')return;
  const productSection=document.getElementById('homeProductsSection');
  const courseSection=document.getElementById('homeCoursesSection');
  const productGrid=document.getElementById('homeProductsGrid');
  const courseGrid=document.getElementById('homeCoursesGrid');
  if(!productGrid||!courseGrid)return;
  const products=(W?.products||[]).filter(x=>x.active&&isItemSectionVisible(x)).slice(0,3);
  const courses=(W?.courses||[]).filter(x=>x.active&&isItemSectionVisible(x)).slice(0,3);
  if(productSection)productSection.hidden=window.storeVisibility.show_products===false||!products.length;
  if(courseSection)courseSection.hidden=window.storeVisibility.show_courses===false||!courses.length;
  productGrid.innerHTML=products.map(x=>card(x).replace('product-card reveal','product-card visible')).join('');
  courseGrid.innerHTML=courses.map(x=>card(x).replace('product-card reveal','product-card visible')).join('');
}
function setupHomeCatalogSections(){
  if(document.body?.dataset?.page!=='home')return;
  Promise.all([window.catalogReady,window.storefrontReady]).then(()=>renderHomeCatalogSections());
  window.catalogRefresh?.then(()=>renderHomeCatalogSections());
  window.storefrontRefresh?.then(()=>renderHomeCatalogSections());
  window.addEventListener('warsha:currency-ready',renderHomeCatalogSections,{once:true});
}
function setupAmbientElectronics(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(matchMedia('(pointer:coarse)').matches||innerWidth<700){document.documentElement.classList.add('fx-mobile');return;}
  const root=document.documentElement;
  if(matchMedia('(pointer:fine)').matches){
    let x=innerWidth/2,y=innerHeight/2,raf=0;
    const paint=()=>{root.style.setProperty('--fx-x',x+'px');root.style.setProperty('--fx-y',y+'px');raf=0};
    addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;if(!raf)raf=requestAnimationFrame(paint)},{passive:true});
    addEventListener('pointerenter',()=>root.classList.add('fx-active'),{passive:true});
    addEventListener('pointerleave',()=>root.classList.remove('fx-active'),{passive:true});
    root.classList.add('fx-active');
    paint();
  }else{
    root.classList.add('fx-mobile');
  }
}

function setup(){applyWarshaLogo();setupWarshaLoader();setupHomeQuickCards();setupHomeCatalogSections();setupAmbientElectronics();const page=document.body.dataset.page;$$('.nav-links a').forEach(a=>a.classList.toggle('active',a.dataset.page===page));const mb=$('#menuButton'),nav=$('#navLinks');if(mb)mb.onclick=()=>nav.classList.toggle('open');if(nav)nav.querySelectorAll('a').forEach(a=>a.onclick=()=>nav.classList.remove('open'));const cb=$('#currencyToggle');if(cb)cb.remove();const actions=$('.nav-actions');if(actions&&!actions.querySelector('.cart-nav'))actions.insertAdjacentHTML('afterbegin',`<a class="currency-btn cart-nav" href="cart.html" aria-label="السلة">🛒<span class="cart-count" data-cart-count></span></a>`);updateCartCount();reveal()}
function reveal(){const els=[...document.querySelectorAll('.reveal:not(.visible)')];if(!els.length)return;if(!('IntersectionObserver' in window)||matchMedia('(pointer:coarse)').matches||innerWidth<700){els.forEach(x=>x.classList.add('visible'));return}const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');o.unobserve(e.target)}}),{threshold:.05});els.forEach(x=>o.observe(x))}window.reveal=reveal;
function card(i){const disabled=['sold','coming'].includes(i.status),main=imageUrl(i.images?.[0]);return`<article class="product-card reveal" onclick="location.href='product.html?id=${encodeURIComponent(i.id)}&type=${i.type}'"><div class="product-media">${i.statusText?`<span class="${statusClass(i.status)}">${i.statusText}</span>`:''}${main?`<img class="product-main-image" src="${main}" alt="${i.title}">`:`<div class="electronics-art"><span class="chip">${i.category.toUpperCase()}</span><i class="wire w1"></i><i class="wire w2"></i><i class="wire w3"></i></div>`}</div><div class="product-body"><span class="category">${i.category}</span><h3>${i.title}</h3><p>${i.short}</p><div class="price-row"><div>${i.status==='sale'&&i.old_price_iqd?`<small class="old-price">${money(i,true)}</small>`:''}<strong class="${i.status==='sale'?'sale-current-price':''}">${i.status==='coming'?'':(i.status==='free'?'<span class="free-price"><b>مجاني</b></span>':money(i))}</strong></div><span class="view-btn">${disabled?'عرض التفاصيل':'التفاصيل ←'}</span></div></div></article>`}
async function renderListing(type,target,searchSelector){
  await window.catalogReady;await window.storefrontReady;
  if((type==='course'&&!window.storeVisibility.show_courses)||(type==='product'&&!window.storeVisibility.show_products)){location.replace('index.html');return}
  const paint=()=>{
    const base=type==='course'?(W.courses||[]):type==='product'?(W.products||[]):allCatalogItems().filter(x=>x.type===type);
    const qv=String(searchSelector?document.querySelector(searchSelector)?.value||'':'').trim().toLowerCase();
    const list=base.filter(x=>x.active&&isItemSectionVisible(x)).filter(x=>!qv||[x.title,x.category,x.short,x.description,...(x.keywords||[])].filter(Boolean).join(' ').toLowerCase().includes(qv));
    const el=$(target);if(el)el.innerHTML=list.length?list.map(card).join(''):'<div class="empty-card"><h3>لا توجد نتائج</h3><p>جرّب كلمة بحث مختلفة.</p></div>';
    reveal();
  };
  paint();
  if(searchSelector){const input=document.querySelector(searchSelector);if(input)input.addEventListener('input',paint)}
  window.catalogRefresh?.then(()=>paint());
  window.addEventListener('warsha:currency-ready',paint,{once:true});
}
document.addEventListener('DOMContentLoaded',setup);