/* JoianDent V2.5 — static Pages CMS content from GitHub. No PHP or runtime CMS credentials.
   Admin edits are committed to content/*.json and deployed by static hosting. */
(() => {
'use strict';
const qs=(s,root=document)=>root.querySelector(s);
const qsa=(s,root=document)=>[...root.querySelectorAll(s)];
const safe=(value)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validImage=(v)=> /^\/?assets\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp|avif)$/i.test(v||'')&&!String(v).includes('..');
const localeKey='joiandent_language';
let language='ro';
try{const saved=localStorage.getItem(localeKey);if(['ro','ru','en'].includes(saved))language=saved;}catch(e){}
let cms=null, selectedCategory='all';
const I={
'Acasă':['Главная','Home'],'Vezi serviciile':['Услуги','Services'],'Program':['График','Hours'],'Contacte':['Контакты','Contact'],
'Înainte / După':['До / После','Before / After'],'Recenzii':['Отзывы','Reviews'],'Programează-te':['Записаться','Book a visit'],
'Clinică Stomatologică':['Стоматологическая клиника','Dental Clinic'],
'Your Favourite Clinic':['Ваша любимая клиника','Your Favourite Clinic'],
'Îngrijire atentă. Tehnologie modernă.':['Забота и современные технологии.','Thoughtful care. Modern technology.'],
'Un zâmbet sănătos începe aici':['Здоровая улыбка начинается здесь','A healthy smile starts here'],
'Stomatologie modernă, într-un spațiu confortabil și sigur. Punem accent pe comunicare clară, precizie și o experiență plăcută pentru fiecare pacient.':['Современная стоматология в уютной и безопасной атмосфере. Мы уделяем внимание ясному общению, точности и комфорту каждого пациента.','Modern dentistry in a comfortable, safe setting. We focus on clear communication, precision, and a welcoming experience for every patient.'],
'Serviciile Noastre':['Наши услуги','Our Services'],'Despre Clinică':['О клинике','About Our Clinic'],
'Alătură-te familiei':['Добро пожаловать в нашу семью','Welcome to the family'],
'La JoianDent, punem pe primul loc sănătatea și confortul fiecărui pacient. Combinăm experiența echipei medicale cu tehnologia modernă pentru a oferi tratamente stomatologice sigure, precise și adaptate fiecărei persoane.':['В JoianDent здоровье и комфорт пациентов — на первом месте. Наша команда объединяет опыт и современные технологии для персонализированного лечения.','At JoianDent, patient health and comfort come first. Our team combines experience and modern technology to provide precise, personalized care.'],
'ani de experiență':['лет опыта','years of experience'],'categorii de servicii':['категорий услуг','service categories'],'echipă dedicată':['команда специалистов','dedicated team'],
'Echipa noastră':['Наша команда','Our Team'],
'Profesioniști dedicați sănătății și frumuseții zâmbetului dumneavoastră.':['Специалисты, заботящиеся о здоровье и красоте вашей улыбки.','Professionals committed to the health and beauty of your smile.'],
'MEDIC STOMATOLOG':['ВРАЧ-СТОМАТОЛОГ','DENTIST'],'ECHIPA JOIANDENT':['КОМАНДА JOIANDENT','JOIANDENT TEAM'],
'Asistentele noastre':['Наши ассистенты','Our Assistants'],
'CAZURI CLINICE':['КЛИНИЧЕСКИЕ СЛУЧАИ','CLINICAL CASES'],
'Rezultate care vorbesc de la sine':['Результаты говорят сами за себя','Results that speak for themselves'],
'Fotografii reale înainte și după tratamente, publicate cu acordul pacienților.':['Реальные фотографии до и после лечения, опубликованные с согласия пациентов.','Real before-and-after photos, published with patient consent.'],
'Cazurile clinice vor apărea aici după publicarea lor de către clinică.':['Клинические случаи появятся здесь после публикации клиникой.','Clinical cases will appear here once published by the clinic.'],
'PĂRERILE PACIENȚILOR':['ОТЗЫВЫ ПАЦИЕНТОВ','PATIENT STORIES'],
'Experiențele pacienților noștri':['Истории наших пациентов','What Our Patients Say'],
'Recenzii publicate după verificarea și aprobarea clinicii.':['Отзывы публикуются после проверки и одобрения клиникой.','Reviews are published after review and approval by the clinic.'],
'Lasă o recenzie':['Оставить отзыв','Leave a review'],
'Încă nu sunt recenzii publicate.':['Пока нет опубликованных отзывов.','No published reviews yet.'],
'Trimite o recenzie':['Отправить отзыв','Submit a review'],
'Recenzia va fi verificată înainte de afișare. Nu include date medicale sau personale sensibile.':['Отзыв будет проверен перед публикацией. Не указывайте конфиденциальную информацию.','Your review will be checked before publishing. Please do not include sensitive medical or personal details.'],
'Nume afișat':['Отображаемое имя','Display name'],'Evaluare':['Оценка','Rating'],'Recenzia ta':['Ваш отзыв','Your review'],
'Sunt de acord ca recenzia și numele afișat să fie publicate după aprobare.':['Я согласен(-на) на публикацию отзыва и отображаемого имени после одобрения.','I agree that my review and display name may be published after approval.'],
'Trimite spre aprobare':['Отправить на модерацию','Submit for approval'],'Înainte':['До','Before'],'După':['После','After'],
'Toate':['Все','All'],
'Contact':['Контакты','Contact'],'Lăsați-ne un mesaj':['Напишите нам','Send us a message'],
'Nume și prenume':['Имя и фамилия','Full name'],'Telefon':['Телефон','Phone'],'Email':['Электронная почта','Email'],
'Subiect':['Тема','Subject'],'Mesajul dumneavoastră':['Ваше сообщение','Your message'],'Trimite':['Отправить','Send'],
'Nu includeți în formular informații medicale sensibile.':['Не указывайте конфиденциальную медицинскую информацию.','Do not include sensitive medical information.'],
'Completează datele de mai jos, iar solicitarea va fi trimisă direct clinicii.':['Заполните форму, и ваш запрос будет отправлен прямо в клинику.','Fill in your details and your request will be sent directly to the clinic.'],
'Serviciu':['Услуга','Service'],'Alege serviciul':['Выберите услугу','Choose a service'],
'Mesaj':['Сообщение','Message'],'Nu include informații medicale sensibile în mesaj.':['Не указывайте конфиденциальную медицинскую информацию.','Do not include sensitive medical information in your message.'],
'Trimite solicitarea':['Отправить запрос','Send request'],
'Clinică stomatologică · Ungheni':['Стоматологическая клиника · Унгены','Dental clinic · Ungheni'],
'Informații':['Информация','Information'],'Rețele sociale':['Социальные сети','Social media'],
'Toate drepturile rezervate.':['Все права защищены.','All rights reserved.'],
'Ex: Ion Popescu':['Напр.: Иван Попеску','e.g. John Smith'],
'exemplu@email.com':['primer@email.com','example@email.com'],
'Scrie pe scurt cum te putem ajuta...':['Кратко опишите, чем мы можем помочь...','Briefly tell us how we can help...'],
'Ex: Ana M.':['Напр.: Анна М.','e.g. Anna M.'],
'Spune-ne despre experiența ta...':['Расскажите о своём опыте...','Tell us about your experience...'],
};
const strings={
 success:['Mulțumim! Recenzia a fost trimisă și așteaptă aprobarea.','Спасибо! Отзыв отправлен на модерацию.','Thank you! Your review is awaiting approval.'],
 fail:['Nu am putut trimite recenzia. Încearcă din nou.','Не удалось отправить отзыв. Попробуйте снова.','Could not submit your review. Please try again.'],
 emptyCases:['Nu sunt încă rezultate publicate în această categorie.','В этой категории пока нет опубликованных случаев.','No cases published in this category yet.'],
 emptyReviews:['Încă nu sunt recenzii publicate.','Пока нет опубликованных отзывов.','No published reviews yet.'],
 before:['ÎNAINTE','ДО','BEFORE'],after:['DUPĂ','ПОСЛЕ','AFTER'],
 slide:['Glisează pentru a compara','Переместите ползунок для сравнения','Slide to compare'],
 consultation:['Consultație / Alt serviciu','Консультация / Другая услуга','Consultation / Other service']
};
const lindex=()=>language==='ru'?0:1;
const tr=(key)=> language==='ro'?key:(I[key]?.[lindex()]??key);
const ts=(key)=> language==='ro'?strings[key]?.[0]:language==='ru'?strings[key]?.[1]:strings[key]?.[2];
const tx=(value)=> typeof value==='object'&&value!==null?(value[language]||value.ro||value.en||''):String(value??'');
const originalNodes=new WeakMap(), originalAttr=new WeakMap();
function translateStatic(){
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()) {
  const n=walker.currentNode;
  if(n.parentElement?.closest('script,style,#cases-list,#reviews-list,#cases-filters,#team-generated,#services-generated,#service-options'))continue;
  if(!originalNodes.has(n))originalNodes.set(n,n.nodeValue);
  const source=originalNodes.get(n),word=source.trim();
  if(I[word]) n.nodeValue=source.replace(word,tr(word));
 }
 qsa('[placeholder],[aria-label]').forEach(el=>{
   if(el.closest('#cases-list,#reviews-list,#cases-filters,#team-generated,#services-generated'))return;
   if(!originalAttr.has(el))originalAttr.set(el,{});
   const stored=originalAttr.get(el);
   for(const k of ['placeholder','aria-label']) {
    if(!el.hasAttribute(k))continue;
    if(!stored[k])stored[k]=el.getAttribute(k);
    const v=stored[k];if(I[v])el.setAttribute(k,tr(v));
   }
 });
 document.documentElement.lang=language;
 qsa('[data-lang]').forEach(b=>{const current=b.dataset.lang===language;b.classList.toggle('active',current);b.setAttribute('aria-pressed',String(current));});
}
function fillCms() {
 if(!cms)return;
 const g=cms.general||{};
 const assign=(sel,value)=>{const e=qs(sel);if(e&&value!==undefined)e.textContent=typeof value==='object'?tx(value):value;};
 assign('.hero-content h1',g.heroTitle);assign('.intro-copy h3',g.introTitle);
 assign('.intro-copy > p:not(.kicker)',g.introDescription);
 assign('.about-copy > h3',g.aboutTitle);assign('.about-copy > p',g.aboutDescription);
 assign('.hero-address',g.address);
 if(g.email&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g.email)){qsa('form.contact-form,form.appointment-form,form.review-form').forEach(f=>f.action='https://formsubmit.co/'+g.email);}
 const map=qs('.map-wrap iframe');if(map&&g.address)map.src='https://www.google.com/maps?q='+encodeURIComponent('JoianDent, '+g.address+', Ungheni, Moldova')+'&output=embed';
 const img=qs('.hero-image');if(img&&validImage(g.heroImage))img.src=g.heroImage;
 const info=qs('.footer-grid > div:nth-child(2)');
 if(info){
  const link=qs('a[href^="tel:"]',info);if(link){link.textContent=g.phone;link.href='tel:'+String(g.phoneLink||'').replace(/[^+0-9]/g,'');}
  const mail=qs('a[href^="mailto:"]',info);if(mail){mail.textContent=g.email;mail.href='mailto:'+g.email;}
  const ps=qsa('p',info);if(ps[0])ps[0].textContent=tx(g.hours);if(ps[1])ps[1].textContent=tx(g.break);
 }
 const stat=qs('.stats > div:nth-child(2) strong');if(stat)stat.textContent=(cms.services||[]).length;
 const services=qs('.services-grid');
 if(services){services.id='services-generated';services.innerHTML=(cms.services||[]).map(s=>`<article class="service-card is-visible"><div class="service-icon" aria-hidden="true">${safe(s.icon||'◇')}</div><h3>${safe(tx(s.title))}</h3><p>${safe(tx(s.description))}</p></article>`).join('');}
 const team=qs('.team-grid');
 if(team){team.id='team-generated';team.innerHTML=(cms.team||[]).filter(t=>validImage(t.image)).map(t=> t.type==='team'?`<article class="assistants-card is-visible"><div class="assistants-photo"><img src="${safe(t.image)}" alt="${safe(t.name)}" loading="lazy" decoding="async"></div><div class="assistants-info"><div><span class="person-label">${safe(tx(t.role))}</span><h3>${safe(t.name)}</h3></div><p>${safe(t.details||'').replace(/\n/g,'<br>')}</p></div></article>`:`<article class="person-card is-visible"><div class="person-photo"><img src="${safe(t.image)}" alt="${safe(t.name)}" loading="lazy" decoding="async"></div><div class="person-info"><span class="person-label">${safe(tx(t.role))}</span><h3>${safe(t.name)}</h3></div></article>`).join('');}
 const select=qs('.appointment-form select[name="Serviciu"]');
 if(select){const chosen=select.value;select.innerHTML=`<option value="" disabled selected>${safe(tr('Alege serviciul'))}</option>`+(cms.services||[]).map(s=>`<option value="${safe(s.title?.ro||'')}">${safe(tx(s.title))}</option>`).join('')+`<option value="Consultație / Alt serviciu">${safe(ts('consultation'))}</option>`;select.value=chosen||'';}
 renderCases();renderReviews();
}
function renderCases(){
 const container=qs('#cases-list'),filters=qs('#cases-filters');if(!container||!filters||!cms)return;
 const shown=(cms.cases||[]).filter(c=>c.published&&c.consent&&validImage(c.before)&&validImage(c.after));
 const categories=[...new Set(shown.map(c=>c.category))];
 if(selectedCategory!=='all'&&!categories.includes(selectedCategory))selectedCategory='all';
 filters.innerHTML=shown.length?`<button type="button" class="filter-pill ${selectedCategory==='all'?'selected':''}" data-filter="all">${safe(tr('Toate'))}</button>`+categories.map(id=>{const category=cms.services.find(s=>s.id===id);return `<button type="button" class="filter-pill ${selectedCategory===id?'selected':''}" data-filter="${safe(id)}">${safe(category?tx(category.title):id)}</button>`}).join(''):'';
 const data=shown.filter(c=>selectedCategory==='all'||c.category===selectedCategory);
 container.innerHTML=data.length?data.map((c,i)=>{
  const cat=cms.services.find(s=>s.id===c.category);
  return `<article class="case-card"><div class="case-description"><span class="case-kicker">${safe(cat?tx(cat.title):c.category)}</span><h3>${safe(tx(c.title))}</h3><p>${safe(tx(c.description))}</p><div class="case-slide-hint">↔ ${safe(ts('slide'))}</div></div><div class="compare" style="--pos:50%"><img class="compare-after" src="${safe(c.after)}" alt="${safe(ts('after'))}: ${safe(tx(c.title))}" loading="lazy"><div class="compare-before-wrap"><img class="compare-before" src="${safe(c.before)}" alt="${safe(ts('before'))}: ${safe(tx(c.title))}" loading="lazy"></div><span class="compare-tag tag-before">${safe(ts('before'))}</span><span class="compare-tag tag-after">${safe(ts('after'))}</span><div class="compare-line"><span>↔</span></div><input type="range" class="compare-range" min="0" max="100" value="50" aria-label="${safe(ts('slide'))}" /></div></article>`;
 }).join(''):`<div class="section-empty">${safe(shown.length?ts('emptyCases'):tr('Cazurile clinice vor apărea aici după publicarea lor de către clinică.'))}</div>`;
 qsa('.compare-range',container).forEach(range=>range.addEventListener('input',()=>range.closest('.compare').style.setProperty('--pos',range.value+'%')));
 qsa('[data-filter]',filters).forEach(b=>b.addEventListener('click',()=>{selectedCategory=b.dataset.filter;renderCases();}));
}
function renderReviews(){
 const container=qs('#reviews-list');if(!container||!cms)return;
 const reviews=(cms.reviews||[]).filter(r=>r.published&&r.text&&r.author);
 container.innerHTML=reviews.length?reviews.map(r=>`<article class="review-card"><div class="review-stars" aria-label="${safe(String(r.rating))} / 5">${'★'.repeat(Math.max(1,Math.min(5,Number(r.rating)||5)))}${'☆'.repeat(5-Math.max(1,Math.min(5,Number(r.rating)||5)))}</div><blockquote>${safe(r.text)}</blockquote><div class="review-author">${safe(r.author)}</div></article>`).join(''):`<div class="section-empty">${safe(ts('emptyReviews'))}</div>`;
}
qsa('[data-lang]').forEach(b=>b.addEventListener('click',()=>{
 language=b.dataset.lang;try{localStorage.setItem(localeKey,language)}catch(e){}
 translateStatic();fillCms();
}));
qs('#open-review-form')?.addEventListener('click',()=>{const f=qs('#review-form');f.hidden=false;f.scrollIntoView({behavior:'smooth',block:'center'});qs('[name="author"]',f)?.focus();});
qs('.review-form-close')?.addEventListener('click',()=>{qs('#review-form').hidden=true;});
qs('#review-form')?.addEventListener('submit',e=>{
 const form=e.currentTarget,feedback=qs('#review-feedback');
 const email=cms?.general?.email;
 if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
   e.preventDefault();feedback.textContent=ts('fail');return;
 }
 // FormSubmit sends clinic an email; the clinic approves and manually publishes in Pages CMS.
 // No patient review is directly written to GitHub or automatically published.
 form.action='https://formsubmit.co/'+email;
});
translateStatic();
(async()=>{
 try{
  const paths=['general','services','team','cases','reviews'];
  const responses=await Promise.all(paths.map(k=>fetch('content/'+k+'.json',{cache:'no-cache'})));
  for(const r of responses)if(!r.ok)throw Error('Conținut indisponibil: '+r.url);
  const values=await Promise.all(responses.map(r=>r.json()));
  cms=Object.fromEntries(paths.map((k,i)=>[k,values[i]]));
  fillCms();
 }catch(err){
  console.error('JoianDent: eroare la încărcarea conținutului Pages CMS',err);
  const list=qs('#cases-list');if(list)list.innerHTML='<div class="section-empty">Conținutul site-ului nu este disponibil momentan.</div>';
  const reviews=qs('#reviews-list');if(reviews)reviews.innerHTML='<div class="section-empty">Recenziile nu sunt disponibile momentan.</div>';
 }
})();
})();
