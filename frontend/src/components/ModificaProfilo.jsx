import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Card,
  Upload,
  Avatar,
  Divider,
  Progress,
  Space,
  Row,
  Col,
} from "antd";
import { UserOutlined, UploadOutlined, HomeOutlined } from "@ant-design/icons";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const DEFAULT_AVATAR =
  "https://cdn3d.iconscout.com/3d/premium/thumb/astronaut-3d-illustration-download-in-png-blend-fbx-gltf-file-formats--space-astronomy-spaceman-avatar-pack-people-illustrations-4715127.png";

const ModificaProfilo = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR); // Stato per gestire l'URL dell'avatar
  const [isUsernameChanged, setIsUsernameChanged] = useState(false);

  const backgroundStyle = {
    background: 'linear-gradient(135deg,rgb(59, 14, 113),rgb(56, 24, 77),rgb(56, 21, 66),rgb(62, 19, 70))',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    color:"#fff"
  };

  // Card-like Container Style with Blur Effect
  const containerStyle = {
    background: 'rgba(0, 0, 0, 0.4)', // Slightly transparent white
    backdropFilter: 'blur(10px)', // Blur effect
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    padding: '30px',
    width: '100%',
    maxWidth: '1200px',
    color:"#fff"
  };

  const {
    username = "",
    email = "",
    role = "",
    avatar = "",
    created_at = "",
    punteggio = 0,
  } = location.state || {};

  const customLabel = (label) => (
    <span style={{ 
      color: 'white', 
      fontWeight: '500' 
    }}>
      {label}
    </span>
  );

  const [initialData, setInitialData] = useState({
    username,
    email,
    role,
    avatarUrl: avatar || DEFAULT_AVATAR,
    createdAt: created_at,
    punteggio: punteggio
  });

  useEffect(() => {
    if (username && email !== null) {
      form.setFieldsValue({
        username,
        email,
        role,
        password: "",
        punteggio: null,
      });
      setInitialData({
        username,
        email,
        role,
        avatarUrl: avatar || DEFAULT_AVATAR,
        createdAt: created_at,
        punteggio: punteggio,
      });
      setAvatarUrl(avatar || DEFAULT_AVATAR);
    }
  }, [form, username, email, role, avatar, created_at, punteggio]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user ? user.id : null;

    if (!userId) {
      message.error("ID utente non trovato");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.put(`${apiUrl}/api/users/${userId}`, {
        username: form.getFieldValue("username"),
        email: form.getFieldValue("email"),
        punteggio: form.getFieldValue("punteggio"),
        avatar: avatarUrl, // Usa l'avatar appena caricato
        password: form.getFieldValue("password") || undefined,
      });

      message.success("Profilo aggiornato con successo");

      // Aggiorna il localStorage con i nuovi dati
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      const updatedUser = {
        ...JSON.parse(localStorage.getItem("user")),
        ...response.data.user,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Aggiornamento completo delle informazioni visualizzate
      setInitialData({
        ...initialData,
        username: form.getFieldValue("username"),
        punteggio: form.getFieldValue("punteggio"),
      });
      navigate("/", { replace: true });
      window.location.reload();
    } catch (error) {
      console.error("Errore durante l'aggiornamento", error);
      message.error("Errore durante l'aggiornamento del profilo");
    } finally {
      setLoading(false);
    }
  };

  // Funzione che gestisce il cambiamento dell'username
  const handleUsernameChange = (e) => {
    const newUsername = e.target.value;
    setIsUsernameChanged(newUsername !== initialData.username); // Controlla se l'username è cambiato
  };

  return (
    <div style={backgroundStyle}>
      <div style={containerStyle}>
      <Row gutter={24}>
        <Col xs={24} md={8}>
          <Space direction="vertical" align="center" style={{ width: "100%" }}>
            <Avatar
              size={128}
              src={avatarUrl}
              alt="Avatar utente"
              style={{ marginTop: 70 }}
              className="border-4 border-white shadow-lg"
            />

            <h3
              className="text-xl font-bold text-white mb-1"
              style={{ marginTop: 20, }}
            >
              {initialData.username}
            </h3>
            <p className="text-indigo-200 mb-6">{initialData.email}</p>
            <h4 className="text-lg text-white mb-2">Punteggio</h4>
            <p className="text-white mt-2" style={{fontSize:25}}>{punteggio}</p>

            <Divider className="border-indigo-400" />
          </Space>
        </Col>

        {/* Area Contenuto Principale */}
        <Col xs={24} md={16}>
          <h2 className="text-2xl font-bold mb-8 mt-4" style={{marginTop:80, marginBottom:50, fontSize:25}}>Modifica Profilo</h2>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            className="space-y-4"
            requiredMark={false}
            initialValues={{
              username: initialData.username,
              email: initialData.email,
              password: "",
            }}
          >
            <Form.Item
              name="username"
              label={customLabel("Username")}
              rules={[{ required: true, message: "Inserisci il tuo username" }]}

            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Username"
                size="large"
                onChange={handleUsernameChange} // Aggiungi la gestione del cambiamento dell'username
              />
            </Form.Item>

            <Space>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0"
                size="large"
                loading={loading}
                style={{color:"white"}}
                block
                disabled={!isUsernameChanged} // Disabilita il pulsante se l'username non è stato cambiato
              >
                Salva Modifiche
              </Button>

            </Space>
          </Form>
        </Col>
      </Row>
    </div>
    </div>
  );
};

export default ModificaProfilo;
