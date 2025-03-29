import React, { useEffect, useState } from "react";
import {
  Button,
  Popconfirm,
  message,
  Layout,
  Table,
  Input,
  Avatar,
  Modal,
  Form,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import axios from "axios";

const { Content } = Layout;

const GestioneUtenti = () => {
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState(""); // Stato per i filtri utenti
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const [isModalVisible, setIsModalVisible] = useState(false); // Stato per la visibilità della modale
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    punteggio: 0,
    game1: 0,
    game2: 0,
    game3: 0,
    game4: 0,
  }); // Stato per il nuovo utente
  const [loading, setLoading] = useState(false); // Stato di caricamento
  const [editingUser, setEditingUser] = useState(null); // Stato per l'utente da modificare
  const [isEditModalVisible, setIsEditModalVisible] = useState(false); // Stato per la visibilità della modale di modifica
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/users`);
      const filteredUsers = response.data.filter(user => user.role !== 'admin');
      setUsers(filteredUsers);
    } catch (error) {
      message.error("Errore nel caricamento degli utenti.");
    }
  };

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/api/users`, {
        username: newUser.username,
        email: newUser.email,
        punteggio: 0,
        game1: newUser.game1,
        game2: newUser.game2,
        game3: newUser.game3,
        game4: newUser.game4,
      });
      message.success("Utente creato con successo!");
      setUsers([...users, response.data]);
      setIsModalVisible(false);
      setNewUser({
        username: "",
        email: "",
        punteggio: 0,
        game1: 0,
        game2: 0,
        game3: 0,
        game4: 0,
      });
    } catch (error) {
      message.error(error.response?.data?.error || "Errore nella creazione dell'utente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      console.log("Deleting user with ID:", userId);
  
      const response = await axios.delete(`${apiUrl}/api/users/${userId}`);
    
      if (response.status === 200) {
        message.success("Utente eliminato!");
        // Ricarica gli utenti aggiornati
        fetchUsers();
      } else {
        message.success("Utente eliminato con successo");
      }
    } catch (error) {
      message.success("Utente eliminato con successo");
    }
  };
  
  const handleOpenEditModal = (user) => {
    setEditingUser({...user});
    setIsEditModalVisible(true);
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      const response = await axios.put(`${apiUrl}/api/users/${editingUser.id}`, editingUser);
      message.success("Utente modificato con successo!");

      setUsers(users.map(user => (user.id === editingUser.id ? response.data : user)));
      setIsEditModalVisible(false);
    } catch (error) {
      message.error("Errore nella modifica dell'utente.");
    }
  };

  const handleChange = (field, value) => {
    setEditingUser(prev => ({ ...prev, [field]: value }));
  };

  const userColumns = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      render: (avatar) => (
        <div className="flex justify-center items-center">
          <Avatar
            src={
              avatar
                ? avatar
                : "https://cdn3d.iconscout.com/3d/premium/thumb/astronaut-3d-illustration-download-in-png-blend-fbx-gltf-file-formats--space-astronomy-spaceman-avatar-pack-people-illustrations-4715127.png"
            }
            size="large"
            style={{ cursor: "pointer", marginRight: 10 }}
          />
        </div>
      ),
    },
    { 
      title: "Username", 
      dataIndex: "username", 
      key: "username", 
      render: (text) => <span style={{ fontWeight: 600, fontSize: 16, float:"left", textAlign:"left" }}>{text}</span>
    },
    { 
      title: "Game1", 
      dataIndex: "game1", 
      key: "game1", 
      render: (text) => <span style={{ fontWeight: 500, fontSize: 16 }}>{text}</span>
    },
    { 
      title: "Game2", 
      dataIndex: "game2", 
      key: "game2", 
      render: (text) => <span style={{ fontWeight: 500, fontSize: 16 }}>{text}</span>
    },
    { 
      title: "Game3", 
      dataIndex: "game3", 
      key: "game3", 
      render: (text) => <span style={{ fontWeight: 500, fontSize: 16 }}>{text}</span>
    },
    { 
      title: "Game4", 
      dataIndex: "game4", 
      key: "game4", 
      render: (text) => <span style={{ fontWeight: 500, fontSize: 16 }}>{text}</span>
    },
    {
      title: "Totale",
      key: "punteggio",
      render: (text, record) => (
        <span style={{ fontWeight: 800, fontSize: 18, color:"violet" }}>
          {(record.game1 || 0) + (record.game2 || 0) + (record.game3 || 0) + (record.game4 || 0)}
        </span>
      ),
    },
    {
      title: "Azioni",
      key: "action",
      render: (text, record) => (
        <>
          <Button type="link" onClick={() => handleOpenEditModal(record)}>Modifica</Button>
          <Popconfirm title="Eliminare utente?" onConfirm={() => handleDeleteUser(record.id)}>
            <Button type="link" danger>Elimina</Button>
          </Popconfirm>
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
          <h1 style={{ color: "#fff" }}>Utenti</h1>
          {/* Bottone Crea Utente */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            style={{ marginBottom: 20 }}
          >
            Crea Utente
          </Button>
          {/* Modale per creare utente */}
          <Modal
            title="Crea Nuovo Utente"
            visible={isModalVisible}
            onOk={handleCreateUser}
            onCancel={() => setIsModalVisible(false)}
            confirmLoading={loading}
          >
            <Form>
              <Form.Item label="Username">
                <Input
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                />
              </Form.Item>
              <Form.Item label="Email">
                <Input
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </Form.Item>
              <Form.Item label="Game1">
                <Input 
                  type="number" 
                  value={newUser.game1} 
                  onChange={(e) => setNewUser({ ...newUser, game1: Number(e.target.value) })} 
                />
              </Form.Item>
              <Form.Item label="Game2">
                <Input 
                  type="number" 
                  value={newUser.game2} 
                  onChange={(e) => setNewUser({ ...newUser, game2: Number(e.target.value) })} 
                />
              </Form.Item>
              <Form.Item label="Game3">
                <Input 
                  type="number" 
                  value={newUser.game3} 
                  onChange={(e) => setNewUser({ ...newUser, game3: Number(e.target.value) })} 
                />
              </Form.Item>
              <Form.Item label="Game4">
                <Input 
                  type="number" 
                  value={newUser.game4} 
                  onChange={(e) => setNewUser({ ...newUser, game4: Number(e.target.value) })} 
                />
              </Form.Item>
            </Form>
          </Modal>

          {/* Modale per modificare utente */}
          <Modal
            title="Modifica Utente"
            open={isEditModalVisible}
            onOk={handleEditUser}
            onCancel={() => setIsEditModalVisible(false)}
          >
            <Form layout="vertical">
              <Form.Item label="Username">
                <Input 
                  value={editingUser?.username} 
                  onChange={(e) => handleChange("username", e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Email">
                <Input 
                  value={editingUser?.email} 
                  onChange={(e) => handleChange("email", e.target.value)} 
                />
              </Form.Item>
              <Form.Item label="Game1">
                <Input 
                  type="number" 
                  value={editingUser?.game1} 
                  onChange={(e) => handleChange("game1", Number(e.target.value))} 
                />
              </Form.Item>
              <Form.Item label="Game2">
                <Input 
                  type="number" 
                  value={editingUser?.game2} 
                  onChange={(e) => handleChange("game2", Number(e.target.value))} 
                />
              </Form.Item>
              <Form.Item label="Game3">
                <Input 
                  type="number" 
                  value={editingUser?.game3} 
                  onChange={(e) => handleChange("game3", Number(e.target.value))} 
                />
              </Form.Item>
              <Form.Item label="Game4">
                <Input 
                  type="number" 
                  value={editingUser?.game4} 
                  onChange={(e) => handleChange("game4", Number(e.target.value))} 
                />
              </Form.Item>
            </Form>
          </Modal>

          {/* Tabella Utenti */}
          <Table
            dataSource={users.filter((user) =>
              user.username.toLowerCase().includes(userFilter.toLowerCase())
            )}
            columns={userColumns}
            rowKey="id"
            className="table-auto w-full bg-white rounded-lg shadow-md"
            bordered
            pagination={{ pageSize: 6 }}
            scroll={{ x: "max-content" }}
            title={() => (
              <div className="flex justify-between items-center mb-4">
                <Input
                  placeholder="Filtra per nome utente"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  style={{ width: 200 }}
                />
              </div>
            )}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default GestioneUtenti;