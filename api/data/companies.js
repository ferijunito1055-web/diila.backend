const { supabase } = require('../../lib/supabase');
const { allowCors } = require('../../lib/cors');
 
function toDb(c) {
  return {
    id: c.id,
    name: c.name,
    business_id: c.businessId,
    email: c.email,
    password: c.password,
    phone: c.phone,
    city: c.city,
    address: c.address,
    subscription_active: c.subscriptionActive,
    subscription_method: c.subscriptionMethod,
    trial_used: c.trialUsed,
    trial_ends_at: c.trialEndsAt,
    stripe_account_id: c.stripeAccountId,
    joined_at: c.joinedAt
  };
}
 
function fromDb(row) {
  return {
    id: row.id,
    name: row.name,
    businessId: row.business_id,
    email: row.email,
    password: row.password,
    phone: row.phone,
    city: row.city,
    address: row.address,
    subscriptionActive: row.subscription_active,
    subscriptionMethod: row.subscription_method,
    trialUsed: row.trial_used,
    trialEndsAt: row.trial_ends_at,
    stripeAccountId: row.stripe_account_id,
    joinedAt: row.joined_at
  };
}
 
module.exports = async (req, res) => {
  if (allowCors(req, res)) return;
 
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(fromDb));
  }
 
  if (req.method === 'POST') {
    const row = toDb(req.body);
    const { error } = await supabase.from('companies').upsert(row);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }
 
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id puuttuu.' });
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }
 
  return res.status(405).json({ error: 'Menetelmää ei tueta.' });
};
 
