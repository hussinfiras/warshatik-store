(()=>{
const q=s=>document.querySelector(s);
let timer=0;
const money=(n,c)=>c==='USD'?'$'+Number(n||0).toFixed(2):Number(n||0).toLocaleString('en-US')+' د.ع';

function renderCustomers(list){
  const body=q('#customerRows');if(!body)return;
  body.innerHTML=(list||[]).map(c=>`<tr class="customer-row" data-email="${encodeURIComponent(c.email)}">
    <td><strong>${c.customer_name||'—'}</strong></td>
    <td>${c.email}</td>
    <td>${Number(c.purchases||0).toLocaleString('en-US')}</td>
    <td>${Number(c.total_iqd||0).toLocaleString('en-US')} د.ع</td>
    <td>$${Number(c.total_usd||0).toFixed(2)}</td>
    <td>${c.last_purchase?new Date(c.last_purchase).toLocaleDateString('en-GB'):'—'}</td>
  </tr>`).join('')||'<tr><td colspan="6">لا يوجد عملاء حتى الآن.</td></tr>';
  body.querySelectorAll('.customer-row').forEach(row=>row.onclick=()=>loadPurchases(decodeURIComponent(row.dataset.email)));
}
async function loadCustomers(){
  const body=q('#customerRows');if(!body||!window.adminBridge)return;
  const search=(q('#customerSearch')?.value||'').trim();
  body.innerHTML='<tr><td colspan="6">جاري التحميل...</td></tr>';
  try{
    const d=await window.adminBridge('customers',{q:search});
    renderCustomers(d.customers||[]);
  }catch(e){body.innerHTML='<tr><td colspan="6">تعذر تحميل العملاء: '+e.message+'</td></tr>'}
}
function groupPurchases(rows){
  const map=new Map();
  for(const x of rows||[]){
    if(!map.has(x.order_id))map.set(x.order_id,{order_id:x.order_id,currency:x.currency,total:x.total,paid_at:x.paid_at||x.created_at,items:[]});
    map.get(x.order_id).items.push(x);
  }
  return [...map.values()];
}
async function loadPurchases(email){
  const panel=q('#customerDetail'),wrap=q('#customerPurchases');if(!panel||!wrap)return;
  panel.hidden=false;q('#customerDetailEmail').textContent=email;q('#customerDetailName').textContent='مشتريات العميل';
  wrap.innerHTML='<p class="hint">جاري تحميل المشتريات...</p>';
  try{
    const d=await window.adminBridge('customer-purchases',{email});
    const groups=groupPurchases(d.purchases||[]);
    const first=(d.purchases||[])[0];if(first?.customer_name)q('#customerDetailName').textContent=first.customer_name;
    wrap.innerHTML=groups.map(o=>`<div class="purchase-group">
      <h4>طلب ${o.order_id}</h4>
      <p class="hint">${o.paid_at?new Date(o.paid_at).toLocaleString('en-GB',{hour12:false}):'—'} · الإجمالي ${money(o.total,o.currency)}</p>
      ${o.items.map(x=>`<div class="purchase-line"><span>${x.title}</span><strong class="${Number(x.price||0)===0?'free-purchase':''}">${Number(x.price||0)===0?'مجاني':money(x.price,o.currency)}</strong></div>`).join('')}
    </div>`).join('')||'<p class="hint">لا توجد مشتريات مكتملة.</p>';
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){wrap.innerHTML='<p class="hint">تعذر تحميل المشتريات: '+e.message+'</p>'}
}
q('#customerSearch')?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(loadCustomers,220)});
q('#refreshCustomers')?.addEventListener('click',loadCustomers);
q('#closeCustomerDetail')?.addEventListener('click',()=>{q('#customerDetail').hidden=true});
document.querySelector('[data-view="customers"]')?.addEventListener('click',loadCustomers);
window.loadCustomers=loadCustomers;
})();