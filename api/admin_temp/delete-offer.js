const { supabase } = require('../../lib/supabase');
const { allowCors } = require('../../lib/cors');

// Tämä on se paikka missä admin-oikeus TARKISTETAAN OIKEASTI.
// ADMIN_SECRET on vain palvelimella, selain ei koskaan näe sitä.
module.exports = async (req, res) => {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Menetelmää ei tueta.' });

  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Väärä admin-avain.' });
  }

  const { offerId } = req.body;
  if (!offerId) return res.status(400).json({ error: 'offerId puuttuu.' });

  const { error } = await supabase.from('offers').delete().eq('id', offerId);
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
};
