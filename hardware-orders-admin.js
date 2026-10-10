(()=>{
const section=document.getElementById('hardwareCodAdmin'),target=document.getElementById('hardwareOrdersTable'),refresh=document.getElementById('loadHardwareOrders'),search=document.getElementById('searchHardwareOrders');
if(!section||!target||!refresh)return;
// Keep the hardware view a direct child of main; malformed legacy section nesting can hide it.
const main=document.querySelector('.app main');
if(main&&section.parentElement!==main)main.appendChild(section);
const nav=document.querySelector('.nav[data-view="hardwareCodAdmin"]');
nav?.addEventListener('click',()=>{
  requestAnimationFrame(()=>{
    section.classList.add('active');
    section.style.display='block';
    section.style.visibility='visible';
    if(!target.textContent.trim())load();
  });
});

const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
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

let orders=[];
function render(){
  const q=String(search?.value||'').trim().toLowerCase();
  const list=orders.filter(o=>[o.id,o.customer_name,o.email,o.province,o.address,o.phone,o.payment_status].some(x=>String(x||'').toLowerCase().includes(q)));
  target.innerHTML='<div style="margin:10px 0">عدد الطلبات: '+list.length+'</div><table style="width:100%;border-collapse:collapse;min-width:1000px"><thead><tr><th>رقم الطلب</th><th>العميل</th><th>التوصيل</th><th>المبلغ</th><th>الحالة</th><th>إدارة الطلب</th></tr></thead><tbody>'+ (list.map(o=>{
    const sent=Number(o.delivery_email_sent||0)>0,processing=o.delivery_email_last_error==='SENDING';
    let actions=o.payment_status==='cod_pending'?'<button data-action="confirm" data-id="'+esc(o.id)+'">تأكيد استلام النقد</button>':'';
    if(o.payment_status==='paid')actions+=(sent?'<span style="color:#19875d">البريد مقبول ✓</span> ':processing?'<span>جاري الإرسال...</span> ':'<span>البريد لم يرسل</span> ')+(processing?'':'<button data-action="resend" data-id="'+esc(o.id)+'">إعادة إرسال البريد والملفات</button>');
    actions+=' <button data-action="edit" data-id="'+esc(o.id)+'">تعديل</button> <button data-action="archive" data-id="'+esc(o.id)+'">حذف</button>';
    return '<tr style="border-top:1px solid #eee"><td>'+esc(o.id)+'</td><td>'+esc(o.customer_name)+'<div>'+esc(o.email)+'</div></td><td>'+esc(o.province)+' - '+esc(o.address)+'<div>'+esc(o.phone)+'</div></td><td>'+Number(o.total||0).toLocaleString('en-US')+' د.ع</td><td>'+esc(o.payment_status)+'</td><td>'+actions+'</td></tr>';
  }).join('')||'<tr><td colspan="6">لا توجد طلبات مطابقة.</td></tr>')+'</tbody></table>';
}
async function load(){
 refresh.disabled=true;target.textContent='جاري تحميل طلبات الهاردوير...';
 try{const d=await hardwareApi('/admin/hardware-orders');orders=d.orders||[];render()}
 catch(e){target.textContent='تعذر تحميل الطلبات: '+e.message}
 finally{refresh.disabled=false}
}
refresh.onclick=load;search?.addEventListener('input',render);
target.addEventListener('click',async ev=>{
 const btn=ev.target.closest('button[data-action]');if(!btn)return;
 const id=btn.dataset.id,action=btn.dataset.action,o=orders.find(x=>x.id===id);if(!o)return;
 if(action==='edit'){
   const form=document.getElementById('hardwareEditForm');
   for(const [field,val] of Object.entries({order_id:o.id,name:o.customer_name,email:o.email,province:o.province,address:o.address,phone:o.phone,phone2:o.phone2,notes:o.notes})){const input=form.elements.namedItem(field);if(input)input.value=val||''}
   document.getElementById('hardwareEditPanel').hidden=false;
   document.getElementById('hardwareEditPanel').scrollIntoView({behavior:'smooth',block:'center'});
   return;
 }
 if(action==='archive'&&!confirm('إخفاء هذا الطلب من القائمة؟ سيتم الاحتفاظ بسجل الدفع لأغراض المحاسبة.'))return;
 if(action==='confirm'&&!confirm('هل استلمت المبلغ نقداً بالفعل؟'))return;
 if(action==='resend'&&!confirm('إعادة إرسال بريد جديد يتضمن ملفات المنتج إلى '+o.email+'؟'))return;
 btn.disabled=true;
 try{
   const endpoint=action==='archive'?'/admin/hardware-delete':'/admin/hardware-confirm-cash';
   const d=await hardwareApi(endpoint,{order_id:id,...(action==='resend'?{resend:true}:{})});
   if(action==='resend'||action==='confirm')alert(d.email_processing?'تم إرسال طلب البريد إلى الخادم. حدث القائمة للتحقق من النتيجة.':d.email_sent?'سبق قبول الرسالة من مزود البريد.':'تم تحديث الطلب.');
   await load();
 }catch(e){alert(e.message);btn.disabled=false}
});
const form=document.getElementById('hardwareEditForm');
document.getElementById('hardwareCancelEdit')?.addEventListener('click',()=>document.getElementById('hardwareEditPanel').hidden=true);
form?.addEventListener('submit',async ev=>{
 ev.preventDefault();const data=Object.fromEntries(new FormData(form).entries());
 const b=form.querySelector('button[type="submit"]');b.disabled=true;
 try{await hardwareApi('/admin/hardware-update',data);document.getElementById('hardwareEditPanel').hidden=true;await load()}
 catch(e){alert(e.message)}finally{b.disabled=false}
});
})();