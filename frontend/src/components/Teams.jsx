import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Checkbox, Form, message, Typography, Spin, Select, Row, Col, Table, Modal, Popconfirm } from 'antd';
import axios from 'axios';

const { Title } = Typography;
const apiUrl = import.meta.env.VITE_BACKEND_URL;


const TeamActions = ({ teamId, onDelete }) => {
    const handleDelete = async () => {
      try {
        const response = await axios.delete(`${apiUrl}/api/teams/${teamId}`);
        message.success(response.data.message);  // Mostra un messaggio di successo
        onDelete();  // Rimuove il team dalla lista della tabella
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
  const [teamName, setTeamName] = useState('');
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
        message.error('Errore nel caricamento degli utenti');
      }
      setLoading(false);
    };

    const fetchTeams = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/api/teams`);
        setTeams(response.data);
      } catch (error) {
        message.error('Errore nel caricamento dei team');
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
      message.error('Nome del team e almeno un partecipante sono obbligatori.');
      return;
    }
  
    const newTeam = {
      name: teamName,
      num_participants: selectedUsers,
      score: teamScore,
      numParticipants: selectedUsers.length,
    };
  
    try {
      setLoading(true);
      const response = await axios.post(`${apiUrl}/api/teams`, newTeam);
  
      if (response.status === 201) {
        message.success('Team creato con successo!');
        const createdTeam = response.data; // Assumiamo che il backend restituisca il team creato con l'ID
  
        // Aggiungiamo il team creato alla lista dei team esistenti
        setTeams([...teams, createdTeam]);  // Aggiorniamo la lista dei team
  
        setIsModalVisible(false);  // Chiudi la modale dopo la creazione
        setTeamName('');  // Resetta il nome del team
        setSelectedUsers([]);  // Resetta i partecipanti
        setTeamScore(0);  // Resetta il punteggio
        window.location.reload();  // Ricarica la pagina

      } else {
        // Se la risposta non è 201, mostra un errore generico
        message.error('Si è verificato un errore nella creazione del team.');
      }
    } catch (error) {
      console.error('Errore nella creazione del team', error);
      message.error('Errore nella creazione del team. Si prega di riprovare.');
    } finally {
      setLoading(false);
    }
  };
  

  const handleDelete = (deletedTeamId) => {
    setTeams(teams.filter(team => team.id !== deletedTeamId));  // Rimuove il team dalla lista
  };

  const columns = [
    {
      title: 'Nome del Team',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Punteggio',
      dataIndex: 'score',
      key: 'score',
    },
    {
      title: 'Numero di Partecipanti',
      dataIndex: 'num_participants',
      key: 'num_participants',
    },
    {
      title: 'Azioni',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => navigate(`/teams/${record.id}`)}>
            Visualizza
          </Button>
          <TeamActions teamId={record.id} onDelete={() => handleDelete(record.id)} />
        </>
      ),
    },
  ];

  return (
    <div className="container" style={{ marginTop: 70, padding: 20 }}>
      <Row justify="center" align="top" gutter={[16, 24]} style={{ width: '100%' }}>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Button
            type="primary"
            onClick={() => setIsModalVisible(true)} // Apre la modale
            block
          >
            Crea Team
          </Button>
        </Col>
      </Row>

      <Row justify="center" align="top" gutter={[16, 24]} style={{ width: '100%' }}>
        <Col xs={24} sm={24} md={12} lg={12}>
          <div
            className="team-table"
            style={{
              padding: 20,
              borderRadius: 8,
              backgroundColor: 'white',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Title level={3} className="text-center">
              Team Esistenti
            </Title>
            <Table
  columns={columns}
  dataSource={teams}
  rowKey="id"
  pagination={{ pageSize: 5 }}
  style={{ width: '100%' }} // Occupa tutta la larghezza disponibile
  scroll={{ x: 'max-content' }} // Abilita lo scroll orizzontale se necessario
/>

          </div>
        </Col>
      </Row>

      {/* Modale per la creazione del team */}
      <Modal
        title="Crea un Nuovo Team"
        visible={isModalVisible}
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
                style={{ width: '100%' }}
                optionLabelProp="label"
              >
                {users.map((user) => (
                  <Select.Option key={user.id} value={user.id} label={user.username}>
                    <Checkbox checked={selectedUsers.includes(user.id)}>{user.username}</Checkbox>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Punteggio del Team" required>
              <Input
                type="number"
                value={teamScore}
                onChange={(e) => setTeamScore(Number(e.target.value))}
                placeholder="Inserisci il punteggio del team"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Crea Team
              </Button>
            </Form.Item>

            <p style={{ textAlign: 'center' }}>Numero di partecipanti: {numParticipants}</p>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}

export default Teams;
