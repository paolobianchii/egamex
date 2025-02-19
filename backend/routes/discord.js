// server.js (o il file in cui gestisci le route)
const express = require('express');
const router = express.Router();

const crypto = require('crypto');

app.get('/api/auth/discord', (req, res) => {
    // Genera un valore casuale per il parametro state
    const state = crypto.randomBytes(16).toString('hex');
    
    // Salva il parametro state nella sessione dell'utente
    req.session.state = state;

    const discordAuthURL = `https://discord.com/oauth2/authorize?response_type=code&redirect_uri=${encodeURIComponent('https://kwxxejdmvgvsteairgyp.supabase.co/auth/v1/callback')}&scope=identify%20email&client_id=1336795914349580319&state=${state}`;

    // Reindirizza l'utente alla pagina di autorizzazione Discord
    res.redirect(discordAuthURL);
});

module.exports = router;
