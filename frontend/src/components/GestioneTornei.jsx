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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import moment from "moment"; // Importa moment.js

const { Sider, Content } = Layout;
const { TabPane } = Tabs;

const GestioneTornei = () => {
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [editingTournament, setEditingTournament] = useState(null);
  const [creatingTournament, setCreatingTournament] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [userFilter, setUserFilter] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState("");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [isAddPlayersModalVisible, setIsAddPlayersModalVisible] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  // Aggiungi questi stati all'inizio del componente
const [playerFilter, setPlayerFilter] = useState('');
const [currentTournamentPlayers, setCurrentTournamentPlayers] = useState([]);

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
      const response = await fetch(`${apiUrl}/api/tournaments`);
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

  const handleChange = (info) => {
    if (Array.isArray(info.fileList)) {
      setFileList(info.fileList);
    } else {
      console.error("fileList non è un array:", info.fileList);
      setFileList([]);
    }
  };

  // Tournament management
  const handleDeleteUser = (userId) => {
    message.success("Utente eliminato!");
    setUsers(users.filter((user) => user.id !== userId));
  };

  const handleDeleteTournament = async (tournamentId) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/tournaments/${tournamentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione del torneo");
      }

      message.success("Torneo eliminato!");
      setTournaments(
        tournaments.filter((tournament) => tournament.id !== tournamentId)
      );
    } catch (error) {
      message.error("Eliminazione non riuscita, riprova.");
      console.error(error);
    }
  };

  const handleEditTournament = (tournament) => {
    setEditingTournament(tournament);
    setIsEditModalVisible(true);

    const formattedDate = moment(tournament.data).format("YYYY-MM-DD");

    form.setFieldsValue({
      titolo: tournament.titolo,
      modalita: tournament.modalita,
      data: formattedDate, // Impostiamo la data formattata correttamente
    });
  };

  const handleUpdateTournament = async () => {
    try {
      const values = await form.validateFields();
  
      const { titolo, modalita, data, image } = values;
      if (!titolo || !modalita || !data) {
        message.error("I campi 'titolo', 'modalità' e 'data' sono obbligatori.");
        return;
      }

      const formData = new FormData();
      formData.append("titolo", titolo);
      formData.append("modalita", modalita);
      formData.append("data", data);
  
      if (image?.[0]?.originFileObj) {
        formData.append("image", image[0].originFileObj);
      }
  
      const response = await fetch(`${apiUrl}/api/tournaments/${editingTournament.id}`, {
        method: "PUT",
        body: formData,
      });
  
      if (!response.ok) throw new Error("Errore durante l'aggiornamento del torneo");
  
      message.success("Torneo aggiornato con successo!");
      resetFormState();
    } catch (error) {
      message.error("Aggiornamento non riuscito, riprova.");
      console.error(error);
    }
  };
  
  const resetFormState = () => {
    setIsEditModalVisible(false);
    setEditingTournament(null);
    form.resetFields();
    fetchTournaments();
  };
  

  const handleCreateTournament = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (!values.titolo || !values.modalita || !values.data) {
          message.error(
            "I campi 'titolo', 'modalita' e 'data' sono obbligatori."
          );
          return;
        }

        // Usa l'URL dell'immagine o uno predefinito
        const imageUrl =
          values.image && values.image[0]
            ? values.image[0].url
            : "https://cdn.prod.website-files.com/64479cbddbde2b42cebe552a/66d565dbfd64573a736e040a_esdp.PNG";

        const tournamentData = {
          titolo: values.titolo,
          modalita: values.modalita,
          data: values.data,
          imageUrl: imageUrl, // Aggiungi l'URL dell'immagine
        };

        try {
          const response = await fetch(`${apiUrl}/api/tournaments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(tournamentData),
          });

          if (!response.ok) {
            throw new Error("Errore nella creazione del torneo");
          }

          message.success("Torneo creato!");
          setCreatingTournament(false);
          form.resetFields();
          fetchTournaments();
        } catch (error) {
          message.error("Creazione non riuscita, riprova.");
          console.error(error);
        }
      })
      .catch(() => {
        message.error("Compila tutti i campi correttamente.");
      });
  };

  const handleAddPlayers = async (tournament) => {
    setSelectedTournament(tournament);
    setIsAddPlayersModalVisible(true);
    setLoading(true);
    
    try {
      // Carica i giocatori già nel torneo
      const response = await fetch(`${apiUrl}/api/tournaments/${tournament.id}/players`);
      if (!response.ok) throw new Error("Failed to fetch tournament players");
      const data = await response.json();
      setCurrentTournamentPlayers(data);
      
      // Pre-seleziona i giocatori già presenti
      setSelectedPlayers(data.map(player => player.id));
    } catch (error) {
      message.error("Errore nel caricamento dei giocatori del torneo");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Modifica la funzione handleAddPlayersToTournament per gestire aggiunte e rimozioni
  const handleAddPlayersToTournament = async () => {
    if (!selectedTournament) {
      message.warning("Nessun torneo selezionato");
      return;
    }
  
    try {
      setLoading(true);
      
      // Identifica i giocatori da aggiungere e rimuovere
      const playersToAdd = selectedPlayers.filter(
        id => !currentTournamentPlayers.some(player => player.id === id)
      );
      
      const playersToRemove = currentTournamentPlayers
        .filter(player => !selectedPlayers.includes(player.id))
        .map(player => player.id);
  
      // Esegui le operazioni in parallelo
      const [addResponse, removeResponse] = await Promise.all([
        playersToAdd.length > 0 ? 
          fetch(`${apiUrl}/api/tournaments/${selectedTournament.id}/players`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerIds: playersToAdd }),
          }) : Promise.resolve(null),
        
        playersToRemove.length > 0 ?
          fetch(`${apiUrl}/api/tournaments/${selectedTournament.id}/players`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerIds: playersToRemove }),
          }) : Promise.resolve(null),
      ]);
  
      if ((addResponse && !addResponse.ok) || (removeResponse && !removeResponse.ok)) {
        throw new Error("Errore nell'aggiornamento dei giocatori");
      }
  
      message.success("Giocatori aggiornati con successo!");
      setIsAddPlayersModalVisible(false);
      setSelectedPlayers([]);
      fetchTournaments();
    } catch (error) {
      message.error("Errore durante l'aggiornamento dei giocatori");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Columns for tables
  const userColumns = [
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Punteggio", dataIndex: "punteggio", key: "punteggio" },
    {
      title: "Azioni",
      key: "action",
      render: (text, record) => (
        <Popconfirm
          title="Sei sicuro di voler eliminare questo utente?"
          onConfirm={() => handleDeleteUser(record.id)}
        >
          <Button type="link" danger>
            Elimina
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const tournamentColumns = [
    {
      title: "Immagine",
      dataIndex: "image",
      key: "image",
      render: (image) => (
        <div className="flex justify-center">
          <img
            src={
              image
                ? `${image}`
                : "https://www.smaroadsafety.com/wp-content/uploads/2022/06/no-pic.png"
            } // Imposta un'immagine di fallback se l'URL è vuoto o non valido
            alt="Tournament"
            style={{
              height: 70, // Imposta anche l'altezza al 100% per fare in modo che riempia l'area
              objectFit: "cover", // Garantisce che l'immagine non distorca
            }}
            className="rounded-full" // Mantiene la forma rotonda
          />
        </div>
      ),
    },
    {
      title: "Nome Torneo",
      dataIndex: "titolo",
      key: "titolo",
      render: (text) => <div className="font-semibold text-left">{text}</div>,
    },
    {
      title: "Modalita",
      dataIndex: "modalita",
      key: "modalita",
      render: (text) => {
        let displayText = "";
        switch (text) {
          case "Eliminazione_Diretta":
            displayText = "Eliminazione diretta";
            break;
          case "Round_Robin":
            displayText = "Round Robin";
            break;
          case "Battle_Royale":
            displayText = "Battle Royale";
            break;
          default:
            displayText = "N/A";
        }
        return <div className="text-left">{displayText}</div>;
      },
    },
    {
      title: "Data",
      dataIndex: "data",
      key: "data",
      render: (text) => (
        <div className="text-center">{moment(text).format("DD/MM/YYYY")}</div>
      ),
    },
    {
      title: "Azioni",
      key: "action",
      render: (text, record) => (
        <div className="flex justify-center space-x-2">
          <Button
          type="link"
          onClick={() => handleAddPlayers(record)}
          className="text-blue-500 hover:text-blue-700"
        >
          <TeamOutlined className="mr-1" />
          Aggiungi Giocatori
        </Button>
          <Button
            type="link"
            onClick={() => handleEditTournament(record)}
            className="text-blue-500 hover:text-blue-700"
          >
            <EditOutlined className="mr-1" />
            Modifica
          </Button>
          <Popconfirm
            title="Sei sicuro di voler eliminare questo torneo?"
            onConfirm={() => handleDeleteTournament(record.id)}
          >
            <Button
              type="link"
              danger
              className="text-red-500 hover:text-red-700"
            >
              <DeleteOutlined className="mr-1" />
              Elimina
            </Button>
          </Popconfirm>
        </div>
      ),
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
  title={`Gestisci Giocatori - ${selectedTournament?.titolo || 'Torneo'}`}
  visible={isAddPlayersModalVisible}
  onOk={handleAddPlayersToTournament}
  onCancel={() => {
    setIsAddPlayersModalVisible(false);
    setSelectedPlayers([]);
    setPlayerFilter('');
  }}
  width={800}
  okText={`Salva modifiche (${selectedPlayers.length} giocatori)`}
  cancelText="Annulla"
  confirmLoading={loading}
>
  <Input
    placeholder="Cerca giocatori..."
    prefix={<SearchOutlined />}
    value={playerFilter}
    onChange={(e) => setPlayerFilter(e.target.value)}
    style={{ marginBottom: 16 }}
  />
  
  <Table
    dataSource={users.filter(user => 
      user.username.toLowerCase().includes(playerFilter.toLowerCase()) ||
      user.email.toLowerCase().includes(playerFilter.toLowerCase())
    )}
    rowKey="id"
    columns={[
      { 
        title: 'Seleziona', 
        dataIndex: 'id', 
        render: (id) => (
          <input
            type="checkbox"
            checked={selectedPlayers.includes(id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedPlayers([...selectedPlayers, id]);
              } else {
                setSelectedPlayers(selectedPlayers.filter(playerId => playerId !== id));
              }
            }}
          />
        ),
        width: 80,
      },
      { 
        title: 'Giocatore', 
        dataIndex: 'username', 
        key: 'username',
        render: (text, record) => (
          <div>
            <strong>{text}</strong>
            {currentTournamentPlayers.some(p => p.id === record.id) && (
              <Tag color="green" style={{ marginLeft: 8 }}>Già nel torneo</Tag>
            )}
          </div>
        )
      },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      { 
        title: 'Punteggio', 
        dataIndex: 'punteggio', 
        key: 'punteggio',
        sorter: (a, b) => a.punteggio - b.punteggio,
      },
    ]}
    rowSelection={{
      selectedRowKeys: selectedPlayers,
      onChange: (selectedRowKeys) => {
        setSelectedPlayers(selectedRowKeys);
      },
    }}
    pagination={{ pageSize: 5 }}
    scroll={{ y: 300 }}
    loading={loading}
  />
</Modal>
          <Button
            type="primary"
            onClick={() => setCreatingTournament(true)}
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

          {/* Modal for creating a tournament */}
          <Modal
            title="Crea Torneo"
            visible={creatingTournament}
            onOk={handleCreateTournament}
            onCancel={() => setCreatingTournament(false)}
          >
            <Form form={form} layout="vertical">
              <Form.Item
                name="titolo"
                label="Nome Torneo"
                rules={[
                  { required: true, message: "Inserisci il nome del torneo!" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="data"
                label="Data"
                rules={[
                  { required: true, message: "Inserisci la data del torneo!" },
                ]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item
                name="modalita"
                label="Modalità"
                rules={[{ required: true, message: "Seleziona una modalità!" }]}
              >
                <Select placeholder="Seleziona modalità">
                  <Select.Option value="Eliminazione_Diretta">
                    Eliminazione diretta
                  </Select.Option>
                  <Select.Option value="Round_Robin">Round Robin</Select.Option>
                  <Select.Option value="Battle_Royale">
                    Battle Royale
                  </Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </Modal>

          {/* Modal for editing a tournament */}
          <Modal
            title="Modifica Torneo"
            visible={isEditModalVisible}
            onOk={handleUpdateTournament}
            onCancel={() => {
              setIsEditModalVisible(false);
              setEditingTournament(null);
              form.resetFields();
            }}
          >
            <Form form={form} layout="vertical">
              <Form.Item
                name="titolo"
                label="Nome Torneo"
                rules={[
                  { required: true, message: "Inserisci il nome del torneo!" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="data"
                label="Data"
                rules={[
                  { required: true, message: "Inserisci la data del torneo!" },
                ]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item
                name="modalita"
                label="Modalità"
                rules={[{ required: true, message: "Seleziona una modalità!" }]}
              >
                <Select placeholder="Seleziona modalità">
                  <Select.Option value="Eliminazione_Diretta">
                    Eliminazione diretta
                  </Select.Option>
                  <Select.Option value="Round_Robin">Round Robin</Select.Option>
                  <Select.Option value="Battle_Royale">
                    Battle Royale
                  </Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="image"
                label="Immagine (opzionale)"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList || []}
              >
                <Upload
                  name="image"
                  listType="picture"
                  beforeUpload={() => false}
                  onChange={handleChange}
                >
                  <Button icon={<UploadOutlined />}>
                    Carica nuova immagine
                  </Button>
                </Upload>
              </Form.Item>
              {editingTournament && editingTournament.image && (
                <div style={{ marginTop: 8 }}>
                  <p>Immagine attuale:</p>
                  <img
                    src={
                      editingTournament.image[0]?.url ||
                      editingTournament.image ||
                      ""
                    }
                    alt="Current Tournament"
                    style={{ width: 100, height: 100, objectFit: "cover" }}
                  />
                </div>
              )}
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default GestioneTornei;
