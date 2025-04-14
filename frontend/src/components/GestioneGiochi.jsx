import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Button,
  Form,
  message,
  Table,
  Modal,
  Popconfirm,
  Layout,
  Space,
  Typography
} from "antd";
import { Content } from "antd/es/layout/layout";
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Title } = Typography;

function GestioneGiochi() {
  const [giochi, setGiochi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentGioco, setCurrentGioco] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  // Funzione per recuperare i giochi
  const fetchGiochi = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/giochi`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nel recupero giochi");
      }
      
      const data = await response.json();
      setGiochi(data);
    } catch (err) {
      message.error(`Errore nel caricamento dei giochi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Carica i giochi all'avvio
  useEffect(() => {
    fetchGiochi();
  }, []);

  // Gestione modali
  const showAddModal = () => setIsAddModalVisible(true);
  const hideAddModal = () => {
    addForm.resetFields();
    setIsAddModalVisible(false);
  };

  const showEditModal = (gioco) => {
    setCurrentGioco(gioco);
    editForm.setFieldsValue({ nome: gioco.nome });
    setIsEditModalVisible(true);
  };

  const hideEditModal = () => {
    editForm.resetFields();
    setCurrentGioco(null);
    setIsEditModalVisible(false);
  };

  // Aggiungi nuovo gioco
  const handleAddGame = async () => {
    try {
      const values = await addForm.validateFields();
      setLoading(true);
      
      const response = await fetch(`${apiUrl}/api/giochi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: values.nome }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Errore nell'aggiunta del gioco");
      }
      
      message.success("Gioco aggiunto con successo");
      addForm.resetFields();
      setIsAddModalVisible(false);
      
      // Aggiorna l'elenco dei giochi
      await fetchGiochi();
    } catch (err) {
      message.error(`Errore nell'inserimento: ${err.message}`);
      setLoading(false);
    }
  };

  // Modifica gioco esistente
  const handleEditGame = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);
      
      const response = await fetch(`${apiUrl}/api/giochi/${currentGioco.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: values.nome }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Errore nella modifica del gioco");
      }
      
      message.success("Gioco modificato con successo");
      hideEditModal();
      
      // Aggiorna l'elenco dei giochi
      await fetchGiochi();
    } catch (err) {
      message.error(`Errore nella modifica: ${err.message}`);
      setLoading(false);
    }
  };

  // Elimina un gioco
  const handleDeleteGame = async (id) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${apiUrl}/api/giochi/${id}`, {
        method: "DELETE",
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Errore nell'eliminazione del gioco");
      }
      
      message.success("Gioco eliminato con successo");
      
      // Aggiorna l'elenco dei giochi
      await fetchGiochi();
    } catch (err) {
      message.error(`Errore nell'eliminazione: ${err.message}`);
      setLoading(false);
    }
  };

  // Filtro per la ricerca
  const handleSearch = (value) => {
    setSearchText(value.toLowerCase());
  };

  const filteredData = giochi.filter((game) =>
    game.nome.toLowerCase().includes(searchText)
  );

  // Colonne tabella
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: '20%',
    },
    {
      title: "Nome",
      dataIndex: "nome",
      key: "nome",
      width: '50%',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Cerca gioco"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => {
              confirm();
              handleSearch(selectedKeys[0] || "");
            }}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => {
                confirm();
                handleSearch(selectedKeys[0] || "");
              }}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Cerca
            </Button>
            <Button 
              onClick={() => {
                clearFilters();
                handleSearch("");
              }} 
              size="small" 
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record) => record.nome.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Azioni",
      key: "azioni",
      width: '30%',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
          >
            Modifica
          </Button>
          <Popconfirm
            title="Sei sicuro di voler eliminare questo gioco?"
            onConfirm={() => handleDeleteGame(record.id)}
            okText="Sì"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Elimina
            </Button>
          </Popconfirm>
        </Space>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={2} style={{ color: "#fff", margin: 0 }}>Gestione Giochi</Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={showAddModal}
              size="large"
            >
              Aggiungi Gioco
            </Button>
          </div>

          {/* Tabella giochi */}
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            style={{ marginTop: 16 }}
          />

          {/* Modale per aggiungere gioco */}
          <Modal
            title="Aggiungi Gioco"
            open={isAddModalVisible}
            onCancel={hideAddModal}
            onOk={handleAddGame}
            confirmLoading={loading}
          >
            <Form form={addForm} layout="vertical">
              <Form.Item
                name="nome"
                label="Nome Gioco"
                rules={[
                  { required: true, message: "Inserisci il nome del gioco" },
                  { min: 2, message: "Il nome deve avere almeno 2 caratteri" }
                ]}
              >
                <Input placeholder="Inserisci il nome del gioco" />
              </Form.Item>
            </Form>
          </Modal>

          {/* Modale per modificare gioco */}
          <Modal
            title="Modifica Gioco"
            open={isEditModalVisible}
            onCancel={hideEditModal}
            onOk={handleEditGame}
            confirmLoading={loading}
          >
            <Form form={editForm} layout="vertical">
              <Form.Item
                name="nome"
                label="Nome Gioco"
                rules={[
                  { required: true, message: "Inserisci il nome del gioco" },
                  { min: 2, message: "Il nome deve avere almeno 2 caratteri" }
                ]}
              >
                <Input placeholder="Inserisci il nome del gioco" />
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}

export default GestioneGiochi;