const express = require("express");
const { supabase } = require("../lib/supabase");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");



const router = express.Router();


const saltRounds = 10; // Numero di cicli per l'hashing della password

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
// REGISTRAZIONE UTENTE
router.post("/register", async (req, res) => {
  const { email, password, username, role } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: "Email, password e username sono richiesti" });
  }

  try {
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: "Un utente con questa email esiste già" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      return res.status(400).json({ error: signUpError.message });
    }

    if (!authData || !authData.user || !authData.user.id) {
      return res.status(500).json({ error: "Errore durante la registrazione" });
    }

    const userId = authData.user.id;
    console.log("Utente creato in Auth con ID:", userId);

    const userData = { 
      id: userId, 
      username, 
      email,
      password: hashedPassword,
      role: role || 'user'
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert([userData])
      .select();

    if (insertError) {
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: "Errore nell'inserimento dell'utente" });
    }

    res.status(201).json({ 
      message: "Utente registrato con successo", 
      user: {
        id: userId,
        username,
        email,
        role: userData.role
      }
    });
  } catch (error) {
    console.error("Errore registrazione:", error);
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
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, username, email, password, role")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      return res.status(400).json({ error: "Credenziali non valide." });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Credenziali non valide." });
    }

    const token = jwt.sign(
      { 
        userId: userData.id, 
        email: userData.email, 
        username: userData.username,
        role: userData.role 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login effettuato con successo!",
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role
      },
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
  const { username, email, password } = req.body;

  try {
    let updates = { 
      username, 
    };

    // Verifica se l'email è stata modificata
    if (email) {
      // Recupera l'utente attuale per verificare se l'email è cambiata
      const { data: currentUser, error: fetchError } = await supabase
        .from("users")
        .select("email")
        .eq("id", id)
        .single();

      if (fetchError) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Se l'email è cambiata, aggiorna anche su Supabase Auth
      if (currentUser.email !== email) {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          id,
          { email }
        );

        if (authUpdateError) {
          return res.status(500).json({ error: "Impossibile aggiornare l'email: " + authUpdateError.message });
        }

        // Aggiungi l'email agli aggiornamenti del database utenti
        updates.email = email;
      }
    }

    // Se è stata fornita una nuova password, aggiornala in Supabase Auth
    if (password) {
      const { error: passwordUpdateError } = await supabase.auth.admin.updateUserById(
        id,
        { password }
      );

      if (passwordUpdateError) {
        return res.status(500).json({ error: "Impossibile aggiornare la password: " + passwordUpdateError.message });
      }
    }

    // Aggiorna la tabella degli utenti
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error("Errore aggiornamento:", error.message);
    res.status(500).json({ error: "Errore durante la modifica dell'utente" });
  }
});

// 5️⃣ Elimina un utente
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Eliminazione richiesta per l'utente con ID: ${id}`);

    // Verifica che l'utente esista
    const { data: userData, error: fetchUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchUserError || !userData) {
      console.log("Utente non trovato:", fetchUserError);
      return res.status(404).json({ error: "Utente non trovato." });
    }

    // Elimina l'utente da Supabase Auth
    console.log("Eliminazione dell'utente da Supabase Auth...");
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
    if (authDeleteError) {
      console.log("Errore durante l'eliminazione da Supabase Auth:", authDeleteError);
      return res.status(500).json({ error: "Errore durante l'eliminazione dall'autenticazione: " + authDeleteError.message });
    }

    // Elimina l'utente dalla tabella 'users'
    console.log("Eliminazione dell'utente dalla tabella 'users'...");
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) {
      console.log("Errore durante l'eliminazione dalla tabella 'users':", error);
      return res.status(500).json({ error: "Errore durante l'eliminazione dall'utente: " + error.message });
    }

    // Risposta positiva dopo che entrambe le operazioni sono state completate
    console.log("Utente eliminato con successo.");
    res.json({ message: "Utente eliminato con successo" });
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'utente:", error.message);
    res.status(500).json({ error: "Errore interno durante l'eliminazione dell'utente." });
  }
});



module.exports = router;