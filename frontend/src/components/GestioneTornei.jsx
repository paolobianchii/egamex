import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import {
  HomeOutlined,
  TeamOutlined,
  AppstoreAddOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  EllipsisOutlined,
  EyeOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Button,
  Popconfirm,
  message,
  Layout,
  Upload,
  Table,
  Form,
  Modal,
  Input,
  DatePicker,
  Tabs,
  Select,
  Spin,
  Tag,
  Row,
  Col,
  TimePicker,
  Menu,
  Dropdown,
  InputNumber,
  Card,
  Tooltip,
  Space,
} from "antd";
import moment from "moment"; // Importa moment.js
import axios from "axios";

const { Sider, Content } = Layout;

const GestioneTornei = () => {
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [isModeModalVisible, setIsModeModalVisible] = useState(false);
  const [isBattleRoyaleModalVisible, setIsBattleRoyaleModalVisible] =
    useState(false);
  const [tournamentFilter, setTournamentFilter] = useState("");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const [selectedMode, setSelectedMode] = useState(null);
  const [modalSelectionTracker, setModalSelectionTracker] = useState(null);
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [isManageModalVisible1, setIsManageModalVisible1] = useState(false);
  const [activeRoundTab, setActiveRoundTab] = useState("1");
  const [penalties, setPenalties] = useState({});
  const [numTeams, setNumTeams] = useState(0); // Stato per il numero di input dinamici
  const [availableTeams, setAvailableTeams] = useState([]);
  const [assignedTeams, setAssignedTeams] = useState([]);
  const [isTeamsRegistered, setIsTeamsRegistered] = useState(false);

  const handleViewTournament = (tournament) => {
    setSelectedTournament(tournament);
    setIsDetailsModalVisible(true);
  };
  const handleChangeTeams = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    setNumTeams(value);

    // Inizializza i moltiplicatori a 0
    const initialValues = {};
    for (let i = 1; i <= value; i++) {
      initialValues[`moltiplicatore${i}`] = 0;
    }
    form.setFieldsValue(initialValues);
  };

  // Fetching data functions
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      message.error("Errore durante il caricamento degli utenti.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/battle-royale`);
      if (!response.ok) throw new Error("Failed to fetch tournaments");
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      message.error("Errore durante il caricamento dei tornei.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTournaments();
  }, []);

  const handleDeleteTournament = async (tournamentId) => {
    try {
      const res = await fetch(`${apiUrl}/api/battle-royale/${tournamentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Errore eliminazione");

      message.success("Torneo eliminato");
      setTournaments(tournaments.filter((t) => t.id !== tournamentId));
    } catch (err) {
      message.error("Errore. Riprova.");
      console.error(err);
    }
  };

  const handleManageTournament = async (tournament) => {
    try {
      setLoading(true);
      setSelectedTournament(tournament);

      // 1. Carica in parallelo partecipazioni e team disponibili
      const [partecipazioniRes, teamsRes] = await Promise.all([
        axios.get(`${apiUrl}/api/partecipazioni/torneo/${tournament.id}`),
        axios.get(`${apiUrl}/api/battle-royale`),
      ]);

      const partecipazioni = await getPartecipazioniWithTeamNames(
        tournament.id
      );
      const allTeams = teamsRes.data || [];

      // 2. Prepara l'array dei team assegnati
      const assigned = Array(tournament.numero_team).fill(null);

      // 3. Mappa le partecipazioni esistenti
      if (partecipazioni.length > 0) {
        const teamMap = allTeams.reduce((map, team) => {
          map[team.id] = team;
          return map;
        }, {});

        partecipazioni.forEach((part) => {
          const index = part.position - 1; // Converti position (1-based) in index (0-based)
          if (index >= 0 && index < assigned.length) {
            assigned[index] = teamMap[part.team_id] || {
              id: part.team_id,
              name: `Team ${part.team_id.substring(0, 6)}...`,
            };
          }
        });

        setIsTeamsRegistered(true);
      } else {
        setIsTeamsRegistered(false);
      }

      // 4. Aggiorna gli stati
      setAvailableTeams(allTeams);
      setAssignedTeams(assigned);
      setIsManageModalVisible1(true);
    } catch (error) {
      console.error("Errore nel caricamento:", error);
      message.error(
        error.response?.data?.error || "Errore nel caricamento dei dati"
      );

      // Fallback: inizializza comunque gli stati
      setAvailableTeams([]);
      setAssignedTeams(Array(selectedTournament?.numero_team || 0).fill(null));
      setIsTeamsRegistered(false);
      setIsManageModalVisible1(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTournament = async (tournament) => {
    try {
      setSelectedTournament(tournament);
      setIsEditModalVisible(true);

      // Aspetta che il form sia pronto prima di impostare i valori
      await form.resetFields();

      form.setFieldsValue({
        titolo: tournament.titolo,
        modalita: tournament.type,
        dataInizio: tournament.data_inizio
          ? moment(tournament.data_inizio)
          : null,
        dataFine: tournament.data_fine ? moment(tournament.data_fine) : null,
        orarioTorneo: tournament.orario_torneo
          ? moment(tournament.orario_torneo, "HH:mm:ss")
          : null,
        gioco: tournament.id_gioco,
        numeroTeam: tournament.numero_team,
        giocatoriPerTeam: tournament.giocatori_per_team,
        rounds: tournament.rounds,
        bestOf: tournament.best_of,
        discordLink: tournament.discord_link,
        // Aggiungi qui eventuali moltiplicatori se presenti
        ...(tournament.moltiplicatori && {
          moltiplicatori: tournament.moltiplicatori,
        }),
      });
    } catch (err) {
      console.error("Errore nella preparazione del form:", err);
      message.error("Errore nella preparazione della modifica");
    }
  };

  const handlePointTournament = (tournament) => {
    setSelectedTournament(tournament);
    setIsManageModalVisible(true);

    // Solo se i team sono già stati assegnati
    const initialPenalties = {};
    assignedTeams.forEach((team, index) => {
      if (team) {
        initialPenalties[`team${index + 1}`] = [];
      }
    });
    setPenalties(initialPenalties);
  };

  const handleAddPenalty = (teamId) => {
    setPenalties((prev) => ({
      ...prev,
      [`team${teamId}`]: [
        ...prev[`team${teamId}`],
        {
          id: Date.now(),
          value: 0,
          reason: "",
        },
      ],
    }));
  };

  const handleRemovePenalty = (teamId, penaltyId) => {
    setPenalties((prev) => ({
      ...prev,
      [`team${teamId}`]: prev[`team${teamId}`].filter(
        (p) => p.id !== penaltyId
      ),
    }));
  };

  const handlePenaltyChange = (teamId, penaltyId, field, value) => {
    setPenalties((prev) => {
      const updatedPenalties = { ...prev };
      updatedPenalties[`team${teamId}`] = updatedPenalties[`team${teamId}`].map(
        (p) => (p.id === penaltyId ? { ...p, [field]: value } : p)
      );
      return updatedPenalties;
    });
  };

  const getPartecipazioniWithTeamNames = async (torneoId) => {
    try {
      const response = await axios.get(
        `${apiUrl}/api/partecipazioni/torneo/${torneoId}`,
        {
          params: {
            join: "teams", // Questo dipende dal tuo backend
          },
        }
      );

      // I dati dovrebbero arrivare già con team_name incluso
      return response.data.map((p) => ({
        ...p,
        team_name: p.team?.name || `Team ${p.team_id.substring(0, 4)}`,
      }));
    } catch (error) {
      console.error("Errore nel recupero:", error);
      return [];
    }
  };

  // 2. Soluzione alternativa: Mappatura lato frontend
  const getTeamNamesForPartecipazioni = async (partecipazioni) => {
    try {
      // Estrai tutti gli ID team univoci
      const teamIds = [...new Set(partecipazioni.map((p) => p.team_id))];

      // Recupera i team corrispondenti
      const response = await axios.get(`${apiUrl}/api/battle-royale`, {
        params: {
          ids: teamIds.join(","),
        },
      });

      // Crea una mappa ID -> nome team
      const teamMap = response.data.reduce((acc, team) => {
        acc[team.id] = team.name;
        return acc;
      }, {});

      // Aggiungi i nomi alle partecipazioni
      return partecipazioni.map((p) => ({
        ...p,
        team_name: teamMap[p.team_id] || `Team ${p.team_id.substring(0, 4)}`,
      }));
    } catch (error) {
      console.error("Errore nel recupero team:", error);
      return partecipazioni.map((p) => ({
        ...p,
        team_name: `Team ${p.team_id.substring(0, 4)}`,
      }));
    }
  };

  const roundTabs =
    selectedTournament?.rounds && isTeamsRegistered
      ? [
          ...Array.from({ length: selectedTournament.rounds }, (_, i) => ({
            key: `${i + 1}`,
            label: `Round ${i + 1}`,
            children: (
              <div style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  {assignedTeams
                    .filter((team) => team !== null)
                    .map((team, index) => {
                      const teamId = index + 1;
                      return (
                        <Col key={teamId} span={8} style={{ marginBottom: 16 }}>
                          <Card
                            title={team.name || `Team ${teamId}`}
                            size="small"
                            extra={
                              <Button
                                size="small"
                                onClick={() => handleAddPenalty(teamId)}
                              >
                                + Penalità
                              </Button>
                            }
                          >
                            <InputNumber
                              defaultValue={0}
                              style={{ width: "100%", marginBottom: 8 }}
                            />
                            {penalties[`team${teamId}`]?.map((penalty) => (
                              <div
                                key={penalty.id}
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  marginBottom: 8,
                                }}
                              >
                                <InputNumber
                                  value={penalty.value}
                                  onChange={(value) =>
                                    handlePenaltyChange(
                                      teamId,
                                      penalty.id,
                                      "value",
                                      value
                                    )
                                  }
                                  style={{ width: "60%" }}
                                />
                                <Input
                                  value={penalty.reason}
                                  onChange={(e) =>
                                    handlePenaltyChange(
                                      teamId,
                                      penalty.id,
                                      "reason",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Motivo"
                                  style={{ width: "100%" }}
                                />
                                <Button
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() =>
                                    handleRemovePenalty(teamId, penalty.id)
                                  }
                                />
                              </div>
                            ))}
                          </Card>
                        </Col>
                      );
                    })}
                </Row>
              </div>
            ),
          })),
        ]
      : [];

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        titolo: values.titolo,
        type: values.modalita,
        data_inizio: values.dataInizio.format("YYYY-MM-DD"),
        data_fine: values.dataFine.format("YYYY-MM-DD"),
        orario_torneo: values.orarioTorneo.format("HH:mm:ss"),
        id_gioco: values.gioco,
        numero_team: values.numeroTeam,
        giocatori_per_team: values.giocatoriPerTeam,
        rounds: values.rounds,
        best_of: values.bestOf,
        discord_link: values.discordLink,
        // Aggiungi qui eventuali moltiplicatori se presenti
        ...(values.moltiplicatori && {
          moltiplicatori: values.moltiplicatori,
        }),
      };

      await axios.put(
        `${apiUrl}/api/battle-royale/${selectedTournament.id}`,
        payload
      );

      message.success("Torneo modificato con successo");
      setIsEditModalVisible(false);
      fetchTournaments(); // Ricarica la lista dei tornei
    } catch (err) {
      console.error("Errore nella modifica del torneo:", err);
      message.error("Errore durante la modifica del torneo");
    }
  };

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/giochi`); // Cambia con il tuo URL se necessario

        if (!response.ok) {
          throw new Error("Errore nella richiesta");
        }

        const data = await response.json();
        setGames(data);
      } catch (err) {
        setError("Errore nel recupero dei giochi");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) return <p>Caricamento giochi...</p>;

  const openModeModal = () => {
    setIsModeModalVisible(true);
    setSelectedMode(null);
  };

  const handleRemoveTeam = async (teamId) => {
    try {
      // 1. Recupera l'ID della partecipazione
      const response = await axios.get(`${apiUrl}/api/partecipazioni`, {
        params: {
          torneo_id: selectedTournament.id,
          team_id: teamId,
        },
      });

      if (response.data.length === 0) {
        throw new Error("Partecipazione non trovata");
      }

      const partecipazioneId = response.data[0].id;

      // 2. Elimina la partecipazione
      await axios.delete(`${apiUrl}/api/partecipazioni/${partecipazioneId}`);

      // 3. Aggiorna lo stato locale
      setAssignedTeams((prev) =>
        prev.map((t) => (t?.id === teamId ? null : t))
      );

      message.success("Team rimosso dal torneo");
      fetchTournaments(); // Aggiorna la lista dei tornei
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.error || "Errore durante la rimozione del team"
      );
    }
  };

  const handleCreateTeams = async () => {
    try {
      setLoading(true);
  
      // Verifica che ci sia un torneo selezionato
      if (!selectedTournament?.id) {
        throw new Error("Nessun torneo selezionato");
      }
  
      // 1. Creazione dei team con UUID generato prima
      const createdTeams = await Promise.all(
        assignedTeams.map(async (team, index) => {
          if (!team?.name || !team?.players?.length) {
            throw new Error(`Dati mancanti per il team ${index + 1}`);
          }
  
          // Genera UUID per il team
          const teamId = uuidv4();
  
          // Crea il team nell'API battle-royale con l'ID specificato
          const teamResponse = await axios.post(`${apiUrl}/api/teams`, {
            id: teamId, // Invia l'UUID generato
            name: team.name,
            players: team.players,
            score: 0,
            num_participants: team.players.length,
            is_active: true,
          });
  
          if (!teamResponse.data?.id) {
            throw new Error(`Creazione team fallita`);
          }
  
          // Verifica che l'ID restituito corrisponda a quello inviato
          if (teamResponse.data.id !== teamId) {
            throw new Error(`ID team non corrisponde`);
          }
  
          return {
            team_id: teamId, // Usa lo stesso UUID generato
            position: index + 1,
          };
        })
      );
  
      // 2. Creazione delle partecipazioni
      await Promise.all(
        createdTeams.map(async (team) => {
          await axios.post(`${apiUrl}/api/partecipazioni`, {
            id: uuidv4(), // Genera un nuovo UUID per la partecipazione
            torneo_id: selectedTournament.id,
            team_id: team.team_id, // Usa l'UUID del team
            position: team.position,
            punti_totali: 0,
            penalita: 0,
          });
        })
      );
  
      message.success("Team e partecipazioni creati con successo!");
      setIsTeamsRegistered(true);
      fetchTournaments();
    } catch (error) {
      console.error("Errore:", error);
      message.error(
        error.response?.data?.error?.solution ||
          error.response?.data?.message ||
          error.message ||
          "Errore durante la creazione"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (value) => {
    setIsModeModalVisible(false);

    if (value === "Battle Royale") {
      // Tracciamo che abbiamo selezionato Battle Royale
      setModalSelectionTracker(value);
      // Resetta il selectedMode
      setSelectedMode(null);
      // Apri il modale Battle Royale
      setIsBattleRoyaleModalVisible(true);
    } else {
      setSelectedMode(value);
      // Resetta il tracker per altre modalità
      setModalSelectionTracker(null);
    }
  };

  // Nuova funzione per gestire la chiusura del modale Battle Royale
  const handleBattleRoyaleModalCancel = () => {
    setIsBattleRoyaleModalVisible(false);
    // Resetta il tracker quando chiudiamo il modale
    setModalSelectionTracker(null);
  };

  // Funzione per il submit del modale Battle Royale
  const handleBattleRoyaleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        titolo: values.titolo,
        giocatoriPerTeam: values.giocatoriPerTeam,
        rounds: values.rounds,
        bestOf: values.bestOf,
        discordLink: values.discordLink,
        gioco: values.gioco, // Questo è l'ID del gioco
        nome_gioco: games.find((g) => g.id === values.gioco)?.nome || "", // Aggiungi il nome del gioco
        type: "Battle Royale",
        numeroTeam: values.numeroTeam,
        dataInizio: values.dataInizio.format("YYYY-MM-DD"),
        dataFine: values.dataFine.format("YYYY-MM-DD"),
        orarioTorneo: values.orarioTorneo.format("HH:mm:ss"),
      };

      await axios.post(`${apiUrl}/api/battle-royale`, payload); // invia il payload al backend

      message.success("Torneo creato");
      form.resetFields();
      handleBattleRoyaleModalCancel(); // chiudi modale
    } catch (err) {
      console.error(err);
      message.error("Errore nella creazione del torneo");
    }
  };

  const tournamentColumns = [
    {
      title: "Titolo",
      dataIndex: "titolo",
      key: "titolo",
      render: (text) => <div className="font-semibold text-left">{text}</div>,
    },
    {
      title: "Modalità",
      dataIndex: "type",
      key: "type",
      render: (text) => <div className="text-center">{text}</div>,
    },
    {
      title: "Gioco",
      dataIndex: "nome_gioco",
      key: "nome_gioco",
      render: (text) => <div className="text-center">{text}</div>,
    },
    {
      title: "Data Inizio",
      dataIndex: "data_inizio",
      key: "data_inizio",
      render: (text) => (
        <div className="text-center">{moment(text).format("DD/MM/YYYY")}</div>
      ),
    },
    {
      title: "Orario",
      dataIndex: "orario_torneo",
      key: "orario_torneo",
      render: (text) => (
        <div className="text-center">
          {moment(text, "HH:mm:ss").format("HH:mm")}
        </div>
      ),
    },
    {
      title: "Matches",
      key: "matches",
      render: (text, record) => (
        <div
          className="flex justify-center space-x-4"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="primary"
            onClick={() => handlePointTournament(record)} // record viene dalla render function
          >
            Punteggio
          </Button>
        </div>
      ),
    },
    {
      title: "Azioni",
      key: "action",
      render: (text, record) => {
        const menu = (
          <Menu>
            <Menu.Item
              key="edit"
              icon={<SettingOutlined />}
              onClick={() => handleManageTournament(record)}
            >
              Gestisci Torneo
            </Menu.Item>
            <Menu.Item
              key="view"
              icon={<EyeOutlined />}
              onClick={() => handleViewTournament(record)}
            >
              Visualizza Torneo
            </Menu.Item>
            <Menu.Item
              key="edit"
              icon={<EditOutlined />}
              onClick={() => handleEditTournament(record)}
            >
              Modifica Torneo
            </Menu.Item>
            <Menu.Item key="delete" icon={<DeleteOutlined />}>
              <Popconfirm
                title="Sei sicuro di voler eliminare questo torneo?"
                onConfirm={() => handleDeleteTournament(record.id)}
                okText="Sì"
                cancelText="No"
              >
                Elimina Torneo
              </Popconfirm>
            </Menu.Item>
          </Menu>
        );

        return (
          <div
            className="flex justify-center space-x-4"
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Dropdown overlay={menu} trigger={["click"]}>
              <Button icon={<EllipsisOutlined />} />
            </Dropdown>
          </div>
        );
      },
    },
  ];

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
          <h1 style={{ color: "#fff" }}>Tornei</h1>

          <Modal
            title="Crea Torneo Battle Royale"
            open={isBattleRoyaleModalVisible}
            onCancel={handleBattleRoyaleModalCancel}
            onOk={handleBattleRoyaleSubmit}
            maskClosable={false}
          >
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="titolo"
                    label="Titolo"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="giocatoriPerTeam"
                    label="Giocatori per Team"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" />
                  </Form.Item>
                  <Form.Item
                    name="rounds"
                    label="Rounds"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" />
                  </Form.Item>
                  <Form.Item
                    name="bestOf"
                    label="Best Of"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" />
                  </Form.Item>
                  <Form.Item name="discordLink" label="Discord Link">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="gioco"
                    label="Giochi"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      {games.map((game) => (
                        <Select.Option key={game.id} value={game.id}>
                          {game.nome}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="numeroTeam"
                    label="Numero Team"
                    rules={[{ required: true }]}
                  >
                    <Input type="number" min={1} onChange={handleChangeTeams} />
                  </Form.Item>

                  <Form.Item
                    name="dataInizio"
                    label="Data Inizio"
                    rules={[{ required: true }]}
                  >
                    <DatePicker />
                  </Form.Item>
                  <Form.Item
                    name="dataFine"
                    label="Data Fine"
                    rules={[{ required: true }]}
                  >
                    <DatePicker />
                  </Form.Item>
                  <Form.Item
                    name="orarioTorneo"
                    label="Start Time"
                    rules={[{ required: true }]}
                  >
                    <TimePicker />
                  </Form.Item>
                </Col>
                <Row gutter={24}>
                  {Array.from({ length: numTeams }, (_, i) => (
                    <Col key={i} span={8}>
                      <Form.Item
                        name={`moltiplicatore${i + 1}`}
                        label={`Moltiplicatore ${i + 1}`}
                      >
                        <Input type="number" />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
                {/* Genera dinamicamente gli input in base al numero inserito */}
              </Row>
            </Form>
          </Modal>

          <Modal
            title="Seleziona Modalità Torneo"
            open={isModeModalVisible}
            onCancel={() => setIsModeModalVisible(false)}
            footer={null}
          >
            <Select
              style={{ width: "100%" }}
              onChange={handleModeSelect}
              placeholder="Seleziona una modalità"
              value={modalSelectionTracker}
            >
              <Select.Option value="Battle Royale">Battle Royale</Select.Option>
              <Select.Option value="Eliminazione Diretta">
                Eliminazione Diretta
              </Select.Option>
              <Select.Option value="Round Robin">Round Robin</Select.Option>
            </Select>
          </Modal>
          {/* Modale di modifica torneo */}
          <Modal
            title="Modifica Torneo Battle Royale"
            open={isEditModalVisible}
            onCancel={() => {
              setIsEditModalVisible(false);
              form.resetFields();
            }}
            onOk={handleEditSubmit}
            width={800}
            destroyOnClose
          >
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="titolo"
                    label="Titolo"
                    rules={[
                      {
                        required: true,
                        message: "Inserisci il titolo del torneo",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="modalita"
                    label="Modalità"
                    rules={[
                      { required: true, message: "Inserisci la modalità" },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="gioco"
                    label="Gioco"
                    rules={[{ required: true, message: "Seleziona un gioco" }]}
                  >
                    <Select>
                      {games.map((game) => (
                        <Select.Option key={game.id} value={game.id}>
                          {game.nome}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="numeroTeam"
                    label="Numero Team"
                    rules={[
                      {
                        required: true,
                        message: "Inserisci il numero di team",
                      },
                    ]}
                  >
                    <InputNumber min={1} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item
                    name="giocatoriPerTeam"
                    label="Giocatori per Team"
                    rules={[
                      {
                        required: true,
                        message: "Inserisci il numero di giocatori per team",
                      },
                    ]}
                  >
                    <Select>
                      {[5, 10, 15, 20, 25].map((value) => (
                        <Select.Option key={value} value={value}>
                          {value}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="dataInizio"
                    label="Data Inizio"
                    rules={[
                      {
                        required: true,
                        message: "Seleziona la data di inizio",
                      },
                    ]}
                  >
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item
                    name="dataFine"
                    label="Data Fine"
                    rules={[
                      { required: true, message: "Seleziona la data di fine" },
                    ]}
                  >
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item
                    name="orarioTorneo"
                    label="Orario Torneo"
                    rules={[{ required: true, message: "Seleziona l'orario" }]}
                  >
                    <TimePicker format="HH:mm" style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item
                    name="rounds"
                    label="Numero Round"
                    rules={[
                      {
                        required: true,
                        message: "Inserisci il numero di round",
                      },
                    ]}
                  >
                    <InputNumber min={1} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item
                    name="bestOf"
                    label="Best Of"
                    rules={[
                      {
                        required: true,
                        message: "Inserisci il valore Best Of",
                      },
                    ]}
                  >
                    <InputNumber min={1} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item name="discordLink" label="Link Discord">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              {/* Sezione per i moltiplicatori dinamici */}
              {numTeams > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h3>Moltiplicatori Team</h3>
                  <Row gutter={16}>
                    {Array.from({ length: numTeams }, (_, i) => (
                      <Col key={i} span={8}>
                        <Form.Item
                          name={`moltiplicatore${i + 1}`}
                          label={`Team ${i + 1}`}
                        >
                          <InputNumber style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Form>
          </Modal>

          <Modal
            title={`Punteggio: ${
              selectedTournament?.titolo || "Nessun torneo selezionato"
            }`}
            open={isManageModalVisible}
            onCancel={() => setIsManageModalVisible(false)}
            footer={[
              <Button key="back" onClick={() => setIsManageModalVisible(false)}>
                Chiudi
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={() => console.log("Salva modifiche", penalties)}
              >
                Salva modifiche
              </Button>,
            ]}
            width={1000}
            destroyOnClose
          >
            {selectedTournament ? (
              <Tabs
                activeKey={activeRoundTab}
                onChange={setActiveRoundTab}
                type="card"
                items={roundTabs}
              />
            ) : (
              <p>Nessun torneo selezionato</p>
            )}
          </Modal>

          <Modal
            title={`Gestione Torneo: ${selectedTournament?.titolo}`}
            open={isManageModalVisible1}
            onCancel={() => setIsManageModalVisible1(false)}
            footer={null}
            width={800}
            destroyOnClose
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: "24px" }}>
                <Spin size="large" />
              </div>
            ) : isTeamsRegistered ? (
              <div>
                <h3 style={{ marginBottom: "16px" }}>
                  Partecipazioni Registrate
                </h3>
                <Table
                  dataSource={assignedTeams
                    .filter((team) => team !== null)
                    .map((team, index) => ({
                      ...team,
                      position: index + 1,
                      key: team.id || index,
                    }))}
                  columns={[
                    {
                      title: "Posizione",
                      dataIndex: "position",
                      key: "position",
                      render: (position) => (
                        <Tag
                          color={
                            position === 1
                              ? "gold"
                              : position === 2
                              ? "silver"
                              : position === 3
                              ? "bronze"
                              : "default"
                          }
                        >
                          {position}°
                        </Tag>
                      ),
                      align: "center",
                      width: 100,
                    },
                    {
                      title: "Team",
                      dataIndex: "team_name",
                      key: "team_name",
                      render: (name, record) => (
                        <Tooltip title={`ID: ${record.team_id}`}>
                          <span>{name}</span>
                        </Tooltip>
                      ),
                    },
                    {
                      title: "Punteggio",
                      dataIndex: "punti_totali",
                      key: "punti_totali",
                      render: (punti) => (
                        <span style={{ fontWeight: "bold" }}>{punti || 0}</span>
                      ),
                      align: "center",
                    },
                    {
                      title: "Azioni",
                      key: "actions",
                      render: (_, record) => (
                        <Space>
                          <Button
                            onClick={() => {
                              // Passa in modalità modifica
                              setIsTeamsRegistered(false);
                            }}
                          >
                            <EditOutlined />
                          </Button>
                          <Button
                            danger
                            onClick={() => handleRemoveTeam(record.id)}
                            icon={<DeleteOutlined />}
                          />
                        </Space>
                      ),
                      width: 120,
                    },
                  ]}
                  pagination={false}
                  rowKey="key"
                  locale={{ emptyText: "Nessuna partecipazione registrata" }}
                />

                <div style={{ marginTop: "16px", textAlign: "right" }}>
                  <Button
                    type="primary"
                    onClick={() => setIsTeamsRegistered(false)}
                  >
                    Aggiungi/Modifica Team
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ marginBottom: "16px" }}>Iscrivi Nuovi Team</h3>
                <Table
                  dataSource={Array.from(
                    { length: selectedTournament?.numero_team || 0 },
                    (_, i) => ({ key: i })
                  )}
                  columns={[
                    {
                      title: "Slot",
                      dataIndex: "slot",
                      key: "slot",
                      render: (_, __, index) => `Slot ${index + 1}`,
                      width: 80,
                    },
                    {
                      title: "Team",
                      key: "team",
                      render: (_, __, index) => (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexDirection: "column",
                          }}
                        >
                          <Input
                            placeholder={`Nome Team ${index + 1}`}
                            value={assignedTeams[index]?.name || ""}
                            onChange={(e) => {
                              const updated = [...assignedTeams];
                              updated[index] = {
                                ...(updated[index] || {}),
                                name: e.target.value,
                              };
                              setAssignedTeams(updated);
                            }}
                          />
                          <Select
                            mode="multiple"
                            placeholder={`Seleziona ${selectedTournament?.giocatori_per_team} giocatori`}
                            value={assignedTeams[index]?.players || []}
                            onChange={(players) => {
                              const updated = [...assignedTeams];
                              updated[index] = {
                                ...(updated[index] || {}),
                                players,
                              };
                              setAssignedTeams(updated);
                            }}
                            maxTagCount={selectedTournament?.giocatori_per_team}
                            style={{ width: "100%" }}
                          >
                            {users.map((user) => (
                              <Select.Option key={user.id} value={user.id}>
                                {user.username}
                              </Select.Option>
                            ))}
                          </Select>
                        </div>
                      ),
                    },
                  ]}
                  pagination={false}
                  rowKey="key"
                />

                <div style={{ marginTop: "16px", textAlign: "right" }}>
                  <Button
                    type="primary"
                    onClick={handleCreateTeams}
                    disabled={
                      !assignedTeams.every(
                        (team) =>
                          team?.name &&
                          team?.players?.length ===
                            selectedTournament?.giocatori_per_team
                      )
                    }
                    loading={loading}
                  >
                    Conferma Iscrizioni
                  </Button>
                </div>
              </div>
            )}
          </Modal>
          <Modal
            title="Dettagli Torneo"
            open={isDetailsModalVisible}
            onCancel={() => setIsDetailsModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setSelectedTournament(null)}>
                Chiudi
              </Button>,
            ]}
            width={600}
          >
            {selectedTournament && (
              <div>
                <Row gutter={16}>
                  <Col span={12}>
                    <p>
                      <strong>Titolo:</strong> {selectedTournament.titolo}
                    </p>
                    <p>
                      <strong>Modalità:</strong> {selectedTournament.type}
                    </p>
                    <p>
                      <strong>Gioco:</strong> {selectedTournament.nome_gioco}
                    </p>
                    <p>
                      <strong>Data Inizio:</strong>{" "}
                      {moment(selectedTournament.data_inizio).format(
                        "DD/MM/YYYY"
                      )}
                    </p>
                    <p>
                      <strong>Orario:</strong>{" "}
                      {moment(
                        selectedTournament.orario_torneo,
                        "HH:mm:ss"
                      ).format("HH:mm")}
                    </p>
                  </Col>
                  <Col span={12}>
                    <p>
                      <strong>Numero Team:</strong>{" "}
                      {selectedTournament.numero_team}
                    </p>
                    <p>
                      <strong>Rounds:</strong> {selectedTournament.rounds}
                    </p>
                    <p>
                      <strong>Best Of:</strong> {selectedTournament.best_of}
                    </p>
                    <p>
                      <strong>Discord Link:</strong>{" "}
                      <a
                        href={selectedTournament.discord_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {selectedTournament.discord_link}
                      </a>
                    </p>
                    <p>
                      <strong>Data Fine:</strong>{" "}
                      {moment(selectedTournament.data_fine).format(
                        "DD/MM/YYYY"
                      )}
                    </p>
                  </Col>
                </Row>
                <Tag color="blue">Torneo Attivo</Tag>
              </div>
            )}
          </Modal>
          <Button
            type="primary"
            onClick={openModeModal}
            style={{ float: "left", marginBottom: 10 }}
          >
            <PlusOutlined /> Crea Torneo
          </Button>

          {loading ? (
            <Spin size="large" />
          ) : (
            <Table
              dataSource={tournaments?.filter((tournament) =>
                tournament.titolo?.includes(tournamentFilter)
              )}
              columns={tournamentColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: "max-content" }}
              title={() => (
                <div className="flex justify-between items-center mb-4">
                  <Input
                    placeholder="Filtra per nome torneo"
                    value={tournamentFilter}
                    onChange={(e) => setTournamentFilter(e.target.value)}
                    style={{ width: 250 }}
                  />
                </div>
              )}
              className="table-auto w-full bg-white rounded-lg shadow-md"
              bordered
            />
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default GestioneTornei;
