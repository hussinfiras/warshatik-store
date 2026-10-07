(()=>{
const q=s=>document.querySelector(s);
const modal=q('#ticketModal'),result=q('#ticketResult'),input=q('#consultTicketCode');
qAll('.consult-book-btn').forEach?.(()=>{});
function qAll(s){return [...document.querySelectorAll(s)]}
qAll('.consult-book-btn').forEach(btn=>btn.addEventListener('click',()=>{modal.hidden=false;input.focus()}));
q('#ticketClose')?.addEventListener('click',()=>{modal.hidden=true;result.innerHTML='';input.value=''});
modal?.addEventListener('click',e=>{if(e.target===modal){modal.hidden=true;result.innerHTML=''}});
q('#validateConsultTicket')?.addEventListener('click',async()=>{
  const code=String(input.value||'').replace(/\D/g,'').slice(0,10);input.value=code;
  if(code.length!==10){result.innerHTML='<div class="ticket-error">أدخل رمزاً مكوّناً من 10 أرقام.</div>';return}
  const btn=q('#validateConsultTicket');btn.disabled=true;result.innerHTML='<p>جاري التحقق...</p>';
  try{
    const r=await fetch('/api/consultations/validate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code})});
    const d=await r.json();if(!r.ok)throw new Error(d.error||'رمز غير صحيح');
    const t=d.ticket;
    const paid=t.status==='paid'||t.status==='completed';
    result.innerHTML=`<div class="ticket-valid">
      <strong>✓ التذكرة صحيحة</strong>
      <p><b>الاسم:</b> ${t.customer_name}</p>
      <p><b>التاريخ:</b> ${t.scheduled_date}</p>
      <p><b>المبلغ:</b> ${Number(t.amount_iqd||0).toLocaleString('en-US')} د.ع</p>
      ${paid?`<div class="ticket-receipt"><strong>إيصال الاستشارة</strong><p>رمز التذكرة: ${t.code}</p><p>الحالة: مدفوع ✓</p>${t.paid_at?`<p>تاريخ الدفع: ${t.paid_at}</p>`:''}<p>سيتم التواصل معك لتأكيد التفاصيل.</p></div>`:`<button class="btn btn-primary" type="button" id="startConsultPayment">المتابعة إلى الدفع</button><p class="hint">بعد الدفع ستتحول حالة التذكرة إلى مدفوع ويظهر الإيصال هنا.</p>`}
    </div>`;
    q('#startConsultPayment')?.addEventListener('click',async()=>{
      const payBtn=q('#startConsultPayment');payBtn.disabled=true;
      try{
        const pr=await fetch('/api/consultations/payment-start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code})});
        const pd=await pr.json();if(!pr.ok)throw new Error(pd.error||'تعذر بدء الدفع');
        if(pd.paid){location.reload();return}
        result.insertAdjacentHTML('beforeend','<div class="ticket-payment-note">'+pd.message+'</div>');
      }catch(e){result.insertAdjacentHTML('beforeend','<div class="ticket-error">'+e.message+'</div>')}
      finally{payBtn.disabled=false}
    });
  }catch(e){result.innerHTML='<div class="ticket-error">'+e.message+'</div>'}
  finally{btn.disabled=false}
});
input?.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,10)});
})();