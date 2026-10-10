(()=>{
const btn=document.getElementById('loadHardwareOrders'),target=document.getElementById('hardwareOrdersTable');
if(!btn||!target)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function hardwareApi(path,payload){
  const token=(()=>{try{return JSON.parse(localStorage.getItem('wt_settings')||'{}').adminKey||''}catch{return ''}})();
  if(!token)throw new Error('يرجى تسجيل الدخول مجدداً إلى لوحة التحكم.');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(new DOMException('Connection timed out','TimeoutError')),20000);
  try{
    const response=await fetch('https://warshatik.com/api'+path,{method:payload?'POST':'GET',headers:{'x-admin-key':token,...(payload?{'content-type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{}),signal:controller.signal,cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'HTTP '+response.status);
    return data;
  }catch(e){if(controller.signal.aborted)throw new Error('انتهت مهلة تحميل طلبات الهاردوير. تحقق من استجابة API في Cloudflare.');throw e}
  finally{clearTimeout(timeout)}
}
async function load(){
  btn.disabled=true;target.textContent='جاري تحميل طلبات الهاردوير...';
  try{
    const d=await hardwareApi('/admin/hardware-orders');
    target.innerHTML='<table style="width:100%;border-collapse:collapse"><thead><tr><th>رقم الطلب</th><th>الاسم والبريد</th><th>التوصيل</th><th>المبلغ</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>'+((d.orders||[]).map(o=>'<tr><td>'+esc(o.id)+'</td><td>'+esc(o.customer_name)+'<div>'+esc(o.email)+'</div></td><td>'+esc(o.province)+'، '+esc(o.address)+'<div>'+esc(o.phone)+'</div></td><td>'+Number(o.total||0).toLocaleString('en-US')+' د.ع</td><td>'+esc(o.payment_status)+'</td><td>'+(o.payment_status==='cod_pending'?'<button type="button" data-confirm-cod="'+esc(o.id)+'">تأكيد استلام النقد وإرسال الإيصال</button>':o.delivery_email_sent?'مدفوع — تم إرسال الإيصال ✓':o.delivery_email_last_error==='SENDING'?'مدفوع — جاري إرسال البريد': '<button type="button" data-confirm-cod="'+esc(o.id)+'">إعادة إرسال الإيصال</button>')+'</td></tr>').join('')||'<tr><td colspan="6">لا توجد طلبات هاردوير بعد.</td></tr>')+'</tbody></table>';
  }catch(e){target.textContent='تعذر تحميل الطلبات: '+e.message}
  finally{btn.disabled=false}
}
btn.onclick=load;
target.addEventListener('click',async event=>{
  const b=event.target.closest('[data-confirm-cod]');if(!b)return;
  if(b.textContent.includes('تأكيد استلام')&&!confirm('هل استلمت المبلغ نقداً بالفعل؟ سيتم تسجيل الطلب كمدفوع وإرسال إيصال إلى البريد.'))return;
  b.disabled=true;
  try{
    const d=await hardwareApi('/admin/hardware-confirm-cash',{order_id:b.dataset.confirmCod});
    alert(d.email_sent?'الدفع مؤكد والإيصال مرسل.':d.email_processing?'تم تسجيل استلام المبلغ. يجري إرسال الإيصال بالبريد، ويمكنك تحديث القائمة بعد قليل.':'تم حفظ حالة الطلب.');
    await load();
  }catch(e){alert(e.name==='AbortError'?'انتهت مهلة الاتصال؛ حدّث قائمة الطلبات قبل إعادة المحاولة.':e.message);b.disabled=false}
});
})();