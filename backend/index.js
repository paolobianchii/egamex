const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const entRoutes = require("./routes/tournaments");
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
app.use(cors({
  origin: ['https://egamex.netlify.app', 'http://localhost:5173'], // Aggiungi altri domini se necessario
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
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

app.use("/api/partecipazioni", partecipazioniRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/battle-royale", entRoutes);
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

// GET - Recupera tutti i giochi
app.get('/api/giochi', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('giochi')
      .select('id, nome')
      .order('nome', { ascending: true }); // Ordina alfabeticamente per nome

    if (error) {
      console.error("Errore nel recupero dei giochi:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Errore interno del server:", err);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore interno nel recupero dei giochi' 
    });
  }
});

// GET - Recupera un singolo gioco per ID
app.get('/api/giochi/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('giochi')
      .select('id, nome')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          error: 'Gioco non trovato' 
        });
      }
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Errore interno del server:", err);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore interno nel recupero del gioco' 
    });
  }
});

// POST - Crea un nuovo gioco
app.post('/api/giochi', async (req, res) => {
  const { nome } = req.body;

  // Validazione input
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      error: 'Il nome del gioco è obbligatorio' 
    });
  }

  try {
    // Verifica se il gioco esiste già
    const { data: esistente } = await supabase
      .from('giochi')
      .select('id')
      .ilike('nome', nome.trim())
      .maybeSingle();

    if (esistente) {
      return res.status(409).json({ 
        success: false, 
        error: 'Esiste già un gioco con questo nome' 
      });
    }

    // Inserisci il nuovo gioco
    const { data, error } = await supabase
      .from('giochi')
      .insert([{ nome: nome.trim() }])
      .select();

    if (error) {
      console.error("Errore nell'inserimento del gioco:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }

    return res.status(201).json({ 
      success: true, 
      data: data[0], 
      message: 'Gioco creato con successo' 
    });
  } catch (err) {
    console.error("Errore interno del server:", err);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore interno nella creazione del gioco' 
    });
  }
});

// PUT - Aggiorna un gioco esistente
app.put('/api/giochi/:id', async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;

  // Validazione input
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      error: 'Il nome del gioco è obbligatorio' 
    });
  }

  try {
    // Verifica se il gioco esiste già con lo stesso nome (escluso l'attuale)
    const { data: esistente } = await supabase
      .from('giochi')
      .select('id')
      .neq('id', id)
      .ilike('nome', nome.trim())
      .maybeSingle();

    if (esistente) {
      return res.status(409).json({ 
        success: false, 
        error: 'Esiste già un altro gioco con questo nome' 
      });
    }

    // Aggiorna il gioco
    const { data, error } = await supabase
      .from('giochi')
      .update({ nome: nome.trim() })
      .eq('id', id)
      .select();

    if (error) {
      console.error("Errore nell'aggiornamento del gioco:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Gioco non trovato' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: data[0], 
      message: 'Gioco aggiornato con successo' 
    });
  } catch (err) {
    console.error("Errore interno del server:", err);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore interno nell\'aggiornamento del gioco' 
    });
  }
});

// DELETE - Elimina un gioco
app.delete('/api/giochi/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Prima verifica se il gioco esiste
    const { data: esistente, error: errorCheck } = await supabase
      .from('giochi')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (errorCheck) {
      console.error("Errore nella verifica del gioco:", errorCheck);
      return res.status(500).json({ 
        success: false, 
        error: errorCheck.message 
      });
    }

    if (!esistente) {
      return res.status(404).json({ 
        success: false, 
        error: 'Gioco non trovato' 
      });
    }

    // Elimina il gioco
    const { error } = await supabase
      .from('giochi')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Errore nell'eliminazione del gioco:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Gioco eliminato con successo' 
    });
  } catch (err) {
    console.error("Errore interno del server:", err);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore interno nell\'eliminazione del gioco' 
    });
  }
});


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

app.get('/api/battle-royale', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('battleroyaletorneo')
      .select('*'); // Recupera tutte le colonne

    if (error) throw error;

    res.status(200).json(data); // Restituisce i tornei
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/battle-royale/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('battleroyaletorneo')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ message: 'Torneo eliminato' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/battle-royale/:id', async (req, res) => {
  const { id } = req.params;
  const {
    titolo,
    giocatoriPerTeam,
    rounds,
    bestOf,
    discordLink,
    gioco, // ID del gioco
    nome_gioco, // Nome del gioco
    numeroTeam,
    dataInizio,
    dataFine,
    orarioTorneo
  } = req.body;

  try {
    // 1. Verifica che il torneo esista
    const { data: existingTournament, error: findError } = await supabase
      .from('battleroyaletorneo')
      .select('*')
      .eq('id', id)
      .single();

    if (findError) throw findError;
    if (!existingTournament) {
      return res.status(404).json({ error: 'Torneo non trovato' });
    }

    // 2. Se viene cambiato il gioco, verifica il nuovo nome del gioco
    let gameName = nome_gioco;
    if (gioco && gioco !== existingTournament.id_gioco) {
      const { data: gameData, error: gameError } = await supabase
        .from('giochi')
        .select('nome')
        .eq('id', gioco)
        .single();

      if (gameError) throw gameError;
      if (!gameData) {
        return res.status(400).json({ error: 'Gioco non trovato' });
      }
      gameName = gameData.nome;
    }

    // 3. Costruisci l'oggetto di aggiornamento
    const updates = {
      titolo: titolo || existingTournament.titolo,
      giocatori_per_team: giocatoriPerTeam || existingTournament.giocatori_per_team,
      rounds: rounds || existingTournament.rounds,
      best_of: bestOf || existingTournament.best_of,
      discord_link: discordLink || existingTournament.discord_link,
      id_gioco: gioco || existingTournament.id_gioco,
      nome_gioco: gameName || existingTournament.nome_gioco,
      numero_team: numeroTeam || existingTournament.numero_team,
      data_inizio: dataInizio || existingTournament.data_inizio,
      data_fine: dataFine || existingTournament.data_fine,
      orario_torneo: orarioTorneo || existingTournament.orario_torneo,
    };

    // 4. Esegui l'aggiornamento
    const { data: updatedData, error: updateError } = await supabase
      .from('battleroyaletorneo')
      .update(updates)
      .eq('id', id)
      .select();

    if (updateError) throw updateError;

    res.status(200).json({ 
      message: 'Torneo aggiornato con successo', 
      data: updatedData 
    });
  } catch (err) {
    console.error('Errore durante l\'aggiornamento del torneo:', err);
    res.status(500).json({ 
      error: err.message || 'Errore durante l\'aggiornamento del torneo' 
    });
  }
});

app.post('/api/battle-royale', async (req, res) => {
  const {
    titolo,
    giocatoriPerTeam,
    rounds,
    bestOf,
    discordLink,
    gioco, // ID del gioco
    nome_gioco, // Nome del gioco
    numeroTeam,
    dataInizio,
    dataFine,
    orarioTorneo
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('battleroyaletorneo')
      .insert([{
        titolo,
        giocatori_per_team: giocatoriPerTeam,
        rounds,
        best_of: bestOf,
        discord_link: discordLink,
        id_gioco: gioco, // Salva solo l'ID del gioco
        nome_gioco, // Salva anche il nome del gioco
        numero_team: numeroTeam,
        data_inizio: dataInizio,
        data_fine: dataFine,
        orario_torneo: orarioTorneo,
      }]);

    if (error) throw error;

    res.status(201).json({ message: 'Torneo creato', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
