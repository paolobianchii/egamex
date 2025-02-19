import React, { useEffect, useState } from "react";
import {
  Layout,
  Menu,
  Modal,
  Button,
  Tabs,
  Form,
  Input,
  Divider,
  message,
  Dropdown,
  Avatar,
} from "antd";
import axios from "axios";
import {
  HomeOutlined,
  TrophyOutlined,
  ShoppingCartOutlined,
  LoginOutlined,
  UserOutlined,
  LockOutlined,
  GithubOutlined,
  InstagramOutlined,
  TwitterOutlined,
  XOutlined,
  DiscordOutlined,
} from "@ant-design/icons";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useNavigate } from "react-router-dom";
import { Content } from "antd/es/layout/layout";

const { Sider } = Layout;
const { TabPane } = Tabs;

const Sidebar = ({ collapsed, setCollapsed }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [username, setUsername] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  const showLoginModal = () => {
    setIsModalVisible(true);
  };

  const handleProfileUpdate = () => {
    navigate("/modifica-profilo");
  };

  const hideLoginModal = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  const handleDiscordLogin = () => {
    message.success(
      "Accesso tramite Discord non implementato (futuro sviluppo)"
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUsername(null);
    message.success("Logout effettuato con successo");
  };

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      handleLogout();
    } else {
      showLoginModal();
    }
  };

  const handleNavigation = (page) => {
    navigate(`/${page}`);
  };

  // Funzione per estrarre l'ID dell'utente dal token JWT
const getUserIdFromToken = (token) => {
  if (!token) return null;

  const payload = JSON.parse(atob(token.split('.')[1])); // Decodifica il payload del token
  return payload.id; // Assumi che l'ID sia nel campo 'id' del payload
};


useEffect(() => {
  if (!token) {
    console.log("Token non trovato, impossibile verificare il ruolo");
    return;
  }

  // Recupera l'ID dal token
  const userId = getUserIdFromToken(token);

  // Effettua la richiesta per ottenere i dettagli dell'utente tramite l'ID
  axios
    .get(`${apiUrl}/api/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      console.log("Risposta del server:", response.data);

      if (response.data && response.data.role === "admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setUsername(response.data.username);
      setIsLoggedIn(true);
    })
    .catch((err) => {
      console.error("Errore nel recupero dei dati dell'utente:", err);
      setIsAdmin(false);
      setIsLoggedIn(false);
    });
}, [token]);


  useEffect(() => {
    console.log("isAdmin cambiato a:", isAdmin);
  }, [isAdmin]);

  const handleResize = () => {
    if (window.innerWidth <= 768) {
      setCollapsed(true);
      setIsMobile(true);
    } else {
      setCollapsed(false);
      setIsMobile(false);
    }
  };

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getMenuItems = () => {
    const items = [
      {
        key: "1",
        icon: <HomeOutlined style={{ fontSize: 20 }} />,
        label: "Home",
        onClick: () => handleNavigation("/"),
        style: {
          fontSize: 16,
          fontWeight: "500",
          color: "#FFFFFF",
          backgroundColor: "#B871F7",
          borderRadius: "8px",
          transition: "background-color 0.3s",
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        },
      },
    ];

    if (isAdmin) {
      items.push(
        {
          key: "5",
          icon: <UserOutlined style={{ fontSize: 20 }} />,
          label: "Gestione Utenti",
          onClick: () => handleNavigation("gestione-utenti"),
        },
        {
          key: "6",
          icon: <TrophyOutlined style={{ fontSize: 20 }} />,
          label: "Gestione Tornei",
          onClick: () => handleNavigation("gestione-tornei"),
        }
      );
    }

    return items;
  };


  const handleRegister = async (values) => {
    try {
      const response = await axios.post(`${apiUrl}/api/register`, {
        email: values.email,
        password: values.password,
        username: values.username,
      });

      message.success(response.data.message);
      setIsModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.error || "Errore nella registrazione.");
    }
  };

  const handleLogin = async (values) => {
    console.log("Dati inviati:", values);
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
        setIsModalVisible(false);
      } else {
        message.error(response.data.error || "Credenziali errate.");
      }
    } catch (error) {
      console.error("Errore durante il login:", error);
      message.error(error.response?.data?.error || "Errore nel login.");
    }
  };

  const tabsItems = [
    {
      label: "Login",
      key: "login",
      children: (
        <>
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={handleLogin}
            layout="vertical"
          >
            <Form.Item
              name="email"
              rules={[
                {
                  required: true,
                  message: "Per favore inserisci la tua email!",
                },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email" />
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
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" block htmlType="submit">
                Login
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          <a href="/forgot-password">Dimenticata la password?</a>
        </>
      ),
    },
    {
      label: "Registrazione",
      key: "register",
      children: (
        <>
          <Form
            name="register"
            initialValues={{ remember: true }}
            onFinish={handleRegister}
            layout="vertical"
          >
            <Form.Item
              name="email"
              rules={[
                {
                  required: true,
                  message: "Per favore inserisci la tua email!",
                },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email" />
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
              <Input prefix={<UserOutlined />} placeholder="Username" />
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
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              rules={[
                {
                  required: true,
                  message: "Per favore conferma la tua password!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject("Le password non corrispondono!");
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Conferma Password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" block htmlType="submit">
                Registrati
              </Button>
            </Form.Item>
          </Form>
        </>
      ),
    },
  ];

  return (
    <>
      <Sider
        style={{
          position: "fixed",
          top: 60,
          left: 0,
          bottom: 0,
          zIndex: 10,
          backgroundColor: "#0F0E17",
        }}
        width={250}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth={collapsed ? 80 : 100}
        trigger={isMobile ? null : undefined}
      >
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          items={getMenuItems()}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            borderRight: 0,
            backgroundColor: "#0F0E17",
            padding:5
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 70,
            left: 0,
            right: 0,
            width: "100%",
            textAlign: "center",
            padding: "20px 0",
            display: "flex",
            flexDirection: collapsed ? "column" : "row",
            alignItems: "center",
            justifyContent:"center",
            gap: "40px",
          }}
        >
          <a
            href="https://discord.com/invite/xtZFtMKZez/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "white", fontSize: "20px" }}
          >
            <DiscordOutlined />
          </a>
          <a
            href="https://x.com/i/flow/login?redirect_after_login=%2FeGameX_Official%2F"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "white", fontSize: "20px" }}
          >
            <XOutlined style={{color:"#fff"}} />
          </a>
          <a
            href="https://www.instagram.com/egamex.eu/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "white", fontSize: "20px" }}
          >
            <InstagramOutlined />
          </a>
        </div>

        <Modal
          title="Accedi o Registrati"
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={400}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabsItems}
          />
        </Modal>
      </Sider>
    </>
  );
};

export default Sidebar;
