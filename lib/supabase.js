// Yhteinen Supabase-yhteys, jota kaikki API-reitit käyttävät.
// Käyttää SECRET-avainta (ei koskaan selaimeen), joten se ohittaa
// Row Level Security -asetukset ja saa täyden pääsyn tietokantaan.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

module.exports = { supabase };
