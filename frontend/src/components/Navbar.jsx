import React, { useState, useEffect } from 'react';
import { Layout, Button, Menu, Dropdown, Avatar, Spin, Modal, Form, Input, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const { Header } = Layout;
const { TabPane } = Tabs;

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(false); // Stato per il caricamento
  const [isModalVisible, setIsModalVisible] = useState(false); // Stato per la modale
  const [activeTab, setActiveTab] = useState("login"); // Tab attivo della modale
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      setUsername({
        id: localStorage.getItem("id"),
        username: localStorage.getItem("username"),
        email: localStorage.getItem("email"),
      });
    }
  }, []);

  const showLoginModal = () => setIsModalVisible(true); // Mostra la modale
  const hideLoginModal = () => setIsModalVisible(false); // Nasconde la modale

  const handleLogout = () => {
    setLoading(true); // Inizia il caricamento
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUsername(null);
    message.success("Logout effettuato con successo");

    // Ricarica la pagina e reindirizza alla home
    setTimeout(() => {
      window.location.reload(); // Ricarica la pagina
      window.location.href = "/"; // Reindirizza alla home
      setLoading(false); // Termina il caricamento
    }, 1000); // Fai durare il loading un po' per simularlo
  };

  const handleLogin = async (values) => {
    setLoading(true); // Inizia il caricamento
    try {
      const response = await axios.post(`${apiUrl}/api/login`, {
        email: values.email,
        password: values.password,
      });
      if (response.data.message) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", values.email);
        setIsLoggedIn(true);
        setUsername(values.email);
        message.success(response.data.message);
        hideLoginModal(); // Chiudi la modale dopo il login
      } else {
        message.error(response.data.error || "Credenziali errate.");
      }
    } catch (error) {
      message.error(error.response?.data?.error || "Errore nel login.");
    } finally {
      setLoading(false); // Termina il caricamento
    }
  };

  const handleRegister = async (values) => {
    setLoading(true); // Inizia il caricamento
    try {
      const response = await axios.post(`${apiUrl}/api/register`, {
        email: values.email,
        password: values.password,
        username: values.username,
      });
      message.success(response.data.message);
      hideLoginModal(); // Chiudi la modale dopo la registrazione
    } catch (error) {
      message.error(error.response?.data?.error || "Errore nella registrazione.");
    } finally {
      setLoading(false); // Termina il caricamento
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="1" disabled>
        {user?.username || "Utente"}
      </Menu.Item>
      <Menu.Item key="2" onClick={() => navigate('/edit', { state: { ...user } })}>
        Modifica Profilo
      </Menu.Item>
      <Menu.Item key="3" onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, width: '100%', zIndex: 1000, padding: '0 20px' }}>
      <div className="navbar-left">
        <img src="https://i.postimg.cc/fLns3GRk/white-Logo.png" alt="Logo" style={{ height: '30px' }} />
      </div>
      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center' }}>
        {isLoggedIn ? (
          <Dropdown overlay={userMenu} trigger={['click']}>
            <Avatar src="https://i.postimg.cc/zGN6QG8M/user-icon.png" size="large" style={{ cursor: "pointer" }} />
          </Dropdown>
        ) : (
          <Button type="primary" onClick={showLoginModal}>Accedi</Button>
        )}
      </div>

      {/* Modale di login/registrazione */}
      <Modal title="Accedi o Registrati" visible={isModalVisible} onCancel={hideLoginModal} footer={null} width={400}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Login" key="login">
            <Form name="login" onFinish={handleLogin} layout="vertical">
              <Form.Item name="email" rules={[{ required: true, message: "Per favore inserisci la tua email!" }]}>
                <Input prefix={<UserOutlined />} placeholder="Email" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: "Per favore inserisci la tua password!" }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" block htmlType="submit">Login</Button>
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab="Registrazione" key="register">
            <Form name="register" onFinish={handleRegister} layout="vertical">
              <Form.Item name="email" rules={[{ required: true, message: "Per favore inserisci la tua email!" }]}>
                <Input prefix={<UserOutlined />} placeholder="Email" />
              </Form.Item>
              <Form.Item name="username" rules={[{ required: true, message: "Per favore inserisci il tuo username!" }]}>
                <Input prefix={<UserOutlined />} placeholder="Username" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: "Per favore inserisci una password!" }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" block htmlType="submit">Registrati</Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Modal>

      {/* Caricamento */}
      {loading && (
        <div className="loading-overlay">
          <Spin size="large" />
        </div>
      )}
    </Header>
  );
};

export default Navbar;
