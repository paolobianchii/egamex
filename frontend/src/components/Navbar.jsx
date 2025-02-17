import React, { useState, useEffect } from "react";
import {
  Layout,
  Button,
  Menu,
  Dropdown,
  Avatar,
  Spin,
  Modal,
  Form,
  Input,
  message,
  Tabs,
} from "antd";
import { UserOutlined, LockOutlined, UserAddOutlined, DiscordOutlined, LoginOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

const { Header } = Layout;
const { TabPane } = Tabs;

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem("username"));

  const [loading, setLoading] = useState(false); // Stato per il caricamento
  const [isModalVisible, setIsModalVisible] = useState(false); // Stato per la modale
  const [activeTab, setActiveTab] = useState("login"); // Tab attivo della modale
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Stato per il login in corso
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Stato per il logout in corso
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const [role, setRole] = useState(null); // Nuovo stato per il ruolo dell'utente

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const user = JSON.parse(localStorage.getItem("user"));
      setIsLoggedIn(true);
      setUsername(user?.email || "");
      fetchUserDetails(token); // Recupera i dettagli dell'utente, incluso il ruolo
    }
  }, []);

  const fetchUserDetails = async (token) => {
    try {
      const response = await axios.get(`${apiUrl}/api/users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data && response.data.email) {
        setUsername(response.data.username);
        setEmail(response.data.email);
        setRole(response.data.role); // Imposta il ruolo dell'utente
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("email", response.data.email);
        localStorage.setItem("role", response.data.role); // Salva il ruolo
      } else {
        console.error("Dati utente non trovati o email non presente");
      }
    } catch (error) {
      message.error("Errore nel recupero dei dati dell'utente.");
      console.error(error);
    }
  };

  const showLoginModal = () => setIsModalVisible(true); // Mostra la modale
  const hideLoginModal = () => setIsModalVisible(false); // Nasconde la modale

  const handleLogout = () => {
    setIsLoggingOut(true); // Mostra la sovrapposizione di logout
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
      setIsLoggingOut(false); // Nascondi la sovrapposizione
    }, 1000); // Fai durare il loading un po' per simularlo
  };

  const handleLogin = async (values) => {
    setIsLoggingIn(true);
    setLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/api/login`, {
        email: values.email,
        password: values.password,
      });
      if (response.data.message) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setIsLoggedIn(true);
        setUsername(values.email);
        setRole(response.data.user.role); // Imposta il ruolo al momento del login
        message.success(response.data.message);
        hideLoginModal();

        // Dopo il login, reindirizza in base al ruolo
        if (response.data.user.role === "admin") {
          navigate("/adminDashboard");
        } else {
          navigate("/");
        }
      } else {
        message.error(response.data.error || "Credenziali errate.");
      }
    } catch (error) {
      message.error(error.response?.data?.error || "Errore nel login.");
    } finally {
      setLoading(false);
      setIsLoggingIn(false);
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
      message.error(
        error.response?.data?.error || "Errore nella registrazione."
      );
    } finally {
      setLoading(false); // Termina il caricamento
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="1" disabled>
        {username || "Utente"}
      </Menu.Item>
      <Menu.Item
        key="2"
        onClick={() => {
          console.log("Navigating with Username:", username); // Debug
          console.log("Navigating with Email:", email); // Debug
          navigate("/edit", { state: { username, email } });
        }}
      >
        Modifica Profilo
      </Menu.Item>
      {role === 'admin' && (
        <Menu.Item key="4" onClick={() => navigate('/adminDashboard')}>
          Gestione
        </Menu.Item>
      )}
      <Menu.Item key="3" onClick={handleLogout}>
        Logout
      </Menu.Item>
      
    </Menu>
  );

  return (
    <Header
      className="navbar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#0F0E17",
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 1000,
        padding: "0 20px",
      }}
    >
      <div className="navbar-left">
  <a href="/" aria-label="Vai alla home">
    <img
      src="https://i.postimg.cc/fLns3GRk/white-Logo.png"
      alt="Logo"
      style={{ height: "30px" }}
    />
  </a>
