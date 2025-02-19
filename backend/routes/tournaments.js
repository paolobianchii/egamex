const express = require ("express");
const { supabase } = require("../lib/supabase");
const NodeCache = require("node-cache");

const router = express.Router();
const cache = new NodeCache({ stdTTL: 60 }); // Cache con TTL di 60 secondi

// Middleware per caching con NodeCache
const cacheMiddleware = (req, res, next) => {
  const key = "tornei_list";
  const cachedData = cache.get(key);
  if (cachedData) {
      return res.json(cachedData); // Se i dati sono nella cache, restituiscili
  }
  res.sendResponse = res.json;
  res.json = (body) => {
      cache.set(key, body); // Salva nella cache
      res.sendResponse(body); // Restituisci la risposta originale
  };
  next(); // Continua con il flusso, chiamando la route effettiva
};

router.get("/",cacheMiddleware ,async (req, res) => {
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