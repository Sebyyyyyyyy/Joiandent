# JoianDent V2.5 — Pages CMS (fără PHP)

Aceasta este o versiune a site-ului JoianDent pregătită pentru **GitHub + Pages CMS + Cloudflare Pages**. Am păstrat codul vizual și fotografiile din V2.4.1 (inclusiv dr. Cristian, dr. Nicolae, prima fotografie de la clinică, meniul lizibil la 16px și titlurile uniforme). Implantologia și Ortodonția rămân în categorii.

## Ce poți edita din Pages CMS

- **01 · Informații și prima pagină:** titlu, introducere, descrierea clinicii, fotografie principală, telefon, email, adresă, orar, traduceri RO/RU/EN.
- **02 · Servicii:** adăugare, modificare, ștergere și ordonare; denumiri/descripții traduse.
- **03 · Echipa:** membri, fotografii, nume, roluri, detalii grup; imagini originale, fără recomprimare realizată de site.
- **04 · Înainte și După:** fotografii, descrieri, categorii, acord pentru publicare, vizibilitate pe site. Se afișează numai când `consent: true` și `published: true`, și când ambele fotografii sunt prezente.
- **05 · Recenzii aprobate:** adaugi manual recenzii autentice și le publici după verificare. Nu publica date medicale.

Structura de administrare este în `.pages.yml`; conținutul este în `content/*.json`. Fotografiile merg în `assets/`. La salvare, Pages CMS face commit în GitHub, apoi Cloudflare Pages publică versiunea nouă. Nu este necesară bază de date proprie sau PHP.

## Pași de instalare — fără a afecta site-ul public

1. **Fă backup** la repository-ul existent și la versiunea live, înainte de modificări.
2. **Creează o ramură GitHub nouă**, de exemplu `joiandent-v25-test`. Urcă **conținutul** acestei arhive în rădăcina acelei ramuri, inclusiv fișierul ascuns `.pages.yml`. Nu înlocui automat ramura care publică site-ul.
3. Intră pe **https://app.pagescms.org/**, autentifică-te cu GitHub, autorizează Pages CMS doar pentru repository-ul JoianDent și deschide **ramura de test**. Pages CMS va citi `.pages.yml`.
4. Pentru a vedea site-ul, conectează repository-ul într-un proiect de test Cloudflare Pages, configurat pe ramura `joiandent-v25-test`. **Build command: gol**; **output folder: `/`** (rădăcina proiectului) pentru acest site static. Folosește subdomeniul temporar `*.pages.dev` oferit de Cloudflare.
5. Testează separat RO/RU/EN, navigația, formularele, editarea conținutului și încărcarea fotografiilor, pe desktop și mobil. FormSubmit poate cere o confirmare inițială a adresei prin email. Nu trimite date personale reale în teste.
6. **Nu modifica DNS sau `joiandent.md` înainte ca versiunea de test să fie aprobată.** Migrarea domeniului se face doar după backup și testare, cu posibilitate de revenire la versiunea veche.

> **Important**: un repository public expune conținutul JSON și fotografiile în GitHub. Datele din `content/*.json` sunt intenționat publice și nu trebuie să conțină informații confidențiale. În special, nu salva recenzii private sau neaprobate în ele.

## Recenzii fără backend

Formularul „Lasă o recenzie” trimite un email clinicii prin **FormSubmit**, nu postează automat în Pages CMS. După primirea recenziei, clinica decide dacă poate fi publicată, apoi o adaugă manual din secțiunea „Recenzii aprobate” în Pages CMS. Aceasta **nu este o coadă automată de aprobare**; pentru automatizare completă ar fi nevoie de un serviciu server-side.

Recenziile și cazurile clinice pornesc goale. Nu am creat recenzii fictive sau exemple înainte/după inventate. Publică doar cu acordul persoanei când este necesar. Adaugă o politică de confidențialitate corectă înainte de a colecta formulare publice.

## Actualizări și limite

- Pagina de intrare către administrare este `/admin/`, dar **panoul efectiv este Pages CMS** (aplicație externă); nu există login local sau „parolă admin” în site.
- Traducerile principalelor texte ale clinicii și ale conținutului sunt editabile; etichetele comune ale interfeței (buton, meniu) sunt traduse în JS și necesită actualizare de cod dacă vrei să le modifici.
- Schimbări majore de layout sau funcții necesită în continuare modificări în codul HTML/CSS/JS.
- Fotografiile salvate în GitHub pot mări repository-ul; recomand fișiere clare, dar rezonabil optimizate pentru web. Site-ul nu le recomprimă automat.
- Formularele de contact și programări folosesc și ele FormSubmit (serviciu extern, cu condițiile și limitele lui).
- Politica Vercel Hobby pentru site-uri comerciale poate impune alt plan; Cloudflare Pages este opțiunea recomandată după verificarea termenilor curenți.

## Previzualizare locală

Nu deschide `index.html` direct prin `file://`, deoarece browserul restricționează `fetch()` pentru fișiere JSON. Pornește un server static local în folderul site-ului:

```bash
python -m http.server 8000
```

apoi deschide `http://localhost:8000/`.

## Structura

- `.pages.yml`: câmpuri editable în Pages CMS
- `content/general.json`: text, contact, fotografie principală
- `content/services.json`: servicii
- `content/team.json`: echipă
- `content/cases.json`: cazuri înainte/după
- `content/reviews.json`: recenzii aprobate
- `assets/`: fotografii și logo-uri
- `enhancements.js`: legătura între fișierele JSON și site-ul public, traduceri și slider
- `admin/index.html`: acces rapid la aplicația Pages CMS

