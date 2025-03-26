const express = require("express");
const { supabase } = require("../lib/supabase");
const { validate: validateUUID } = require('uuid');

const router = express.Router();

// Ottieni tutte le partecipazioni
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("partecipazioni").select("*");

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
// Verifica se un utente è già iscritto al torneo
// Verifica se un utente è già iscritto al torneo
router.get("/api/partecipazioni/:torneoId/utente/:userId", async (req, res) => {
  const { torneoId, userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("partecipazioni")
      .select("id, game1, punteggio")
      .eq("torneo_id", torneoId)
      .eq("utente_id", userId)
      .single(); // .single() restituisce un singolo record se esiste

    if (error) {
      console.error("Errore nel recupero dell'iscrizione:", error);
      return res.status(500).json({ error: "Errore nel recupero dell'iscrizione. Riprova più tardi." });
    }

    if (data) {
      return res.json({ iscrizione: true, message: "Sei già iscritto a questo torneo." });
    }

    // Se l'utente non è iscritto
    res.json({ iscrizione: false, message: "Non sei iscritto a questo torneo." });

  } catch (error) {
    console.error("Errore imprevisto durante la verifica dell'iscrizione:", error);
    res.status(500).json({ error: "Errore durante la verifica dell'iscrizione. Riprova più tardi." });
  }
});


// Ottieni partecipazioni per un torneo specifico
router.post("/:torneoId", async (req, res) => {
  const torneo_id = req.body.torneo_id;  // Usa il torneo_id dal body della richiesta
  const { utente_id, punteggio, created_at } = req.body;

  // Verifica se l'ID del torneo è un UUID valido
  if (!validateUUID(torneo_id)) {
    console.error("ID torneo non valido:", torneo_id);
    return res.status(400).json({ error: "ID torneo non valido" });
  }

  // Verifica se l'ID utente è valido
  if (!validateUUID(utente_id)) {
    console.error("ID utente non valido:", utente_id);
    return res.status(400).json({ error: "ID utente non valido" });
  }

  try {
    // Aggiungi la partecipazione nel database
    const { data, error } = await supabase
      .from("partecipazioni")
      .insert([
        { 
          torneo_id: torneo_id, 
          utente_id: utente_id, 
          punteggio: 0,  // Considerando che il punteggio iniziale è 0
          created_at: created_at,
        }
      ])
      .single();  // Restituisce un singolo record

    if (error) {
      console.error("Errore nell'aggiunta della partecipazione:", error);
      return res.status(500).json({ error: "Errore nell'aggiunta della partecipazione" });
    }

    res.status(201).json(data);  // Rispondi con i dati della partecipazione appena creata
  } catch (error) {
    console.error("Errore durante l'iscrizione:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});



module.exports = router;
