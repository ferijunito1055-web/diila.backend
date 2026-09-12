const { supabase } = require('../../lib/supabase');
const { allowCors } = require('../../lib/cors');

module.exports = async (req, res) => {
  if (allowCors(req, res)) return;

  if (req.method === 'POST') {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Sähköposti puuttuu.' });
    const { error } = await supabase
      .from('newsletter')
      .upsert({ email, created_at: Date.now() });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Menetelmää ei tueta.' });
};
