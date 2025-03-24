const express = require("express");
const { supabase } = require("../lib/supabase");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const router = express.Router();

const saltRounds = 10; // Numero di cicli per l'hashing della password
const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Token mancante" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded; // Salva l'informazione dell'utente decodificato
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token non valido" });
  }
};

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

// Route protetta che richiede l'autenticazione
router.get("/role", authenticateJWT, async (req, res) => {
  const userId = req.user.userId; // Ottieni userId dalla richiesta (decodificato)
  
  try {
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

    // Dopo aver registrato un nuovo utente, solo al login generi un token
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
      { userId: userData.id, role: userData.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login effettuato con successo!",
      token, // Invia solo il token, non l'intero oggetto user
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

// Route che richiede permessi di amministratore
router.get("/admin", authenticateJWT, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Non hai accesso a questa risorsa" });
  }
  // Logica per l'accesso admin
  res.json({ message: "Benvenuto, admin!" });
});


// 5️⃣ Elimina un utente
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Eliminazione richiesta per l'utente con ID: ${id}`);

    // Verifica se l'utente esiste nella tabella users
    const { data: userData, error: fetchUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (!userData || fetchUserError) {
      console.log("Utente non trovato:", fetchUserError);
      return res.status(404).json({ error: "Utente non trovato." });
    }

    // Elimina l'utente da Supabase Auth con il client admin
    console.log("Eliminazione dell'utente da Supabase Auth...");
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (authDeleteError) {
      console.log("Errore durante l'eliminazione da Supabase Auth:", authDeleteError);
      return res.status(500).json({ error: "Errore durante l'eliminazione dall'autenticazione: " + authDeleteError.message });
    }

    // Elimina l'utente dalla tabella 'users'
    console.log("Eliminazione dell'utente dalla tabella 'users'...");
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.log("Errore durante l'eliminazione dalla tabella 'users':", error);
      return res.status(500).json({ error: "Errore durante l'eliminazione dell'utente: " + error.message });
    }

    console.log("Utente eliminato con successo.");
    res.json({ message: "Utente eliminato con successo" });

  } catch (error) {
    console.error("Errore durante l'eliminazione dell'utente:", error.message);
    res.status(500).json({ error: "Errore interno durante l'eliminazione dell'utente." });
  }
});




module.exports = router;