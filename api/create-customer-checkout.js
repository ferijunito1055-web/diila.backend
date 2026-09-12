// POST /api/create-customer-checkout
//
// Kutsutaan kun asiakas painaa "Siirry maksamaan" ostoskorissa.
//
// TÄRKEÄ RAJOITUS: Stripe voi jakaa YHDEN maksun vain YHDELLE
// yritykselle kerrallaan (transfer_data.destination hyväksyy vain
// yhden tilin). Jos ostoskorissa on tarjouksia usealta eri
// yritykseltä, frontendin pitää kutsua tätä osoitetta ERIKSEEN
// jokaiselle yritykselle (eli ryhmittele ostoskori yrityksittäin
// ennen kutsua). Tämä on tietoinen yksinkertaistus - oikeassa
// isossa palvelussa tähän käytetään esim. useampaa PaymentIntentiä
// samassa "kaupassa" tai kerätään raha ensin Diilan tilille ja
// jaetaan erillisillä Transfer-kutsuilla myöhemmin.
//
// Body (JSON):
// {
//   customerId, customerEmail,
//   companyStripeAccountId,     // yrityksen Connect-tili (acct_...)
//   items: [{ offerId, title, unitPriceCents, qty }]
// }

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-pyynnöt sallittu.' });
  }

  try {
    const { customerId, customerEmail, companyStripeAccountId, items } = req.body || {};

    if (!customerId || !companyStripeAccountId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'customerId, companyStripeAccountId ja items vaaditaan.' });
    }

    const line_items = items.map((it) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: it.title },
        unit_amount: it.unitPriceCents, // hinta senteissä, esim. 3.50 EUR = 350
      },
      quantity: it.qty,
    }));

    const totalCents = items.reduce((sum, it) => sum + it.unitPriceCents * it.qty, 0);
    const feePercent = Number(process.env.PLATFORM_FEE_PERCENT || 10);
    const applicationFeeCents = Math.round((totalCents * feePercent) / 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      line_items,
      payment_intent_data: {
        // Diila pidättää tämän summan itselleen, loppu menee suoraan
        // yrityksen omalle Stripe-tilille.
        application_fee_amount: applicationFeeCents,
        transfer_data: {
          destination: companyStripeAccountId,
        },
      },
      metadata: {
        customerId,
        // Tallenna ostoskorin rivit JSON-muodossa metadataan, jotta
        // webhook voi generoida oikeat lunastuskoodit ostoksen
        // vahvistuttua. Stripen metadata-kentän maksimikoko on rajattu
        // (500 merkkiä per arvo), joten isoilla ostoksilla kannattaa
        // tallentaa vain offerId+qty-parit, ei koko tuotenimiä.
        cartSummary: JSON.stringify(items.map((it) => ({ offerId: it.offerId, qty: it.qty }))),
      },
      success_url: `${process.env.FRONTEND_URL}/?osto=onnistui`,
      cancel_url: `${process.env.FRONTEND_URL}/?osto=peruttu`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-customer-checkout virhe:', err);
    return res.status(500).json({ error: 'Maksusession luonti epäonnistui.' });
  }
};
