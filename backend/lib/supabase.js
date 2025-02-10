require("dotenv").config(); // 🔥 Carica dotenv prima di tutto
const { createClient } = require("@supabase/supabase-js");
const supUrl = process.env.SUPABASE_URL; // Corretto
const supAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Aggiunto per coerenza
const SUPABASE_URL = supUrl;
const SUPABASE_SERVICE_ROLE_KEY =supAnonKey;

if (!supUrl || !supAnonKey) {
    throw new Error("⚠️ Errore: SUPABASE_URL o SUPABASE_ANON_KEY mancanti!");
  }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

module.exports = { supabase };



