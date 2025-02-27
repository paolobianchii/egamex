import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModificaProfilo from '../components/ModificaProfilo';
import axios from 'axios';

const ModificaProfiloPage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUser(response.data);
      } catch (error) {
        message.error("Errore nel recupero dei dati");
        navigate('/');
      }
    };

    fetchUser();
  }, [navigate]);

  return user ? <ModificaProfilo user={user} /> : <p>Caricamento...</p>;
};

export default ModificaProfiloPage;
