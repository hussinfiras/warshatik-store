const STATUS={normal:'عادي',new:'جديد',sale:'خصم',sold:'نفد',featured:'مميز',coming:'قريباً'};
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
  const c=await db.prepare('SELECT COUNT(*) c FROM items').first();
  if(Number(c.c)===0){for(const x of SEED)await db.prepare(`INSERT INTO items(id,type,title,category,price_iqd,price_usd,old_price_iqd,old_price_usd,status,status_text,short,description,features,images,files,youtube,active,sort_order,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(x[0],x[1],x[2],x[3],x[4],x[5],x[6],x[7],x[8],x[9],x[10],x[11],JSON.stringify(x[12]),JSON.stringify(x[13]),JSON.stringify(x[14]),x[15],x[16],x[17]).run();}
}
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-admin-key,x-file-name,x-file-kind,x-item-id','access-control-allow-methods':'GET,POST,DELETE,OPTIONS'};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8',...cors,...extra}});
function safeParse(v,fallback=[]){try{return JSON.parse(v||'[]')}catch{return fallback}}
function row(r){return {...r,statusText:r.status_text,features:safeParse(r.features),images:safeParse(r.images),files:safeParse(r.files),active:!!r.active,old_iqd:r.old_price_iqd,old_usd:r.old_price_usd};}
function isAdmin(req,env){return !!env.ADMIN_KEY&&req.headers.get('x-admin-key')===env.ADMIN_KEY}
function extFrom(name,type){const m=(name||'').match(/\.([a-zA-Z0-9]{1,8})$/);if(m)return m[1].toLowerCase();const map={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','application/zip':'zip','application/pdf':'pdf','text/plain':'txt'};return map[type]||'bin'}
function cleanName(name){return (name||'file').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(0,90)}
export default{async fetch(req,env){
  const u=new URL(req.url);
  if(req.method==='OPTIONS')return json({ok:true});
  if(!u.pathname.startsWith('/api/')&&!u.pathname.startsWith('/media/'))return env.ASSETS.fetch(req);
  await init(env.DB);

  if(u.pathname==='/api/catalog'&&req.method==='GET'){
    const {results}=await env.DB.prepare('SELECT * FROM items ORDER BY sort_order,id').all();
    return json({products:results.filter(x=>x.type==='product').map(row),courses:results.filter(x=>x.type==='course').map(row)});
  }

  if(u.pathname.startsWith('/media/images/')&&req.method==='GET'){
    if(!env.MEDIA)return new Response('R2 binding missing',{status:503});
    const key=decodeURIComponent(u.pathname.slice('/media/'.length));
    const obj=await env.MEDIA.get(key);
    if(!obj)return new Response('Not found',{status:404});
    const h=new Headers();obj.writeHttpMetadata(h);h.set('etag',obj.httpEtag);h.set('cache-control','public, max-age=31536000, immutable');
    return new Response(obj.body,{headers:h});
  }

  if(!isAdmin(req,env))return json({error:'Unauthorized'},401);

  if(u.pathname==='/api/uploads'&&req.method==='POST'){
    if(!env.MEDIA)return json({error:'R2 binding MEDIA is missing'},503);
    const kind=req.headers.get('x-file-kind')==='file'?'file':'image';
    const itemId=(req.headers.get('x-item-id')||'general').replace(/[^a-zA-Z0-9_-]/g,'-');
    const original=decodeURIComponent(req.headers.get('x-file-name')||'upload.bin');
    const type=req.headers.get('content-type')||'application/octet-stream';
    const max=kind==='image'?10*1024*1024:100*1024*1024;
    const len=Number(req.headers.get('content-length')||0);if(len>max)return json({error:kind==='image'?'Image too large (max 10 MB)':'File too large (max 100 MB)'},413);
    const ext=extFrom(original,type),key=`${kind==='image'?'images':'files'}/${itemId}/${crypto.randomUUID()}.${ext}`;
    await env.MEDIA.put(key,req.body,{httpMetadata:{contentType:type,contentDisposition:`${kind==='image'?'inline':'attachment'}; filename="${cleanName(original)}"`},customMetadata:{originalName:original,itemId,kind}});
    const head=await env.MEDIA.head(key);
    return json({key,name:original,type,size:head?.size||len,kind,url:kind==='image'?`/media/${key}`:null});
  }

  if(u.pathname==='/api/uploads'&&req.method==='DELETE'){
    if(!env.MEDIA)return json({error:'R2 binding MEDIA is missing'},503);
    const key=u.searchParams.get('key');if(!key)return json({error:'Missing key'},400);
    await env.MEDIA.delete(key);return json({ok:true});
  }

  if(u.pathname.startsWith('/api/files/')&&req.method==='GET'){
    if(!env.MEDIA)return json({error:'R2 binding MEDIA is missing'},503);
    const key=decodeURIComponent(u.pathname.slice('/api/files/'.length));
    const obj=await env.MEDIA.get(key);if(!obj)return new Response('Not found',{status:404});
    const h=new Headers(cors);obj.writeHttpMetadata(h);h.set('etag',obj.httpEtag);return new Response(obj.body,{headers:h});
  }

  if(u.pathname==='/api/items'&&req.method==='POST'){
    const x=await req.json(),st=x.status||'normal',text=x.statusText||STATUS[st]||'عادي';
    await env.DB.prepare(`INSERT INTO items(id,type,title,category,price_iqd,price_usd,old_price_iqd,old_price_usd,status,status_text,short,description,features,images,files,youtube,active,sort_order,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET type=excluded.type,title=excluded.title,category=excluded.category,price_iqd=excluded.price_iqd,price_usd=excluded.price_usd,old_price_iqd=excluded.old_price_iqd,old_price_usd=excluded.old_price_usd,status=excluded.status,status_text=excluded.status_text,short=excluded.short,description=excluded.description,features=excluded.features,images=excluded.images,files=excluded.files,youtube=excluded.youtube,active=excluded.active,sort_order=excluded.sort_order,updated_at=CURRENT_TIMESTAMP`).bind(x.id,x.type,x.title,x.category||'',+x.price_iqd||0,+x.price_usd||0,x.old_iqd??x.old_price_iqd??null,x.old_usd??x.old_price_usd??null,st,text,x.short||'',x.description||'',JSON.stringify(x.features||[]),JSON.stringify(x.images||[]),JSON.stringify(x.files||[]),x.youtube||'',x.active===false?0:1,x.sort_order||0).run();
    return json({ok:true});
  }

  if(u.pathname.startsWith('/api/items/')&&req.method==='DELETE'){
    const id=decodeURIComponent(u.pathname.split('/').pop());
    const old=await env.DB.prepare('SELECT images,files FROM items WHERE id=?').bind(id).first();
    if(env.MEDIA&&old){for(const a of [...safeParse(old.images),...safeParse(old.files)])if(a&&a.key)await env.MEDIA.delete(a.key);}
    await env.DB.prepare('DELETE FROM items WHERE id=?').bind(id).run();return json({ok:true});
  }
  return json({error:'Not found'},404);
}};