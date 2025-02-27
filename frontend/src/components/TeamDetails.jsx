import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message, Button, Typography } from 'antd';
import axios from 'axios';

const { Title } = Typography;

function TeamDetails() {
  const { teamId } = useParams();  // Prendi l'id del team dalla rotta
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/api/teams/${teamId}`);
        setTeam(response.data);
      } catch (error) {
        message.error('Errore nel caricamento dei dettagli del team');
      }
      setLoading(false);
    };

    fetchTeam();
  }, [teamId]);

  return (
    <div style={{ padding: 20, marginTop:70 }}>
      <Spin spinning={loading} tip="Caricamento dettagli...">
        {team && (
          <div style={{ backgroundColor: 'white', padding: 20, borderRadius: 8, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
            <Title level={2}>Dettagli Team: {team.name}</Title>
            <p><strong>Punteggio:</strong> {team.score}</p>
            <p><strong>Numero di partecipanti:</strong> {team.num_participants}</p>
            <p><strong>Partecipanti:</strong></p>
            <ul>
              {team.participants.map((user) => (
                <li key={user.id}>{user.username}</li>
              ))}
            </ul>
            <Button onClick={() => navigate('/teams')}>Indietro</Button>
          </div>
        )}
      </Spin>
    </div>
  );
}

export default TeamDetails;
