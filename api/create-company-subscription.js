// POST /api/create-company-subscription
//
// Kutsutaan kun yritys painaa "Aktivoi tilaus" Diila-sivulla.
// Luo Stripe Checkout -session kuukausitilaukselle (8,99 EUR / kk) ja
// palauttaa osoitteen, jonne selain ohjataan maksamaan.
//
// Body (JSON): { companyId, businessId, email, companyName }

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-pyynnöt sallittu.' });
  }

  try {
    const { companyId, businessId, email, companyName } = req.body || {};

    if (!companyId || !email) {
      return res.status(400).json({ error: 'companyId ja email vaaditaan.' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Diila Yritys -tilaus',
              description: companyName ? `Kuukausitilaus: ${companyName}` : 'Kuukausitilaus',
            },
            unit_amount: 899, // 8,99 EUR senteissä
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      // metadata kulkee mukana webhookiin asti, jotta tiedämme kenen
      // tilaus juuri aktivoitui
      metadata: { companyId, businessId: businessId || '' },
      subscription_data: {
        metadata: { companyId, businessId: businessId || '' },
      },
      success_url: `${process.env.FRONTEND_URL}/?tilaus=onnistui&companyId=${companyId}`,
      cancel_url: `${process.env.FRONTEND_URL}/?tilaus=peruttu`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-company-subscription virhe:', err);
    return res.status(500).json({ error: 'Maksusession luonti epäonnistui.' });
  }
};
