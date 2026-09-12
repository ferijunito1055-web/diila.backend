const { supabase } = require('../../lib/supabase');
const { allowCors } = require('../../lib/cors');
 
function toDb(o) {
  return {
    id: o.id,
    company_id: o.companyId,
    company_name: o.companyName,
    title: o.title,
    discount_label: o.discountLabel,
    description: o.description,
    image_url: o.imageUrl,
    category: o.category,
    price: o.price,
    quantity: o.quantity,
    expires_at: o.expiresAt,
    created_at: o.createdAt
  };
}
 
function fromDb(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    title: row.title,
    discountLabel: row.discount_label,
    description: row.description,
    imageUrl: row.image_url,
    category: row.category,
    price: row.price,
    quantity: row.quantity,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
}
 
module.exports = async (req, res) => {
  if (allowCors(req, res)) return;
 
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('offers').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(fromDb));
  }
 
  if (req.method === 'POST') {
    const row = toDb(req.body);
    const { error } = await supabase.from('offers').upsert(row);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }
 
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id puuttuu.' });
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }
 
  return res.status(405).json({ error: 'Menetelmää ei tueta.' });
};
 
