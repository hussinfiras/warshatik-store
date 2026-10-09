(()=>{
const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const modal=q('#ticketModal'),result=q('#ticketResult'),input=q('#consultTicketCode'),paymentBox=q('#paymentStepContent');
let selectedType='individual';
const typeLabel=()=>selectedType==='supervision'?'باقة الإشراف والمتابعة':'استشارة فردية';
const ticketMoney=t=>currency()==='USD'
  ?'$'+Number(t.amount_usd||0).toFixed(Number(t.amount_usd||0)%1?2:0)
  :Number(t.amount_iqd||0).toLocaleString('en-US')+' د.ع';

function setStep(step){
  qa('[data-step-indicator]').forEach(el=>el.classList.toggle('active',el.dataset.stepIndicator===String(step)));
  qa('[data-step-panel]').forEach(el=>el.classList.toggle('active',el.dataset.stepPanel===String(step)));
}
function buildContactMessage(){
  const details=String(q('#consultRequestDetails')?.value||'').trim();
  return 'مرحباً، أريد حجز تذكرة '+typeLabel()+'.\n\nالتفاصيل التي أحتاج المساعدة بها:\n'+(details||'[اكتب هنا بالتحديد ما تحتاجه في الاستشارة]');
}
qa('.consult-book-btn').forEach(btn=>btn.addEventListener('click',()=>{
  selectedType=btn.dataset.consultType||'individual';
  modal.hidden=false;setStep(1);q('#consultRequestDetails')?.focus();
}));
q('#ticketClose')?.addEventListener('click',()=>{modal.hidden=true;result.innerHTML='';input.value='';setStep(1)});
modal?.addEventListener('click',e=>{if(e.target===modal){modal.hidden=true;result.innerHTML='';setStep(1)}});

q('#whatsappConsultLink')?.addEventListener('click',()=>{
  const msg=buildContactMessage();
  window.open('https://wa.me/9647867419185?text='+encodeURIComponent(msg),'_blank','noopener');
  setStep(2);
});
q('#goToTicketStep')?.addEventListener('click',()=>setStep(2));
q('#backToExplainStep')?.addEventListener('click',()=>setStep(1));
q('#backToTicketStep')?.addEventListener('click',()=>setStep(2));

q('#validateConsultTicket')?.addEventListener('click',async()=>{
  const code=String(input.value||'').replace(/\D/g,'').slice(0,10);input.value=code;
  if(code.length!==10){result.innerHTML='<div class="ticket-error">أدخل رمزاً مكوّناً من 10 أرقام.</div>';return}
  const btn=q('#validateConsultTicket');btn.disabled=true;result.innerHTML='<p>جاري التحقق...</p>';
  try{
    const r=await fetch('/api/consultations/validate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code})});
    const d=await r.json();if(!r.ok)throw new Error(d.error||'رمز غير صحيح');
    const t=d.ticket;
    if(t.status==='ended'){result.innerHTML='<div class="ticket-error">انتهت الجلسة، حاول مرة أخرى.</div>';return}
    if(t.status==='cancelled'){result.innerHTML='<div class="ticket-error">هذه التذكرة ملغاة.</div>';return}
    const paid=t.status==='paid'||t.status==='completed';
    if(paid){
      paymentBox.innerHTML=`<div class="ticket-receipt"><strong>إيصال الاستشارة</strong><p><b>الاسم:</b> ${t.customer_name}</p><p><b>رمز التذكرة:</b> ${t.code}</p><p><b>المبلغ:</b> ${ticketMoney(t)}</p><p><b>الحالة:</b> مدفوع ✓</p>${t.paid_at?`<p><b>تاريخ الدفع:</b> ${t.paid_at}</p>`:''}<p>سيتم التواصل معك لتأكيد التفاصيل.</p></div>`;
      setStep(3);return;
    }
    result.innerHTML=`<div class="ticket-valid"><strong>✓ التذكرة صحيحة</strong><p><b>الاسم:</b> ${t.customer_name}</p><p><b>التاريخ:</b> ${t.scheduled_date}</p><p><b>المبلغ:</b> ${ticketMoney(t)}</p></div>`;
    paymentBox.innerHTML=`<div class="ticket-valid"><strong>التذكرة جاهزة للدفع</strong><p>${t.customer_name}</p><p>${ticketMoney(t)}</p><button class="btn btn-primary" type="button" id="startConsultPayment">المتابعة إلى الدفع</button><p class="hint">سيتم تحويلك الآن إلى بوابة Wayl لإكمال الدفع بأمان.</p></div>`;
    setStep(3);
    q('#startConsultPayment')?.addEventListener('click',async()=>{
      const payBtn=q('#startConsultPayment');payBtn.disabled=true;
      try{
        const pr=await fetch('/api/consultations/payment-start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code})});
        const pd=await pr.json();if(!pr.ok)throw new Error(pd.error||'تعذر بدء الدفع');
        if(pd.paid){location.href='consultations.html?wayl_consult='+encodeURIComponent(code);return}
        if(pd.url){location.href=pd.url;return}
        paymentBox.insertAdjacentHTML('beforeend','<div class="ticket-payment-note">تعذر استلام رابط الدفع من Wayl.</div>');
      }catch(e){paymentBox.insertAdjacentHTML('beforeend','<div class="ticket-error">'+e.message+'</div>')}
      finally{payBtn.disabled=false}
    });
  }catch(e){result.innerHTML='<div class="ticket-error">'+e.message+'</div>'}
  finally{btn.disabled=false}
});
input?.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,10)});
async function handleWaylConsultReturn(){const code=new URLSearchParams(location.search).get('wayl_consult');if(!code)return;modal.hidden=false;setStep(3);paymentBox.innerHTML='<div class="ticket-valid"><strong>جاري التحقق من الدفع...</strong></div>';try{const r=await fetch('/api/consultations/payment-status?code='+encodeURIComponent(code),{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'تعذر التحقق من الدفع');if(d.paid){const t=d.ticket||{};paymentBox.innerHTML=`<div class="ticket-receipt"><strong>تم الدفع بنجاح ✓</strong><p><b>الاسم:</b> ${t.customer_name||''}</p><p><b>رمز التذكرة:</b> ${code}</p><p><b>المبلغ:</b> ${ticketMoney(t)}</p><p>سيتم التواصل معك لتأكيد تفاصيل الاستشارة.</p></div>`}else{paymentBox.innerHTML=`<div class="ticket-valid"><strong>الدفع لم يكتمل بعد</strong><p>حالة Wayl: ${d.wayl_status||d.status||'قيد المعالجة'}</p><button class="btn btn-primary" onclick="location.reload()">تحقق مرة أخرى</button></div>`}}catch(e){paymentBox.innerHTML='<div class="ticket-error">'+e.message+'</div>'}}
handleWaylConsultReturn();
})();