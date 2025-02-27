import React, { useEffect, useState } from "react";
import { Layout, Card, Col, Row, Statistic, Button } from "antd";
import { Link } from "react-router-dom";

const { Content } = Layout;

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  // Funzioni per caricare i dati
  const fetchUsers = async () => {
    const response = await fetch(`${apiUrl}/api/users`);
    const data = await response.json();
    setUsers(data);
  };

  const fetchTournaments = async () => {
    const response = await fetch(`${apiUrl}/api/tournaments`);
    const data = await response.json();
    setTournaments(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchTournaments();
  }, []);

  // Count dei tornei dal db
  const totalTournaments = tournaments.length;  // Conta tutti i tornei senza filtro

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
          <h1 style={{ color: "#fff" }}>Benvenuto nell'Admin Dashboard</h1>

          {/* Sezione con le card */}
          <Row gutter={16}>
            <Col
              xs={24} sm={12} md={8} lg={6} xl={6}  // Responsività per diverse larghezze di schermo
            >
              <Card
                title="Tornei totali"
                bordered={false}
                style={{
                  backgroundColor: "#8a2be2", // Viola
                  borderRadius: 10,
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  marginBottom: 16, // Aggiunto margine tra le card
                }}
              >
                <Link to="/gestione-tornei" style={{ color: 'white', textDecoration: 'none' }}>
                  <Statistic 
                    value={totalTournaments} 
                    valueStyle={{ fontSize: '32px', color: '#ffffff' }} // Font-size più grande e colore del testo bianco
                  />
                  <Button
                    type="primary"
                    style={{ marginTop: 16, width: "100%" }}
                  >
                    Vai alla gestione tornei
                  </Button>
                </Link>
              </Card>
            </Col>
            <Col
              xs={24} sm={12} md={8} lg={6} xl={6}  // Responsività per diverse larghezze di schermo
            >
              <Card
                title="Giochi"
                bordered={false}
                style={{
                  backgroundColor: "#8a2be2", // Viola
                  borderRadius: 10,
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  marginBottom: 16, // Aggiunto margine tra le card
                }}
              >
                <Statistic 
                  value={gamesCount} 
                  valueStyle={{ fontSize: '32px', color: '#ffffff' }} // Font-size più grande e colore del testo bianco
                />
                <Button
                  type="primary"
                  style={{ marginTop: 16, width: "100%" }}
                  onClick={() => console.log('Vai alla gestione giochi')} // Aggiungi il link appropriato
                >
                  Vai alla gestione giochi
                </Button>
              </Card>
            </Col>
            <Col
              xs={24} sm={12} md={8} lg={6} xl={6}  // Responsività per diverse larghezze di schermo
            >
              <Card
                title="Totale utenti"
                bordered={false}
                style={{
                  backgroundColor: "#8a2be2", // Viola
                  borderRadius: 10,
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                }}
              >
                <Statistic 
                  value={totalUsers} 
                  valueStyle={{ fontSize: '32px', color: '#ffffff' }} // Font-size più grande e colore del testo bianco
                />
                <Link to="/gestione-utenti" style={{ color: 'white', textDecoration: 'none' }}>
                  <Button
                    type="primary"
                    style={{ marginTop: 16, width: "100%" }}
                  >
                    Vai alla gestione utenti
                  </Button>
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
