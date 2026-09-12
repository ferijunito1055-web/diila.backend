const { supabase } = require('../../lib/supabase');
const { allowCors } = require('../../lib/cors');

module.exports = async (req, res) => {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Menetelmää ei tueta.' });

  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Väärä admin-avain.' });
  }

  const { companyId } = req.body;
  if (!companyId) return res.status(400).json({ error: 'companyId puuttuu.' });

  // offers-taulu on liitetty companies-tauluun "on delete cascade" -säännöllä,
  // joten yrityksen poisto poistaa automaattisesti myös sen tarjoukset.
  const { error } = await supabase.from('companies').delete().eq('id', companyId);
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
};
