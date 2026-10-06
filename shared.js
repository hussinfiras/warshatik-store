let W=window.WARSHA_DATA,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
document.head.insertAdjacentHTML('beforeend',`<style>.product-main-image{width:100%;height:100%;object-fit:cover;display:block}.gallery-photo{width:100%;height:100%;object-fit:contain;background:#f1edf5}.thumb img{width:100%;height:100%;object-fit:cover;border-radius:13px}.thumb.active{outline:2px solid #8055c2;outline-offset:2px}.download-note{margin-top:18px;padding:13px 15px;border-radius:14px;background:#f2ecfa;color:#655570;font-size:13px}.cart-nav{position:relative;min-width:46px}.cart-count{position:absolute;top:-7px;left:-7px;min-width:20px;height:20px;padding:0 5px;border-radius:20px;background:#8055c2;color:#fff;font:800 11px/20px Cairo;text-align:center}</style>`);
const CATALOG_CACHE_KEY='warsha-catalog-v1';
function readCatalogCache(){try{const x=JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY)||'null');return x&&x.products&&x.courses?x:null}catch{return null}}
function saveCatalogCache(data){try{localStorage.setItem(CATALOG_CACHE_KEY,JSON.stringify(data))}catch{}}
const cachedCatalog=readCatalogCache();
if(cachedCatalog)W=window.WARSHA_DATA=cachedCatalog;
window.catalogReady=Promise.resolve(W);
window.catalogRefresh=(async()=>{try{const r=await fetch('/api/catalog',{cache:'default'});if(r.ok){const fresh=await r.json();W=window.WARSHA_DATA=fresh;saveCatalogCache(fresh);window.dispatchEvent(new CustomEvent('warsha:catalog-updated'));return fresh}}catch(e){console.warn('Using cached/fallback catalog',e)}return W})();
const currency=()=>localStorage.getItem('warsha-currency')||'IQD';
function money(i,old=false){const usd=currency()==='USD',n=usd?(old?i.old_price_usd:i.price_usd):(old?i.old_price_iqd:i.price_iqd);if(n==null)return'';return usd?`$${Number(n).toFixed(n%1?2:0)}`:`${Number(n).toLocaleString('en-US')} د.ع`}
function statusClass(s){return`flag flag-${s||'normal'}`}
function imageUrl(x){if(!x)return'';return typeof x==='string'?x:(x.url||'')}
function cartIds(){try{return JSON.parse(localStorage.getItem('warsha-cart')||'[]')}catch{return[]}}
function saveCart(ids){localStorage.setItem('warsha-cart',JSON.stringify([...new Set(ids)]));updateCartCount()}
function updateCartCount(){const c=cartIds().length;$$('[data-cart-count]').forEach(x=>{x.textContent=c;x.style.display=c?'block':'none'})}
function addToCart(id){const all=[...(W?.products||[]),...(W?.courses||[])],item=all.find(x=>x.id===id);if(!item||item.active===false||['sold','coming'].includes(item.status))return false;const ids=cartIds();if(!ids.includes(id))ids.push(id);saveCart(ids);return true}
function removeFromCart(id){saveCart(cartIds().filter(x=>x!==id))}
function clearCart(){saveCart([])}
window.addToCart=addToCart;window.removeFromCart=removeFromCart;window.clearCart=clearCart;window.cartIds=cartIds;

function setupAmbientElectronics(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
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

function setup(){setupAmbientElectronics();const page=document.body.dataset.page;$$('.nav-links a').forEach(a=>a.classList.toggle('active',a.dataset.page===page));const mb=$('#menuButton'),nav=$('#navLinks');if(mb)mb.onclick=()=>nav.classList.toggle('open');if(nav)nav.querySelectorAll('a').forEach(a=>a.onclick=()=>nav.classList.remove('open'));const cb=$('#currencyToggle');if(cb){cb.textContent=currency();cb.onclick=()=>{localStorage.setItem('warsha-currency',currency()==='IQD'?'USD':'IQD');location.reload()}}const actions=$('.nav-actions');if(actions&&!actions.querySelector('.cart-nav'))actions.insertAdjacentHTML('afterbegin',`<a class="currency-btn cart-nav" href="cart.html" aria-label="السلة">🛒<span class="cart-count" data-cart-count></span></a>`);updateCartCount();reveal()}
function reveal(){const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');o.unobserve(e.target)}}),{threshold:.1});$$('.reveal:not(.visible)').forEach(x=>o.observe(x))}
function card(i){const disabled=['sold','coming'].includes(i.status),main=imageUrl(i.images?.[0]);return`<article class="product-card reveal" onclick="location.href='product.html?id=${encodeURIComponent(i.id)}&type=${i.type}'"><div class="product-media">${i.statusText?`<span class="${statusClass(i.status)}">${i.statusText}</span>`:''}${main?`<img class="product-main-image" src="${main}" alt="${i.title}">`:`<div class="electronics-art"><span class="chip">${i.category.toUpperCase()}</span><i class="wire w1"></i><i class="wire w2"></i><i class="wire w3"></i></div>`}</div><div class="product-body"><span class="category">${i.category}</span><h3>${i.title}</h3><p>${i.short}</p><div class="price-row"><div>${i.old_price_iqd?`<small class="old-price">${money(i,true)}</small>`:''}<strong>${money(i)}</strong></div><span class="view-btn">${disabled?'عرض التفاصيل':'التفاصيل ←'}</span></div></div></article>`}
async function renderListing(type,target){await window.catalogReady;const paint=()=>{const list=(type==='course'?W.courses:W.products).filter(x=>x.active);const el=$(target);if(el)el.innerHTML=list.map(card).join('');reveal()};paint();window.addEventListener('warsha:catalog-updated',paint,{once:true})}
document.addEventListener('DOMContentLoaded',setup);