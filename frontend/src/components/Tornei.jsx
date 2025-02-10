import React, { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Empty, Table, Modal, Badge } from "antd";
import axios from 'axios';
import { CalendarOutlined } from "@ant-design/icons"; // Importa l'icona


const { Meta } = Card;

const Tornei = () => {
  const [tornei, setTornei] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [partecipanti, setPartecipanti] = useState([]);
    const [loadingPartecipanti, setLoadingPartecipanti] = useState(false);
    const [torneoId, setTorneoId] = useState(null); // Definisci lo stato torneoId
    const [error, setError] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  const openModal = async (torneoId) => {
    if (!torneoId) return;

    setTorneoId(torneoId);
    setLoadingPartecipanti(true);
    setIsModalVisible(true);

    try {
      const response = await axios.get(
        `${apiUrl}/api/partecipanti/${torneoId}`
      );

      if (Array.isArray(response.data) && response.data.length > 0) {
        setPartecipanti(response.data);
      } else {
        setPartecipanti([]);
      }
    } catch (error) {
      console.error("Errore nel recupero delle partecipazioni:", error);
    } finally {
      setLoadingPartecipanti(false);
    }
  };

  const columns = [
    /*
    {
      title: "ID Partecipazione",
      dataIndex: "partecipazione_id",
      key: "partecipazione_id",
      width: 150,
    },
    {
      title: "ID Utente",
      dataIndex: "utente_id",
      key: "utente_id",
      width: 150,
    },
    {
      title: "Torneo ID",
      dataIndex: "torneo_id",
      key: "torneo_id",
      render: (text) => text || "N/A", // Rendi più robusto se manca il valore
    },
    */
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => text || "N/A",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (text) => text || "N/A",
    },
    {
      title: "Punteggio",
      dataIndex: "punteggio",
      key: "punteggio",
      render: (punteggio) => punteggio || "0",
    },
    
  ];

  useEffect(() => {
    if (!partecipanti || partecipanti.length === 0) {
      console.log("⚠️ Nessun partecipante trovato o dati non disponibili.");
    } else {
      console.log(
        `✅ Partecipanti trovati (${partecipanti.length}):`,
        partecipanti
      );
    }
  }, [partecipanti]);
  useEffect(() => {
    axios.get(`${apiUrl}/api/tournaments`)
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

  const getDaysRemaining = (torneoDate) => {
    const diffTime = torneoDate - currentDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Usa Math.floor per evitare il problema del giorno parziale
    return diffDays;
  };

  const getTimeRemaining = (torneoDate) => {
    // Calcola la data di scadenza (5 giorni dopo la data del torneo)
    const expirationDate = new Date(torneoDate);
    expirationDate.setDate(torneoDate.getDate() + 5); // Aggiungi 5 giorni

    const diffTime = expirationDate - currentDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Giorni
    const diffHours = Math.floor(
      (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    ); // Ore
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60)); // Minuti

    return `${diffDays} giorni ${diffHours}h ${diffMinutes}m`;
  };

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

<Modal
  title={<span className="fs-4 fw-bold text-white">Classifica Torneo</span>} // Titolo con Bootstrap
  open={isModalVisible}
  onCancel={() => setIsModalVisible(false)}
  footer={null}
  width={800}
  destroyOnClose
  className="custom-modal" // Applichiamo una classe personalizzata alla modale
  maskClassName="custom-mask" // Applichiamo una classe personalizzata alla maschera (sfondo scuro sotto la modale)
>
  <Table
    dataSource={partecipanti}
    columns={columns}
    rowKey="partecipazione_id"
    loading={loadingPartecipanti}
    scroll={{ y: 400 }}
    locale={{
      emptyText: (
        <Empty description={<span style={{ color: '#ccc' }}>Nessun partecipante registrato</span>} />
      ),
    }}
    rowClassName={(record, index) => {
      // Differenzia i ranghi con sfondi diversi per i top 3
      if (index === 0) return 'top1'; // Primo posto
      if (index === 1) return 'top2'; // Secondo posto
      if (index === 2) return 'top3'; // Terzo posto
      return ''; // Altri posti
    }}
    style={{
      backgroundColor: '#282828', // Sfondo della tabella
      color: 'white',
    }}
    pagination={false} // Rimuovi la paginazione per una visualizzazione più semplice
  />
</Modal>



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
              <h4
                style={{
                  color: "white",
                  textAlign: "left",
                  marginBottom: "20px",
                  fontSize: 28,
                  marginLeft: 5,
                  fontWeight: "700",
                }}
              >
                Tornei in corso ({inCorsoTornei.length})
              </h4>
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
                        {/* Badge sopra l'immagine */}
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            backgroundColor: "#ff4d4f",
                            color: "white",
                            padding: "5px 10px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            fontSize: 12,
                          }}
                        >
                          {`Scade tra ${getTimeRemaining(
                            new Date(torneo.data)
                          )}`}
                        </div>
                        <Meta
                          title={
                            <h3
                              style={{
                                fontWeight: "700",
                                fontSize: "18px",
                                color: "#282828",
                              }}
                            >
                              {torneo.titolo}
                            </h3>
                          }
                          description={
                            <Badge
                              count={`${torneo.modalita}`}
                              style={{
                                backgroundColor: "#282828", // Colore del badge (puoi cambiarlo)
                                color: "white", // Colore del testo
                                padding: "12px", // Padding per fare un po' di spazio attorno al testo
                                display: "flex",
                                marginTop: -20,
                                justifyContent: "center",
                                alignItems: "center",
                                borderRadius: "6px", // Per rendere gli angoli arrotondati
                                fontSize: "12px", // Regola la dimensione del font
                              }}
                            />
                          }
                        />
                        <div style={{ marginTop: 15, marginBottom: 15 }}>
                          <span style={{ fontSize: 11, fontWeight: "" }}>
                            Creato:{" "}
                          </span>
                          <span style={{ fontSize: 11 }}>
                            {new Date(torneo.data).toLocaleString("it-IT", {
                              weekday: "long", // Giorno della settimana
                              year: "numeric", // Anno
                              month: "long", // Mese
                              day: "numeric", // Giorno
                              hour: "2-digit", // Ora (due cifre)
                            })}
                          </span>
                        </div>

                        <Button
                          style={{ width: "100%" }}
                          type="primary"
                          onClick={() => openModal(torneo.id)}
                          disabled={
                            new Date(torneo.data).getTime() <=
                            currentDate.getTime() - 5 * 24 * 60 * 60 * 1000 // 5 giorni fa
                          }
                        >
                          {new Date(torneo.data).getTime() <=
                          currentDate.getTime() - 5 * 24 * 60 * 60 * 1000
                            ? "Scaduto"
                            : new Date(torneo.data).getTime() >
                              currentDate.getTime()
                            ? `Partecipa tra ${getDaysRemaining(
                                new Date(torneo.data)
                              )} giorni` // Torneo futuro
                            : `Partecipa`}
                        </Button>
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
              <h4
                style={{
                  color: "white",
                  textAlign: "left",
                  marginBottom: "20px",
                  fontSize: 28,
                  marginLeft: 5,
                  fontWeight: "700",
                }}
              >
                Tornei a breve ({futureTornei.length})
              </h4>
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
                          title={
                            <h3
                              style={{
                                fontWeight: "700",
                                fontSize: "18px",
                                color: "#282828",
                              }}
                            >
                              {torneo.titolo}
                            </h3>
                          }
                          description={
                            <p style={{ color: "#282828", fontSize: "16px" }}>
                              Modalità: {torneo.modalita}
                            </p>
                          }
                        />
                        <p>
                          <CalendarOutlined style={{ fontSize: 18 }} />{" "}
                          {new Date(torneo.data).toLocaleDateString()}
                        </p>
                        <Button
                          type="primary"
                          disabled={
                            new Date(torneo.data).toLocaleDateString() !==
                            currentDate.toLocaleDateString()
                          }
                        >
                          {new Date(torneo.data).toLocaleDateString() ===
                          currentDate.toLocaleDateString()
                            ? "Partecipa"
                            : `Mancano ${getDaysRemaining(
                                new Date(torneo.data)
                              )} giorni`}
                        </Button>
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
