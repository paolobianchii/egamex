import { supabase } from "../lib/supabase.js";

export const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Accesso negato" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: "Token non valido" });

  req.user = data.user;
  next();
};
