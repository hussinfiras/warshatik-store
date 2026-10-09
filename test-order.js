(()=>{
  const $q=s=>document.querySelector(s);
  async function loadTestOrderItems(){
    const sel=$q('#testOrderItem');
    const status=$q('#testOrderStatus');
    if(!sel)return;
    try{
      sel.disabled=true;
      sel.innerHTML='<option value="">جاري تحميل المنتجات...</option>';
      const r=await fetch((settings?.apiBase||'https://warshatik.com/api').replace(/\/$/,'')+'/catalog');
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||('HTTP '+r.status));
      const all=[...(d.products||[]),...(d.courses||[])].filter(x=>x&&x.active!==false&&!['sold','coming'].includes(x.status));
      sel.innerHTML='<option value="">اختر منتجاً</option>'+all.map(x=>{
        const files=Array.isArray(x.files)?x.files:[];
        const note=files.length?'':' — بدون ملف مرفوع';
        return `<option value="${String(x.id).replace(/"/g,'&quot;')}">${x.title}${note}</option>`;
      }).join('');
      if(!all.length){
        sel.innerHTML='<option value="">لا توجد منتجات متاحة</option>';
        if(status)status.textContent='لم يتم العثور على منتجات قابلة للشراء في الكتالوج.';
      }
    }catch(err){
      sel.innerHTML='<option value="">تعذر تحميل المنتجات</option>';
      if(status)status.textContent='❌ تعذر تحميل المنتجات: '+(err?.message||'خطأ غير معروف');
    }finally{
      sel.disabled=false;
    }
  }

  async function createPaidTestOrder(){
    const email=$q('#testOrderEmail')?.value.trim();
    const itemId=$q('#testOrderItem')?.value;
    const currency=$q('#testOrderCurrency')?.value||'IQD';
    const status=$q('#testOrderStatus');
    const btn=$q('#createPaidTestOrder');
    if(!status||!btn)return;
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
    }finally{
      btn.disabled=false;
    }
  }

  function init(){
    const btn=$q('#createPaidTestOrder');
    if(btn)btn.onclick=createPaidTestOrder;
    loadTestOrderItems();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();