</div>

      <div
        className="navbar-right"
        style={{ display: "flex", alignItems: "center" }}
      >
        {isLoggedIn ? (
          <Dropdown overlay={userMenu} trigger={["click"]}>
            <Avatar
              src="https://i.postimg.cc/zGN6QG8M/user-icon.png"
              size="large"
              style={{ cursor: "pointer" }}
            />
          </Dropdown>
        ) : (
          <Button
  type="primary"
  onClick={showLoginModal}
  style={{
    backgroundColor: '#9b4dca', // Colore con trasparenza per effetto vetro
    backdropFilter: 'blur(10px)', // Sfocatura dietro il bottone
    borderRadius: '12px', // Angoli arrotondati
    padding: '12px 24px', // Maggiore padding per un bottone più visibile
    fontSize: '16px', // Aumenta la dimensione del testo
    color: '#fff', // Colore del testo
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', // Ombra sottile per dare profondità
    fontWeight: 'bold', // Testo in grassetto
    transition: 'all 0.3s ease', // Aggiungi transizione morbida
    height:43
  }}

>
  <UserOutlined/> Accedi
</Button>

        )}
      </div>

      {/* Modale di login/registrazione */}
      <Modal
  open={isModalVisible}
  onCancel={hideLoginModal}
  footer={null}
  width={450}
  className="custom-modal"
>
  <div className="modal-header" style={{ textAlign: 'left' }}>
  <img
      src="https://i.postimg.cc/fLns3GRk/white-Logo.png"
      alt="Logo"
      style={{ height: "40px", marginBottom:15 }}
    />
  </div>
  <Tabs
    activeKey={activeTab}
    onChange={setActiveTab}
    tabBarStyle={{
      color: "#4A90E2",
      fontWeight: "bold",
      fontSize: "16px",
      marginBottom: "20px",
    }}
  >
    <TabPane tab="Accesso" key="login">
      <Form name="login" onFinish={handleLogin} layout="vertical">
        <Form.Item
          name="email"
          rules={[
            {
              required: true,
              message: "Per favore inserisci la tua email!",
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Email"
            size="large"
            style={{ height: '45px', fontSize: '16px' }}
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            {
              required: true,
              message: "Per favore inserisci la tua password!",
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
            style={{ height: '45px', fontSize: '16px' }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            block
            htmlType="submit"
            style={{
              backgroundColor: 'rgb(15, 14, 23)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              height:45
            }}
          >
            <LoginOutlined /> Accedi
          </Button>
        </Form.Item>

        {/* Divider Line */}
        <hr style={{ border: '1px solid #ddd', margin: '20px 0' }} />

        

        {/* Discord login button */}
        <Form.Item>
          <Button
            block
            disabled
            style={{
              backgroundColor: '#7289DA',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#fff',
              height:45
            }}
          >
            <DiscordOutlined /> Accedi con Discord
          </Button>
        </Form.Item>
      </Form>
    </TabPane>

    <TabPane tab="Registrazione" key="register">
      <Form name="register" onFinish={handleRegister} layout="vertical">
        <Form.Item
          name="email"
          rules={[
            {
              required: true,
              message: "Per favore inserisci la tua email!",
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Email"
            size="large"
            style={{ height: '45px', fontSize: '16px' }}
          />
        </Form.Item>
        <Form.Item
          name="username"
          rules={[
            {
              required: true,
              message: "Per favore inserisci il tuo username!",
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Username"
            size="large"
            style={{ height: '45px', fontSize: '16px' }}
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            {
              required: true,
              message: "Per favore inserisci una password!",
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
            style={{ height: '45px', fontSize: '16px' }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            block
            htmlType="submit"
            style={{
              backgroundColor: 'rgb(15, 14, 23)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              height:45
            }}
          >
            <UserAddOutlined /> Registrati
          </Button>
        </Form.Item>
      </Form>
    </TabPane>
  </Tabs>
</Modal>


      {/* Sovrapposizione di "Accesso in corso" o "Logout in corso" */}
      {(isLoggingIn || isLoggingOut) && (
        <div className="loading-overlay">
          <Spin size="large" />
          <p>{isLoggingIn ? "Accesso in corso..." : "Logout in corso..."}</p>
        </div>
      )}
    </Header>
  );
};

export default Navbar;
