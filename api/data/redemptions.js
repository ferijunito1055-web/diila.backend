const { supabase } = require('../../lib/supabase');
const { allowCors } = require('../../lib/cors');

function toDb(r) {
  return {
    id: r.id,
    code: r.code,
    offer_id: r.offerId,
    offer_title: r.offerTitle,
    discount_label: r.discountLabel,
    customer_id: r.customerId,
    customer_name: r.customerName,
    company_id: r.companyId,
    company_name: r.companyName,
    qty: r.qty,
    unit_price: r.unitPrice,
    amount_paid: r.amountPaid,
    paid: r.paid,
    payment_method: r.paymentMethod,
    redeemed_at: r.redeemedAt,
    created_at: r.createdAt
  };
}

function fromDb(row) {
  return {
    id: row.id,
    code: row.code,
    offerId: row.offer_id,
    offerTitle: row.offer_title,
    discountLabel: row.discount_label,
    customerId: row.customer_id,
    customerName: row.customer_name,
    companyId: row.company_id,
    companyName: row.company_name,
    qty: row.qty,
    unitPrice: row.unit_price,
    amountPaid: row.amount_paid,
    paid: row.paid,
    paymentMethod: row.payment_method,
    redeemedAt: row.redeemed_at,
    createdAt: row.created_at
  };
}

module.exports = async (req, res) => {
  if (allowCors(req, res)) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('redemptions').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(fromDb));
  }

  if (req.method === 'POST') {
    const row = toDb(req.body);
    const { error } = await supabase.from('redemptions').upsert(row);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Menetelmää ei tueta.' });
};
