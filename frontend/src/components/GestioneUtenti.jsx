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
  }); // Stato per il nuovo utente
  const [loading, setLoading] = useState(false); // Stato di caricamento

  console.log("Backend URL:", apiUrl);

  // Funzione per caricare gli utenti
  const fetchUsers = async () => {
    try {
      console.log("Fetching users from:", `${apiUrl}/api/users`);

      const response = await fetch(`${apiUrl}/api/users`);
      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Users fetched:", data);

      setUsers(data);
    } catch (error) {
      message.error("Errore nel caricamento degli utenti");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Funzione di creazione utente
  const handleCreateUser = async () => {
    setLoading(true); // Inizia il caricamento
    try {
      const response = await axios.post(`${apiUrl}/api/users`, {
        username: newUser.username,
        email: newUser.email,
        punteggio: newUser.punteggio,
      });
      message.success("Utente creato con successo!");
      setUsers([...users, response.data]); // Aggiungi l'utente appena creato alla lista
      setIsModalVisible(false); // Chiudi la modale
      setNewUser({
        username: "",
        email: "",
        punteggio: 0,
      }); // Resetta il form
    } catch (error) {
      message.error(
        error.response?.data?.error || "Errore nella creazione dell'utente."
      );
    } finally {
      setLoading(false); // Termina il caricamento
    }
  };

  // Funzione di gestione eliminazione utente
  const handleDeleteUser = async (userId) => {
    try {
      console.log("Deleting user with ID:", userId);

      // Chiamata API per eliminare l'utente dal backend
      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
        method: "DELETE",
      });

      console.log("Delete response status:", response.status);

      if (response.ok) {
        message.success("Utente eliminato!");
        // Rimuovi l'utente anche dallo stato locale
        setUsers(users.filter((user) => user.id !== userId));
      } else {
        const errorData = await response.json();
        console.error("Errore eliminazione utente:", errorData);

        message.error(
          `Errore nell'eliminazione dell'utente: ${
            errorData.error || "Errore sconosciuto"
          }`
        );
      }
    } catch (error) {
      message.error("Errore nel processo di eliminazione");
    }
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
            </Form>
          </Modal>
          <Table
            dataSource={users.filter((user) =>
              user.username.includes(userFilter)
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
