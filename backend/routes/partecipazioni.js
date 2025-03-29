const express = require("express");
const { supabase } = require("../lib/supabase");
const { validate: validateUUID } = require('uuid');

const router = express.Router();

// Ottieni tutte le partecipazioni con il punteggio dell'utente
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("partecipazioni")
      .select(`
        *,
        users:punteggio
      `);

    if (error) {
      console.error("Errore nel recupero delle partecipazioni:", error);
      return res.status(500).json({ error: "Errore nel recupero delle partecipazioni" });
    }

    res.json(data);
  } catch (error) {
    console.error("Errore durante la richiesta delle partecipazioni:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Ottieni partecipazioni per un torneo specifico con punteggio utente
router.get("/api/partecipanti/:torneoId", async (req, res) => {
  const { torneoId } = req.params;

  try {
    const { data, error } = await supabase
      .from("partecipazioni")
      .select(`
        *,
        user:users (username, punteggio)
      `)
      .eq("torneo_id", torneoId);

    if (error) {
      console.error("Errore nel recupero delle partecipazioni:", error);
      return res.status(500).json({ error: "Errore nel recupero delle partecipazioni" });
    }

    // Formatta i dati per includere username e punteggio direttamente nell'oggetto
    const formattedData = data.map(partecipazione => ({
      ...partecipazione,
      username: partecipazione.user?.username || "N/A",
      user_score: partecipazione.user?.punteggio || 0
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Errore durante la richiesta delle partecipazioni:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Verifica iscrizione utente con punteggio
router.get("/:torneoId/utente/:userId", async (req, res) => {
  const { torneoId, userId } = req.params;

  try {
    // Recupera sia la partecipazione che il punteggio dell'utente
    const { data, error } = await supabase
      .from("partecipazioni")
      .select(`
        *,
        user:users (punteggio)
      `)
      .eq("torneo_id", torneoId)
      .eq("utente_id", userId)
      .single();

    if (error) {
      console.error("Errore nel recupero dell'iscrizione:", error);
      return res.status(500).json({ error: "Errore nel recupero dell'iscrizione" });
    }

    if (data) {
      return res.json({
        iscrizione: true,
        punteggio: data.user?.punteggio || 0,
        message: "Sei già iscritto a questo torneo."
      });
    }

    res.json({ iscrizione: false, message: "Non sei iscritto a questo torneo." });
  } catch (error) {
    console.error("Errore imprevisto durante la verifica dell'iscrizione:", error);
    res.status(500).json({ error: "Errore durante la verifica dell'iscrizione" });
  }
});

// Crea una nuova partecipazione con punteggio utente
router.post("/:torneoId", async (req, res) => {
  const { torneo_id, utente_id, created_at } = req.body;

  if (!validateUUID(torneo_id)) {
    return res.status(400).json({ error: "ID torneo non valido" });
  }

  if (!validateUUID(utente_id)) {
    return res.status(400).json({ error: "ID utente non valido" });
  }

  try {
    // 1. Recupera il punteggio attuale dell'utente
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("punteggio")
      .eq("id", utente_id)
      .single();

    if (userError) throw userError;
    if (!userData) return res.status(404).json({ error: "Utente non trovato" });

    const userScore = userData.punteggio || 0;

    // 2. Crea la partecipazione
    const { data, error } = await supabase
      .from("partecipazioni")
      .insert([{
        torneo_id,
        utente_id,
        punteggio: userScore, // Usa il punteggio dell'utente
        created_at,
        game1: 0,
        game2: 0,
        game3: 0,
        game4: 0
      }])
      .select();

    if (error) throw error;

    // 3. Restituisci i dati completi con join all'utente
    const { data: completeData, error: joinError } = await supabase
      .from("partecipazioni")
      .select(`
        *,
        user:users (username, punteggio)
      `)
      .eq("id", data[0].id)
      .single();

    if (joinError) throw joinError;

    res.status(201).json({
      ...completeData,
      username: completeData.user?.username,
      user_score: completeData.user?.punteggio
    });

  } catch (error) {
    console.error("Errore durante l'iscrizione:", error);
    res.status(500).json({ error: error.message || "Errore interno del server" });
  }
});

module.exports = router;