(()=>{try{
  if(typeof settings!=='undefined'&&!settings.apiBase){
    settings.apiBase='https://warshatik-store2.hussainfiras23.workers.dev/api';
    localStorage.setItem('wt_settings',JSON.stringify(settings));
  }
  const input=document.querySelector('#apiBase');
  if(input&&typeof settings!=='undefined')input.value=settings.apiBase||'https://warshatik-store2.hussainfiras23.workers.dev/api';
}catch(e){console.warn('API setup skipped',e)}})();