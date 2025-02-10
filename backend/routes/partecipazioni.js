const express = require("express");
const { supabase } = require("../lib/supabase");

const router = express.Router();

// Ottieni tutte le partecipazioni
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("partecipazioni").select("*");

    // Log per visualizzare i dati ricevuti
    //console.log("Dati ricevuti:", data);

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

// Supponiamo che tu stia già recuperando i dati per il torneo specifico

const { validate: validateUUID } = require('uuid');

router.get("/:id", async (req, res) => {
  const torneoId = req.params.id; // L'ID passato nella URL
  
  // Controlla se l'ID è un UUID valido
  if (!validateUUID(torneoId)) {
    console.error("ID torneo non valido:", torneoId);
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from("partecipazioni")
      .select("*")
      .eq("torneo_id", torneoId);

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


router.get("/:torneoId", async (req, res) => {
  const torneoId = req.params.torneoId; // Estrai l'ID del torneo dalla URL
  try {
    // Recupera tutte le partecipazioni per quel torneo
    const { data, error } = await supabase
      .from("partecipazioni")
      .select("*")
      .eq("torneo_id", torneoId);  // Filtra per ID torneo
    
    if (error) {
      console.error("Errore nel recupero delle partecipazioni:", error);
      return res.status(500).json({ error: "Errore nel recupero delle partecipazioni" });
    }

    res.json(data); // Restituisci i dati delle partecipazioni
  } catch (error) {
    console.error("Errore durante la richiesta delle partecipazioni:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});


module.exports = router;
