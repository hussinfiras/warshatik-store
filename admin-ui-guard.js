(()=>{
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  function bindNav(){
    qa('.nav').forEach(b=>{
      b.onclick=()=>{
        qa('.nav').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        qa('.view').forEach(v=>v.classList.remove('active'));
        const view=q('#'+b.dataset.view);if(view)view.classList.add('active');
        const title=q('#pageTitle');if(title)title.textContent=b.textContent.trim();
      };
    });
  }
  function bindEditors(){
    const safeOpen=type=>{
      try{
        if(typeof window.openEditor==='function')window.openEditor(type);
        else if(typeof openEditor==='function')openEditor(type);
        else throw new Error('محرر المنتجات غير جاهز');
      }catch(e){console.error(e);alert('تعذر فتح محرر المنتج. حدّث الصفحة وحاول مرة أخرى.');}
    };
    const qaBtn=q('#quickAdd'),p=q('#addProduct'),c=q('#addCourse');
    if(qaBtn)qaBtn.onclick=()=>safeOpen('product');
    if(p)p.onclick=()=>safeOpen('product');
    if(c)c.onclick=()=>safeOpen('course');
  }
  function init(){bindNav();bindEditors()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();