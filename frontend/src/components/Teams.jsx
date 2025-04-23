import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Button,
  Checkbox,
  Form,
  message,
  Typography,
  Spin,
  Select,
  Row,
  Col,
  Table,
  Modal,
  Popconfirm,
  Layout,
} from "antd";
import axios from "axios";
import {
  HomeOutlined,
  TeamOutlined,
  AppstoreAddOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const { Sider, Content } = Layout;
const { Title } = Typography;
const apiUrl = import.meta.env.VITE_BACKEND_URL;

const TeamActions = ({ teamId, onDelete }) => {
  const handleDelete = async () => {
    try {
      const response = await axios.delete(`${apiUrl}/api/teams/${teamId}`);
      message.success(response.data.message); // Mostra un messaggio di successo
      onDelete(); // Rimuove il team dalla lista della tabella
    } catch (error) {
      message.error("Errore nell'eliminazione del team");
    }
  };

  return (
    <Popconfirm
      title="Sei sicuro di voler eliminare questo team?"
      description="Questa azione è irreversibile."
      okText="Sì"
      cancelText="Annulla"
      onConfirm={handleDelete}
      placement="topRight"
    >
      <Button type="link" danger>
        Elimina
      </Button>
    </Popconfirm>
  );
};

function Teams() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [teamScore, setTeamScore] = useState(0);
  const [numParticipants, setNumParticipants] = useState(0);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false); // Stato per la modale
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/api/users`);
        setUsers(response.data);
      } catch (error) {
        message.error("Errore nel caricamento degli utenti");
      }
      setLoading(false);
    };

    const fetchTeams = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/api/teams`);
        setTeams(response.data);
      } catch (error) {
        message.error("Errore nel caricamento dei team");
      }
      setLoading(false);
    };

    fetchUsers();
    fetchTeams();
  }, []);

  const handleUserSelect = (value) => {
    setSelectedUsers(value);
    setNumParticipants(value.length);
  };

  const handleSubmit = async () => {
    if (!teamName || selectedUsers.length === 0) {
      message.error("Nome del team e almeno un partecipante sono obbligatori.");
      return;
    }
  
    const newTeam = {
      name: teamName,
      score: teamScore,
      numParticipants: selectedUsers.length,
    };
  
    try {
      setLoading(true);
      const response = await axios.post(`${apiUrl}/api/teams`, newTeam);
  
      if (response.status === 201) {
        message.success("Team creato con successo!");
  
        // Ricarica i team dalla API per assicurarci che i dati siano aggiornati
        const updatedTeams = await axios.get(`${apiUrl}/api/teams`);
        setTeams(updatedTeams.data);
  
        setIsModalVisible(false);
        setTeamName("");
        setSelectedUsers([]);
        setTeamScore(0);
        setGame1(0);
        setGame2(0);
        setGame3(0);
        setGame4(0);
      } else {
        message.error("Si è verificato un errore nella creazione del team.");
      }
    } catch (error) {
      console.error("Errore nella creazione del team", error);
      message.error("Errore nella creazione del team. Si prega di riprovare.");
    } finally {
      setLoading(false);
    }
  };
  

  const handleDelete = (deletedTeamId) => {
    setTeams(teams.filter((team) => team.id !== deletedTeamId)); // Rimuove il team dalla lista
  };

  const columns = [
    {
      title: "Nome del Team",
      dataIndex: "name",
      key: "name",
      render: (text) => <span style={{ fontWeight: 600, fontSize: 16, float:"left", textAlign:"left" }}>{text}</span>

    },
    
  
    {
      title: "Azioni",
      key: "actions",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => navigate(`/teams/${record.id}`)}>
            Visualizza
          </Button>
          <TeamActions
            teamId={record.id}
            onDelete={() => handleDelete(record.id)}
          />
        </>
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
          <h1 style={{ color: "#fff" }}>Teams</h1>
          <Button
            type="primary"
            onClick={() => setIsModalVisible(true)} // Apre la modale
            style={{ float: "left", marginBottom: 10 }}
          >
            <PlusOutlined />
            Crea Team
          </Button>

          <Table
            columns={columns}
            dataSource={teams}
            rowKey="id"
            className="table-auto w-full bg-white rounded-lg shadow-md"
    bordered
            pagination={{ pageSize: 5 }}
            style={{ maxWidth: "100%" }} // Occupa tutta la larghezza disponibile
            scroll={{ x: "max-content" }} // Abilita lo scroll orizzontale se necessario
          />

          {/* Modale per la creazione del team */}
          <Modal
            title="Crea un Nuovo Team"
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)} // Chiude la modale
            footer={null} // Rimuove il footer predefinito della modale
            width={600}
          >
            <Spin spinning={loading} tip="Caricamento utenti...">
              <Form layout="vertical" onFinish={handleSubmit}>
                <Form.Item label="Nome del Team" required>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Inserisci il nome del team"
                  />
                </Form.Item>

                <Form.Item label="Seleziona i partecipanti" required>
                  <Select
                    mode="multiple"
                    placeholder="Seleziona i partecipanti"
                    value={selectedUsers}
                    onChange={handleUserSelect}
                    style={{ width: "100%" }}
                    optionLabelProp="label"
                  >
                    {users.map((user) => (
                      <Select.Option
                        key={user.id}
                        value={user.id}
                        label={user.username}
                      >
                        <Checkbox checked={selectedUsers.includes(user.id)}>
                          {user.username}
                        </Checkbox>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>



                <Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    Crea Team
                  </Button>
                </Form.Item>

                <p style={{ textAlign: "center" }}>
                  Numero di partecipanti: {numParticipants}
                </p>
              </Form>
            </Spin>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}

export default Teams;
