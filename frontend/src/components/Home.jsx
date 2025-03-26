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
  Spin,
} from "antd";
import axios from "axios";
import { CalendarOutlined } from "@ant-design/icons"; // Importa l'icona
import debounce from "lodash.debounce"; // Importa il debounce
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Footer from "./Footer";
import imgTorneo from "../assets/torneoImage.png";
import MarqueeGiochi from "./MarqueeGiochi";

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
  const [user, setUser] = useState(null);
  

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log("User from localStorage:", parsedUser); // Debug per verificare
      setUser(parsedUser);
    } else {
      console.log("No user found in localStorage");
    }
  }, []);

  useEffect(() => {
    console.log("User state updated:", user);  // Verifica se user cambia correttamente
  }, [user]);

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
      setLoading(true); // Avvia il loading quando si inizia a caricare i tornei
      const response = await axios.get(`${apiUrl}/api/tournaments`);
      setTornei(response.data); // Imposta i tornei quando sono stati recuperati
    } catch (error) {
      console.error("Errore nel recupero dei tornei:", error);
    } finally {
      setLoading(false); // Ferma il loading una volta che i dati sono stati caricati
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  

  const getRankedLeaderboard = (partecipanti) => {
    // Calcola punteggio sommando i game
    const playersWithScore = partecipanti.map(player => ({
      ...player,
      punteggio: (player.game1 || 0) + (player.game2 || 0) + (player.game3 || 0) + (player.game4 || 0)
    }));
  
    // Ordina per punteggio decrescente
    const sortedPlayers = playersWithScore.sort((a, b) => b.punteggio - a.punteggio);
  
    let lastPunteggio = null;
    let lastRank = 0;
    let skipRank = 0;
  
    return sortedPlayers.map((player, index) => {
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
      render: (int) => (
        <span style={{ color: "white", fontWeight: "bold" }}>
    {int !== undefined ? int : "N/A"}
    </span>
      ),
    },
    {
      title: (
        <span style={{ color: "#1E90FF", fontWeight: "bold" }}>Game 2</span>
      ),
      dataIndex: "game2",
      key: "game2",
      render: (int) => (
        <span style={{ color: "white", fontWeight: "bold" }}>
    {int !== undefined ? int : "N/A"}
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
    {int !== undefined ? int : "N/A"}
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
        .then((response) => response.json())
        .then((data) => setTeams(data));
    }
  }, [isTeamView]);


  const handleIscrizione = async () => {
    // Verifica che l'utente sia loggato
    if (!user || !user.id || !user.role) {
      notification.error({
        message: "Errore",
        description: "Devi essere registrato per iscriverti a questo torneo.",
        duration: 3,
      });
      return;
    }
  
    // Logica per l'iscrizione
    const torneoId = torneoSelezionato?.id;
    const createdAt = torneoSelezionato?.created_at;
    const punteggio = 0;
  
    try {
      // Verifica se l'utente è già iscritto al torneo
      const checkResponse = await axios.get(`${apiUrl}/api/partecipazioni/${torneoId}/utente/${user.id}`);
      if (checkResponse.data.iscrizione) {
        notification.info({
          message: "Sei già iscritto",
          description: "Non puoi iscriverti più di una volta a questo torneo.",
          duration: 3,
        });
        return; // Non eseguire l'iscrizione se già iscritto
      }
  
      // Aggiungi la partecipazione se non è già presente
      const response = await axios.post(`${apiUrl}/api/partecipazioni/${torneoId}`, {
        torneo_id: torneoId,
        utente_id: user.id,
        punteggio: punteggio,
        created_at: createdAt,
      });
  
      if (response.status === 200 && response.data) {
        setPartecipanti((prevPartecipanti) => [...prevPartecipanti, response.data]);
        notification.success({
          message: "Iscrizione completata",
          description: "Sei stato iscritto al torneo con punteggio 0.",
          duration: 3,
        });
      } else {
        notification.error({
          message: "Errore",
          description: "Non è stato possibile completare l'iscrizione.",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Errore nell'iscrizione:", error);
      notification.error({
        message: "Errore",
        description: error.response?.data?.message || "Si è verificato un problema durante l'iscrizione.",
        duration: 3,
      });
    }
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
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  color: "#00FFFF",
                  fontWeight: "bold",
                  fontSize: "28px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                {torneoSelezionato?.titolo}
              </span>
            </div>

            {/* Image Section */}
            <div
              style={{
                marginBottom: "30px",
                textAlign: "center",
              }}
            >
              <img
                src={
                  torneoSelezionato?.image ||
                  "https://wallpapers.com/images/hd/futuristic-spacecraft-battle-scene-in-outer-space-zyttyd8mqpke0qf4.jpg"
                }
                alt="Tournament Image"
                style={{
                  width: "40%",
                  maxHeight: "300px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0, 255, 255, 0.2)",
                }}
              />
            </div>

            {/* Switch Tab Section */}
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <span
                style={{
                  color: "#00FFFF",
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginRight: "10px",
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
                  backgroundColor: "#00FFFF",
                  borderRadius: "50px",
                  padding: "1px 5px",
                }}
              />
            </div>
            {user && user.id ? (
        user.role === "user" ? (
          <Button
            type="primary"
            style={{
              backgroundColor: "#00FFFF",
              border: "none",
              fontSize: "16px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
            onClick={handleIscrizione}
          >
            Iscriviti al torneo
          </Button>
        ) : (
          <p style={{ color: "#fff" }}>Devi essere loggato come utente per partecipare.</p>
        )
      ) : (
        <p style={{ color: "#fff" }}>Accedi prima di iscriverti al torneo.</p>
      )}


            {/* Data Table Section */}
            <div
              style={{
                background: "linear-gradient(145deg, #111, #000)",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 255, 255, 0.3)",
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
                        <span style={{ color: "#ccc", fontSize: "16px" }}>
                          {isTeamView
                            ? "Nessun team registrato"
                            : "Nessun partecipante registrato"}
                        </span>
                      }
                    />
                  ),
                }}
                rowClassName={(record, index) => {
                  if (index === 0) return "top1";
                  if (index === 1) return "top2";
                  if (index === 2) return "top3";
                  return "";
                }}
                style={{
                  background: "#222",
                  borderRadius: "10px",
                  overflow: "hidden",
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
                    <div className="loading-spinner">
                      <Spin size="large" />
                      <span>Caricamento tornei...</span>
                    </div>
                  </div>
                )}
                {loading ? (
                  <div className="loading-spinner">
                    <Spin size="large" />
                    <span>Loading tornei...</span>
                  </div>
                ) : inCorsoTornei.length > 0 ? (
                  inCorsoTornei.map((torneo) => (
                    <Col span={24} sm={12} md={18} lg={12} key={torneo.id}>
                      <Card
                        hoverable
                        style={{ marginBottom: "20px" }}
                        cover={
                          <img
                            alt={torneo.titolo}
                            src={
                              torneo.image ||
                              "https://cdn.prod.website-files.com/64479cbddbde2b42cebe552a/66d565dbfd64573a736e040a_esdp.PNG"
                            } // Default image URL
                            style={{ height: "150px", objectFit: "cover" }}
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
                            src={
                              torneo.image ||
                              "https://cdn.prod.website-files.com/64479cbddbde2b42cebe552a/66d565dbfd64573a736e040a_esdp.PNG"
                            } // Default image URL
                            style={{ height: "150px", objectFit: "cover" }}
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

        <MarqueeGiochi />

        <Footer />
      </div>
    </div>
  );
};

export default Home;
