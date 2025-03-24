const express = require("express");
const { supabase } = require("../lib/supabase");
const NodeCache = require("node-cache");
const multer = require("multer");
const fs = require("fs");
const path = require("path");


const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minuti invece di 60 secondi

// Assicurati che la cartella "uploads" esista
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configurazione Multer per salvare i file localmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Cartella dove salvare le immagini
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome univoco
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Solo immagini JPG, PNG o GIF sono consentite"));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite di 5MB per immagine
  }
});

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
  next(); // Continua con il flusso
};

// Servire la cartella uploads come statica
router.use("/uploads", express.static("uploads"));

// Route per ottenere tutti i tornei
// Route per ottenere tutti i tornei
router.get("/", cacheMiddleware, async (req, res) => {
  try {
    console.time("Supabase Query");
    const { data, error } = await supabase
      .from("tornei")
      .select("*")
      .order("data", { ascending: false }) // Ordina per data decrescente
      .limit(20); // Limita il numero di risultati

    console.timeEnd("Supabase Query");

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



router.post("/", async (req, res) => {
  const { titolo, modalita, data, imageUrl } = req.body;

  if (!titolo || !modalita || !data) {
    return res.status(400).json({ error: "I campi 'titolo', 'modalita' e 'data' sono obbligatori" });
  }

  try {
    // Usa un URL di immagine predefinito se non viene fornito alcun URL
    const image = imageUrl || "https://cdn.prod.website-files.com/64479cbddbde2b42cebe552a/66d565dbfd64573a736e040a_esdp.PNG";

    const { data: insertedData, error } = await supabase.from("tornei").insert([
      {
        titolo,
        modalita,
        data,
        image: image,  // Salva l'URL dell'immagine nel database
      },
    ]).select();

    if (error) {
      console.error("Errore nell'inserimento del torneo:", error);
      return res.status(500).json({ error: "Errore nell'inserimento del torneo" });
    }

    cache.del("tornei_list");
    res.status(201).json(insertedData);
  } catch (error) {
    console.error("Errore interno durante l'inserimento del torneo:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});


// Route per modificare un torneo con gestione file locale
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { titolo, modalita, data } = req.body;
  const imageFile = req.file;

  if (!titolo || !modalita || !data) {
    return res.status(400).json({ error: "I campi 'titolo', 'modalita' e 'data' sono obbligatori" });
  }

  try {
    const { data: currentTournament, error: fetchError } = await supabase
      .from("tornei")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Errore nel recupero del torneo esistente:", fetchError);
      return res.status(500).json({ error: "Errore nel recupero del torneo" });
    }

    if (!currentTournament) {
      return res.status(404).json({ error: "Torneo non trovato" });
    }

    const updatedData = { titolo, modalita, data };

    if (imageFile) {
      // Elimina la vecchia immagine se esiste
      if (currentTournament.image) {
        const oldImagePath = path.join(__dirname, "..", currentTournament.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Salva il nuovo percorso immagine
      updatedData.image = `/uploads/${imageFile.filename}`;
    }

    const { data: updatedTournament, error: updateError } = await supabase
      .from("tornei")
      .update(updatedData)
      .eq("id", id)
      .select();

    if (updateError) {
      console.error("Errore nell'aggiornamento del torneo:", updateError);
      return res.status(500).json({ error: "Errore nell'aggiornamento del torneo" });
    }

    cache.del("tornei_list");
    res.status(200).json(updatedTournament);
  } catch (error) {
    console.error("Errore interno durante l'aggiornamento del torneo:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Route per eliminare un torneo
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from("tornei").select("*").eq("id", id).single();

    if (error) {
      console.error("Errore nel recupero del torneo:", error);
      return res.status(500).json({ error: "Errore nel recupero del torneo" });
    }

    if (!data) {
      return res.status(404).json({ error: "Torneo non trovato" });
    }

    // Elimina l'immagine associata
    if (data.image) {
      const imagePath = path.join(__dirname, "..", data.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Elimina il torneo dal database
    const { error: deleteError } = await supabase.from("tornei").delete().eq("id", id);

    if (deleteError) {
      console.error("Errore nell'eliminazione del torneo:", deleteError);
      return res.status(500).json({ error: "Errore nell'eliminazione del torneo" });
    }

    cache.del("tornei_list");
    res.status(200).json({ message: "Torneo eliminato con successo" });
  } catch (error) {
    console.error("Errore interno durante l'eliminazione del torneo:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

module.exports = router;
