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
import axios from "axios"; // ⬅ Importa axios per chiamare il backend
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
import { useNavigate } from "react-router-dom"; // Usa useNavigate invece di useHistory
import { Content } from "antd/es/layout/layout";

const { Sider } = Layout;
const { TabPane } = Tabs;

const Sidebar = ({ collapsed, setCollapsed }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Stato per gestire il login
  const [isModalVisible, setIsModalVisible] = useState(false); // Stato per la visibilità della modale
  const [activeTab, setActiveTab] = useState("login"); // Stato per gestire il tab attivo
  const navigate = useNavigate(); // Gestire la navigazione con useNavigate
  const [isMobile, setIsMobile] = useState(false); // Stato per determinare se è dispositivo mobile
  const [username, setUsername] = useState(null); // Stato per gestire il nome utente
  const [isAdmin, setIsAdmin] = useState(false);

  const showLoginModal = () => {
    setIsModalVisible(true); // Mostra la modale di login
  };

  const handleProfileUpdate = () => {
    navigate("/modifica-profilo"); // Naviga alla pagina di modifica profilo
  };

  const hideLoginModal = () => {
    setIsModalVisible(false); // Nascondi la modale di login
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
    localStorage.removeItem("token"); // Rimuove il token dal localStorage
    setIsLoggedIn(false); // Imposta isLoggedIn su false
    setUsername(null); // Rimuove il nome utente
    message.success("Logout effettuato con successo");
  };

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      handleLogout(); // Esegui il logout
    } else {
      showLoginModal(); // Mostra la modale di login
    }
  };

  // Navigazione tra le pagine
  const handleNavigation = (page) => {
    navigate(`/${page}`);
  };

  // Funzione per gestire il ridimensionamento della finestra
  const handleResize = () => {
    if (window.innerWidth <= 768) {
      setCollapsed(true); // Chiudi la sidebar su schermi piccoli
      setIsMobile(true); // Imposta il flag mobile a true
    } else {
      setCollapsed(false); // Espandi la sidebar su schermi più grandi
      setIsMobile(false); // Imposta il flag mobile a false
    }
  };

  useEffect(() => {
    handleResize(); // Imposta lo stato iniziale basato sulla larghezza della finestra

    // Aggiungi l'event listener per il resize della finestra
    window.addEventListener("resize", handleResize);

    // Pulizia dell'event listener quando il componente viene smontato
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  // Funzione per determinare gli items del menu
  const getMenuItems = () => {
    const items = [
      {
        key: "1",
        icon: <HomeOutlined style={{ fontSize: 20 }} />,
        label: "Home",
        onClick: () => handleNavigation("/"),
        style: {
          fontSize: 17,
          fontWeight: "500",
        },
      },
      /*
      {
        key: "2",
        icon: <TrophyOutlined style={{ fontSize: 20 }} />,
        label: "Tornei",
        onClick: () => handleNavigation("tornei"),
        style: {
          fontSize: 17,
          fontWeight: "500",
        },
      },
      
    {
      key: "3",
      icon: <ShoppingCartOutlined style={{ fontSize: 20 }} />,
      label: "Store",
      onClick: () => handleNavigation("store"),
      style:{
        fontSize:17,
        fontWeight:"500"
      }
    },
    
      {
        key: "4",
        icon: <LoginOutlined style={{ fontSize: 20 }} />,
        label: isLoggedIn ? null : "Login",
        onClick: isLoggedIn ? handleLogout : handleLoginLogout,
        style: {
          fontSize: 17,
          fontWeight: "500",
        },
      },
      */
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
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  // Metodo di registrazione
  const handleRegister = async (values) => {
    try {
      // Assicurati che l'URL corrisponda al tuo backend
      const response = await axios.post(`${apiUrl}/api/register`, {
        email: values.email,
        password: values.password,
        username: values.username,
      });

      message.success(response.data.message); // Mostra messaggio di successo
      setIsModalVisible(false); // Chiudi la modale
    } catch (error) {
      message.error(
        error.response?.data?.error || "Errore nella registrazione."
      );
    }
  };

  const handleLogin = async (values) => {
    console.log("Dati inviati:", values); // Controlla i dati inviati
    try {
      // Invia email e password al backend
      const response = await axios.post(`${apiUrl}/api/login`, {
        email: values.email, // Cambiato da username a email
        password: values.password,
      });

      //console.log("Risposta ricevuta:", response); // Controlla la risposta

      if (response.data.message) {
        // Se la risposta contiene il messaggio di successo
        localStorage.setItem("token", response.data.token); // Salva il token
        localStorage.setItem("username", values.email); // Salva l'email come username

        setIsLoggedIn(true); // Utente loggato
        setUsername(values.email); // Salva l'email come username
        message.success(response.data.message); // Mostra il messaggio di successo
        setIsModalVisible(false); // Chiudi la modale
      } else {
        message.error(response.data.error || "Credenziali errate."); // Mostra il messaggio di errore
      }
    } catch (error) {
      console.error("Errore durante il login:", error); // Stampa l'errore
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
              name="email" // Cambiato da 'username' a 'email'
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
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
              />
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
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
              />
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
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Conferma Password"
              />
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      // Aggiungi il recupero del nome utente dal localStorage
      const savedUsername = localStorage.getItem("username");
      setUsername(savedUsername);

      // Fai una richiesta al backend per ottenere il ruolo dell'utente
      axios
        .get(`${apiUrl}/api/getUserRole`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          if (response.data.role === "admin") {
            setIsAdmin(true);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, []);

  return (
    <>
      <Sider
        style={{
          position: "fixed", // Sidebar fissa
          top: 60,
          left: 0,
          bottom: 0,
          zIndex: 10, // Mantieni la sidebar sopra altri contenuti
          backgroundColor: "#0F0E17",
        }}
        width={250}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth={collapsed ? 80 : 100}
        trigger={isMobile ? null : undefined} // Blocca l'apertura della sidebar su dispositivi mobili
      >
        {/*
        <div className="logo">
          <img
            src={
              collapsed ? "https://i.postimg.cc/763kSK59/white-Sm-Logo.png" : "https://i.postimg.cc/fLns3GRk/white-Logo.png"
            }
            alt="Logo"
            style={{
              width: collapsed ? "82px" : "130px", // Imposta una larghezza ridotta per il logo quando la sidebar è collassata
              height: "auto", // Mantenere le proporzioni corrette
              transition: "width 0.3s ease", // Aggiungi una transizione per un effetto fluido
              margin: collapsed ? "20px auto" : "20px 20px", // Centra il logo orizzontalmente
              display: "block", // Blocca il logo in modo che venga centrato
            }}
          />
        </div>
        */}

        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          items={getMenuItems()}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px", // Spazio uniforme tra gli elementi
            borderRight: 0,
            backgroundColor: "#0F0E17",
            padding:5
          }}
        />
        {isLoggedIn && (
          <div style={{ marginTop: "auto" }}>
            {/* Questo posiziona il dropdown in fondo */}
            {/* Posiziona il dropdown in fondo */}
            <Dropdown
              trigger={["click"]} // Gestisce il trigger al click
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Menu>
                    <Menu.Item onClick={handleProfileUpdate}>
                      Modifica Profilo
                    </Menu.Item>
                    <Menu.Item onClick={handleLogout}>Logout</Menu.Item>
                  </Menu>
                </div>
              )}
            >
              <div className="avatar-container">
                <Avatar
                  size="large"
                  icon={<UserOutlined />} // Usa un'icona di utente di default se non c'è un'immagine
                  style={{
                    cursor: "pointer",
                  }}
                />
                {/* Mostra username su schermi più grandi */}
                <div className="username">{username} </div>
                <ArrowDropDownIcon
                  style={{ fontSize: 20, color: "white", marginLeft: 5 }}
                />
              </div>
            </Dropdown>
          </div>
        )}
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
            items={tabsItems} // Passa gli items invece delle TabPane
          />
        </Modal>
      </Sider>
    </>
  );
};

export default Sidebar;
