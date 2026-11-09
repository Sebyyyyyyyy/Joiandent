/* JoianDent public forms API — Cloudflare Pages Functions.
   Email is sent from a verified clinic domain via Resend. Secrets never leave Cloudflare.
   Fail closed until Resend and Cloudflare Turnstile are fully configured. */
const jsonHeaders = {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
function reply(body,status=200){return new Response(JSON.stringify(body),{status,headers:jsonHeaders});}
const allowedForms=new Set(["contact","appointment","review"]);
const text=(v,max)=>typeof v==="string"?v.trim().slice(0,max):"";
const emailOkay=v=>/^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(v)&&v.length<=254;
const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function configured(env){return !!(env.RESEND_API_KEY&&env.MAIL_FROM&&env.MAIL_TO&&env.TURNSTILE_SECRET_KEY&&env.TURNSTILE_SITE_KEY);}
function validate(kind,raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
  const name=text(raw.name,110),phone=text(raw.phone,45),email=text(raw.email,254);
  const message=text(raw.message,1500),subject=text(raw.subject,140),service=text(raw.service,110);
  const rating=Number(raw.rating),consent=raw.consent===true;
  if(!name||name.length<2)return null;
  if(kind==="review"){
    if(!consent||!message||message.length<10||!Number.isInteger(rating)||rating<1||rating>5)return null;
    return {name,message,rating};
  }
  if(!emailOkay(email)||!phone||phone.length<6||!message||message.length<3)return null;
  if(!/^[+0-9()\s.\-]{6,45}$/.test(phone))return null;
  if(kind==="contact"&&!subject)return null;
  if(kind==="appointment"&&!service)return null;
  return {name,phone,email,message,...(kind==="contact"?{subject}:{service})};
}
function makeMail(kind,fields){
  const title={
    contact:"Mesaj nou — JoianDent",
    appointment:"Cerere nouă de programare — JoianDent",
    review:"Recenzie spre aprobare — JoianDent"
  }[kind];
  const pairs=[["Tip",title],["Nume",fields.name]];
  if(fields.phone)pairs.push(["Telefon",fields.phone]);
  if(fields.email)pairs.push(["Email",fields.email]);
  if(fields.subject)pairs.push(["Subiect",fields.subject]);
  if(fields.service)pairs.push(["Serviciu",fields.service]);
  if(fields.rating)pairs.push(["Evaluare",fields.rating+" / 5"]);
  pairs.push(["Mesaj",fields.message]);
  if(kind==="review")pairs.push(["Publicare","Recenzia este doar o solicitare de aprobare, nu este publicată automat."]);
  const plain=pairs.map(([k,v])=>k+": "+v).join("\n\n");
  const rows=pairs.map(([k,v])=>"<tr><th style=\"text-align:left;padding:12px;border-bottom:1px solid #e9eff7;color:#36517b;vertical-align:top\">"+escapeHtml(k)+"</th><td style=\"padding:12px;border-bottom:1px solid #e9eff7;white-space:pre-wrap\">"+escapeHtml(v)+"</td></tr>").join("");
  const html="<div style=\"font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#213449\"><div style=\"background:#142d90;color:white;padding:24px\"><h2 style=\"margin:0\">JoianDent</h2><p style=\"margin:8px 0 0\">"+escapeHtml(title)+"</p></div><table style=\"border-collapse:collapse;width:100%;font-size:14px\">"+rows+"</table><p style=\"color:#748294;font-size:12px\">Mesaj primit prin formularul oficial al site-ului. Nu este o confirmare de programare.</p></div>";
  return {subject:title,text:plain,html};
}
export async function onRequestGet({env}){
  return reply({ok:true,ready:configured(env),siteKey:configured(env)?env.TURNSTILE_SITE_KEY:null});
}
export async function onRequestPost({request,env}){
  if(!configured(env))return reply({ok:false,error:"Formularul este în curs de configurare. Te rugăm să contactezi clinica telefonic."},503);
  const origin=request.headers.get("Origin");
  if(!origin||origin!==new URL(request.url).origin)return reply({ok:false,error:"Solicitare neautorizată."},403);
  if(!(request.headers.get("Content-Type")||"").startsWith("application/json"))return reply({ok:false,error:"Format de solicitare invalid."},415);
  const claimedSize=Number(request.headers.get("Content-Length")||"0");
  if(claimedSize>15000)return reply({ok:false,error:"Mesaj prea lung."},413);
  let input;
  try{
    const source=await request.text();
    if(source.length>15000)return reply({ok:false,error:"Mesaj prea lung."},413);
    input=JSON.parse(source);
  }catch{return reply({ok:false,error:"Date invalide."},400);}
  if(!input||!allowedForms.has(input.kind))return reply({ok:false,error:"Formular necunoscut."},400);
  // Honeypot, intentionally not referenced in the visible fields.
  if(input.website)return reply({ok:true},200);
  const fields=validate(input.kind,input.fields);
  if(!fields)return reply({ok:false,error:"Verifică informațiile completate în formular."},400);
  const token=text(input.turnstileToken,2049);
  if(!token||token.length>2048)return reply({ok:false,error:"Confirmă verificarea de securitate."},400);
  let verification;
  try{
    const payload=new FormData();
    payload.set("secret",env.TURNSTILE_SECRET_KEY);
    payload.set("response",token);
    const ip=request.headers.get("CF-Connecting-IP");
    if(ip)payload.set("remoteip",ip);
    const check=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:payload});
    if(!check.ok)throw new Error("verification failed");
    verification=await check.json();
  }catch{return reply({ok:false,error:"Verificarea anti-spam nu este disponibilă. Încearcă din nou."},502);}
  if(!verification.success||verification.hostname!==new URL(request.url).hostname||verification.action!=="joiandent-form"){
    return reply({ok:false,error:"Verificarea anti-spam a eșuat. Încearcă din nou."},403);
  }
  const mail=makeMail(input.kind,fields);
  let result;
  try{
    const message={
      from:env.MAIL_FROM,
      to:[env.MAIL_TO],
      subject:mail.subject,
      html:mail.html,
      text:mail.text,
      ...(fields.email?{reply_to:fields.email}:{})
    };
    const sent=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify(message)
    });
    if(!sent.ok)return reply({ok:false,error:"Emailul nu a putut fi trimis. Te rugăm să contactezi clinica telefonic."},502);
    result=await sent.json();
  }catch{return reply({ok:false,error:"Serviciul de email nu răspunde. Încearcă din nou."},502);}
  if(!result?.id)return reply({ok:false,error:"Nu am putut confirma trimiterea. Încearcă din nou."},502);
  return reply({ok:true,message:input.kind==="review"?"Recenzia a fost trimisă clinicii spre aprobare.":"Solicitarea a fost preluată pentru trimitere. Clinica te va contacta pentru confirmare."});
}
