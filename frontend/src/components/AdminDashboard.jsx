import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message, Input, Upload, Modal, Form } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [editingTournament, setEditingTournament] = useState(null);
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;


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
        // Save edited tournament (replace with your API call)
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
    { title: 'Immagine', dataIndex: 'image', key: 'image', render: (image) => <img src={image} alt="Tournament" style={{ width: 50, height: 50 }} /> },
    {
      title: 'Azioni',
      key: 'action',
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
    // Handle image upload logic (upload to server or store locally)
    return false; // prevent automatic upload
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
    <div style={{marginTop:50, padding:20}}>
      <h2 className="mb-4" style={{color:"#fff"}}>Gestione Utenti</h2>
      <Table
        dataSource={users}
        columns={userColumns}
        rowKey="id"
        className="mb-8"
        pagination={{
            pageSize: 6, // Numero massimo di righe per pagina
            showSizeChanger: false, // Disabilita la possibilità di cambiare il numero di righe per pagina
          }}
      />

      <h2 className="mb-4" style={{color:"#fff"}}>Gestione Tornei</h2>
      <Table
        dataSource={tournaments}
        columns={tournamentColumns}
        rowKey="id"
        pagination={{
            pageSize: 3, // Numero massimo di righe per pagina
            showSizeChanger: false, // Disabilita la possibilità di cambiare il numero di righe per pagina
          }}
      />

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
    </div>
    </div>
    </div>
  );
};

export default AdminDashboard;
