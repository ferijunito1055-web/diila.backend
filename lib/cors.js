// Sallii Diila-sivun (eri osoitteesta) kutsua näitä API-reittejä.
// Käytä tätä jokaisen reitin alussa.

function allowCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // kertoo kutsujalle että pyyntö on jo käsitelty
  }
  return false;
}

module.exports = { allowCors };
