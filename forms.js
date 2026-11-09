/* JoianDent — clinic forms. No external form redirects or public API secrets. */
(() => {
  "use strict";
  const API="/api/forms";
  const entries=[
    {kind:"contact",selector:".contact-form"},
    {kind:"appointment",selector:".appointment-form"},
    {kind:"review",selector:"#review-form"}
  ];
  const forms=entries.map(e=>({...e,form:document.querySelector(e.selector)})).filter(e=>e.form);
  const widgetIds=new Map(),tokens=new Map();
  let configured=false,siteKey="",scriptLoaded=false;
  const lang=()=>["ro","ru","en"].includes(document.documentElement.lang)?document.documentElement.lang:"ro";
  const messages={
    unavailable:{
      ro:"Formularul este momentan indisponibil. Te rugăm să contactezi clinica telefonic.",
      ru:"Форма пока недоступна. Пожалуйста, свяжитесь с клиникой по телефону.",
      en:"This form is temporarily unavailable. Please contact the clinic by phone."
    },
    security:{
      ro:"Completează verificarea de securitate înainte de trimitere.",
      ru:"Пройдите проверку безопасности перед отправкой.",
      en:"Complete the security check before sending."
    },
    sending:{
      ro:"Se trimite solicitarea…",
      ru:"Отправляем запрос…",
      en:"Sending your request…"
    },
    failure:{
      ro:"Nu am putut trimite mesajul. Încearcă din nou sau contactează clinica telefonic.",
      ru:"Не удалось отправить сообщение. Повторите попытку или позвоните в клинику.",
      en:"We could not send your message. Please retry or call the clinic."
    },
    success:{
      ro:"Mesajul a fost acceptat pentru trimitere. Clinica va confirma separat solicitarea.",
      ru:"Сообщение принято к отправке. Клиника подтвердит ваш запрос отдельно.",
      en:"Your message was accepted for sending. The clinic will confirm your request separately."
    },
    reviewSuccess:{
      ro:"Recenzia a fost trimisă spre aprobare. Nu va fi publicată automat.",
      ru:"Отзыв отправлен на проверку. Он не будет опубликован автоматически.",
      en:"Your review was submitted for approval. It will not be published automatically."
    }
  };
  const message=key=>messages[key]?.[lang()]||messages[key]?.ro||"";
  function status(form,key){
    const feedback=form.querySelector(".form-feedback");
    if(feedback){feedback.textContent=message(key);feedback.dataset.state=key;}
  }
  function markFormReady(form,ready){
    const btn=form.querySelector('button[type="submit"]');
    if(btn)btn.disabled=!ready;
    if(!ready)status(form,"unavailable");
    else if(form.querySelector(".form-feedback")?.dataset.state==="unavailable"){
      const feedback=form.querySelector(".form-feedback");
      feedback.textContent="";feedback.removeAttribute("data-state");
    }
  }
  function formIsVisible(form){
    if(form.hidden)return false;
    const modal=form.closest(".appointment-modal");
    if(modal&&!modal.classList.contains("is-open"))return false;
    return form.getClientRects().length>0;
  }
  function mountWidgets(){
    if(!configured||!scriptLoaded||!window.turnstile)return;
    for(const {form} of forms){
      const target=form.querySelector("[data-turnstile-slot]");
      if(!target||!formIsVisible(form)||widgetIds.has(form))continue;
      try{
        const id=window.turnstile.render(target,{
          sitekey:siteKey,
          action:"joiandent-form",
          theme:"auto",
          callback:token=>tokens.set(form,token),
          "expired-callback":()=>tokens.delete(form),
          "error-callback":()=>tokens.delete(form)
        });
        widgetIds.set(form,id);
      }catch(e){markFormReady(form,false);}
    }
  }
  function loadTurnstile(){
    if(window.turnstile){scriptLoaded=true;mountWidgets();return;}
    const script=document.createElement("script");
    script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async=true;script.defer=true;
    script.onload=()=>{scriptLoaded=true;mountWidgets();};
    script.onerror=()=>{forms.forEach(({form})=>markFormReady(form,false));};
    document.head.appendChild(script);
  }
  function fieldsFor(kind,form){
    const d=new FormData(form);
    if(kind==="review")return {
      name:d.get("author")||"",rating:d.get("rating")||"",
      message:d.get("text")||"",consent:d.get("consent")==="on"
    };
    return {
      name:d.get(kind==="appointment"?"Nume și prenume":"Nume")||"",
      phone:d.get("Telefon")||"",email:d.get("Email")||"",
      message:d.get("Mesaj")||"",
      ...(kind==="contact"?{subject:d.get("Subiect")||""}:{service:d.get("Serviciu")||""})
    };
  }
  async function submit({kind,form},event){
    event.preventDefault();
    if(!configured){status(form,"unavailable");return;}
    if(!form.reportValidity())return;
    const token=tokens.get(form);
    if(!token){status(form,"security");mountWidgets();return;}
    const button=form.querySelector('button[type="submit"]');
    if(button)button.disabled=true;
    status(form,"sending");
    const data=new FormData(form);
    try{
      const response=await fetch(API,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        credentials:"same-origin",
        body:JSON.stringify({kind,turnstileToken:token,website:data.get("_honey")||"",fields:fieldsFor(kind,form)})
      });
      const outcome=await response.json().catch(()=>({ok:false}));
      if(!response.ok||!outcome.ok)throw new Error("Delivery was not accepted");
      form.reset();
      status(form,kind==="review"?"reviewSuccess":"success");
    }catch(e){status(form,"failure");}
    finally{
      tokens.delete(form);
      if(widgetIds.has(form)&&window.turnstile){
        try{window.turnstile.reset(widgetIds.get(form));}catch{}
      }
      if(button)button.disabled=!configured;
    }
  }
  forms.forEach(entry=>{
    entry.form.addEventListener("submit",event=>submit(entry,event));
    markFormReady(entry.form,false);
  });
  document.addEventListener("click",e=>{
    if(e.target.closest(".appointment-trigger, #open-review-form")){
      requestAnimationFrame(mountWidgets);
      setTimeout(mountWidgets,150);
    }
  });
  async function init(){
    try{
      const res=await fetch(API,{cache:"no-store"});
      const data=await res.json();
      if(!res.ok||!data.ok||!data.ready||!data.siteKey)return;
      configured=true;siteKey=data.siteKey;
      forms.forEach(({form})=>markFormReady(form,true));
      loadTurnstile();
    }catch(e){/* no secrets or personal data are logged */}
  }
  init();
})();
