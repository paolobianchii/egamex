import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Empty,
  Badge,
  Input,
  Modal,
  Table,
  Switch,
  notification,
} from "antd";
import axios from "axios";
import { CalendarOutlined } from "@ant-design/icons"; // Importa l'icona
import debounce from "lodash.debounce"; // Importa il debounce
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Footer from "./Footer";

const { Meta } = Card;

const Home = () => {
  const [tornei, setTornei] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Stato per la ricerca
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const [showTeams, setShowTeams] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null); // Stato per l'utente loggato
  const [isLoginVisible, setIsLoginVisible] = useState(false); // Stato per la modale di login

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [partecipanti, setPartecipanti] = useState([]);
  const [loadingPartecipanti, setLoadingPartecipanti] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [torneoId, setTorneoId] = useState(null); // Definisci lo stato torneoId
  const [error, setError] = useState(null);
  const [torneoSelezionato, setTorneoSelezionato] = useState(null);

  const openModal = async (torneo) => {
    if (!torneo) return;

    setTorneoSelezionato(torneo);
    setLoadingPartecipanti(true);
    setIsModalVisible(true);

    try {
      const response = await axios.get(
        `${apiUrl}/api/partecipanti/${torneo.id}`
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

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/tournaments`);
      setTornei(response.data);
    } catch (error) {
      console.error("Errore nel recupero dei tornei:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTournaments();
  }, []);
  

  const getRankedLeaderboard = (partecipanti) => {
    // Ordina i partecipanti in base al punteggio decrescente
    const sortedPlayers = [...partecipanti].sort(
      (a, b) => b.punteggio - a.punteggio
    );
  
    let lastPunteggio = null;
    let lastRank = 0;
    let skipRank = 0;
  
    return sortedPlayers.map((player, index) => {
      // Se il punteggio è uguale al precedente, assegna la stessa posizione
      if (player.punteggio === lastPunteggio) {
        skipRank++;
      } else {
        lastRank += 1 + skipRank;
        skipRank = 0;
      }
  
      lastPunteggio = player.punteggio;
  
      return { ...player, posizione: lastRank };
    });
  };
  
  const rankedPlayers = getRankedLeaderboard(partecipanti);

  const columns = [
    {
      title: (
        <span style={{ color: "#FFA500", fontWeight: "bold" }}>Posizione</span>
      ),
      dataIndex: "posizione",
      key: "posizione",
      render: (text) => (
        <span style={{ color: "white", fontWeight: "bold" }}>{text}</span>
      ),
    },
    {
      title: (
        <span style={{ color: "#00FF00", fontWeight: "bold" }}>Username</span>
      ),
      dataIndex: "username",
      key: "username",
      render: (text) => (
        <span style={{ color: "white", fontWeight: "bold" }}>
          {text || "N/A"}
        </span>
      ),
    },
    {
      title: (
        <span style={{ color: "#FF4500", fontWeight: "bold" }}>Game 1</span>
      ),
      dataIndex: "game1",
      key: "game1",
      render: (text) => (
        <span style={{ color: "white", fontWeight: "bold" }}>
          {text || "-"}
        </span>
      ),
    },
    {
      title: (
        <span style={{ color: "#1E90FF", fontWeight: "bold" }}>Game 2</span>
      ),
      dataIndex: "game2",
      key: "game2",
      render: (text) => (
        <span style={{ color: "white", fontWeight: "bold" }}>
          {text || "-"}
        </span>
      ),
    },
    {
      title: (
        <span style={{ color: "gold", fontWeight: "bold" }}>Punteggio</span>
      ),
      dataIndex: "punteggio",
      key: "punteggio",
      render: (int) => (
        <span
          style={{
            color: "gold",
            fontWeight: "bold",
            textShadow: "0px 0px 10px rgba(255, 215, 0, 0.8)",
          }}
        >
          {int || "0"}
        </span>
      ),
    },
  ];

  const teamColumns = [
    {
      title: (
        <span style={{ color: "#FFA500", fontWeight: "bold" }}>Posizione</span>
      ),
      dataIndex: "posizione",
      key: "posizione",
      render: (text) => (
        <span style={{ color: "white", fontWeight: "bold" }}>{text}</span>
      ),
    },
    {
      title: (
        <span style={{ color: "#00FF00", fontWeight: "bold" }}>Nome Team</span>
      ),
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span style={{ color: "white", fontWeight: "bold" }}>
          {text || "N/A"}
        </span>
      ),
    },
    {
      title: (
        <span style={{ color: "gold", fontWeight: "bold" }}>Punteggio</span>
      ),
      dataIndex: "score",
      key: "score",
      render: (int) => (
        <span
          style={{
            color: "gold",
            fontWeight: "bold",
            textShadow: "0px 0px 10px rgba(255, 215, 0, 0.8)",
          }}
        >
          {int || "0"}
        </span>
      ),
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
  const [isTeamView, setIsTeamView] = useState(false); // Stato per gestire la vista (team o utenti)
  const [teams, setTeams] = useState([]); // Stato per i dati dei team

  useEffect(() => {
    if (isTeamView) {
      fetch(`${apiUrl}/api/teams`)
        .then(response => response.json())
        .then(data => setTeams(data));
    }
  }, [isTeamView]);
  

// Funzione per gestire l'iscrizione
const handleIscrizione = () => {
  // Verifica se l'utente è loggato (adatta questa parte al tuo sistema di autenticazione)
  const isLoggedIn = localStorage.getItem("authToken") !== null; // Verifica la presenza di un token di autenticazione

  if (!isLoggedIn) {
    // Mostra la notifica di errore se l'utente non è loggato
    notification.error({
      message: "Errore",
      description: "Devi essere registrato per iscriverti a questo torneo.",
      duration: 3, // Durata della notifica
    });
    return;
  }

  // Se l'utente è loggato, continua con il processo di iscrizione
  const torneoId = torneoSelezionato.id;

  // Logica per iscrivere l'utente al torneo
  axios
    .post(`${apiUrl}/api/partecipanti/${torneoId}`, { userId, punteggio: 0 })
    .then((response) => {
      // Gestisci la risposta e aggiorna lo stato
      setPartecipanti([...partecipanti, response.data]);
      notification.success({
        message: "Iscrizione completata",
        description: "Sei stato iscritto al torneo con punteggio 0.",
      });
    })
    .catch((error) => {
      console.error("Errore nell'iscrizione:", error);
    });
};


  // Funzione debounce per gestire la ricerca
  const handleSearchChange = debounce((value) => {
    setSearchTerm(value);
  }, 100); // Ritarda di 500ms prima di aggiornare lo stato

  const currentDate = new Date();
  const fiveDaysAgo = new Date(currentDate);
  fiveDaysAgo.setDate(currentDate.getDate() - 5);
  const futureTornei = [];
  const inCorsoTornei = [];
  const passatiTornei = [];

  // Assicurati che `tornei` sia un array prima di eseguire il ciclo
  if (Array.isArray(tornei)) {
    tornei.forEach((torneo) => {
      // Assicurati che `torneo.data` sia una data valida
      const torneoDate = new Date(torneo.data);

      // Verifica che la data del torneo sia valida
      if (isNaN(torneoDate)) {
        console.error(`Data del torneo non valida: ${torneo.data}`);
        return; // Salta questo torneo se la data non è valida
      }

      // Confronta le date
      if (torneoDate > currentDate) {
        futureTornei.push(torneo); // Tornei futuri
      } else if (torneoDate >= fiveDaysAgo) {
        inCorsoTornei.push(torneo); // Tornei in corso
      } else {
        passatiTornei.push(torneo); // Tornei passati
      }
    });
  } else {
    console.error("tornei non è un array valido:", tornei);
  }

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
          padding: "10px 10px",
          minHeight: "100vh",
        }}
      >
        {/* Barra di ricerca visibile solo su desktop */}
        <div style={{ display: "none", marginBottom: "20px" }}>
          <Input
            placeholder="Cerca tornei"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: "300px",
              marginBottom: "20px",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          />
        </div>

        <Row gutter={16} style={{ marginBottom: "40px", marginTop: 70 }}>
        <Modal
      open={isModalVisible}
      onCancel={() => setIsModalVisible(false)}
      footer={null}
      width="90vw"
      className="tournament-modal"
      maskClassName="custom-mask"
      destroyOnClose
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        <span
          style={{
            color: '#00FFFF',
            fontWeight: 'bold',
            fontSize: '28px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          {torneoSelezionato?.titolo}
        </span>
      </div>

      {/* Image Section */}
      <div
        style={{
          marginBottom: '30px',
          textAlign: 'center',
        }}
      >
        <img
          src={torneoSelezionato?.image || 'https://wallpapers.com/images/hd/futuristic-spacecraft-battle-scene-in-outer-space-zyttyd8mqpke0qf4.jpg'}
          alt="Tournament Image"
          style={{
            width: '100%',
            maxHeight: '350px',
            objectFit: 'cover',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 255, 255, 0.2)',
          }}
        />
      </div>

      {/* Switch Tab Section */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <span
          style={{
            color: '#00FFFF',
            fontSize: '18px',
            fontWeight: 'bold',
            marginRight: '10px',
          }}
        >
          Visualizza:
        </span>
        <Switch
          checked={isTeamView}
          onChange={(checked) => setIsTeamView(checked)}
          checkedChildren="Teams"
          unCheckedChildren="Users"
          style={{
            backgroundColor: '#00FFFF',
            borderRadius: '50px',
            padding: '1px 5px',
          }}
        />
      </div>

      {/* Data Table Section */}
      <div
        style={{
          background: 'linear-gradient(145deg, #111, #000)',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 255, 255, 0.3)',
        }}
      >
        <Table
          dataSource={isTeamView ? teams : rankedPlayers}
          columns={isTeamView ? teamColumns : columns}
          rowKey="id"
          loading={isTeamView ? loadingTeams : loadingPartecipanti}
          scroll={{ y: 400 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  <span style={{ color: '#ccc', fontSize: '16px' }}>
                    {isTeamView ? 'Nessun team registrato' : 'Nessun partecipante registrato'}
                  </span>
                }
              />
            ),
          }}
          rowClassName={(record, index) => {
            if (index === 0) return 'top1';
            if (index === 1) return 'top2';
            if (index === 2) return 'top3';
            return '';
          }}
          style={{
            background: '#222',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
          pagination={false}
          bordered
        />
      </div>
    </Modal>


          {/* Tornei in corso */}
          <Col span={24} md={12}>
            <div
              style={{
                background: "rgba(15, 14, 23, 0.1)", // Colore di sfondo quasi trasparente
                backdropFilter: "blur(10px)", // Effetto di sfocatura dietro il div
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Ombra
                padding: "20px", // Aggiungi padding per distanziare il contenuto dal bordo
                borderRadius: "8px", // Per arrotondare gli angoli
                border: "0.1px solid #493473", // Bordo
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
                {loading && (
                  <div
                    style={{
                      position: "absolute", // Posizionamento assoluto rispetto al contenitore
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: -2,
                    }}
                  >
                    <h2 style={{ color: "#fff", fontSize: "24px" }}>
                      Caricamento tornei...
                    </h2>
                  </div>
                )}
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
                            src={`${apiUrl}${torneo.image}`}
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
                            padding: "3px 8px",
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
                          onClick={() => openModal(torneo)}
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
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#fff",
                      textAlign: "center",
                      background: "rgba(0, 0, 0, 0.6)", // Sfondo scuro semi-trasparente
                      padding: "30px", // Spazio attorno al testo
                      borderRadius: "10px", // Angoli arrotondati
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)", // Ombra leggera
                      maxWidth: "400px", // Larghezza massima
                      margin: "0 auto", // Centra il contenuto
                      transition: "all 0.3s ease", // Transizione per animazioni
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 30,
                    }}
                  >
                    Non ci sono tornei in corso
                  </div>
                )}
              </Row>
            </div>
          </Col>

          {/* Tornei a breve */}
          <Col span={24} md={12}>
            {loading && (
              <div
                style={{
                  position: "absolute", // Posizionamento assoluto rispetto al contenitore
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 9999,
                }}
              >
                <h2 style={{ color: "#fff", fontSize: "24px" }}>
                  Caricamento tornei...
                </h2>
              </div>
            )}
            <div
              style={{
                background: "rgba(15, 14, 23, 0.1)", // Colore di sfondo quasi trasparente
                backdropFilter: "blur(10px)", // Effetto di sfocatura dietro il div
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Ombra
                padding: "20px", // Aggiungi padding per distanziare il contenuto dal bordo
                borderRadius: "8px", // Per arrotondare gli angoli
                border: "0.1px solid #493473", // Bordo
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
                A breve ({futureTornei.length})
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
                            src={`${apiUrl}${torneo.image}`}
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
                          <span style={{ fontSize: 11 }} className="text-muted">
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
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#fff",
                      textAlign: "center",
                      background: "rgba(0, 0, 0, 0.6)", // Sfondo scuro semi-trasparente
                      padding: "30px", // Spazio attorno al testo
                      borderRadius: "10px", // Angoli arrotondati
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)", // Ombra leggera
                      maxWidth: "400px", // Larghezza massima
                      margin: "0 auto", // Centra il contenuto
                      transition: "all 0.3s ease", // Transizione per animazioni
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 30,
                    }}
                  >
                    Non ci sono tornei a breve
                  </div>
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
            marginBottom: "20px",
            fontSize: 34,
            marginLeft: 5,
            fontWeight: "700",
          }}
        >
          Giochi
        </h2>
        <div
          style={{
            background: "rgba(15, 14, 23, 0.1)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <div style={{ overflow: "hidden", width: "100%" }}>
            <div
              style={{
                display: "flex",
                animation: "scroll 10s linear infinite",
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

              {/* Duplica il contenuto per far sembrare che l'animazione sia infinita */}
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

        <Footer />
      </div>
    </div>
  );
};

export default Home;
