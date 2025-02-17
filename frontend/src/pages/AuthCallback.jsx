const saveUserToDatabase = async (user) => {
    const { data, error } = await supabase.from("users").upsert([
      {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.user_metadata.avatar_url,
        role: "user", // Default user
      }
    ]);
  
    if (error) console.error("Errore nel salvataggio utente:", error.message);
  };
  