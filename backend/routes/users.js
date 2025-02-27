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
    // Prima verifica se l'utente esiste già nella tabella users
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: "Un utente con questa email esiste già" });
    }

    // Verifica anche in Supabase Auth
    const { data: existingAuth, error: authCheckError } = await supabase.auth.admin.listUsers({
      filter: { email }
    });

    if (existingAuth && existingAuth.users && existingAuth.users.length > 0) {
      // Utente esiste in Auth ma non nella tabella users - caso anomalo
      // Possiamo gestirlo in uno dei due modi:
      // 1. Eliminare l'utente da Auth e ricrearlo
      const userId = existingAuth.users[0].id;
      await supabase.auth.admin.deleteUser(userId);
      
      // Oppure
      // 2. Usare l'ID esistente per creare il record nella tabella users
      // In questo caso scelgo di eliminare e ricreare per pulizia
    }

    // Crea un nuovo utente in Supabase Authentication
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      return res.status(400).json({ error: signUpError.message });
    }

    // Verifica che abbiamo ricevuto i dati dell'utente
    if (!authData || !authData.user || !authData.user.id) {
      return res.status(500).json({ error: "Errore durante la registrazione: dati utente non ricevuti da Supabase Auth" });
    }

    const userId = authData.user.id;
    console.log("Utente creato in Auth con ID:", userId);

    // Salva l'utente nel database con il ruolo
    const userData = { 
      id: userId, 
      username, 
      email,
      role: role || 'user' // Imposta un ruolo predefinito se non specificato
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert([userData])
      .select();

    if (insertError) {
      // Se c'è un errore nell'inserimento, elimina l'utente da Auth per mantenere la coerenza
      console.error("Errore nell'inserimento dell'utente nel DB:", insertError.message);
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: "Errore nell'inserimento dell'utente: " + insertError.message });
    }

    // Conferma la registrazione e restituisce i dati dell'utente
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
    res.status(500).json({ error: "Errore durante la registrazione: " + (error.message || "Errore sconosciuto") });
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
      .select("username, email, role")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return res.status(500).json({ error: "Errore nel recupero dei dati utente." });
    }

    // Genera il token JWT
    const token = jwt.sign(
      { 
        userId, 
        email: userData.email, 
        username: userData.username,
        role: userData.role 
      },
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
    // Prima elimina l'utente da Supabase Auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
    
    if (authDeleteError) {
      return res.status(500).json({ error: "Errore durante l'eliminazione dell'autenticazione: " + authDeleteError.message });
    }

    // Poi elimina l'utente dalla tabella users
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Utente eliminato con successo" });
  } catch (error) {
    console.error("Errore eliminazione:", error.message);
    res.status(500).json({ error: "Errore durante l'eliminazione dell'utente" });
  }
});

module.exports = router;