import React, { useEffect, useState } from "react";
import { Layout, Card, Col, Row, Statistic, Button, Badge } from "antd";
import { Link } from "react-router-dom";
import Meta from "antd/es/card/Meta";

const { Content } = Layout;


// **Stile personalizzato per i bottoni**
const buttonStyle = {
  marginTop: 16,
  background: "linear-gradient(135deg, #ff7eb3, #ff758c)", 
  border: "none",
  color: "#fff",
  fontWeight: "bold",
  padding: "10px 20px",
  fontSize: "16px",
  borderRadius: "8px",
  transition: "all 0.3s ease",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer",
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  // Funzioni per caricare i dati
  const fetchUsers = async () => {
    const response = await fetch(`${apiUrl}/api/users`);
    const data = await response.json();
    setUsers(data);
  };

  const fetchTeams = async () => {
    const response = await fetch(`${apiUrl}/api/teams`);
    const data = await response.json();
    setTeams(data);
  };

  const fetchTournaments = async () => {
    const response = await fetch(`${apiUrl}/api/tournaments`);
    const data = await response.json();
    setTournaments(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchTournaments();
    fetchTeams();
  }, []);

  // Count dei tornei dal db
  const totalTournaments = tournaments.length;  // Conta tutti i tornei senza filtro
  const totalTeams = teams.length;  // Conta tutti i tornei senza filtro
  const gamesCount = 10; // Esempio, sostituire con il conteggio dei giochi
  const totalUsers = users.length;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout style={{ padding: "0 4px 4px", backgroundColor: "#191029" }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            marginTop: 70,
            marginBottom: 30,
          }}
        >
          <h1 style={{ color: "#fff" }}>Dashboard</h1>
          
          {/* Sezione con le card */}
          <Row gutter={16}>
          <Col
              xs={24} sm={12} md={8} lg={6} xl={6}  // Responsività per diverse larghezze di schermo
            >
              <Card
                title="Utenti"
                bordered={false}
                style={{
                  backgroundColor: "#8a2be2", // Viola
                  borderRadius: 10,
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                }}
                headStyle={{
                  color: "#fff", // Colore testo del titolo
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                
                <Link to="/gestione-utenti" style={{ color: 'white', textDecoration: 'none' }}>
                <Statistic 
                  value={totalUsers} 
                  valueStyle={{ fontSize: '32px', color: '#ffffff' }} // Font-size più grande e colore del testo bianco
                />
                </Link>
              </Card>
            </Col>
            <Col
              xs={24} sm={12} md={8} lg={6} xl={6}  // Responsività per diverse larghezze di schermo
            >
              <Card
                title="Tornei"
                bordered={false}
                style={{
                  backgroundColor: "#8a2be2", // Viola
                  borderRadius: 10,
                  color:"#fff",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  marginBottom: 16, // Aggiunto margine tra le card
                }}
                headStyle={{
                  color: "#fff", // Colore testo del titolo
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                <Link to="/gestione-tornei" style={{ color: 'white', textDecoration: 'none' }}>
                  <Statistic 
                    value={totalTournaments} 
                    valueStyle={{ fontSize: '32px', color: '#ffffff' }} // Font-size più grande e colore del testo bianco
                  />

                </Link>
              </Card>
            </Col>
            <Col
              xs={24} sm={12} md={8} lg={6} xl={6}  // Responsività per diverse larghezze di schermo
            >
              <Card
                title="Teams"
                bordered={false}
                style={{
                  backgroundColor: "#8a2be2", // Viola
                  borderRadius: 10,
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  marginBottom: 16, // Aggiunto margine tra le card
                }}
                headStyle={{
                  color: "#fff", // Colore testo del titolo
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                <Link to="/teams" style={{ color: 'white', textDecoration: 'none' }}>
                  <Statistic 
                    value={totalTeams} 
                    valueStyle={{ fontSize: '32px', color: '#ffffff' }} // Font-size più grande e colore del testo bianco
                  />

                </Link>

              </Card>
            </Col>
            
          </Row>

        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
