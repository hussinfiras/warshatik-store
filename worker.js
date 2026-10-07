const STATUS={normal:'عادي',new:'جديد',sale:'خصم',sold:'نفد',featured:'مميز',coming:'قريباً'};
let initPromise=null;
const SEED=[
['rfid-attendance','product','نظام RFID للحضور','Arduino',12000,9,15000,11.5,'new','جديد','كود كامل + مخطط توصيل + قائمة مكتبات + ملف شرح.','مشروع متكامل لبناء نظام حضور باستخدام Arduino وقارئ RFID.',['كود Arduino كامل','مخطط التوصيل','قائمة المكتبات','ملف شرح PDF'],[],[],'https://www.youtube.com/',1,10],
['ble-mouse','product','مشروع BLE Mouse','ESP32',15000,11.5,20000,15,'sale','خصم','ESP32 + Joystick للتحكم بالمؤشر لاسلكياً.','مشروع تحكم بالمؤشر عبر Bluetooth باستخدام ESP32 وJoystick.',['كود ESP32','شرح التوصيل','إعداد BLE'],[],[],'https://www.youtube.com/',1,20],
['sensor-guide','product','دليل الحساسات العملي','Guides',10000,7.5,null,null,'normal','عادي','مرجع عربي سريع للحساسات الأكثر استخداماً.','دليل مرتب للحساسات الشائعة مع فكرة العمل والتوصيل.',['شرح مبسط','أمثلة توصيل','أكواد تجريبية'],[],[],'',1,30],
['smart-parking','product','نظام الموقف الذكي','Arduino',9000,7,null,null,'sold','نفد','Servo + LCD + حساسات لموقف سيارات ذكي.','مشروع كامل لموقف ذكي مع عداد أماكن متبقية وبوابة Servo وشاشة LCD.',['كود المشروع','مخطط التوصيل','منطق الدخول والخروج'],[],[],'',1,40],
['esp32-web-dashboard','product','لوحة تحكم ESP32 Web','ESP32',14000,10.5,null,null,'featured','مميز','واجهة ويب للتحكم بالمخارج والحساسات.','مشروع ESP32 بواجهة ويب متجاوبة للتحكم بالمخارج وقراءة الحساسات.',['واجهة متجاوبة','ESP32 AP / Wi-Fi','تحكم لحظي'],[],[],'',1,50],
['arduino-basics','course','أساسيات Arduino من الصفر','Arduino',30000,23,40000,30,'sale','خصم','ابدأ من الأساسيات ووصل للمشاريع العملية.','دورة تطبيقية مرتبة للمبتدئ.',['شرح عربي','تمارين عملية','ملفات كود'],[],[],'https://www.youtube.com/',1,60],
['protocols-course','course','UART • I²C • SPI ببساطة','Electronics',22000,17,null,null,'new','جديد','فهم بروتوكولات الاتصال من خلال أمثلة عملية.','دورة مختصرة توضح الفرق بين UART وI²C وSPI.',['شرح البتات','أمثلة عملية','مقارنة البروتوكولات'],[],[],'https://www.youtube.com/',1,70],
['esp32-wireless','course','ESP32: Wi-Fi و Bluetooth','ESP32',35000,27,null,null,'coming','قريباً','مشاريع لاسلكية ولوحات ويب باستخدام ESP32.','دورة عملية للبدء مع Wi-Fi وBluetooth على ESP32.',['Wi-Fi','BLE','Web Control'],[],[],'',1,80]
];
async function init(db){
  await db.exec(`CREATE TABLE IF NOT EXISTS items(id TEXT PRIMARY KEY,type TEXT NOT NULL,title TEXT NOT NULL,category TEXT NOT NULL,price_iqd REAL NOT NULL,price_usd REAL NOT NULL,old_price_iqd REAL,old_price_usd REAL,status TEXT NOT NULL,status_text TEXT NOT NULL,short TEXT,description TEXT,features TEXT NOT NULL DEFAULT '[]',images TEXT NOT NULL DEFAULT '[]',youtube TEXT,active INTEGER NOT NULL DEFAULT 1,sort_order INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  try{await db.exec(`ALTER TABLE items ADD COLUMN files TEXT NOT NULL DEFAULT '[]'`)}catch{}
  try{await db.exec(`ALTER TABLE items ADD COLUMN warning_text TEXT NOT NULL DEFAULT ''`)}catch{}
  try{await db.exec(`ALTER TABLE items ADD COLUMN digital_only INTEGER NOT NULL DEFAULT 1`)}catch{}
  try{await db.exec(`ALTER TABLE items ADD COLUMN iraq_only INTEGER NOT NULL DEFAULT 0`)}catch{}
  await db.exec(`CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,email TEXT NOT NULL,currency TEXT NOT NULL,total REAL NOT NULL,payment_status TEXT NOT NULL DEFAULT 'pending',payment_reference TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,paid_at TEXT);`);
  await db.exec(`CREATE TABLE IF NOT EXISTS order_items(order_id TEXT NOT NULL,item_id TEXT NOT NULL,title TEXT NOT NULL,price REAL NOT NULL,PRIMARY KEY(order_id,item_id));`);
  await db.exec(`CREATE TABLE IF NOT EXISTS recovery_codes(id TEXT PRIMARY KEY,email TEXT NOT NULL,code_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,used_at INTEGER,created_at INTEGER NOT NULL);`);
  await db.exec(`CREATE TABLE IF NOT EXISTS download_tokens(token_hash TEXT PRIMARY KEY,order_id TEXT NOT NULL,item_id TEXT NOT NULL,file_key TEXT NOT NULL,file_name TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);`);
  await db.exec(`CREATE TABLE IF NOT EXISTS store_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  const c=await db.prepare('SELECT COUNT(*) c FROM items').first();
  if(Number(c.c)===0){for(const x of SEED)await db.prepare(`INSERT INTO items(id,type,title,category,price_iqd,price_usd,old_price_iqd,old_price_usd,status,status_text,short,description,features,images,files,youtube,active,sort_order,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(x[0],x[1],x[2],x[3],x[4],x[5],x[6],x[7],x[8],x[9],x[10],x[11],JSON.stringify(x[12]),JSON.stringify(x[13]),JSON.stringify(x[14]),x[15],x[16],x[17]).run();}
}
function ensureInit(db){if(!initPromise)initPromise=init(db).catch(e=>{initPromise=null;throw e});return initPromise}
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-admin-key,x-file-name,x-file-kind,x-item-id','access-control-allow-methods':'GET,POST,DELETE,OPTIONS'};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8',...cors,...extra}});
function safeParse(v,fallback=[]){try{return JSON.parse(v||'[]')}catch{return fallback}}
function row(r){return {...r,statusText:r.status_text,warningText:r.warning_text||'',digitalOnly:!!r.digital_only,iraqOnly:!!r.iraq_only,features:safeParse(r.features),images:safeParse(r.images),files:safeParse(r.files),active:!!r.active,old_iqd:r.old_price_iqd,old_usd:r.old_price_usd};}
async function getSettings(db){const {results}=await db.prepare('SELECT key,value FROM store_settings').all();const out={};for(const r of results||[]){try{out[r.key]=JSON.parse(r.value)}catch{out[r.key]=r.value}}return out}
async function putSettings(db,obj){for(const [key,value] of Object.entries(obj||{})){await db.prepare(`INSERT INTO store_settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`).bind(key,JSON.stringify(value)).run();}}
function isAdmin(req,env){return !!env.ADMIN_KEY&&req.headers.get('x-admin-key')===env.ADMIN_KEY}
function extFrom(name,type){const m=(name||'').match(/\.([a-zA-Z0-9]{1,8})$/);if(m)return m[1].toLowerCase();const map={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','application/zip':'zip','application/pdf':'pdf','text/plain':'txt'};return map[type]||'bin'}
function cleanName(name){return (name||'file').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(0,90)}
function normEmail(v){return String(v||'').trim().toLowerCase()}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
function randomToken(bytes=32){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function hashText(v){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function sendEmail(env,to,subject,html){
  if(!env.RESEND_API_KEY||!env.EMAIL_FROM)return {sent:false,reason:'Email provider not configured'};
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${env.RESEND_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM,to:[to],subject,html})});
  if(!r.ok){let detail='';try{const x=await r.json();detail=x.message||x.name||''}catch{}return {sent:false,reason:`Email HTTP ${r.status}${detail?': '+detail:''}`};}
  return {sent:true};
}
async function makeDownloadLinks(env,db,orderId,itemId,origin){
  const item=await db.prepare('SELECT files,title FROM items WHERE id=?').bind(itemId).first();if(!item)return[];
  const files=safeParse(item.files);const out=[];const now=Date.now(),exp=now+60*60*1000;
  for(const f of files){if(!f?.key)continue;const raw=randomToken(32),h=await hashText(raw),name=f.name||`${item.title}.zip`;await db.prepare('INSERT INTO download_tokens(token_hash,order_id,item_id,file_key,file_name,expires_at,created_at) VALUES(?,?,?,?,?,?,?)').bind(h,orderId,itemId,f.key,name,exp,now).run();out.push({name,url:`${origin}/api/download/${raw}`,expires_at:exp});}
  return out;
}
async function sendPurchaseEmail(env,db,orderId,origin){
  const order=await db.prepare('SELECT * FROM orders WHERE id=?').bind(orderId).first();if(!order||order.payment_status!=='paid')return {sent:false};
  const {results}=await db.prepare('SELECT * FROM order_items WHERE order_id=?').bind(orderId).all();let blocks='';
  for(const it of results){const links=await makeDownloadLinks(env,db,orderId,it.item_id,origin);blocks+=`<h3>${it.title}</h3>${links.length?links.map(l=>`<p><a href="${l.url}">تحميل ${l.name}</a> <small>(الرابط صالح لمدة ساعة)</small></p>`).join(''):'<p>سيتم توفير الملف قريباً.</p>'}`;}
  const recover=`${origin}/recover.html`;
  return sendEmail(env,order.email,'مشترياتك من ورشة تك',`<div dir="rtl" style="font-family:Arial,sans-serif"><h2>شكراً لشرائك من ورشة تك</h2><p>رقم الطلب: <b>${order.id}</b></p>${blocks}<hr><p>حقك في المنتجات لا ينتهي. إذا انتهى رابط التحميل، استخدم صفحة استرجاع المشتريات لإصدار روابط جديدة:</p><p><a href="${recover}">استرجاع مشترياتي</a></p></div>`);
}
export default{async fetch(req,env){
  const u=new URL(req.url),origin=u.origin;
  if(req.method==='OPTIONS')return json({ok:true});
  if(!u.pathname.startsWith('/api/')&&!u.pathname.startsWith('/media/'))return env.ASSETS.fetch(req);
  await ensureInit(env.DB);

  if(u.pathname==='/api/region'&&req.method==='GET')return json({country:req.cf?.country||'XX',is_iraq:(req.cf?.country||'XX')==='IQ'},200,{'cache-control':'private, max-age=300'});

  if(u.pathname==='/api/storefront'&&req.method==='GET'){
    const s=await getSettings(env.DB);
    return json({
      home_title:s.home_title||'حوّل أفكارك الإلكترونية إلى مشاريع حقيقية.',
      home_subtitle:s.home_subtitle||'دورات عملية، أكواد Arduino وESP32، ملفات مشاريع واستشارات شخصية تساعدك تتعلم وتبني مشروعك بطريقة واضحة.',
      home_image:s.home_image||'',
      news_enabled:s.news_enabled!==false,
      news_items:Array.isArray(s.news_items)?s.news_items:[],
      home_banners:Array.isArray(s.home_banners)?s.home_banners:[],
      digital_warning_default:s.digital_warning_default||'تنبيه: هذا منتج رقمي فقط ولا يتضمن حزمة قطع أو مكونات هاردوير كاملة.',
      show_courses:s.show_courses!==false,
      show_products:s.show_products!==false,
      show_consultations:s.show_consultations!==false
    },200,{'cache-control':'public, max-age=30, s-maxage=60'});
  }

  if(u.pathname==='/api/catalog'&&req.method==='GET'){
    const cache=globalThis.caches?.default,cacheKey=new Request(u.origin+'/api/catalog-cache');
    if(cache){
      const hit=await cache.match(cacheKey);
      if(hit)return hit;
    }
    const {results}=await env.DB.prepare('SELECT * FROM items ORDER BY sort_order,id').all();
    const response=json({products:results.filter(x=>x.type==='product').map(row),courses:results.filter(x=>x.type==='course').map(row)},200,{'cache-control':'public, max-age=30, s-maxage=60, stale-while-revalidate=300'});
    if(cache)await cache.put(cacheKey,response.clone());
    return response;
  }

  if(u.pathname.startsWith('/media/images/')&&req.method==='GET'){
    if(!env.MEDIA)return new Response('R2 binding missing',{status:503});
    const key=decodeURIComponent(u.pathname.slice('/media/'.length)),obj=await env.MEDIA.get(key);if(!obj)return new Response('Not found',{status:404});
    const h=new Headers();obj.writeHttpMetadata(h);h.set('etag',obj.httpEtag);h.set('cache-control','public, max-age=31536000, immutable');return new Response(obj.body,{headers:h});
  }

  if(u.pathname==='/api/orders/create'&&req.method==='POST'){
    const b=await req.json(),email=normEmail(b.email),currency=String(b.currency||'IQD').toUpperCase();if(!validEmail(email))return json({error:'Invalid email'},400);
    const ids=[...new Set(Array.isArray(b.items)?b.items.map(String):[])];if(!ids.length)return json({error:'Cart is empty'},400);
    const vis=await getSettings(env.DB);let total=0,selected=[];for(const id of ids){const it=await env.DB.prepare('SELECT id,type,title,price_iqd,price_usd,status,active,iraq_only FROM items WHERE id=?').bind(id).first();if(!it||!it.active||['sold','coming'].includes(it.status))continue;if(it.type==='course'&&vis.show_courses===false)continue;if(it.type==='product'&&vis.show_products===false)continue;if(it.iraq_only&&req.cf?.country!=='IQ')return json({error:'هذا المنتج متاح للشراء داخل العراق فقط.'},403);const price=currency==='USD'?Number(it.price_usd):Number(it.price_iqd);total+=price;selected.push({...it,price});}
    if(!selected.length)return json({error:'No purchasable items'},400);const orderId='WT-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
    await env.DB.prepare('INSERT INTO orders(id,email,currency,total) VALUES(?,?,?,?)').bind(orderId,email,currency,total).run();for(const it of selected)await env.DB.prepare('INSERT INTO order_items(order_id,item_id,title,price) VALUES(?,?,?,?)').bind(orderId,it.id,it.title,it.price).run();
    return json({ok:true,order_id:orderId,email,currency,total});
  }

  if(u.pathname==='/api/recovery/request'&&req.method==='POST'){
    const b=await req.json(),email=normEmail(b.email);if(!validEmail(email))return json({ok:true});
    const paid=await env.DB.prepare("SELECT COUNT(*) c FROM orders WHERE email=? AND payment_status='paid'").bind(email).first();
    if(Number(paid?.c||0)>0){const code=String(Math.floor(100000+Math.random()*900000)),h=await hashText(code),now=Date.now();await env.DB.prepare('DELETE FROM recovery_codes WHERE email=?').bind(email).run();await env.DB.prepare('INSERT INTO recovery_codes(id,email,code_hash,expires_at,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),email,h,now+15*60*1000,now).run();await sendEmail(env,email,'رمز استرجاع مشتريات ورشة تك',`<div dir="rtl"><h2>رمز استرجاع مشترياتك</h2><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p><p>الرمز صالح لمدة 15 دقيقة.</p></div>`);}
    return json({ok:true,message:'إذا كان البريد مرتبطاً بمشتريات مدفوعة، أرسلنا رمز تحقق.'});
  }

  if(u.pathname==='/api/recovery/verify'&&req.method==='POST'){
    const b=await req.json(),email=normEmail(b.email),code=String(b.code||'').trim(),now=Date.now(),h=await hashText(code);const rec=await env.DB.prepare('SELECT * FROM recovery_codes WHERE email=? AND code_hash=? AND used_at IS NULL AND expires_at>? ORDER BY created_at DESC LIMIT 1').bind(email,h,now).first();if(!rec)return json({error:'Invalid or expired code'},400);await env.DB.prepare('UPDATE recovery_codes SET used_at=? WHERE id=?').bind(now,rec.id).run();
    const {results}=await env.DB.prepare("SELECT DISTINCT oi.order_id,oi.item_id,oi.title FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.email=? AND o.payment_status='paid' ORDER BY o.paid_at DESC").bind(email).all();const items=[];for(const it of results){items.push({order_id:it.order_id,item_id:it.item_id,title:it.title,downloads:await makeDownloadLinks(env,env.DB,it.order_id,it.item_id,origin)});}return json({ok:true,items});
  }

  if(u.pathname.startsWith('/api/download/')&&req.method==='GET'){
    if(!env.MEDIA)return new Response('R2 binding missing',{status:503});const raw=decodeURIComponent(u.pathname.split('/').pop()),h=await hashText(raw),now=Date.now();const t=await env.DB.prepare('SELECT * FROM download_tokens WHERE token_hash=? AND expires_at>?').bind(h,now).first();if(!t)return new Response('Download link expired or invalid',{status:403});const paid=await env.DB.prepare("SELECT payment_status FROM orders WHERE id=?").bind(t.order_id).first();if(!paid||paid.payment_status!=='paid')return new Response('Order is not paid',{status:403});const obj=await env.MEDIA.get(t.file_key);if(!obj)return new Response('File not found',{status:404});const headers=new Headers();obj.writeHttpMetadata(headers);headers.set('content-disposition',`attachment; filename="${cleanName(t.file_name)}"`);headers.set('cache-control','private, no-store');return new Response(obj.body,{headers});
  }

  if(u.pathname==='/api/admin/bridge'&&req.method==='POST'){
    let b={};
    try{b=JSON.parse(await req.text())}catch{return json({error:'Invalid request'},400)}
    if(!env.ADMIN_KEY||String(b.admin_key||'')!==env.ADMIN_KEY)return json({error:'Unauthorized'},401);
    if(b.action==='get-settings')return json({settings:await getSettings(env.DB)});
    if(b.action==='save-settings'){
      const allowed=['home_title','home_subtitle','home_image','news_enabled','news_items','home_banners','digital_warning_default','wayl_fee_percent','wayl_fixed_iqd','wayl_fixed_usd','show_courses','show_products','show_consultations'];
      const clean={};for(const k of allowed)if(k in (b.payload||{}))clean[k]=b.payload[k];
      await putSettings(env.DB,clean);
      return json({ok:true,settings:await getSettings(env.DB)});
    }
    if(b.action==='stats'){
      const paid=await env.DB.prepare("SELECT COUNT(*) orders,COUNT(DISTINCT email) customers FROM orders WHERE payment_status='paid'").first();
      const pending=await env.DB.prepare("SELECT COUNT(*) c FROM orders WHERE payment_status='pending'").first();
      const units=await env.DB.prepare("SELECT COUNT(*) c FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.payment_status='paid'").first();
      const {results:revenue}=await env.DB.prepare("SELECT currency,SUM(total) total FROM orders WHERE payment_status='paid' GROUP BY currency").all();
      const {results:top}=await env.DB.prepare("SELECT oi.item_id,oi.title,COUNT(*) sold,SUM(oi.price) revenue,o.currency FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.payment_status='paid' GROUP BY oi.item_id,oi.title,o.currency ORDER BY sold DESC LIMIT 10").all();
      return json({paid_orders:Number(paid?.orders||0),customers:Number(paid?.customers||0),pending_orders:Number(pending?.c||0),units_sold:Number(units?.c||0),revenue:revenue||[],top_products:top||[]});
    }
    return json({error:'Unknown action'},400);
  }

  if(!isAdmin(req,env))return json({error:'Unauthorized'},401);

  if(u.pathname==='/api/admin/settings'&&req.method==='GET'){
    return json({settings:await getSettings(env.DB)});
  }

  if(u.pathname==='/api/admin/settings'&&req.method==='POST'){
    const b=await req.json();
    const allowed=['home_title','home_subtitle','home_image','news_enabled','news_items','home_banners','digital_warning_default','wayl_fee_percent','wayl_fixed_iqd','wayl_fixed_usd','show_courses','show_products','show_consultations'];
    const clean={};for(const k of allowed)if(k in b)clean[k]=b[k];
    await putSettings(env.DB,clean);
    return json({ok:true,settings:await getSettings(env.DB)});
  }

  if(u.pathname==='/api/admin/stats'&&req.method==='GET'){
    const paid=await env.DB.prepare("SELECT COUNT(*) orders,COUNT(DISTINCT email) customers FROM orders WHERE payment_status='paid'").first();
    const pending=await env.DB.prepare("SELECT COUNT(*) c FROM orders WHERE payment_status='pending'").first();
    const units=await env.DB.prepare("SELECT COUNT(*) c FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.payment_status='paid'").first();
    const {results:revenue}=await env.DB.prepare("SELECT currency,SUM(total) total FROM orders WHERE payment_status='paid' GROUP BY currency").all();
    const {results:top}=await env.DB.prepare("SELECT oi.item_id,oi.title,COUNT(*) sold,SUM(oi.price) revenue,o.currency FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.payment_status='paid' GROUP BY oi.item_id,oi.title,o.currency ORDER BY sold DESC LIMIT 10").all();
    return json({paid_orders:Number(paid?.orders||0),customers:Number(paid?.customers||0),pending_orders:Number(pending?.c||0),units_sold:Number(units?.c||0),revenue:revenue||[],top_products:top||[]});
  }

  if(u.pathname==='/api/admin/test-email'&&req.method==='POST'){
    const b=await req.json(),email=normEmail(b.email);if(!validEmail(email))return json({error:'Invalid email'},400);
    const mail=await sendEmail(env,email,'اختبار البريد الإلكتروني - ورشة تك',`<div dir="rtl" style="font-family:Arial,sans-serif"><h2>✅ البريد الإلكتروني يعمل</h2><p>تم إرسال هذه الرسالة من Cloudflare Worker الخاص بمتجر <b>ورشة تك</b> باستخدام Resend.</p><p>إذا وصلت هذه الرسالة، فإن إعدادات <b>RESEND_API_KEY</b> و <b>EMAIL_FROM</b> صحيحة.</p></div>`);
    if(!mail.sent)return json({error:mail.reason||'Email failed'},502);
    return json({ok:true,message:'Test email sent'});
  }

  if(u.pathname==='/api/orders/mark-paid'&&req.method==='POST'){
    const b=await req.json(),id=String(b.order_id||'');const order=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first();if(!order)return json({error:'Order not found'},404);await env.DB.prepare("UPDATE orders SET payment_status='paid',payment_reference=?,paid_at=CURRENT_TIMESTAMP WHERE id=?").bind(String(b.payment_reference||'manual'),id).run();const mail=await sendPurchaseEmail(env,env.DB,id,origin);return json({ok:true,email_sent:mail.sent,email_reason:mail.reason||null});
  }

  if(u.pathname==='/api/orders'&&req.method==='GET'){
    const {results}=await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all();return json({orders:results});
  }

  if(u.pathname==='/api/uploads'&&req.method==='POST'){
    if(!env.MEDIA)return json({error:'R2 binding MEDIA is missing'},503);const kind=req.headers.get('x-file-kind')==='file'?'file':'image',itemId=(req.headers.get('x-item-id')||'general').replace(/[^a-zA-Z0-9_-]/g,'-'),original=decodeURIComponent(req.headers.get('x-file-name')||'upload.bin'),type=req.headers.get('content-type')||'application/octet-stream',max=kind==='image'?10*1024*1024:100*1024*1024,len=Number(req.headers.get('content-length')||0);if(len>max)return json({error:kind==='image'?'Image too large (max 10 MB)':'File too large (max 100 MB)'},413);const ext=extFrom(original,type),key=`${kind==='image'?'images':'files'}/${itemId}/${crypto.randomUUID()}.${ext}`;await env.MEDIA.put(key,req.body,{httpMetadata:{contentType:type,contentDisposition:`${kind==='image'?'inline':'attachment'}; filename="${cleanName(original)}"`},customMetadata:{originalName:original,itemId,kind}});const head=await env.MEDIA.head(key);return json({key,name:original,type,size:head?.size||len,kind,url:kind==='image'?`/media/${key}`:null});
  }

  if(u.pathname==='/api/uploads'&&req.method==='DELETE'){
    if(!env.MEDIA)return json({error:'R2 binding MEDIA is missing'},503);const key=u.searchParams.get('key');if(!key)return json({error:'Missing key'},400);await env.MEDIA.delete(key);return json({ok:true});
  }

  if(u.pathname.startsWith('/api/files/')&&req.method==='GET'){
    if(!env.MEDIA)return json({error:'R2 binding MEDIA is missing'},503);const key=decodeURIComponent(u.pathname.slice('/api/files/'.length)),obj=await env.MEDIA.get(key);if(!obj)return new Response('Not found',{status:404});const h=new Headers(cors);obj.writeHttpMetadata(h);h.set('etag',obj.httpEtag);return new Response(obj.body,{headers:h});
  }

  if(u.pathname==='/api/items'&&req.method==='POST'){
    const x=await req.json(),st=x.status||'normal',text=x.statusText||STATUS[st]||'عادي';await env.DB.prepare(`INSERT INTO items(id,type,title,category,price_iqd,price_usd,old_price_iqd,old_price_usd,status,status_text,short,description,features,images,files,youtube,warning_text,digital_only,iraq_only,active,sort_order,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET type=excluded.type,title=excluded.title,category=excluded.category,price_iqd=excluded.price_iqd,price_usd=excluded.price_usd,old_price_iqd=excluded.old_price_iqd,old_price_usd=excluded.old_price_usd,status=excluded.status,status_text=excluded.status_text,short=excluded.short,description=excluded.description,features=excluded.features,images=excluded.images,files=excluded.files,youtube=excluded.youtube,warning_text=excluded.warning_text,digital_only=excluded.digital_only,iraq_only=excluded.iraq_only,active=excluded.active,sort_order=excluded.sort_order,updated_at=CURRENT_TIMESTAMP`).bind(x.id,x.type,x.title,x.category||'',+x.price_iqd||0,+x.price_usd||0,x.old_iqd??x.old_price_iqd??null,x.old_usd??x.old_price_usd??null,st,text,x.short||'',x.description||'',JSON.stringify(x.features||[]),JSON.stringify(x.images||[]),JSON.stringify(x.files||[]),x.youtube||'',x.warningText||x.warning_text||'',x.digitalOnly===false?0:1,x.iraqOnly?1:0,x.active===false?0:1,x.sort_order||0).run();return json({ok:true});
  }

  if(u.pathname.startsWith('/api/items/')&&req.method==='DELETE'){
    const id=decodeURIComponent(u.pathname.split('/').pop()),old=await env.DB.prepare('SELECT images,files FROM items WHERE id=?').bind(id).first();if(env.MEDIA&&old){for(const a of [...safeParse(old.images),...safeParse(old.files)])if(a&&a.key)await env.MEDIA.delete(a.key);}await env.DB.prepare('DELETE FROM items WHERE id=?').bind(id).run();return json({ok:true});
  }
  return json({error:'Not found'},404);
}};