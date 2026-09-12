// POST /api/webhook
//
// Stripe kutsuu tätä osoitetta automaattisesti kun jotain tapahtuu
// (maksu onnistui, tilaus peruttiin, jne). Tämä on TÄRKEIN tiedosto
// turvallisuuden kannalta: vasta kun Stripe vahvistaa maksun TÄÄLLÄ,
// palvelin saa merkitä tilauksen/lunastuksen maksetuksi. Älä koskaan
// luota pelkkään selaimen ilmoitukseen "maksu onnistui".
//
// Asetukset Stripe Dashboardissa:
//   Developers -> Webhooks -> Add endpoint
//   URL: https://sinun-projektisi.vercel.app/api/webhook
//   Events: checkout.session.completed, invoice.payment_failed,
//           customer.subscription.deleted

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Vercel parsii JSON-bodyn automaattisesti oletuksena, mutta Stripen
// allekirjoituksen tarkistus vaatii RAAKAN, käsittelemättömän bodyn.
// Tämä rivi kytkee automaattisen parsinnan pois vain tälle reitille.
module.exports.config = {
  api: { bodyParser: false },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhookin allekirjoitus ei täsmää:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      if (session.mode === 'subscription') {
        const companyId = session.metadata && session.metadata.companyId;
        console.log('Yrityksen tilaus aktivoitu, companyId:', companyId);
        // TODO (tietokantaan):
        //   UPDATE companies SET subscription_active = true,
        //     stripe_subscription_id = session.subscription
        //   WHERE id = companyId
      }

      if (session.mode === 'payment') {
        const customerId = session.metadata && session.metadata.customerId;
        let cart = [];
        try {
          cart = JSON.parse((session.metadata && session.metadata.cartSummary) || '[]');
        } catch (e) {
          console.error('cartSummary-metadatan luku epäonnistui:', e);
        }
        console.log('Asiakkaan maksu onnistui, customerId:', customerId, 'rivit:', cart);
        // TODO (tietokantaan), tee TÄSSÄ eikä selaimessa, jotta koodeja
        // ei voi väärentää:
        //   for each item in cart:
        //     INSERT INTO redemptions (code, offer_id, qty, customer_id, paid, ...)
        //     VALUES (generateCode(), item.offerId, item.qty, customerId, true, ...)
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.log('Laskun veloitus epäonnistui, subscription:', invoice.subscription);
      // TODO: merkitse yrityksen tilaus ei-aktiiviseksi tietokannassa.
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const companyId = subscription.metadata && subscription.metadata.companyId;
      console.log('Tilaus peruttu, companyId:', companyId);
      // TODO: merkitse yrityksen tilaus ei-aktiiviseksi tietokannassa.
      break;
    }

    default:
      // Muut tapahtumat voi jättää huomiotta.
      break;
  }

  return res.status(200).json({ received: true });
};
