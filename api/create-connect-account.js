// POST /api/create-connect-account
//
// Tätä tarvitaan VAIN jos haluat että asiakkaan maksama kupongin hinta
// menee oikeasti suoraan yritykselle (Diila pidättää oman palkkionsa).
// Ilman tätä kaikki raha jäisi vain Diilan omalle Stripe-tilille.
//
// Kutsutaan esim. kun yritys rekisteröityy tai ensimmäistä kertaa
// lisää maksullisen tarjouksen. Luo yritykselle oman "Stripe Express"
// -alitilin ja palauttaa linkin, jonne yritys ohjataan täyttämään
// omat pankkitietonsa ja henkilöllisyytensä (Stripen omalla lomakkeella).
//
// Body (JSON): { companyId, email, country }  // country esim. "FI"

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-pyynnöt sallittu.' });
  }

  try {
    const { companyId, email, country } = req.body || {};
    if (!companyId || !email) {
      return res.status(400).json({ error: 'companyId ja email vaaditaan.' });
    }

    // Luo yritykselle oma Stripe-alitili (Express = Stripe hoitaa
    // suurimman osan käyttöliittymästä puolestasi).
    const account = await stripe.accounts.create({
      type: 'express',
      country: country || 'FI',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { companyId },
    });

    // Linkki, jonne yritys ohjataan täyttämään tietonsa Stripelle.
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/?connect=uudelleen`,
      return_url: `${process.env.FRONTEND_URL}/?connect=valmis&companyId=${companyId}`,
      type: 'account_onboarding',
    });

    // TÄRKEÄÄ: tallenna account.id (esim. "acct_1AbC...") yrityksen
    // tietoihin omassa tietokannassasi — sitä tarvitaan joka ikisessä
    // myöhemmässä maksussa (ks. create-customer-checkout.js).
    // Tässä esimerkissä palautetaan se suoraan frontendille, jotta
    // näet arvon — oikeassa versiossa se pitäisi tallentaa serverillä.
    return res.status(200).json({
      url: accountLink.url,
      stripeAccountId: account.id,
    });
  } catch (err) {
    console.error('create-connect-account virhe:', err);
    return res.status(500).json({ error: 'Yritystilin luonti epäonnistui.' });
  }
};
