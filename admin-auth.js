(()=>{
const API_BASES=['https://warshatik-store2.hussainfiras23.workers.dev/api','https://warshatik.com/api'];
const API=API_BASES[0];
const $=s=>document.querySelector(s);
const login=$('#adminLogin'),emailStep=$('#adminLoginEmailStep'),codeStep=$('#adminLoginCodeStep');
const emailInput=$('#adminLoginEmail'),passwordInput=$('#adminLoginPassword'),codeInput=$('#adminLoginCode'),status=$('#adminLoginStatus');
const sendBtn=$('#adminSendCode'),verifyBtn=$('#adminVerifyCode');
const lastEmail=localStorage.getItem('wt_admin_email')||'';
if(emailInput&&lastEmail)emailInput.value=lastEmail;

function readSettings(){try{return JSON.parse(localStorage.getItem('wt_settings')||'{}')}catch{return {}}}
function saveToken(token){
  const s=readSettings();
  s.apiBase=API;
  s.adminKey=token;
  localStorage.setItem('wt_settings',JSON.stringify(s));
}
function getToken(){return String(readSettings().adminKey||'').trim()}
function clearToken(){
  const s=readSettings();
  s.adminKey='';
  localStorage.setItem('wt_settings',JSON.stringify(s));
}
async function call(path,opt={}){
  const headers={...(opt.headers||{})};
  if(opt.body&&!headers['content-type'])headers['content-type']='application/json';
  const token=getToken();if(token)headers['x-admin-key']=token;
  let lastErr=null;
  for(const base of API_BASES){
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),15000);
    try{
      const r=await fetch(base+path,{...opt,headers,signal:ctrl.signal,cache:'no-store'});
      let d={};try{d=await r.json()}catch{}
      if(!r.ok)throw new Error(d.error||('HTTP '+r.status));
      return d;
    }catch(e){
      lastErr=e;
      if(e.message==='بيانات الدخول غير صحيحة.'||e.message==='رمز التحقق غير صحيح أو منتهي.'||e.message.startsWith('ADMIN_')||e.message.startsWith('محاولات كثيرة'))throw e;
    }finally{clearTimeout(timer)}
  }
  if(lastErr?.name==='AbortError')throw new Error('انتهت مهلة الاتصال. حاول مرة أخرى.');
  throw new Error(lastErr?.message||'تعذر الاتصال بالخادم');
}
function setStatus(msg,ok=false){if(status){status.textContent=msg||'';status.style.color=ok?'#147a4d':'#655d6d'}}
function showLogin(){
  document.body.classList.add('admin-auth-pending');
  if(login)login.hidden=false;
}
function showCode(){
  if(emailStep)emailStep.hidden=true;
  if(codeStep)codeStep.hidden=false;
  setTimeout(()=>codeInput?.focus(),40);
}
function showEmail(){
  if(emailStep)emailStep.hidden=false;
  if(codeStep)codeStep.hidden=true;
  if(codeInput)codeInput.value='';
  setStatus('');
  setTimeout(()=>emailInput?.focus(),40);
}
function loadScript(src){
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('تعذر تحميل لوحة التحكم'));
    document.body.appendChild(s);
  });
}
async function startAdmin(){
  if(login)login.hidden=true;
  document.body.classList.remove('admin-auth-pending');
  const scripts=[
    'app.js?v=20261009j',
    'domain-migrate.js?v=20261009j',
    'store-tools.js?v=20261009j',
    'section-manager.js?v=20261009j',
    'consultation-admin.js?v=20261009j',
    'admin-ui-guard.js?v=20261009j',
    'customer-admin.js?v=20261009j',
    'test-order.js?v=20261009j'
  ];
  try{
    for(const src of scripts)await loadScript(src);
    $('#adminLogout')?.addEventListener('click',async()=>{
      const token=getToken();
      try{if(token)await call('/admin/auth/logout',{method:'POST'})}catch{}
      clearToken();location.reload();
    });
  }catch(e){
    showLogin();setStatus('❌ '+e.message);
  }
}
sendBtn?.addEventListener('click',async()=>{
  const email=String(emailInput?.value||'').trim().toLowerCase(),password=String(passwordInput?.value||'');
  if(!email||!password){setStatus('اكتب البريد الإلكتروني وكلمة المرور أولاً.');return}
  sendBtn.disabled=true;setStatus('جاري إرسال رمز الدخول...');
  try{
    const d=await call('/admin/auth/request-code',{method:'POST',body:JSON.stringify({email,password})});
    localStorage.setItem('wt_admin_email',email);
    if(passwordInput)passwordInput.value='';
    setStatus(d.message||'تم إرسال الرمز.',true);
    showCode();
  }catch(e){setStatus('❌ '+e.message)}
  finally{sendBtn.disabled=false}
});
verifyBtn?.addEventListener('click',async()=>{
  const email=String(emailInput?.value||localStorage.getItem('wt_admin_email')||'').trim().toLowerCase();
  const code=String(codeInput?.value||'').replace(/\D/g,'').slice(0,6);
  if(code.length!==6){setStatus('أدخل رمز التحقق المكوّن من 6 أرقام.');return}
  verifyBtn.disabled=true;setStatus('جاري التحقق...');
  try{
    const d=await call('/admin/auth/verify-code',{method:'POST',body:JSON.stringify({email,code})});
    saveToken(d.token);
    setStatus('تم تسجيل الدخول ✓',true);
    await startAdmin();
  }catch(e){setStatus('❌ '+e.message)}
  finally{verifyBtn.disabled=false}
});
$('#adminChangeEmail')?.addEventListener('click',showEmail);
codeInput?.addEventListener('input',()=>{codeInput.value=codeInput.value.replace(/\D/g,'').slice(0,6)});
codeInput?.addEventListener('keydown',e=>{if(e.key==='Enter')verifyBtn?.click()});
emailInput?.addEventListener('keydown',e=>{if(e.key==='Enter')passwordInput?.focus()});
passwordInput?.addEventListener('keydown',e=>{if(e.key==='Enter')sendBtn?.click()});

(async()=>{
  showLogin();
  const token=getToken();
  if(!token){showEmail();return}
  setStatus('جاري التحقق من الجلسة...');
  try{
    await call('/admin/auth/session',{method:'GET'});
    await startAdmin();
  }catch{
    clearToken();
    showEmail();
  }
})();
})();