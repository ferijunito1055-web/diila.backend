# Diila-backend

Pieni Node.js-backend, joka hoitaa oikeat Stripe-maksut Diila-sivustolle:
yritysten kuukausitilauksen (8,99 €/kk) ja asiakkaiden kuponkiostot.

Tarkoitettu vietäväksi **Verceliin**, mutta toimii yhtä lailla missä
tahansa Node.js-ympäristössä (Render, Railway jne.) pienin muutoksin.

## Mitä tässä on ja mitä EI ole

Mukana:
- `api/create-company-subscription.js` — yrityksen kuukausitilauksen maksusivu
- `api/create-connect-account.js` — yrityksen liittäminen Stripeen niin että se voi vastaanottaa rahaa
- `api/create-customer-checkout.js` — asiakkaan kuponkioston maksusivu
- `api/webhook.js` — vahvistaa maksut turvallisesti Stripen puolelta

EI mukana (pitää lisätä itse, tai pyytää minua tekemään ne seuraavaksi):
- **Oikea tietokanta.** Koodissa on `TODO`-kommentit kohdissa, joissa
  pitäisi tallentaa tieto pysyvästi (esim. "yrityksen tilaus on nyt
  aktiivinen"). Juuri nyt ne vain kirjoittavat konsoliin
  (`console.log`). Ilman tietokantaa tieto katoaa heti. Suosittelen
  esim. **Supabase**tai **Vercel Postgres** -aloitukseen, koska
  molemmat toimivat helposti Vercelin kanssa ja niissä on ilmainen taso.
- **Kirjautuminen/sessiot palvelimella.** Diilan nykyinen kirjautuminen
  on vain selaimen muistissa (demo). Oikeassa versiossa myös
  kirjautuminen pitäisi siirtää palvelimelle.
- Monen yrityksen ostoskori yhdellä maksulla — ks. kommentti
  `create-customer-checkout.js`-tiedostossa.

## 1. Asenna riippuvuudet

```bash
npm install
```

## 2. Luo Stripe-tili ja hae avaimet

1. Rekisteröidy [stripe.com](https://stripe.com)
2. Dashboard → Developers → API keys → kopioi **Secret key** (aloita
   test-avaimella `sk_test_...`, ei oikealla rahalla vielä)
3. Jos aiot käyttää Stripe Connectia (raha suoraan yrityksille), käy
   ottamassa Connect käyttöön: Dashboard → Connect → Get started

## 3. Aseta ympäristömuuttujat

Kopioi `.env.example` nimelle `.env` ja täytä arvot paikallista
testausta varten. **Älä koskaan committaa `.env`-tiedostoa GitHubiin**
(se on jo `.gitignore`ssa).

## 4. Testaa paikallisesti (valinnainen mutta suositeltu)

```bash
npm install -g vercel
vercel dev
```

Tämä käynnistää palvelimen osoitteeseen `http://localhost:3000`.
Testaa webhookia paikallisesti Stripe CLI:llä:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Komento tulostaa oman `whsec_...`-arvon — käytä sitä `.env`-tiedoston
`STRIPE_WEBHOOK_SECRET`-arvona paikallisessa testauksessa.

## 5. Vie GitHubiin

```bash
git init
git add .
git commit -m "Diila backend"
```

Luo uusi tyhjä repositorio GitHubissa ja seuraa sen antamia ohjeita
("push an existing repository").

## 6. Julkaise Verceliin

1. Mene [vercel.com](https://vercel.com), kirjaudu GitHub-tilillä
2. "Add New" → "Project" → valitse juuri luomasi repositorio
3. Vercel tunnistaa `api/`-kansion automaattisesti — ei erillisiä
   asetuksia tarvita
4. **Ennen julkaisua**: Project Settings → Environment Variables →
   lisää samat muuttujat kuin `.env.example`-tiedostossa (paitsi
   `STRIPE_WEBHOOK_SECRET`, joka tulee vasta seuraavassa vaiheessa)
5. Paina "Deploy"

Saat osoitteen kuten `https://diila-backend.vercel.app`.

## 7. Luo oikea webhook Stripe Dashboardissa

1. Dashboard → Developers → Webhooks → "Add endpoint"
2. URL: `https://diila-backend.vercel.app/api/webhook`
3. Valitse tapahtumat: `checkout.session.completed`,
   `invoice.payment_failed`, `customer.subscription.deleted`
4. Kopioi annettu **Signing secret** (`whsec_...`)
5. Lisää se Verceliin: Project Settings → Environment Variables →
   `STRIPE_WEBHOOK_SECRET` → tallenna → julkaise projekti uudelleen
   (Deployments → ... → Redeploy), jotta muutos tulee voimaan

## 8. Yhdistä Diila-sivu tähän backendiin

Diila-sivun nykyinen koodi (`confirmPayment`, `confirmCheckout`
-funktiot) tekee maksun kokonaan selaimessa demona. Ne pitää korvata
kutsuilla tähän backendiin, esim.:

```javascript
async function confirmPayment() {
  const response = await fetch('https://diila-backend.vercel.app/api/create-company-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyId: state.currentCompany.id,
      businessId: state.currentCompany.businessId,
      email: state.currentCompany.email,
      companyName: state.currentCompany.name,
    }),
  });
  const data = await response.json();
  window.location.href = data.url; // ohjaa asiakkaan Stripen maksusivulle
}
```

Kun maksu onnistuu, Stripe ohjaa käyttäjän takaisin `FRONTEND_URL`-osoitteeseesi,
ja **webhook** (ei selain) on se, joka oikeasti vahvistaa maksun palvelimella.

## Seuraavat askeleet, jos haluat jatkaa

- Pyydä minua lisäämään tietokantayhteys (esim. Supabase) niin että
  `TODO`-kohdat oikeasti tallentavat tiedon pysyvästi
- Pyydä minua päivittämään itse Diila-sivun koodi käyttämään näitä
  osoitteita demotoiminnon sijaan
