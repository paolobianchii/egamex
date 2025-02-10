const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const tournamentRoutes = require("./routes/tournaments");
const usersRoutes = require("./routes/users");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken"); // Aggiunto per la gestione dei JWT
const { supabase } = require("./lib/supabase");
const path = require('path');


dotenv.config(); // Carica le variabili d'ambiente


const supUrl = process.env.SUPABASE_URL; // Corretto
const supAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Aggiunto per coerenza

const app = express();

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

console.log("SUPABASE_URL:", supUrl);
console.log("SUPABASE_ANON_KEY:", supAnonKey);


app.use("/api/tournaments", tournamentRoutes);
app.use("/api/users", usersRoutes); // Aggiunta la gestione delle rotte utenti

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
            .select("role")
            .eq("email", email) // Cerca per email direttamente senza usare 'data.user.email'
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
            { userId: data.user.id, email: data.user.email, username: userData.username },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        // Rispondi con i dati dell'utente e il token
        res.json({
            message: "Login effettuato con successo!",
            user: {
                email: data.user.email,
                id: data.user.id,
                username: userData.username,
            },
            token,
        });
    } catch (error) {
        console.error("Errore durante il login:", error);
        return res.status(500).json({ error: "Errore interno del server. Riprova più tardi." });
    }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