**Nu s-a făcut nicio publicare pe GitHub, Cloudflare sau `joiandent.md` prin această arhivă.**


## Panou propriu JoianDent — acces administrator și editor (V2.5-test)

Interfața nouă este \`/admin/\` și API-ul său Cloudflare Pages Functions este \`/api/admin\`.
Este o versiune **de test**, nu activa niciun domeniu public înaintea configurării.

**Conturi separate**
- \`OWNER_EMAIL\`: adresa administratorului principal (o singură adresă).
- \`EDITOR_EMAILS\`: adresele colaboratorilor JoianDent, separate prin virgulă.
- Nu folosi aceeași parolă pentru toți; autentificarea este gestionată prin Cloudflare Zero Trust Access (politici de acces pentru exact adresele permise).
- În această versiune administratorul și editorii pot modifica aceleași 5 categorii. Administratorul controlează lista de adrese permise și secretele numai din Cloudflare, nu din panou.

**Configurare Cloudflare (înainte să funcționeze):**
1. Creează un proiect **Cloudflare Pages de test**, conectat la ramura \`joiandent-v2.5\`, fără domeniul \`joiandent.md\`. Site static, fără comandă de build, director de ieșire rădăcina proiectului. Funcțiile din \`functions/\` trebuie să ruleze pe Cloudflare Pages, nu pe Vercel.
2. Configurează **Cloudflare Access** pentru **ambele** căi: \`/admin/*\` și \`/api/admin*\` ale domeniului de test. Doar adresele autorizate pot trece de acces. Pentru a identifica conturile API-ul verifică criptografic semnătura JWT Access, audiența, expirarea și emailul.
3. În setările Pages pentru mediul Preview setează variabilele \`CF_ACCESS_TEAM_DOMAIN\` (de ex. \`clinica.cloudflareaccess.com\`) și \`CF_ACCESS_AUD\` (audiența JWT a aplicației Access), \`OWNER_EMAIL\`, \`EDITOR_EMAILS\`, \`GH_REPO=Sebyyyyyyyy/Joiandent\` și \`GH_BRANCH=joiandent-v2.5\`. Configurează \`GH_TOKEN\` ca **secret criptat**, nu în GitHub. Tokenul trebuie să permită doar accesul necesar la repository și la fișierele sale. Nu publica sau trimite tokenuri în conversații.
4. Lasă \`ALLOW_PRODUCTION_WRITES\` nedefinit, astfel încât aplicația să refuze explicit scrierea directă pe \`main\` sau \`master\`.
5. Testează cu contul principal și cu un cont editor: autentificare, modificări conținut, imagini, recenzii, revenire la commit anterior. Nu folosi date reale ale pacienților în test.

**Notă:** datele din \`content/*.json\` și imaginile \`assets/\` sunt vizibile în repository-ul public. Publică numai recenzii aprobate și cazuri cu acord documentat. Nu stoca fișe medicale, date sensibile sau cereri private în GitHub.

**Limitări:** loginul Cloudflare necesită configurarea ta a celor două conturi/permisiuni și a secretelor. Fără ele API-ul răspunde cu indisponibil, iar panoul nu poate salva. Pages CMS extern rămâne disponibil ca alternativă pentru editarea directă din GitHub.


## Vizibilitatea secțiunii Înainte / După

Secțiunea este ascunsă implicit în V2.5, inclusiv legătura sa din meniul site-ului. Controlul se află în panoul propriu `/admin/` → `Înainte / După` → `Afișează secțiunea` → `Salvează afișarea`. Se poate modifica și în Pages CMS, la `Informații și prima pagină` → `Afișează secțiunea Înainte / După`.

Chiar dacă administratorul o activează, secțiunea rămâne ascunsă până când există cel puțin un caz clinic complet, cu imagini înainte/după, marcat ca publicat și cu acordul pacientului. Editorii pot pregăti cazurile fără publicare; activarea nu dezvăluie automat cazuri incomplete. Ambele operațiuni din panoul propriu necesită autentificarea Cloudflare Access și configurarea secretelor GitHub.

## Comutatoare ON/OFF pentru toate secțiunile

În panoul propriu `/admin/` → **Vizibilitatea secțiunilor** există comutatoare individuale pentru Prima pagină, Introducere, Servicii, Despre clinică, Echipa, Înainte / După, Recenzii, Contact și hartă și Program/informații din subsol. După schimbarea fiecărui comutator se apasă **Salvează modificările**. Informația ascunsă rămâne salvată în fișiere, inclusiv fotografiile și traducerile.

La dezactivare, pagina publică ascunde secțiunea și legătura ei din meniul principal (dacă există); logo-ul, antetul și structura de bază a subsolului rămân accesibile. Comutatoarele sunt disponibile și în Pages CMS, la **Informații și prima pagină → Vizibilitatea secțiunilor**.

**Stări implicite:** toate secțiunile vizibile, cu excepția „Înainte / După”, care rămâne inițial ascunsă și necesită un caz cu două poze, `consent: true` și `published: true` înainte să poată fi văzută de vizitatori.

Modificările rămân pe ramura `joiandent-v2.5`, până la testarea și publicarea aprobată a site-ului principal.
