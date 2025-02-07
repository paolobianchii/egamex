import React, { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Empty } from "antd";
import axios from 'axios';

const { Meta } = Card;

const Tornei = () => {
  const [tornei, setTornei] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5002/api/tournaments')
      .then(response => {
        setTornei(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("C'è stato un errore nel recupero dei tornei:", error);
        setLoading(false);
      });
  }, []);

  const currentDate = new Date();
  const fiveDaysAgo = new Date(currentDate);
  fiveDaysAgo.setDate(currentDate.getDate() - 5);
  const futureTornei = [];
  const inCorsoTornei = [];
  const passatiTornei = [];

  tornei.forEach(torneo => {
    const torneoDate = new Date(torneo.data);
    if (torneoDate > currentDate) {
      futureTornei.push(torneo);
    } else if (torneoDate >= fiveDaysAgo) {
      inCorsoTornei.push(torneo);
    } else {
      passatiTornei.push(torneo);
    }
  });

  return (
    <div
          style={{
            backgroundImage:
              "url(https://images.rawpixel.com/image_800/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcm0zODAtMDIuanBn.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            position: "relative",
            minHeight: "100vh",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              padding: "50px 20px",
              minHeight: "100vh",
            }}
          >
            <Row gutter={16} style={{ marginBottom: "40px" }}>
              {/* Tornei in corso */}
              <Col span={24} md={12}>
                <div
                  style={{
                    background: "#0F0E17", // Colore di sfondo personalizzato
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Ombra
                    padding: "20px", // Aggiungi padding per distanziare il contenuto dal bordo
                    borderRadius: "8px", // Per arrotondare gli angoli
                    border: "0.8px solid #493473",
                  }}
                >
                  <h2
                    style={{
                      color: "white",
                      textAlign: "left",
                      marginBottom: "20px",
                      fontSize: 34,
                      marginLeft: 5,
                      fontWeight: "700",
                    }}
                  >
                    Tornei in corso ({inCorsoTornei.length})
                  </h2>
                  <Row gutter={16}>
                    {loading ? (
                      <p>Loading tornei...</p>
                    ) : inCorsoTornei.length > 0 ? (
                      inCorsoTornei.map((torneo) => (
                        <Col span={24} sm={12} md={18} lg={12} key={torneo.id}>
                          <Card
                            hoverable
                            style={{ marginBottom: "20px" }}
                            cover={
                              <img
                                alt={torneo.titolo}
                                src={torneo.image}
                                style={{ height: "200px", objectFit: "cover" }}
                              />
                            }
                          >
                            <Meta
                              title={torneo.titolo}
                              description={`Modalità: ${torneo.modalita}`}
                            />
                            <p>
                              Data: {new Date(torneo.data).toLocaleDateString()}
                            </p>
                            <Button type="primary">Partecipa</Button>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <Empty
                        description={
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "bold",
                              color: "#fff",
                              textAlign: "center",
                            }}
                          >
                            Non ci sono tornei in corso
                          </div>
                        }
                      />
                    )}
                  </Row>
                </div>
              </Col>
    
              {/* Tornei a breve */}
              <Col span={24} md={12}>
                <div
                  style={{
                    background: "#0F0E17", // Colore di sfondo personalizzato
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Ombra
                    padding: "20px", // Aggiungi padding per distanziare il contenuto dal bordo
                    borderRadius: "8px", // Per arrotondare gli angoli
                    border: "0.8px solid #493473",
                  }}
                >
                  <h2
                    style={{
                      color: "white",
                      textAlign: "left",
                      marginBottom: "20px",
                      fontSize: 34,
                      marginLeft: 5,
                      fontWeight: "700",
                    }}
                  >
                    Tornei a breve ({futureTornei.length})
                  </h2>
                  <Row gutter={16}>
                    {futureTornei.length > 0 ? (
                      futureTornei.map((torneo) => (
                        <Col span={24} sm={12} md={18} lg={12} key={torneo.id}>
                          <Card
                            hoverable
                            style={{ marginBottom: "20px" }}
                            cover={
                              <img
                                alt={torneo.titolo}
                                src={torneo.image}
                                style={{ height: "200px", objectFit: "cover" }}
                              />
                            }
                          >
                            <Meta
                              title={torneo.titolo}
                              description={`Modalità: ${torneo.modalita}`}
                            />
                            <p>
                              Data: {new Date(torneo.data).toLocaleDateString()}
                            </p>
                            <Button type="primary">Partecipa</Button>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <Empty description="Non ci sono tornei a breve" />
                    )}
                  </Row>
                </div>
              </Col>
            </Row>
    
            {/* Carosello di loghi */}
            <h2
              style={{
                color: "white",
                textAlign: "left",
                marginBottom: "60px",
                fontSize: 34,
                marginLeft: 5,
                fontWeight: "700",
              }}
            >
              Giochi
            </h2>
            <div style={{ overflow: "hidden", width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  animation: "scroll 18s linear infinite",
                }}
              >
                <img
                  src="https://cdn2.steamgriddb.com/logo_thumb/db6d9e1beb13d90e4a67706afb39e4e8.png"
                  alt="Logo 1"
                  style={{ height: "50px", marginRight: "100px" }}
                />
                <img
                  src="https://www.stormforcegaming.co.uk/wp-content/uploads/2024/04/FortniteLogo-wht.png"
                  alt="Logo 2"
                  style={{ height: "50px", marginRight: "100px" }}
                />
                <img
                  src="https://fifauteam.com/images/fc25/logo/long-white.webp"
                  alt="Logo 3"
                  style={{ height: "50px", marginRight: "100px" }}
                />
                <img
                  src="https://logos-world.net/wp-content/uploads/2020/12/Dota-2-Logo.png"
                  alt="Logo 4"
                  style={{ height: "50px", marginRight: "100px" }}
                />
                <img
                  src="https://freepnglogo.com/images/all_img/1706273096valorant-logo-png-white.png"
                  alt="Logo 5"
                  style={{ height: "50px", marginRight: "100px" }}
                />
              </div>
            </div>
          </div>
        </div>
  );
};

export default Tornei;
