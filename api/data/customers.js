const { supabase } = require('../../lib/supabase');
const { allowCors } = require('../../lib/cors');

function toDb(c) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    password: c.password,
    favorites: c.favorites || [],
    cart: c.cart || [],
    joined_at: c.joinedAt
  };
}

function fromDb(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    favorites: row.favorites || [],
    cart: row.cart || [],
    joinedAt: row.joined_at
  };
}

module.exports = async (req, res) => {
  if (allowCors(req, res)) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(fromDb));
  }

  if (req.method === 'POST') {
    const row = toDb(req.body);
    const { error } = await supabase.from('customers').upsert(row);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Menetelmää ei tueta.' });
};
