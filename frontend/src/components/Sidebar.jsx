import React, { useEffect, useMemo, useState } from "react";
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
  DashboardOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useNavigate } from "react-router-dom";
import { Content } from "antd/es/layout/layout";

const { Sider } = Layout;

const Sidebar = ({ collapsed, setCollapsed }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [username, setUsername] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const [selectedKey, setSelectedKey] = useState(isAdmin ? "2" : "1"); // Se admin, inizializza a "2" (Dashboard), altrimenti "1" (Home)
  
  const handleNavigation = (page) => {
    navigate(`/${page}`);
  };
  const handleMenuClick = (key, path) => {
    setSelectedKey(key);
    handleNavigation(path);
  };


  // Funzione per estrarre l'ID dell'utente dal token JWT
  const getUserIdFromToken = (token) => {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1])); // Decodifica il payload del token
      return {
        id: payload.id,
        role: payload.role || "user", // Se il ruolo non è nel token, default a "user"
      };
    } catch (error) {
      console.error("Errore nella decodifica del token:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!token) {
      console.log("Token non trovato, impossibile verificare il ruolo");
      return;
    }

    const userData = getUserIdFromToken(token);

    if (userData?.role === "admin") {
      setIsAdmin(true);
      setIsLoggedIn(true);
      return;
    }

    // Se il ruolo non è nel token, facciamo una chiamata al backend per sicurezza
    axios
      .get(`${apiUrl}/api/user/${userData?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log("Risposta del server:", response.data);
        setIsAdmin(response.data.role === "admin");
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

  const getMenuItems = useMemo(() => {
    let items = [];

    if (!isAdmin) {
      // Aggiungi "Home" solo se non sei in modalità admin
      items.push({
        key: "1",
        icon: <HomeOutlined style={{ fontSize: 20 }} />,
        label: "Home",
        onClick: () => handleMenuClick("1", "/"),
        style: {
          fontSize: 16,
          fontWeight: "500",
          color: "#FFFFFF",
          backgroundColor: selectedKey === "1" ? "#8A2BE2" : "transparent", // Solo se selezionato
          borderRadius: "8px",
          transition: "background-color 0.3s",
        },
      });
    }

    if (isAdmin) {
      // Aggiungi gli altri menu per l'admin
      items.push(
        {
          key: "2",
          icon: <DashboardOutlined style={{ fontSize: 20 }} />,
          label: "Dashboard",
          onClick: () => handleMenuClick("2", "adminDashboard"),
          style: {
            fontSize: 16,
            fontWeight: "500",
            color: "#FFFFFF",
            backgroundColor: selectedKey === "2" ? "#8A2BE2" : "transparent", // Solo se selezionato
            borderRadius: "8px",
            transition: "background-color 0.3s",
          },
        },
        {
          key: "3",
          icon: <UserOutlined style={{ fontSize: 20 }} />,
          label: "Gestione Utenti",
          onClick: () => handleMenuClick("3", "gestione-utenti"),
          style: {
            fontSize: 16,
            fontWeight: "500",
            color: "#FFFFFF",
            backgroundColor: selectedKey === "3" ? "#8A2BE2" : "transparent", // Solo se selezionato
            borderRadius: "8px",
            transition: "background-color 0.3s",
          },
        },
        {
          key: "4",
          icon: <TrophyOutlined style={{ fontSize: 20 }} />,
          label: "Gestione Tornei",
          onClick: () => handleMenuClick("4", "gestione-tornei"),
          style: {
            fontSize: 16,
            fontWeight: "500",
            color: "#FFFFFF",
            backgroundColor: selectedKey === "4" ? "#8A2BE2" : "transparent", // Solo se selezionato
            borderRadius: "8px",
            transition: "background-color 0.3s",
          },
        },
        {
          key: "5",
          icon: <TeamOutlined style={{ fontSize: 20 }} />,
          label: "Teams",
          onClick: () => handleMenuClick("5", "teams"),
          style: {
            fontSize: 16,
            fontWeight: "500",
            color: "#FFFFFF",
            backgroundColor: selectedKey === "5" ? "#8A2BE2" : "transparent", // Solo se selezionato
            borderRadius: "8px",
            transition: "background-color 0.3s",
          },
        }
      );
    }

    return items;
  }, [selectedKey, isAdmin]);

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
      message.error(
        error.response?.data?.error || "Errore nella registrazione."
      );
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
          selectedKeys={[selectedKey]}
          items={getMenuItems}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            borderRight: 0,
            backgroundColor: "#0F0E17",
            padding: 5,
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
            justifyContent: "center",
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
            <XOutlined style={{ color: "#fff" }} />
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

        
      </Sider>
    </>
  );
};

export default Sidebar;
