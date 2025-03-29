const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const tournamentRoutes = require("./routes/tournaments");
const usersRoutes = require("./routes/users");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { supabase } = require("./lib/supabase");
const partecipazioniRoutes = require("./routes/partecipazioni");
const compression = require("compression");
const NodeCache = require("node-cache");
const roleRouter = require("./routes/users");
const session = require("express-session");
const path = require("path");
const helmet = require("helmet");
const xss = require("xss-clean");
const axios = require("axios");

dotenv.config(); 

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const app = express();

// Middleware di sicurezza
app.use(helmet()); 
app.use(xss()); 

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

// Middleware per gestire la sessione utente
app.use(
  session({
    secret: process.env.SESSION_SECRET,  // La chiave segreta è fornita direttamente qui
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: process.env.NODE_ENV === "production", 
      httpOnly: true,  // Sicurezza extra per proteggere i cookie
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Serializzazione e deserializzazione dell'utente
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Riferimenti al database
const supUrl = process.env.SUPABASE_URL;
const supAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("SUPABASE_URL:", supUrl);
console.log("SUPABASE_ANON_KEY:", supAnonKey);

app.use("/api/tournaments", tournamentRoutes);
app.use("/api/partecipazioni", partecipazioniRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/role", roleRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware per caching
const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  const cachedData = cache.get(key);
  if (cachedData) {
    return res.json(cachedData);
  }
  res.sendResponse = res.json;
  res.json = (body) => {
    cache.set(key, body);
    res.sendResponse(body);
  };
  next();
};

// Elimina un utente
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(500).json({
        message: "Errore nell'eliminazione dell'utente",
        error: deleteError.message,
      });
    }

    const { error: authDeleteError } = await supabase.auth.api.deleteUser(id);
    if (authDeleteError) {
      return res.status(500).json({
        message: "Errore nell'eliminazione dell'utente dal sistema di autenticazione",
        error: authDeleteError.message,
      });
    }

    res.status(200).json({ message: "Utente eliminato con successo" });
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'utente:", error);
    res.status(500).json({ message: "Errore del server", error });
  }
});

// REGISTRAZIONE UTENTE
app.post("/api/register", async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: "Tutti i campi sono obbligatori." });
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const userId = data.user?.id;
    if (!userId) return res.status(500).json({ error: "Errore durante la registrazione" });

    const { error: insertError } = await supabase.from("users").insert([{ id: userId, username, email }]);

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.status(201).json({ message: "Registrazione completata con successo!" });
  } catch (err) {
    console.error("Errore durante la registrazione:", err);
    res.status(500).json({ error: "Errore durante la registrazione." });
  }
});

// LOGIN UTENTE
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e password sono obbligatorie" });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    if (!data.user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, username, punteggio")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (userError) return res.status(400).json({ error: userError.message });
    if (!userData) return res.status(404).json({ error: "Utente non trovato" });

    const token = jwt.sign(
      { userId: data.user.id, email: data.user.email, username: userData.username, role: userData.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login effettuato con successo!",
      user: { email: data.user.email, id: data.user.id, username: userData.username, role: userData.role, punteggio: userData.punteggio },
      token,
    });
  } catch (error) {
    console.error("Errore durante il login:", error);
    return res.status(500).json({ error: "Errore interno del server. Riprova più tardi." });
  }
});

app.get("/api/partecipanti/:torneoId", cacheMiddleware, async (req, res) => {
  const { torneoId } = req.params;

  try {
      const { data, error } = await supabase
.from('partecipazioni')
.select('id, torneo_id, utente_id, created_at, game1, punteggio, users(id, username, email)')
.eq('torneo_id', torneoId);


      if (error) throw error;

      // Rispondi con i dati dei partecipanti
      res.json(data.map(p => ({
          partecipazione_id: p.id, // id della partecipazione
          utente_id: p.utente_id,   // id dell'utente
          username: p.users.username,
          email: p.users.email,
          punteggio: p.punteggio,
          game1: p.game1,
      })));
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teams')  // Nome della tua tabella
      .select('*');  // Seleziona tutte le colonne

    if (error) {
      return res.status(500).json({ message: 'Errore nel recupero dei dati', error });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error });
  }
});

app.get('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;  // Prendi l'ID dalla rotta

    // Recupera il team specifico con l'ID
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)  // Filtra il team per ID
      .single();  // Assicurati che venga restituito un solo team (in caso di ricerca univoca)

    if (error) {
      return res.status(500).json({ message: 'Errore nel recupero del team', error });
    }

    if (!data) {
      return res.status(404).json({ message: 'Team non trovato' });
    }

    // Recupera i partecipanti, se necessario (se sono in una tabella separata)
    const { data: participants, error: participantsError } = await supabase
      .from('users')  // Tabella dei partecipanti
      .select('username')
      .in('id', data.participants);  // Supponiamo che 'participants' sia un array di ID

    if (participantsError) {
      return res.status(500).json({ message: 'Errore nel recupero dei partecipanti', participantsError });
    }

    // Includi i partecipanti nei dettagli del team
    res.status(200).json({ ...data, participants: participants || [] });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error });
  }
});
app.delete('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;  // Ottieni l'ID del team dalla rotta

    // Elimina il team con l'ID specificato
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);  // Filtra per l'ID del team

    if (error) {
      return res.status(500).json({ message: 'Errore nell\'eliminazione del team', error });
    }

    // Se non c'è errore, invia una risposta di successo
    res.status(200).json({ message: 'Team eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error });
  }
});


// Endpoint per creare un team
app.post('/api/teams', async (req, res) => {
  const { name, participants, score, numParticipants, game1, game2, game3, game4 } = req.body;

  // Inserimento del team nella tabella
  try {
    const { data, error } = await supabase.from('teams').insert([
      {
        name,
        score,
        num_participants: numParticipants,
        game1,
        game2,
        game3,
        game4,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    if (error) throw error;

    res.status(201).json({ message: 'Team creato con successo', team: data });
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione del team', error });
  }
});
// Avvio del server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
