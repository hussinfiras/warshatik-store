(()=>{
const q=s=>document.querySelector(s);
const statusText={issued:'تم الإصدار',payment_pending:'بانتظار الدفع',paid:'مدفوع',completed:'مكتمل',cancelled:'ملغى'};
const typeText={individual:'استشارة فردية',supervision:'إشراف شهري'};
async function loadTickets(){
  const body=q('#consultTicketRows');if(!body||!window.adminBridge)return;
  try{
    const d=await window.adminBridge('list-consultation-tickets');
    body.innerHTML=(d.tickets||[]).map(t=>`<tr>
      <td><strong class="ticket-code">${t.code}</strong></td>
      <td><strong>${t.customer_name}</strong><br><small>${t.contact_method}: ${t.contact_value||'—'}</small></td>
      <td>${typeText[t.consultation_type]||t.consultation_type}<br><small>${Number(t.amount_iqd||0).toLocaleString('en-US')} د.ع</small></td>
      <td>${t.scheduled_date||'—'}</td>
      <td><span class="ticket-status ticket-${t.status}">${statusText[t.status]||t.status}</span></td>
      <td><select class="ticket-status-select" data-code="${t.code}">
        ${['issued','payment_pending','paid','completed','cancelled'].map(s=>`<option value="${s}" ${s===t.status?'selected':''}>${statusText[s]}</option>`).join('')}
      </select></td>
    </tr>`).join('')||'<tr><td colspan="6">لا توجد تذاكر بعد.</td></tr>';
    body.querySelectorAll('.ticket-status-select').forEach(sel=>sel.onchange=async()=>{
      const prev=sel.dataset.prev||'';
      try{await window.adminBridge('set-consultation-ticket-status',{code:sel.dataset.code,status:sel.value});if(typeof toast==='function')toast('تم تحديث حالة التذكرة');loadTickets()}
      catch(e){alert(e.message);if(prev)sel.value=prev}
    });
  }catch(e){body.innerHTML='<tr><td colspan="6">تعذر تحميل التذاكر: '+e.message+'</td></tr>'}
}
q('#newConsultTicket')?.addEventListener('click',()=>{const box=q('#ticketCreateBox');box.hidden=!box.hidden});
q('#generateTicket')?.addEventListener('click',async()=>{
  const btn=q('#generateTicket'),out=q('#ticketGenerated');
  const payload={
    customer_name:q('#ticketCustomerName')?.value.trim(),
    contact_method:q('#ticketContactMethod')?.value,
    contact_value:q('#ticketContactValue')?.value.trim(),
    scheduled_date:String(q('#ticketDate')?.value||'').trim(),
    consultation_type:q('#ticketType')?.value
  };
  const formStatus=q('#ticketFormStatus');
  if(!payload.customer_name){if(formStatus)formStatus.textContent='❌ أدخل اسم العميل.';q('#ticketCustomerName')?.focus();return}
  if(!payload.contact_method){if(formStatus)formStatus.textContent='❌ اختر طريقة التواصل.';q('#ticketContactMethod')?.focus();return}
  if(!payload.scheduled_date){if(formStatus)formStatus.textContent='❌ أدخل التاريخ بصيغة YYYY-MM-DD.';q('#ticketDate')?.focus();return}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(payload.scheduled_date)){if(formStatus)formStatus.textContent='❌ صيغة التاريخ يجب أن تكون مثل 2026-10-10.';q('#ticketDate')?.focus();return}
  if(formStatus)formStatus.textContent='جاري إنشاء التذكرة...';
  btn.disabled=true;
  try{
    const d=await window.adminBridge('create-consultation-ticket',payload),t=d.ticket;
    out.hidden=false;
    out.innerHTML='<strong>رمز التذكرة:</strong><div class="generated-code">'+t.code+'</div><button type="button" class="mini" id="copyTicketCode">نسخ الرمز</button><p class="hint">أرسل هذا الرمز للعميل. عند إدخاله في صفحة الاستشارات سيتم التحقق من التذكرة.</p>';
    q('#copyTicketCode').onclick=async()=>{await navigator.clipboard.writeText(t.code);if(typeof toast==='function')toast('تم نسخ الرمز')};
    q('#ticketCustomerName').value='';q('#ticketContactValue').value='';
    if(formStatus)formStatus.textContent='✅ تم إنشاء التذكرة بنجاح.';
    loadTickets();
  }catch(e){if(formStatus)formStatus.textContent='❌ '+e.message;else alert(e.message)}
  finally{btn.disabled=false}
});
document.addEventListener('DOMContentLoaded',loadTickets);
if(document.readyState!=='loading')loadTickets();
})();