const express = require ("express");
const { supabase } = require("../lib/supabase");

const router = express.Router();


router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase.from("tornei").select("*");
        //console.log("Dati ricevuti:", data);  // Aggiungi questo log
        if (error) {
            console.error("Errore nel recupero dei tornei:", error);
            return res.status(500).json({ error: "Errore nel recupero dei tornei" });
        }
        res.json(data);
    } catch (error) {
      console.error("Errore durante la richiesta dei tornei:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });



module.exports = router;