import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [isManageModalVisible1, setIsManageModalVisible1] = useState(false);
  const [activeRoundTab, setActiveRoundTab] = useState("1");
  const [penalties, setPenalties] = useState({});
  const [numTeams, setNumTeams] = useState(0); // Stato per il numero di input dinamici
  const [availableTeams, setAvailableTeams] = useState([]);
  const [assignedTeams, setAssignedTeams] = useState([]);
  const [isTeamsRegistered, setIsTeamsRegistered] = useState(false);
  const allTeamsAssigned = assignedTeams.every((team) => team !== null);

  const handleViewTournament = (tournament) => {
    setSelectedTournament(tournament);
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
    setSelectedTournament(tournament);
    setIsManageModalVisible1(true);
    setIsTeamsRegistered(false); // resetta registrazione

    try {
      const response = await fetch(`${apiUrl}/api/teams`);
      if (!response.ok) throw new Error("Errore nel fetch dei team");
      const data = await response.json();
      setAvailableTeams(data);
    } catch (error) {
      console.error(error);
      message.error("Impossibile caricare i team");
    }

    // Inizializza slot vuoti per i team assegnati
    setAssignedTeams(Array(tournament.numero_team).fill(null));
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

  const roundTabs = selectedTournament?.rounds && isTeamsRegistered
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
                          <div key={penalty.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <InputNumber
                              value={penalty.value}
                              onChange={(value) =>
                                handlePenaltyChange(teamId, penalty.id, "value", value)
                              }
                              style={{ width: "60%" }}
                            />
                            <Input
                              value={penalty.reason}
                              onChange={(e) =>
                                handlePenaltyChange(teamId, penalty.id, "reason", e.target.value)
                              }
                              placeholder="Motivo"
                              style={{ width: "100%" }}
                            />
                            <Button
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemovePenalty(teamId, penalty.id)}
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
                    <Select>
                      {[5, 10, 15, 20, 25].map((value) => (
                        <Select.Option key={value} value={value}>
                          {value}
                        </Select.Option>
                      ))}
                    </Select>
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
          >
            <Table
              dataSource={assignedTeams.map((team, index) => ({
                key: index,
                slot: `Slot ${index + 1}`,
                team,
              }))}
              columns={[
                {
                  title: "Slot",
                  dataIndex: "slot",
                  key: "slot",
                },
                {
                  title: "Team Assegnato",
                  key: "team",
                  render: (_, record, rowIndex) => (
                    <Select
                      style={{ width: "100%" }}
                      placeholder="Seleziona un team"
                      value={record.team?.id || null}
                      onChange={(teamId) => {
                        const selectedTeam = availableTeams.find(
                          (t) => t.id === teamId
                        );
                        // Evita duplicati
                        if (assignedTeams.some((t) => t?.id === teamId)) {
                          return message.warning(
                            "Questo team è già stato assegnato"
                          );
                        }
                        const updated = [...assignedTeams];
                        updated[rowIndex] = selectedTeam;
                        setAssignedTeams(updated);
                      }}
                      allowClear
                    >
                      {availableTeams.map((team) => (
                        <Select.Option key={team.id} value={team.id}>
                          {team.name}
                        </Select.Option>
                      ))}
                    </Select>
                  ),
                },
              ]}
              pagination={false}
            />
            {allTeamsAssigned && (
  <div style={{ marginTop: 20, textAlign: "right" }}>
    <Button
      type="primary"
      onClick={() => {
        // Esegui logica per "iscrivere" i team
        message.success("Team iscritti con successo!");
        setIsTeamsRegistered(true);
        setIsManageModalVisible1(false); // chiudi modale
      }}
    >
      Iscrivi Team al Torneo
    </Button>
  </div>
)}

          </Modal>

          <Modal
            title="Dettagli Torneo"
            open={selectedTournament !== null}
            onCancel={() => setSelectedTournament(null)}
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
              dataSource={tournaments.filter((tournament) =>
                tournament.titolo.includes(tournamentFilter)
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
