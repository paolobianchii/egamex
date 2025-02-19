import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeOutlined, TeamOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import { Button, Popconfirm, message, Layout, Upload, Table, Form, Modal, Input } from "antd";
import { UploadOutlined } from "@ant-design/icons";
const { Sider, Content } = Layout;

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [editingTournament, setEditingTournament] = useState(null);
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const [selectedSection, setSelectedSection] = useState('tornei'); // Stato per selezionare la sezione (tornei o utenti)

  // Fetching users and tournaments from API
  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch(`${apiUrl}/api/users`);
      const data = await response.json();
      setUsers(data);
    };

    const fetchTournaments = async () => {
      const response = await fetch(`${apiUrl}/api/tournaments`);
      const data = await response.json();
      setTournaments(data);
    };

    fetchUsers();
    fetchTournaments();
  }, []);

  // Handle delete action for users and tournaments
  const handleDeleteUser = (userId) => {
    message.success("Utente eliminato!");
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleDeleteTournament = (tournamentId) => {
    message.success("Torneo eliminato!");
    setTournaments(tournaments.filter(tournament => tournament.id !== tournamentId));
  };

  // Handle edit tournament
  const handleEditTournament = (tournament) => {
    setEditingTournament(tournament);
    form.setFieldsValue({
      titolo: tournament.titolo,
      data: tournament.data,
      modalita: tournament.modalita,
      image: tournament.image,
    });
  };

  // Handle save edited tournament
  const handleSaveTournament = () => {
    form
      .validateFields()
      .then((values) => {
        message.success("Torneo modificato!");
        setTournaments(
          tournaments.map((tournament) =>
            tournament.id === editingTournament.id ? { ...tournament, ...values } : tournament
          )
        );
        setEditingTournament(null);
      })
      .catch((info) => {
        message.error("Modifica non riuscita, riprova.");
      });
  };

  // Columns for Users Table
  const userColumns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Punteggio', dataIndex: 'score', key: 'score' },
    {
      title: 'Azioni',
      key: 'action',
      render: (text, record) => (
        <Popconfirm
          title="Sei sicuro di voler eliminare questo utente?"
          onConfirm={() => handleDeleteUser(record.id)}
        >
          <Button type="link" danger>Elimina</Button>
        </Popconfirm>
      ),
    },
  ];

  // Columns for Tournaments Table
  const tournamentColumns = [
    { title: 'Nome Torneo', dataIndex: 'titolo', key: 'titolo' },
    { title: 'Data', dataIndex: 'data', key: 'data' },
    { title: 'Modalita', dataIndex: 'modalita', key: 'modalita' },
    {
      title: 'Immagine', dataIndex: 'image', key: 'image',
      render: (image) => <img src={image} alt="Tournament" style={{ width: 50, height: 50 }} />
    },
    {
      title: 'Azioni', key: 'action',
      render: (text, record) => (
        <>
          <Button type="link" onClick={() => handleEditTournament(record)}>Modifica</Button>
          <Popconfirm
            title="Sei sicuro di voler eliminare questo torneo?"
            onConfirm={() => handleDeleteTournament(record.id)}
          >
            <Button type="link" danger>Elimina</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  // Upload file handler
  const handleUpload = (file) => {
    return false; // prevent automatic upload
  };
  // Dati di esempio per le tabelle
  const torneiData = [
    { key: '1', nome: 'Torneo 1', data: '2025-03-10', partecipanti: 32 },
    { key: '2', nome: 'Torneo 2', data: '2025-03-15', partecipanti: 24 },
  ];

  const utentiData = [
    { key: '1', nome: 'Mario Rossi', email: 'mario@example.com', ruolo: 'Giocatore' },
    { key: '2', nome: 'Luca Bianchi', email: 'luca@example.com', ruolo: 'Giocatore' },
  ];


  return (
    <Layout style={{ minHeight: '100vh', }}>

      <Layout style={{ padding: '0 24px 24px', backgroundColor:"#002140" }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            marginTop:70,
            marginBottom:30,
            
          }}
        >
          <h1 style={{color:"#fff"}}>Benvenuto nell'Admin Dashboard</h1>

          {/* Bottoni per cambiare sezione */}
          <Button 
            type={selectedSection === 'tornei' ? 'primary' : 'default'} 
            onClick={() => setSelectedSection('tornei')}
            style={{ marginRight: 10 }}
          >
            Gestione Tornei
          </Button>
          <Button 
            type={selectedSection === 'utenti' ? 'primary' : 'default'} 
            onClick={() => setSelectedSection('utenti')}
          >
            Gestione Utenti
          </Button>

          {/* Sezione per la gestione tornei */}
          {selectedSection === 'tornei' && (
            <div style={{marginTop:20}}>
              <h2  style={{color:"#fff"}}>Gestione Tornei</h2>
              <Table
            dataSource={tournaments}
            columns={tournamentColumns}
            rowKey="id"
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
            }}
            scroll={{ x: 'max-content' }} // Enable horizontal scroll
          />
            </div>
          )}

          {/* Sezione per la gestione utenti */}
          {selectedSection === 'utenti' && (
            <div style={{marginTop:20}}>
              <h2  style={{color:"#fff"}}>Gestione Utenti</h2>
              <Table
            dataSource={users}
            columns={userColumns}
            rowKey="id"
            className="mb-8"
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
            }}
            scroll={{ x: 'max-content' }} // Enable horizontal scroll
          />

            </div>
          )}
          <Modal
            title="Modifica Torneo"
            visible={editingTournament !== null}
            onOk={handleSaveTournament}
            onCancel={() => setEditingTournament(null)}
          >
            <Form
              form={form}
              initialValues={editingTournament}
              layout="vertical"
            >
              <Form.Item name="titolo" label="Nome Torneo" rules={[{ required: true, message: 'Inserisci il nome del torneo!' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="data" label="Data" rules={[{ required: true, message: 'Inserisci la data del torneo!' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="modalita" label="Punteggio" rules={[{ required: true, message: 'Inserisci il punteggio!' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="image" label="Immagine">
                <Upload
                  listType="picture"
                  beforeUpload={handleUpload}
                  onChange={({ file, fileList }) => {
                    if (file.status === 'done') {
                      form.setFieldsValue({ image: file.response?.url || fileList[0].url });
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />}>Carica Immagine</Button>
                </Upload>
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
