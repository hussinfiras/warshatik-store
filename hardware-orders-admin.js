(()=>{
const btn=document.getElementById('loadHardwareOrders'),target=document.getElementById('hardwareOrdersTable');
if(!btn||!target)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function load(){
  if(typeof window.adminBridge!=='function'){target.textContent='افتح لوحة التحكم وسجل الدخول أولاً.';return}
  btn.disabled=true;target.textContent='جاري تحميل طلبات الهاردوير...';
  try{
    const d=await window.adminBridge('hardware-orders',{});
    target.innerHTML='<table style="width:100%;border-collapse:collapse"><thead><tr><th>رقم الطلب</th><th>الاسم والبريد</th><th>التوصيل</th><th>المبلغ</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>'+((d.orders||[]).map(o=>'<tr><td>'+esc(o.id)+'</td><td>'+esc(o.customer_name)+'<div>'+esc(o.email)+'</div></td><td>'+esc(o.province)+'، '+esc(o.address)+'<div>'+esc(o.phone)+'</div></td><td>'+Number(o.total||0).toLocaleString('en-US')+' د.ع</td><td>'+esc(o.payment_status)+'</td><td>'+(o.payment_status==='cod_pending'?'<button type="button" data-confirm-cod="'+esc(o.id)+'">تأكيد استلام النقد وإرسال الإيصال</button>':'مدفوع')+'</td></tr>').join('')||'<tr><td colspan="6">لا توجد طلبات هاردوير بعد.</td></tr>')+'</tbody></table>';
  }catch(e){target.textContent='تعذر تحميل الطلبات: '+e.message}
  finally{btn.disabled=false}
}
btn.onclick=load;
target.addEventListener('click',async event=>{
  const b=event.target.closest('[data-confirm-cod]');if(!b)return;
  if(!confirm('هل استلمت المبلغ نقداً بالفعل؟ سيتم تسجيل الطلب كمدفوع وإرسال إيصال إلى البريد.'))return;
  b.disabled=true;
  try{
    const d=await window.adminBridge('hardware-confirm-cash',{order_id:b.dataset.confirmCod});
    alert(d.email_sent?'تم تأكيد الدفع وإرسال رسالة التأكيد.':'تم تأكيد استلام النقد ولكن فشل البريد: '+(d.email_reason||'تحقق من إعدادات البريد'));
    await load();
  }catch(e){alert(e.message);b.disabled=false}
});
})();