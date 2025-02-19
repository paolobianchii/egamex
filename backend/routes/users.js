const express = require("express");
const { supabase } = require("../lib/supabase");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const router = express.Router();

// 1️⃣ Ottieni tutti gli utenti
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Errore durante la ricerca degli utenti" });
  }
});

// 2️⃣ Ottieni un utente per ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero dell'utente" });
  }
});

// 6️⃣ Ottieni il ruolo dell'utente tramite JWT
// Endpoint per ottenere il ruolo dell'utente
router.get("/role", async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Token mancante" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decoded.userId;

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json({ role: data.role });
  } catch (error) {
    console.error("Errore nel recupero del ruolo:", error.message);
    res.status(500).json({ error: "Errore durante il recupero del ruolo dell'utente" });
  }
});



// REGISTRAZIONE UTENTE
router.post("/register", async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: "Email, password e username sono richiesti" });
  }

  try {
    // Cifra la password prima di salvarla (opzionale, ma raccomandato)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea un nuovo utente in Supabase Authentication
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: hashedPassword, // Usa la password cifrata
    });

    if (signUpError) {
      return res.status(400).json({ error: signUpError.message });
    }

    const userId = authData.user?.id; // Ottieni l'UUID assegnato da Supabase

    if (!userId) {
      return res.status(500).json({ error: "Errore durante la registrazione dell'utente." });
    }

    // Salva l'utente nel database
    const { error: insertError } = await supabase.from("users").insert([
      { id: userId, username, email }
    ]);

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.status(201).json({ message: "Utente registrato con successo", userId });
  } catch (error) {
    console.error("Errore registrazione:", error.message);
    res.status(500).json({ error: "Errore durante la registrazione" });
  }
});

// LOGIN UTENTE
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e password sono richiesti" });
  }

  try {
    // Effettua il login con Supabase Authentication
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !authData.user) {
      return res.status(400).json({ error: "Credenziali non valide." });
    }

    const userId = authData.user.id;
    console.log("UserID from Supabase Authentication:", userId);

    // Recupera informazioni aggiuntive dal database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("username, email")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return res.status(500).json({ error: "Errore nel recupero dei dati utente." });
    }

    // Genera il token JWT
    const token = jwt.sign(
      { userId, email: userData.email, username: userData.username },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login effettuato con successo!",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Errore login:", error.message);
    res.status(500).json({ error: "Errore durante il login" });
  }
});

// 4️⃣ Modifica un utente
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  try {
    const { data, error } = await supabase
      .from("users")
      .update({ username, email, role })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Errore durante la modifica dell'utente" });
  }
});

// 5️⃣ Elimina un utente
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: "Utente eliminato con successo" });
  } catch (error) {
    res.status(500).json({ error: "Errore durante l'eliminazione dell'utente" });
  }
});

module.exports = router;
