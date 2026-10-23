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
