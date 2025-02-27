import React, { useEffect, useState } from "react";
import { Button, Popconfirm, message, Layout, Table, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
const { Content } = Layout;

const GestioneUtenti = () => {
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState(""); // Stato per i filtri utenti
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  // Funzione per caricare gli utenti
  const fetchUsers = async () => {
    const response = await fetch(`${apiUrl}/api/users`);
    const data = await response.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Funzione di gestione eliminazione utente
  const handleDeleteUser = (userId) => {
    message.success("Utente eliminato!");
    setUsers(users.filter((user) => user.id !== userId));
  };

  const userColumns = [
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Punteggio", dataIndex: "punteggio", key: "punteggio" },
    {
      title: "Azioni",
      key: "action",
      render: (text, record) => (
        <Popconfirm title="Sei sicuro di voler eliminare questo utente?" onConfirm={() => handleDeleteUser(record.id)}>
          <Button type="link" danger>Elimina</Button>
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


          <Table
            dataSource={users.filter(user => user.username.includes(userFilter))}
            columns={userColumns}
            rowKey="id"
            pagination={{ pageSize: 6 }}
            scroll={{ x: "max-content" }}
            title={() => (
              <div>
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
