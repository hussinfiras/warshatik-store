(()=>{
  const $q=s=>document.querySelector(s);
  function availableItems(){
    const all=[...(typeof products!=='undefined'?products:[]),...(typeof courses!=='undefined'?courses:[])];
    return all.filter(x=>x&&x.active!==false&&!['sold','coming'].includes(x.status));
  }
  function renderOptions(){
    const sel=$q('#testOrderItem');
    if(!sel)return;
    const current=sel.value;
    const all=availableItems();
    sel.innerHTML='<option value="">اختر منتجاً</option>'+all.map(x=>{
      const files=Array.isArray(x.files)?x.files:[];
      const note=files.length?'':' — بدون ملف مرفوع';
      return `<option value="${String(x.id).replace(/"/g,'&quot;')}">${x.title}${note}</option>`;
    }).join('');
    if(all.some(x=>x.id===current))sel.value=current;
  }
  async function createPaidTestOrder(){
    const email=$q('#testOrderEmail')?.value.trim();
    const itemId=$q('#testOrderItem')?.value;
    const currency=$q('#testOrderCurrency')?.value||'IQD';
    const status=$q('#testOrderStatus');
    const btn=$q('#createPaidTestOrder');
    if(!email){status.textContent='اكتب بريد المشتري أولاً.';return;}
    if(!itemId){status.textContent='اختر منتجاً أو دورة.';return;}
    if(typeof settings==='undefined'||!settings.adminKey){status.textContent='احفظ Admin API Key أولاً.';return;}
    btn.disabled=true;
    status.textContent='جاري إنشاء الطلب...';
    try{
      const order=await apiCall('/orders/create',{method:'POST',body:JSON.stringify({email,currency,items:[itemId]})});
      status.textContent=`تم إنشاء الطلب ${order.order_id}. جاري تعليمه كمدفوع وإرسال البريد...`;
      const paid=await apiCall('/orders/mark-paid',{method:'POST',body:JSON.stringify({order_id:order.order_id,payment_reference:'ADMIN-TEST'})});
      if(paid.email_sent){
        status.innerHTML=`✅ تم إنشاء طلب اختبار مدفوع: <b>${order.order_id}</b><br>تم إرسال بريد الشراء. افحص Inbox وSpam، ثم جرّب رابط التحميل وبعدها صفحة استرجاع المشتريات.`;
        if(typeof toast==='function')toast('تم إرسال بريد طلب الاختبار');
      }else{
        status.innerHTML=`⚠️ تم إنشاء الطلب وتعليمه كمدفوع: <b>${order.order_id}</b><br>لكن البريد لم يُرسل: ${paid.email_reason||'سبب غير معروف'}`;
      }
    }catch(err){
      status.textContent='❌ '+(err?.message||'فشل إنشاء طلب الاختبار');
    }finally{btn.disabled=false;}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const btn=$q('#createPaidTestOrder');
    if(btn)btn.addEventListener('click',createPaidTestOrder);
    renderOptions();
    let tries=0;
    const timer=setInterval(()=>{renderOptions();if(availableItems().length||++tries>20)clearInterval(timer)},500);
  });
})();