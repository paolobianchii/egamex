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
  Tabs,
} from "antd";
import axios from "axios";
import {
  CalendarOutlined,
  TrophyOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  ControlOutlined,
  ControlFilled,
  GifOutlined,
  GiftFilled,
  CodeFilled,
  EyeOutlined,
} from "@ant-design/icons";
import debounce from "lodash.debounce";
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Footer from "./Footer";
import imgTorneo from "../assets/torneoImage.png";
import MarqueeGiochi from "./MarqueeGiochi";

const { Meta } = Card;
const { TabPane } = Tabs;

const Home = () => {
  const [tornei, setTornei] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [currentTorneo, setCurrentTorneo] = useState(null);
  const [viewMode, setViewMode] = useState("player"); // player or team
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);

      // 1. Recupera i tornei
      const responseTornei = await axios.get(`${apiUrl}/api/battle-royale`);
      const torneiData = responseTornei.data;

      // 2. Recupera tutte le partecipazioni
      const responsePartecipazioni = await axios.get(
        `${apiUrl}/api/partecipazioni`
      );
      const partecipazioniData = responsePartecipazioni.data;

      // 3. Recupera tutte le informazioni sugli utenti
      const responseUtenti = await axios.get(`${apiUrl}/api/users`);
      const utentiData = responseUtenti.data;

      // 4. Recupera tutte le informazioni sui team
      const responseTeams = await axios.get(`${apiUrl}/api/teams`);
      const teamsData = responseTeams.data;

      // 5. Aggiungi i partecipanti e team ai tornei
      const torneoConDati = torneiData.map((torneo) => {
        // Filtra le partecipazioni per il torneo corrente
        const partecipazioniTorneo = partecipazioniData.filter(
          (partecipazione) => partecipazione.torneo_id === torneo.id
        );

        // Mappa le partecipazioni con le informazioni sugli utenti (username e punteggio)
        const partecipantiConInfo = partecipazioniTorneo.map(
          (partecipazione) => {
            const utente = utentiData.find(
              (utente) => utente.id === partecipazione.utente_id
            );

            // Crea un oggetto con i punteggi per ogni round
            const roundScores = {};
            if (torneo.rounds) {
              for (let i = 1; i <= torneo.rounds; i++) {
                roundScores[`round_${i}`] = partecipazione[`round_${i}`] || 0;
              }
            }

            return {
              username: utente ? utente.username : "Unknown",
              punteggio: partecipazione.punteggio || 0,
              team_id: utente ? utente.team_id : null,
              team_name: utente && utente.team_id 
                ? teamsData.find(team => team.id === utente.team_id)?.name || "Unknown Team" 
                : "No Team",
              ...roundScores,
            };
          }
        );

        // Organizza i dati per i team
        const teamMap = new Map();
        
        partecipantiConInfo.forEach(player => {
          if (player.team_id) {
            if (!teamMap.has(player.team_id)) {
              teamMap.set(player.team_id, {
                team_id: player.team_id,
                team_name: player.team_name,
                members: [],
                punteggio: 0,
                round_scores: {},
              });
              
              // Inizializza i punteggi dei round per il team
              if (torneo.rounds) {
                for (let i = 1; i <= torneo.rounds; i++) {
                  teamMap.get(player.team_id).round_scores[`round_${i}`] = 0;
                }
              }
            }
            
            // Aggiungi il giocatore al team
            teamMap.get(player.team_id).members.push(player.username);
            
            // Aggiorna il punteggio totale del team
            teamMap.get(player.team_id).punteggio += player.punteggio;
            
            // Aggiorna i punteggi dei round per il team
            if (torneo.rounds) {
              for (let i = 1; i <= torneo.rounds; i++) {
                teamMap.get(player.team_id).round_scores[`round_${i}`] += player[`round_${i}`] || 0;
              }
            }
          }
        });
        
        // Converti la Map in un array di team
        const teamsData = Array.from(teamMap.values()).map(team => ({
          team_name: team.team_name,
          members: team.members,
          punteggio: team.punteggio,
          ...team.round_scores,
        }));

        return {
          ...torneo,
          partecipanti: partecipantiConInfo,
          teams: teamsData,
          roundCount: torneo.rounds || 0, // Usa il campo rounds dal torneo
        };
      });

      setTornei(torneoConDati);
    } catch (error) {
      console.error("Errore nel recupero dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  // Colonne per la tabella dei giocatori
  const getPartecipantiColumns = (roundCount) => {
    const baseColumns = [
      {
        title: "Giocatore",
        dataIndex: "username",
        key: "username",
        render: (text) => <span style={{ color: "#d8b4fe" }}>{text}</span>,
        fixed: "left",
        sorter: (a, b) => a.username.localeCompare(b.username),
      },
      {
        title: "Team",
        dataIndex: "team_name",
        key: "team_name",
        render: (text) => (
          <span style={{ color: "#a78bfa" }}>
            <TeamOutlined style={{ marginRight: 5 }} />
            {text}
          </span>
        ),
      }
    ];

    // Aggiungi colonne per ogni round
    for (let i = 1; i <= roundCount; i++) {
      baseColumns.push({
        title: `Game ${i}`,
        dataIndex: `round_${i}`,
        key: `round_${i}`,
        align: "center",
        render: (score) => (
          <Badge
            count={score || 0}
            style={{
              backgroundColor: score > 0 ? "#6a3093" : "#4c1d95",
              color: "#fff",
            }}
          />
        ),
        sorter: (a, b) => (a[`round_${i}`] || 0) - (b[`round_${i}`] || 0),
      });
    }

    // Aggiungi colonna punteggio totale
    baseColumns.push({
      title: "Totale",
      dataIndex: "punteggio",
      key: "punteggio",
      align: "center",
      fixed: "right",
      sorter: (a, b) => (a.punteggio || 0) - (b.punteggio || 0),
      defaultSortOrder: 'descend',
      render: (score) => (
        <span
          style={{
            color: "#fff",
            fontWeight: "bold",
            background: "linear-gradient(135deg, #7e22ce 0%, #6a3093 100%)",
            padding: "4px 12px",
            borderRadius: "16px",
            boxShadow: "0 2px 8px rgba(122, 40, 206, 0.4)",
          }}
        >
          {score || 0}
        </span>
      ),
    });

    return baseColumns;
  };

  // Colonne per la tabella dei team
  const getTeamColumns = (roundCount) => {
    const baseColumns = [
      {
        title: "Team",
        dataIndex: "team_name",
        key: "team_name",
        render: (text) => <span style={{ color: "#d8b4fe" }}>{text}</span>,
        fixed: "left",
        sorter: (a, b) => a.team_name.localeCompare(b.team_name),
      },
      {
        title: "Membri",
        dataIndex: "members",
        key: "members",
        render: (members) => (
          <span style={{ color: "#a78bfa" }}>
            {members.join(", ")}
          </span>
        ),
      }
    ];

    // Aggiungi colonne per ogni round
    for (let i = 1; i <= roundCount; i++) {
      baseColumns.push({
        title: `Game ${i}`,
        dataIndex: `round_${i}`,
        key: `round_${i}`,
        align: "center",
        render: (score) => (
          <Badge
            count={score || 0}
            style={{
              backgroundColor: score > 0 ? "#6a3093" : "#4c1d95",
              color: "#fff",
            }}
          />
        ),
        sorter: (a, b) => (a[`round_${i}`] || 0) - (b[`round_${i}`] || 0),
      });
    }

    // Aggiungi colonna punteggio totale
    baseColumns.push({
      title: "Totale",
      dataIndex: "punteggio",
      key: "punteggio",
      align: "center",
      fixed: "right",
      sorter: (a, b) => (a.punteggio || 0) - (b.punteggio || 0),
      defaultSortOrder: 'descend',
      render: (score) => (
        <span
          style={{
            color: "#fff",
            fontWeight: "bold",
            background: "linear-gradient(135deg, #7e22ce 0%, #6a3093 100%)",
            padding: "4px 12px",
            borderRadius: "16px",
            boxShadow: "0 2px 8px rgba(122, 40, 206, 0.4)",
          }}
        >
          {score || 0}
        </span>
      ),
    });

    return baseColumns;
  };

  const openModal = (torneo) => {
    setCurrentTorneo(torneo);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
  };

  const switchView = (mode) => {
    setViewMode(mode);
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
        <Row gutter={[16, 16]} style={{ marginTop: 70, marginBottom: 30 }}>
          <Col xs={24} style={{ textAlign: "center", marginBottom: 20 }}>
            <h1
              style={{ color: "#fff", fontSize: "2.5rem", fontWeight: "bold" }}
            >
              <TrophyOutlined style={{ marginRight: 10 }} />
              Tornei Attivi
            </h1>
          </Col>

          {loading ? (
            <Col span={24} style={{ textAlign: "center" }}>
              <Spin size="large" />
            </Col>
          ) : tornei.length === 0 ? (
            <Col span={24} style={{ textAlign: "center" }}>
              <Empty
                description={
                  <span style={{ color: "#ccc", fontSize: "1.2rem" }}>
                    Nessun torneo attivo al momento
                  </span>
                }
              />
            </Col>
          ) : (
            tornei.map((torneo) => (
              <Col xs={24} sm={12} md={8} lg={6} key={torneo.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: "12px",
                    background: "linear-gradient(to bottom, #2a0a4a, #1a052a)",
                    border: "1px solid #6a3093",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 4px 12px rgba(106, 48, 147, 0.3)",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{
                    padding: "16px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                  cover={
                    <div style={{ position: "relative" }}>
                      <img
                        alt={torneo.titolo}
                        src={
                          torneo.image ||
                          "https://wallpapers.com/images/hd/futuristic-spacecraft-battle-scene-in-outer-space-zyttyd8mqpke0qf4.jpg"
                        }
                        style={{
                          height: "180px",
                          width: "100%",
                          objectFit: "cover",
                          borderTopLeftRadius: "12px",
                          borderTopRightRadius: "12px",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background:
                            "linear-gradient(to bottom, rgba(42,10,74,0.3), rgba(26,5,42,0.7))",
                        }}
                      ></div>
                    </div>
                  }
                  onClick={() => openModal(torneo)}
                >
                  <Meta
                    title={
                      <span
                        style={{
                          color: "#d8b4fe",
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                          textShadow: "0 0 8px rgba(216, 180, 254, 0.3)",
                          marginBottom: "12px",
                          display: "block",
                        }}
                      >
                        {torneo.titolo}
                      </span>
                    }
                    description={
                      <div style={{ color: "#a78bfa", flex: 1 }}>
                        <div
                          style={{
                            marginBottom: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <CalendarOutlined
                            style={{
                              color: "#c084fc",
                              fontSize: 16,
                            }}
                          />
                          {new Date(torneo.data_inizio).toLocaleDateString(
                            "it-IT",
                            { day: "numeric", month: "long", year: "numeric" }
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 16,
                          }}
                        >
                          <ClockCircleOutlined
                            style={{
                              color: "#c084fc",
                              fontSize: 16,
                            }}
                          />
                          {torneo.orario_torneo}
                        </div>
                      </div>
                    }
                  />
                  <Button
                    type="primary"
                    style={{
                      marginTop: "auto",
                      width: "100%",
                      background: "linear-gradient(to right, #7e22ce, #6a3093)",
                      border: "none",
                      fontWeight: "bold",
                      color: "#fff",
                      height: "40px",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(122, 40, 206, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.2s",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(torneo);
                    }}
                  >
                    <EyeOutlined />
                    Dettagli
                  </Button>
                </Card>
              </Col>
            ))
          )}
        </Row>

        {/* Modal per dettagli torneo */}
        <Modal
          open={visible}
          onCancel={closeModal}
          footer={null}
          width={800}
          style={{ top: 20 }}
          bodyStyle={{
            backgroundColor: "#1a052a",
            color: "#ffffff",
            padding: 0,
          }}
          headerStyle={{
            backgroundColor: "#2a0a4a",
            color: "#ffffff",
            borderBottom: "1px solid #6a3093",
          }}
        >
          <div
            style={{
              backgroundImage: `url(${
                currentTorneo?.image ||
                "https://wallpapers.com/images/hd/futuristic-spacecraft-battle-scene-in-outer-space-zyttyd8mqpke0qf4.jpg"
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
              height: "300px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "linear-gradient(to bottom, rgba(42,10,74,0.7), rgba(26,5,42,0.9))",
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                color: "#fff",
                zIndex: 1,
              }}
            >
              <h1
                style={{
                  color: "#fff",
                  fontSize: 32,
                  textShadow: "0 0 10px rgba(255,255,255,0.3)",
                  margin: 0,
                }}
              >
                {currentTorneo?.titolo}
              </h1>
            </div>
          </div>

          <Row gutter={[16, 16]} style={{ marginTop: 20, padding: "0 20px" }}>
            <Col span={24}>
              <Tabs 
                defaultActiveKey="players" 
                onChange={switchView}
                style={{
                  color: "#a78bfa",
                }}
                tabBarStyle={{
                  borderBottom: "2px solid #6a3093",
                  marginBottom: "20px",
                }}
              >
                <TabPane 
                  tab={
                    <span style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <TrophyOutlined style={{ color: "#fbbf24" }} /> Classifica Giocatori
                    </span>
                  } 
                  key="player"
                >
                  <Table
                    columns={getPartecipantiColumns(currentTorneo?.roundCount || 0)}
                    dataSource={currentTorneo?.partecipanti || []}
                    rowKey="username"
                    pagination={{ pageSize: 10 }}
                    style={{
                      backgroundColor: "transparent",
                    }}
                    rowClassName={() => "gaming-table-row"}
                    scroll={{ x: true }}
                    bordered
                  />
                </TabPane>
                <TabPane 
                  tab={
                    <span style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <TeamOutlined style={{ color: "#fbbf24" }} /> Classifica Teams
                    </span>
                  } 
                  key="team"
                >
                  <Table
                    columns={getTeamColumns(currentTorneo?.roundCount || 0)}
                    dataSource={currentTorneo?.teams || []}
                    rowKey="team_name"
                    pagination={{ pageSize: 10 }}
                    style={{
                      backgroundColor: "transparent",
                    }}
                    rowClassName={() => "gaming-table-row"}
                    scroll={{ x: true }}
                    bordered
                  />
                </TabPane>
              </Tabs>
            </Col>
          </Row>

          <div
            style={{
              marginTop: 30,
              padding: "20px",
              background: "linear-gradient(to right, #2a0a4a, #1a052a)",
              borderTop: "1px solid #6a3093",
              borderBottom: "1px solid #6a3093",
            }}
          >
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} sm={8}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CodeFilled
                    style={{
                      fontSize: 24,
                      color: "#a78bfa",
                      backgroundColor: "#4c1d95",
                      padding: 8,
                      borderRadius: 8,
                    }}
                  />
                  <div>
                    <div style={{ color: "#a78bfa", fontSize: 14 }}>Gioco</div>
                    <div
                      style={{ color: "#fff", fontSize: 18, fontWeight: 500 }}
                    >
                      {currentTorneo?.nome_gioco}
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <SettingOutlined
                    style={{
                      fontSize: 24,
                      color: "#a78bfa",
                      backgroundColor: "#4c1d95",
                      padding: 8,
                      borderRadius: 8,
                    }}
                  />
                  <div>
                    <div style={{ color: "#a78bfa", fontSize: 14 }}>
                      Modalità
                    </div>
                    <div
                      style={{ color: "#fff", fontSize: 18, fontWeight: 500 }}
                    >
                      {currentTorneo?.type}
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <InfoCircleOutlined
                    style={{
                      fontSize: 24,
                      color: "#a78bfa",
                      backgroundColor: "#4c1d95",
                      padding: 8,
                      borderRadius: 8,
                    }}
                  />
                  <div>
                    <div style={{ color: "#a78bfa", fontSize: 14 }}>
                      Informazioni
                    </div>
                    <div style={{ color: "#fff", fontSize: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <CalendarOutlined />
                        {new Date(
                          currentTorneo?.data_inizio
                        ).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <ClockCircleOutlined /> {currentTorneo?.orario_torneo}
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Modal>

        <MarqueeGiochi />
        <Footer />
      </div>
    </div>
  );
};

export default Home;