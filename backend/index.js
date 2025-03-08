const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const tournamentRoutes = require("./routes/tournaments");
const usersRoutes = require("./routes/users");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken"); // Aggiunto per la gestione dei JWT
const { supabase } = require("./lib/supabase");
const partecipazioniRoutes = require("./routes/partecipazioni"); // Aggiungi la tua route
const compression = require("compression");
const NodeCache = require("node-cache");
const roleRouter = require('./routes/users');
const session = require("express-session");
const path = require("path");
const helmet = require("helmet");
const xss = require("xss-clean");
const axios = require('axios');


dotenv.config(); // Carica le variabili d'ambiente
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // Cache con TTL di 60 sec

const supUrl = process.env.SUPABASE_URL; // Corretto
const supAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Aggiunto per coerenza

const app = express();
// Middleware di sicurezza
app.use(helmet()); // Protegge dagli attacchi comuni basati su intestazioni HTTP
app.use(xss()); // Pulisce input dannosi da XSS

app.use(bodyParser.json());
// Modifica la configurazione CORS all'inizio del file
app.use(cors());
app.use(express.json());

passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID, // Inserisci il tuo Client ID di Discord
        clientSecret: process.env.DISCORD_CLIENT_SECRET, // Inserisci il tuo Client Secret
        callbackURL: process.env.DISCORD_CALLBACK_URL, // URL di callback
        scope: ['identify', 'email'], // Permessi richiesti
      },
      async (accessToken, refreshToken, profile, done) => {
        // In questa funzione, recuperiamo i dati dell'utente da Discord
        // Puoi usare l'access token per fare chiamate API e ottenere più dati, se necessario.
        try {
          const user = {
            id: profile.id,
            username: profile.username,
            email: profile.email || 'non disponibile', // Se non ci fosse email
            discordId: profile.id,
          };
  
          // In un'applicazione reale, dovresti verificare se l'utente esiste nel tuo database
          // e registrarlo se è la prima volta che accede.
  
          // Simula un salvataggio in database e restituisce l'utente
          // (puoi persistere questo utente nel tuo database, se necessario)
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );
  
  // Middleware per gestire la sessione utente
  app.use(session({
    secret: 'O5ZhHBr4P5sZdUbkSBn2P8pLxCenFhLw',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  }));  app.use(passport.initialize());
  app.use(passport.session());
  
  // Serializzazione e deserializzazione dell'utente
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
  
  // Endpoint di autenticazione con Discord
  app.get("/api/auth/discord", passport.authenticate("discord"));

console.log("SUPABASE_URL:", supUrl);
console.log("SUPABASE_ANON_KEY:", supAnonKey);


app.use("/api/tournaments", tournamentRoutes);
app.use("/api/partecipazioni", partecipazioniRoutes);
app.use("/api/users", usersRoutes);
app.use('/api/role', roleRouter);  // Assicurati che il prefisso /api sia corretto
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Middleware per caching con node-cache
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

// Endpoint per avviare il login con Discord
app.get("/api/auth/discord", (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  req.session.discordOAuthState = state;

  const authUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.BACKEND_URL}/api/auth/discord/callback`)}&response_type=code&scope=identify%20email&state=${state}`;
  res.redirect(authUrl);
});

