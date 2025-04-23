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
const { validate: validateUUID } = require('uuid-validate');
const { v4: uuidv4 } = require('uuid');



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

app.post("/api/partecipazioni", async (req, res) => {
  const { torneo_id, team_id } = req.body;

  // Validazione avanzata con logging
  console.log("Dati ricevuti:", { torneo_id, team_id });

  if (!team_id) {
    return res.status(400).json({
      error: "ID team mancante",
      solution: "Includi un ID team valido nel corpo della richiesta"
    });
  }

  if (!validateUUID(team_id)) {
    return res.status(400).json({
      error: "Formato ID team non valido",
      details: {
        valore_ricevuto: team_id,
        formato_richiesto: "UUID v4 (esempio: '123e4567-e89b-12d3-a456-426614174000')",
        lunghezza_attesa: 36,
        lunghezza_ricevuta: team_id?.length || 0
      }
    });
  }

  // Resto del codice invariato...
  try {
    // Verifica esistenza team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('id', team_id)
      .single();

    if (teamError || !team) {
      return res.status(404).json({
        error: "Team non trovato",
        team_id_provided: team_id,
        action_required: "Creare prima il team o verificare l'ID"
      });
    }

    // Procedi con la creazione della partecipazione...
    const { data, error } = await supabase
      .from('partecipazioni')
      .insert([{
        torneo_id,
        team_id,
        punti_totali: 0,
        penalita: 0
      }])
      .select('*');

    if (error) throw error;

    res.status(201).json({
      success: true,
      partecipazione: data[0]
    });

  } catch (error) {
    console.error("Errore durante la creazione:", error);
    res.status(500).json({
      error: "Errore interno del server",
      debug_info: {
        received_data: req.body,
        validation: {
          torneo_id_valid: validateUUID(torneo_id),
          team_id_valid: validateUUID(team_id)
        }
      }
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
  const { name, score = 0 } = req.body;

  const uuid = uuidv4(); // genera UUID nel backend

  try {
    const { data, error } = await supabase.from('teams').insert([
      {
        id: uuid,
        name,
        score,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]).select();

    if (error) throw error;

    res.status(201).json({
      message: 'Team creato con successo',
      id: uuid, // restituisci l'UUID generato
      team: data[0],
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore nella creazione del team', error });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    // Fetch all teams from the database
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    
    if (teamsError) throw teamsError;

    // Fetch user-team relationships from a separate table
    // Assuming you have a team_members table that links users and teams
    const { data: teamMembershipsData, error: membershipError } = await supabase
      .from('partecipazioni') // Update this to your actual junction table name
      .select('team_id, torneo_id');
    
    if (membershipError) throw membershipError;

    // Fetch all users to get their details
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, username');
    
    if (usersError) throw usersError;

    // Map team members to their teams
    const teamsWithMembers = teamsData.map(team => {
      // Find all membership records for this team
      const teamMemberships = teamMembershipsData.filter(
        membership => membership.team_id === team.id
      );
      
      // Find the users that correspond to these memberships
      const members = teamMemberships.map(membership => {
        const user = usersData.find(user => user.id === membership.user_id);
        return user ? { id: user.id, username: user.username } : null;
      }).filter(member => member !== null); // Remove any nulls
      
      return {
        ...team,
        members: members,
        member_count: members.length
      };
    });

    res.status(200).json(teamsWithMembers);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero dei team', 
      error: error.message 
    });
  }
});

// Alternative implementation if you don't have a junction table
// Uncomment and use this if your structure is different
/*
app.get('/api/teams', async (req, res) => {
  try {
    // Fetch all teams
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    
    if (teamsError) throw teamsError;
    
    // Return teams without member info if we can't link them
    res.status(200).json(teamsData.map(team => ({
      ...team,
      members: [],
      member_count: 0
    })));
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero dei team', 
      error: error.message 
    });
  }
});
*/

// Get team by ID
app.get('/api/teams/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get team data
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (teamError) throw teamError;
    
    if (!teamData) {
      return res.status(404).json({ message: 'Team non trovato' });
    }

    // Get team memberships from the junction table
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('team_members') // Update this to your actual junction table name
      .select('user_id')
      .eq('team_id', id);
    
    if (membershipsError) throw membershipsError;

    // Get user details for team members
    let members = [];
    if (membershipsData && membershipsData.length > 0) {
      const userIds = membershipsData.map(m => m.user_id);
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds);
      
      if (usersError) throw usersError;
      members = usersData || [];
    }

    // Combine data
    const teamWithMembers = {
      ...teamData,
      members: members,
      member_count: members.length
    };

    res.status(200).json(teamWithMembers);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ 
      message: 'Errore nel recupero del team', 
      error: error.message 
    });
  }
});

// Avvio del server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
