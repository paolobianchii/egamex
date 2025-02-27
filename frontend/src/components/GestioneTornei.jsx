import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HomeOutlined,
  TeamOutlined,
  AppstoreAddOutlined,
  PlusOutlined,
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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
const { Sider, Content } = Layout;
const { TabPane } = Tabs;

const GestioneTornei = () => {
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [editingTournament, setEditingTournament] = useState(null);
  const [form] = Form.useForm();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const [creatingTournament, setCreatingTournament] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [userFilter, setUserFilter] = useState(""); // Stato per i filtri utenti
  const [tournamentFilter, setTournamentFilter] = useState(""); // Stato per i filtri tornei
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Funzioni per caricare i dati
  const fetchUsers = async () => {
    const response = await fetch(`${apiUrl}/api/users`);
    const data = await response.json();
    setUsers(data);
  };

  const fetchTournaments = async () => {
    const response = await fetch(`${apiUrl}/api/tournaments`);
    const data = await response.json();
  console.log("Tornei ricevuti:", data);
    setTournaments(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchTournaments();
  }, []);

  // Funzioni di gestione
  const handleUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    const isSizeValid = file.size / 1024 / 1024 < 5;

    if (!isImage) {
      message.error("Devi caricare un file immagine!");
      return Upload.LIST_IGNORE;
    }

    if (!isSizeValid) {
      message.error("L'immagine è troppo grande! (max 5MB)");
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  const handleChange = (info) => {
    if (Array.isArray(info.fileList)) {
      setFileList(info.fileList);
    } else {
      console.error("fileList non è un array:", info.fileList);
      setFileList([]);
    }
  };

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
      setTournaments(tournaments.filter((tournament) => tournament.id !== tournamentId));
    } catch (error) {
      message.error("Eliminazione non riuscita, riprova.");
    }
  };

  const handleEditTournament = (tournament) => {
    setEditingTournament(tournament);
    setIsEditModalVisible(true);
    
    // Prepara i dati per il form
    form.setFieldsValue({
      titolo: tournament.titolo,
      modalita: tournament.modalita,
      data: tournament.data,
      // Se l'immagine è già caricata, non la includiamo nel form
      // perché Upload gestisce diversamente i file già esistenti
    });
  };

  const handleUpdateTournament = async () => {
    try {
      const values = await form.validateFields();
      
      if (!values.titolo || !values.modalita || !values.data) {
        message.error("I campi 'titolo', 'modalita' e 'data' sono obbligatori.");
        return;
      }
      
      const formData = new FormData();
      formData.append("titolo", values.titolo);
      formData.append("modalita", values.modalita);
      formData.append("data", values.data);
      
      // Aggiungi l'immagine solo se è stata caricata una nuova
      if (values.image && values.image[0] && values.image[0].originFileObj) {
        formData.append("image", values.image[0].originFileObj);
      }
      
      const response = await fetch(
        `${apiUrl}/api/tournaments/${editingTournament.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );
      
      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento del torneo");
      }
      
      message.success("Torneo aggiornato con successo!");
      setIsEditModalVisible(false);
      setEditingTournament(null);
      form.resetFields();
      fetchTournaments(); // Ricarica i tornei aggiornati
      
    } catch (error) {
      message.error("Aggiornamento non riuscito, riprova.");
      console.error("Errore durante l'aggiornamento:", error);
    }
  };

  

  const handleCreateTournament = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (!values.titolo || !values.modalita || !values.data) {
          message.error("I campi 'titolo', 'modalita' e 'data' sono obbligatori.");
          return;
        }

        const formData = new FormData();
        formData.append("titolo", values.titolo);
        formData.append("modalita", values.modalita);
        formData.append("data", values.data);

        if (values.image && values.image[0]) {
          formData.append("image", values.image[0].originFileObj);
        }

        try {
          const response = await fetch(`${apiUrl}/api/tournaments`, {
            method: "POST",
            body: formData,
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
        }
      })
      .catch(() => {
        message.error("Compila tutti i campi correttamente.");
      });
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

  const tournamentColumns = [
    { title: "Nome Torneo", dataIndex: "titolo", key: "titolo" },
    { title: "Data", dataIndex: "data", key: "data" },
    { title: "Modalita", dataIndex: "modalita", key: "modalita" },
    {
      title: "Immagine",
      dataIndex: "image",
      key: "image",
      render: (image) => (
        <img 
          src={`${apiUrl}${image}`} 
          alt="Tournament" 
          style={{ width: 50, height: 50 }} 
        />
      )
      
    },
    {
      title: "Azioni",
      key: "action",
      render: (text, record) => (
        <>
          <Button type="link" onClick={() => handleEditTournament(record)}>Modifica</Button>
          <Popconfirm title="Sei sicuro di voler eliminare questo torneo?" onConfirm={() => handleDeleteTournament(record.id)}>
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
          <h1 style={{ color: "#fff" }}>Tornei</h1>


              <Button type="primary" onClick={() => setCreatingTournament(true)} style={{ float: "left", marginBottom: 10 }}>
                <PlusOutlined/>Crea Torneo
              </Button>
              <Table
                dataSource={tournaments.filter(tournament => tournament.titolo.includes(tournamentFilter))}
                columns={tournamentColumns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: "max-content" }}
                title={() => (
                  <div>
                    <Input
                      placeholder="Filtra per nome torneo"
                      value={tournamentFilter}
                      onChange={(e) => setTournamentFilter(e.target.value)}
                      style={{ width: 200 }}
                    />
                  </div>
                )}
              />

          {/* Modale per la creazione del torneo */}
          <Modal
            title="Crea Torneo"
            visible={creatingTournament}
            onOk={handleCreateTournament}
            onCancel={() => setCreatingTournament(false)}
          >
            <Form form={form} layout="vertical">
              <Form.Item name="titolo" label="Nome Torneo" rules={[{ required: true, message: "Inserisci il nome del torneo!" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="data" label="Data" rules={[{ required: true, message: "Inserisci la data del torneo!" }]}>
                <Input type="date" />
              </Form.Item>
              <Form.Item name="modalita" label="Modalità" rules={[{ required: true, message: "Inserisci la modalità!" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="image" label="Immagine" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList || []}>
                <Upload
                  name="image"
                  listType="picture"
                  beforeUpload={() => false}
                  onChange={handleChange}
                >
                  <Button icon={<UploadOutlined />}>Carica immagine</Button>
                </Upload>
              </Form.Item>
            </Form>
          </Modal>

          {/* Modale per la modifica del torneo */}
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
              <Form.Item name="titolo" label="Nome Torneo" rules={[{ required: true, message: "Inserisci il nome del torneo!" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="data" label="Data" rules={[{ required: true, message: "Inserisci la data del torneo!" }]}>
                <Input type="date" />
              </Form.Item>
              <Form.Item name="modalita" label="Modalità" rules={[{ required: true, message: "Inserisci la modalità!" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="image" label="Immagine (opzionale)" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList || []}>
                <Upload
                  name="image"
                  listType="picture"
                  beforeUpload={() => false}
                  onChange={handleChange}
                >
                  <Button icon={<UploadOutlined />}>Carica nuova immagine</Button>
                </Upload>
              </Form.Item>
              {editingTournament && editingTournament.image && (
                <div style={{ marginTop: 8 }}>
                  <p>Immagine attuale:</p>
                  <img 
                    src={editingTournament.image[0]?.url || editingTournament.image || ""} 
                    alt="Current Tournament" 
                    style={{ width: 100, height: 100, objectFit: 'cover' }} 
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