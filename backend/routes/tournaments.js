const express = require("express");
const { supabase } = require("../lib/supabase");

const router = express.Router();

router.post('/battle-royale', async (req, res) => {
  const {
    titolo,
    giocatoriPerTeam,
    rounds,
    bestOf,
    discordLink,
    gioco,
    numeroTeam,
    dataInizio,
    dataFine,
    nomeGioco,
    orarioTorneo,
    moltiplicatori // array di numeri
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
        gioco_id: gioco,
        nome_gioco: nomeGioco,
        numero_team: numeroTeam,
        data_inizio: dataInizio,
        data_fine: dataFine,
        orario_torneo: orarioTorneo,
        moltiplicatori // supponiamo che la colonna sia un array numerico
      }]);

    if (error) throw error;

    res.status(201).json({ message: 'Torneo creato', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/battle-royale/:id', async (req, res) => {
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



router.get('/battle-royale', async (req, res) => {
  try {
    // 1. Tornei
    const { data: tornei, error: torneoError } = await supabase
      .from('battleroyaletorneo')
      .select('*');

    if (torneoError) throw torneoError;

    // 2. Giochi
    const { data: giochi, error: giochiError } = await supabase
      .from('giochi')
      .select('id, nome');

    if (giochiError) throw giochiError;

    // 3. Unione
    const torneiConNomeGioco = tornei.map(torneo => {
      const gioco = giochi.find(g => g.id === torneo.gioco_id);
      return {
        ...torneo,
        nomeGioco: gioco ? gioco.nome : null
      };
    });

    res.status(200).json(torneiConNomeGioco);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/battle-royale/:id', async (req, res) => {
  const { id } = req.params;
  const {
    titolo,
    modalita, // o type, a seconda di come lo chiami nel frontend
    data,
    gioco,
    numeroTeam,
    dataInizio,
    dataFine,
    orarioTorneo,
    giocatoriPerTeam,
    rounds,
    bestOf,
    discordLink
  } = req.body;

  try {
    // Prima verifichiamo che il torneo esista
    const { data: existingTournament, error: findError } = await supabase
      .from('battleroyaletorneo')
      .select('*')
      .eq('id', id)
      .single();

    if (findError) throw findError;
    if (!existingTournament) {
      return res.status(404).json({ error: 'Torneo non trovato' });
    }

    // Costruiamo l'oggetto con i campi da aggiornare
    const updates = {
      titolo: titolo || existingTournament.titolo,
      type: modalita || existingTournament.type,
      data_inizio: dataInizio || existingTournament.data_inizio,
      data_fine: dataFine || existingTournament.data_fine,
      orario_torneo: orarioTorneo || existingTournament.orario_torneo,
      gioco_id: gioco || existingTournament.gioco_id,
      numero_team: numeroTeam || existingTournament.numero_team,
      giocatori_per_team: giocatoriPerTeam || existingTournament.giocatori_per_team,
      rounds: rounds || existingTournament.rounds,
      best_of: bestOf || existingTournament.best_of,
      discord_link: discordLink || existingTournament.discord_link,
    };

    // Se viene passato un nuovo gioco, aggiorniamo anche il nome del gioco
    if (gioco && gioco !== existingTournament.gioco_id) {
      const { data: giocoData, error: giocoError } = await supabase
        .from('giochi')
        .select('nome')
        .eq('id', gioco)
        .single();

      if (giocoError) throw giocoError;
      updates.nome_gioco = giocoData.nome;
    }

    // Eseguiamo l'aggiornamento
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

module.exports = router;
