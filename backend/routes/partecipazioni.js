const express = require("express");
const { supabase } = require("../lib/supabase");
const { validate: validateUUID } = require('uuid');

const router = express.Router();

// Ottieni tutte le partecipazioni con dettagli team e torneo
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("partecipazioni")
      .select(`
        *,
        team:teams (name)
        torneo:battleroyaletorneo (titolo, type, data_inizio)
      `)
      .order('punti_totali', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Errore nel recupero delle partecipazioni:", error);
    res.status(500).json({ error: "Errore nel recupero delle partecipazioni" });
  }
});

// Endpoint /api/partecipazioni/torneo/:torneoId
// Endpoint /api/partecipazioni/torneo/:torneoId
router.get("/torneo/:torneoId", async (req, res) => {
  const { torneoId } = req.params;

  if (!validateUUID(torneoId)) {
    return res.status(400).json({ error: "ID torneo non valido" });
  }

  try {
    // 1. Recupera le partecipazioni con i dettagli dei team
    const { data, error } = await supabase
      .from('partecipazioni')
      .select(`
        id,
        created_at,
        punti_totali,
        penalita,
        team_id,
        team:teams (
          id,
          name
        )
      `)
      .eq('torneo_id', torneoId);

    if (error) throw error;

    // 2. Formatta i dati in modo sicuro
    const partecipazioni = data.map(p => ({
      id: p.id,
      team_id: p.team_id,
      punti_totali: p.punti_totali || 0,
      penalita: p.penalita || 0,
      created_at: p.created_at,
      team_name: p.team?.name || `Team ${p.team_id?.substring(0, 4) || 'XXXX'}`
    }));

    // 3. Ordina per punteggio (decrescente) e data di creazione
    partecipazioni.sort((a, b) => {
      const diff = b.punti_totali - a.punti_totali;
      return diff !== 0 ? diff : new Date(a.created_at) - new Date(b.created_at);
    });

    // 4. Aggiungi la posizione in classifica
    const risultato = partecipazioni.map((p, index) => ({
      ...p,
      position: index + 1
    }));

    res.json(risultato);

  } catch (error) {
    console.error("Errore nel recupero partecipazioni:", error);
    res.status(500).json({ 
      error: "Errore interno del server",
      details: error.message 
    });
  }
});

// Iscrivi un team a un torneo
router.post("/partecipazioni", async (req, res) => {
  const { torneo_id, team_id } = req.body;

  if (!validateUUID(torneo_id) || !validateUUID(team_id)) {
    return res.status(400).json({ error: "ID torneo o team non valido" });
  }

  try {
    // Verifica se il team è già iscritto
    const { count, error: checkError } = await supabase
      .from("partecipazioni")
      .select('*', { count: 'exact' })
      .eq("torneo_id", torneo_id)
      .eq("team_id", team_id);

    if (checkError) throw checkError;
    if (count > 0) {
      return res.status(400).json({ error: "Il team è già iscritto a questo torneo" });
    }

    // Crea la partecipazione
    const { data, error } = await supabase
      .from("partecipazioni")
      .insert([{
        torneo_id,
        team_id,
        punti_totali: 0,
        penalita: 0
      }])
      .select(`
        *,
        team:teams (name)
      `);

    if (error) throw error;

    res.status(201).json({
      ...data[0],
      team_name: data[0].team?.name
    });

  } catch (error) {
    console.error("Errore durante l'iscrizione:", error);
    res.status(500).json({ error: error.message || "Errore interno del server" });
  }
});

// Aggiorna punteggio e penalità di un team in un torneo
router.put("/:partecipazioneId", async (req, res) => {
  const { partecipazioneId } = req.params;
  const { punti_totali, penalita } = req.body;

  if (!validateUUID(partecipazioneId)) {
    return res.status(400).json({ error: "ID partecipazione non valido" });
  }

  try {
    const { data, error } = await supabase
      .from("partecipazioni")
      .update({
        punti_totali,
        penalita,
        updated_at: new Date().toISOString()
      })
      .eq("id", partecipazioneId)
      .select(`
        *,
        team:teams (name)
      `);

    if (error) throw error;

    res.json({
      ...data[0],
      team_name: data[0].team?.name
    });

  } catch (error) {
    console.error("Errore durante l'aggiornamento:", error);
    res.status(500).json({ error: error.message || "Errore interno del server" });
  }
});

// Elimina una partecipazione (rimuovi team da torneo)
router.delete("/:partecipazioneId", async (req, res) => {
  const { partecipazioneId } = req.params;

  if (!validateUUID(partecipazioneId)) {
    return res.status(400).json({ error: "ID partecipazione non valido" });
  }

  try {
    const { error } = await supabase
      .from("partecipazioni")
      .delete()
      .eq("id", partecipazioneId);

    if (error) throw error;

    res.status(204).end();
  } catch (error) {
    console.error("Errore durante l'eliminazione:", error);
    res.status(500).json({ error: error.message || "Errore interno del server" });
  }
});

module.exports = router;