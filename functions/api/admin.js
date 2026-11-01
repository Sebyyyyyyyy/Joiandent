/* JoianDent admin API — Cloudflare Pages Functions. All credentials stay in Cloudflare secrets. */
const resources = new Set(["general","services","team","cases","reviews"]);
const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff"}
});
const fail = (message, status=400) => reply({ok:false,error:message},status);
function decode64(s) {
  const normalized=s.replace(/-/g,"+").replace(/_/g,"/");
  const bin=atob(normalized+"=".repeat((4-normalized.length%4)%4));
  return Uint8Array.from(bin,c=>c.charCodeAt(0));
}
function decodeJson(s){return JSON.parse(new TextDecoder().decode(decode64(s)));}
function toBase64(bytes){let out="";for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(out);}
async function identity(request, env) {
  const domain=String(env.CF_ACCESS_TEAM_DOMAIN||"").trim().replace(/^https?:\/\//,"").replace(/\/$/,"").toLowerCase();
  const audience=String(env.CF_ACCESS_AUD||"").trim();
  const token=request.headers.get("Cf-Access-Jwt-Assertion");
  if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain)||!audience||!token)return null;
  try {
    const parts=token.split(".");
    if(parts.length!==3)return null;
    const header=decodeJson(parts[0]),payload=decodeJson(parts[1]);
    const now=Math.floor(Date.now()/1000);
    if(header.alg!=="RS256"||!header.kid||payload.iss!=="https://"+domain||
       !(Array.isArray(payload.aud)?payload.aud.includes(audience):payload.aud===audience)||
       !Number.isFinite(payload.exp)||payload.exp<now-30||
       (payload.nbf&&payload.nbf>now+30)||!payload.email)return null;
    const response=await fetch("https://"+domain+"/cdn-cgi/access/certs");
    if(!response.ok)return null;
    const keys=(await response.json()).keys||[];
    const jwk=keys.find(x=>x.kid===header.kid&&x.kty==="RSA");
    if(!jwk)return null;
    const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    const valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decode64(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1]));
    if(!valid)return null;
    const email=String(payload.email).trim().toLowerCase();
    const owner=String(env.OWNER_EMAIL||"").trim().toLowerCase();
    const editors=String(env.EDITOR_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
    const role=email===owner&&owner?"owner":editors.includes(email)?"editor":null;
    return role?{email,role}:null;
  } catch {return null;}
}
function settings(env){
  const repo=String(env.GH_REPO||"").trim(),branch=String(env.GH_BRANCH||"").trim();
  const token=String(env.GH_TOKEN||"").trim();
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo)||!branch||!token)return null;
  if(["main","master"].includes(branch)&&env.ALLOW_PRODUCTION_WRITES!=="true")return null;
  return {repo,branch,token};
}
async function github(env,path,method="GET",data){
  const s=settings(env);
  if(!s)throw new Error("Configurarea GitHub lipsește sau ramura principală este blocată.");
  const target="https://api.github.com/repos/"+s.repo+"/contents/"+path;
  const url=method==="GET"?target+"?ref="+encodeURIComponent(s.branch):target;
  const res=await fetch(url,{method,headers:{"Authorization":"Bearer "+s.token,
    "Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",
    "User-Agent":"JoianDent-admin","Content-Type":"application/json"},
    body:data?JSON.stringify(data):undefined});
  let body={};try{body=await res.json();}catch{}
  if(!res.ok){
    if(res.status===409||res.status===422)throw new Error("Conflict de versiune. Reîncarcă pagina și verifică modificările.");
    if(res.status===404)throw new Error("Fișierul sau ramura GitHub nu au fost găsite.");
    throw new Error("GitHub a răspuns cu eroarea "+res.status+".");
  }
  return body;
}
function validate(resource,value){
  if(resource==="general"){
    if(!value||Array.isArray(value)||typeof value!=="object")throw new Error("Format general invalid.");
    const allowed=["heroTitle","heroImage","introTitle","introDescription","aboutTitle","aboutDescription","phone","phoneLink","email","address","hours","break","showBeforeAfter","sectionsVisibility"];
    if(Object.keys(value).some(k=>!allowed.includes(k)))throw new Error("Câmp nepermis.");
    if("showBeforeAfter" in value && typeof value.showBeforeAfter!=="boolean")throw new Error("Opțiunea de afișare trebuie să fie activată sau dezactivată.");
    if("sectionsVisibility" in value){
      const v=value.sectionsVisibility;
      const allowedSections=["home","intro","services","about","team","beforeAfter","reviews","contact","hours"];
      if(!v || Array.isArray(v) || typeof v!=="object" || Object.keys(v).some(key=>!allowedSections.includes(key) || typeof v[key]!=="boolean"))
        throw new Error("Vizibilitatea secțiunilor trebuie să conțină doar opțiuni ON/OFF valide.");
    }
  }else{
    if(!Array.isArray(value)||value.length>100)throw new Error("Lista trebuie să conțină maximum 100 de elemente.");
    for(const item of value){
      if(!item||typeof item!=="object"||!/^[-a-zA-Z0-9_]{2,80}$/.test(item.id||""))throw new Error("Fiecare element trebuie să aibă un ID unic.");
      if(resource==="cases"&&item.published&&(!item.consent||!item.before||!item.after))throw new Error("Un caz publicat necesită acord și ambele fotografii.");
      if(resource==="reviews"&&item.published&&(!item.author||!item.text))throw new Error("Recenzia publicată trebuie să aibă nume și text.");
    }
    if(new Set(value.map(x=>x.id)).size!==value.length)throw new Error("ID-urile trebuie să fie unice.");
  }
  if(JSON.stringify(value).length>180000)throw new Error("Conținutul este prea mare.");
}
function sameOrigin(request){
  const origin=request.headers.get("Origin");
  return origin===new URL(request.url).origin;
}
export async function onRequest(context){
  const {request,env}=context;
  if(!["GET","PUT","POST"].includes(request.method))return fail("Metodă nepermisă.",405);
  if(!env.CF_ACCESS_TEAM_DOMAIN||!env.CF_ACCESS_AUD||!env.OWNER_EMAIL||!settings(env))
    return fail("Panoul nu este activat. Configurează accesul și secretele în Cloudflare.",503);
  const user=await identity(request,env);
  if(!user)return fail("Acces neautorizat. Autentifică-te prin Cloudflare Access.",401);
  const url=new URL(request.url),action=url.searchParams.get("action"),resource=url.searchParams.get("resource");
  if(request.method==="GET"&&action==="session"){
    const s=settings(env);return reply({ok:true,email:user.email,role:user.role,branch:s.branch});
  }
  if(request.method==="GET"&&resources.has(resource)){
    try {
      const file=await github(env,"content/"+resource+".json");
      const content=JSON.parse(new TextDecoder().decode(decode64(String(file.content||"").replace(/\s/g,""))));
      return reply({ok:true,data:content,sha:file.sha});
    }catch(e){return fail(e.message||"Eroare la citire.",502);}
  }
  if(request.method!=="GET"&&!sameOrigin(request))return fail("Cerere refuzată: origine diferită.",403);
  if(request.method==="PUT"&&resources.has(resource)){
    try{
      if(Number(request.headers.get("Content-Length")||0)>200000)return fail("Date prea mari.",413);
      const data=await request.json();
      if(!/^[a-f0-9]{40}$/.test(data.sha||""))return fail("Versiune invalidă.");
      validate(resource,data.value);
      const content=toBase64(new TextEncoder().encode(JSON.stringify(data.value,null,2)+"\n"));
      const result=await github(env,"content/"+resource+".json","PUT",{
        message:"admin: actualizează "+resource+" ("+user.role+")",
        sha:data.sha,content,branch:settings(env).branch
      });
      return reply({ok:true,sha:result.content?.sha||"",commit:result.commit?.sha||""});
    }catch(e){return fail(e.message||"Eroare de salvare.",400);}
  }
  if(request.method==="POST"&&action==="media"){
    try{
      if(Number(request.headers.get("Content-Length")||0)>9000000)return fail("Imagine prea mare.",413);
      const body=await request.json();
      const mime=String(body.mime||"").toLowerCase();
      const ext=({"image/jpeg":"jpg","image/png":"png","image/webp":"webp"})[mime];
      if(!ext||typeof body.base64!=="string"||body.base64.length>7200000)return fail("Acceptăm doar JPG, PNG și WebP, max. 5 MB.");
      const bytes=decode64(body.base64);
      if(bytes.length===0||bytes.length>5*1024*1024)return fail("Fișier prea mare (max. 5 MB).");
      const isJpg=ext==="jpg"&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
      const isPng=ext==="png"&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
      const isWebp=ext==="webp"&&new TextDecoder().decode(bytes.subarray(0,4))==="RIFF"&&new TextDecoder().decode(bytes.subarray(8,12))==="WEBP";
      if(!(isJpg||isPng||isWebp))return fail("Fișierul nu este o imagine acceptată.");
      const id=crypto.randomUUID().replace(/-/g,"").slice(0,16);
      const path="assets/uploads/"+Date.now()+"-"+id+"."+ext;
      await github(env,path,"PUT",{message:"admin: fotografie nouă ("+user.role+")",content:body.base64,branch:settings(env).branch});
      return reply({ok:true,path});
    }catch(e){return fail(e.message||"Încărcarea imaginii a eșuat.",400);}
  }
  return fail("Resursa nu există.",404);
}
