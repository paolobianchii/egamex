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


dotenv.config(); // Carica le variabili d'ambiente
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // Cache con TTL di 60 sec

const supUrl = process.env.SUPABASE_URL; // Corretto
const supAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Aggiunto per coerenza

const app = express();

app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:5173', // il dominio del tuo frontend
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type,Authorization',
  }));app.use(express.json());

passport.use(
    new DiscordStrategy(
      {
        clientID: '1336795914349580319', // Inserisci il tuo Client ID di Discord
        clientSecret: 'Hy3PUVeKrhA69DXp82yLbTONfHuRe-f4', // Inserisci il tuo Client Secret
        callbackURL: 'https://kwxxejdmvgvsteairgyp.supabase.co/auth/v1/callback', // URL di callback
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
  app.use(session({ secret: 'mySuperSecretKey_1234!$%#', resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
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

app.get('/auth/discord/callback', (req, res) => {
    // Recupera il parametro state dalla query string
    const receivedState = req.query.state;

    // Verifica che il parametro state corrisponda a quello memorizzato nella sessione
    if (receivedState !== req.session.state) {
        return res.status(400).json({ error: 'Invalid state parameter' });
    }

    // Se il parametro state è valido, continua con il processo di autenticazione
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        // Dopo il login riuscito, puoi generare un token JWT o gestire la sessione utente
        const user = req.user;
        const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, 'mySuperSecretJWTKey123!$');
        
        res.json({
            message: 'Login riuscito',
            token: token,
            user: user
        });
    };
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
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