// Endpoint di callback per Discord
app.get("/api/auth/discord/callback", async (req, res) => {
  const { code, state } = req.query;

  if (state !== req.session.discordOAuthState) {
    return res.status(403).send("State mismatch: possibile attacco CSRF.");
  }

  try {
    // Scambia il codice con un token di accesso
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${process.env.BACKEND_URL}/api/auth/discord/callback`,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // Ottieni le informazioni dell'utente
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData = userResponse.data;

    // Salva l'utente nel database o nella sessione
    req.session.user = userData;

    // Reindirizza l'utente al frontend
    res.redirect("http://localhost:5173");
  } catch (error) {
    console.error("Errore durante l'autenticazione con Discord:", error);
    res.status(500).send("Errore durante l'autenticazione con Discord.");
  }
});

// Endpoint per eliminare un utente
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params; // Prendi l'ID dell'utente dalla rotta

  try {
      // Elimina l'utente dalla tabella "users"
      const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', id); // Filtro per l'ID dell'utente

      if (deleteError) {
          return res.status(500).json({ message: 'Errore nell\'eliminazione dell\'utente', error: deleteError.message });
      }

      // Elimina anche l'utente dalla tabella di autenticazione di Supabase
      const { error: authDeleteError } = await supabase.auth.api.deleteUser(id); // Usa l'API di Supabase per eliminare l'utente
      if (authDeleteError) {
          return res.status(500).json({ message: 'Errore nell\'eliminazione dell\'utente dal sistema di autenticazione', error: authDeleteError.message });
      }

      // Rispondi con successo
      res.status(200).json({ message: 'Utente eliminato con successo' });
  } catch (error) {
      console.error('Errore durante l\'eliminazione dell\'utente:', error);
      res.status(500).json({ message: 'Errore del server', error });
  }
});


// REGISTRAZIONE UTENTE
app.post('/api/register', async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
    }

    try {
        // Crea un nuovo utente in Supabase Authentication
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            console.error('Errore Supabase:', error.message); // Log dell'errore
            return res.status(400).json({ error: error.message });
        }

        const userId = data.user?.id; // Ottieni l'UUID assegnato da Supabase
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

        res.status(201).json({ message: 'Registrazione completata con successo!' });
    } catch (err) {
        console.error('Errore generico durante la registrazione:', err); // Log degli errori generici
        res.status(500).json({ error: 'Errore durante la registrazione.' });
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
    const { name, participants, score, numParticipants } = req.body;
  
    // Inserimento del team nella tabella
    try {
      const { data, error } = await supabase.from('teams').insert([
        {
          name,
          score,
          num_participants: numParticipants,
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

// LOGIN UTENTE
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email e password sono obbligatorie" });
    }

    try {
        // Recupera i dati dell'utente dalla tabella 'auth.users' di Supabase
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return res.status(400).json({ error: error.message || "Errore durante l'autenticazione" });
        }

        // Verifica che l'utente sia stato trovato in auth.users
        if (!data.user) {
            return res.status(404).json({ error: "Utente non trovato nel database di autenticazione" });
        }

        // Ottieni il ruolo dell'utente dalla tabella 'users' (non dalla tabella 'auth.users')
        const { data: userData, error: userError } = await supabase
            .from("users")  
            .select("role, username") // Aggiungi 'role' e 'username' qui
            .eq("email", email) // Cerca per email direttamente
            .limit(1)
            .maybeSingle();

        if (userError) {
            return res.status(400).json({ error: userError.message || "Errore nel recupero del ruolo utente" });
        }

        // Se non esiste l'utente con quel ruolo
        if (!userData) {
            return res.status(404).json({ error: "Utente non trovato nel database" });
        }

        // Genera il token JWT
        const token = jwt.sign(
            { userId: data.user.id, email: data.user.email, username: userData.username, role: userData.role }, // Includi il ruolo nel payload
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        // Rispondi con i dati dell'utente, il ruolo e il token
        res.json({
            message: "Login effettuato con successo!",
            user: {
                email: data.user.email,
                id: data.user.id,
                username: userData.username,
                role: userData.role, // Aggiungi il ruolo nella risposta
            },
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
  .select('id, torneo_id, utente_id, created_at, punteggio, users(id, username, email)')
  .eq('torneo_id', torneoId);


        if (error) throw error;

        // Rispondi con i dati dei partecipanti
        res.json(data.map(p => ({
            partecipazione_id: p.id, // id della partecipazione
            utente_id: p.utente_id,   // id dell'utente
            username: p.users.username,
            email: p.users.email,
            punteggio: p.punteggio,
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
