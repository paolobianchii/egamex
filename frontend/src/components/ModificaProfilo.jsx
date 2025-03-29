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
import { UserOutlined, UploadOutlined, MailOutlined } from "@ant-design/icons";
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
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [user, setUser] = useState(null);
  const [initialValues, setInitialValues] = useState({
    username: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Imposta i valori iniziali dall'utente in localStorage
      setInitialValues({
        username: parsedUser.username,
      });
      // Imposta i valori nel form
      form.setFieldsValue({
        username: parsedUser.username,
      });
    }
  }, []);

  const backgroundStyle = {
    background: 'linear-gradient(135deg,rgb(59, 14, 113),rgb(56, 24, 77),rgb(56, 21, 66),rgb(62, 19, 70))',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    color:"#fff"
  };

  const containerStyle = {
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    padding: '30px',
    width: '100%',
    maxWidth: '1200px',
    color:"#fff"
  };

  const customLabel = (label) => (
    <span style={{ 
      color: 'white', 
      fontWeight: '500' 
    }}>
      {label}
    </span>
  );

  // Gestisce il cambiamento dei campi del form
  const handleFormChange = () => {
    const currentValues = form.getFieldsValue();
    const changed = currentValues.username !== initialValues.username;
    setIsFormChanged(changed);
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const userId = user ? user.id : null;
  
    if (!userId) {
      message.error("ID utente non trovato");
      setLoading(false);
      return;
    }
  
    try {
      const updatedData = {
        username: form.getFieldValue("username"),
      };
  
      // 1. Chiamata API per aggiornare il database
      const response = await axios.put(`${apiUrl}/api/users/${userId}`, updatedData);
  
      // 2. Aggiorna lo stato locale
      const updatedUser = {
        ...user,
        username: updatedData.username,
      };
      
      // 3. Aggiorna localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // 4. Aggiorna lo stato dell'applicazione
      setUser(updatedUser);
      
      // 5. Mostra messaggio di successo
      message.success("Profilo aggiornato con successo");
      
      // 6. Naviga verso la home dopo un breve delay per far vedere il messaggio
      setTimeout(() => {
        navigate("/", {
          state: { 
            userUpdated: true,
            username: updatedData.username 
          }
        });
      }, 1000);
      
    } catch (error) {
      console.error("Errore durante l'aggiornamento", error);
      message.error(error.response?.data?.message || "Errore durante l'aggiornamento del profilo");
    } finally {
      setLoading(false);
    }
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

              <h3 className="text-xl font-bold text-white mb-1" style={{ marginTop: 20 }}>
                {user?.username || "Utente"}
              </h3>
              <p className="text-indigo-200 mb-6">{user?.email || ""}</p>
              <h4 className="text-lg text-white mb-2">Punteggio</h4>
              <p className="text-white mt-2" style={{fontSize:25}}>{user?.punteggio || 0}</p>

              <Divider className="border-indigo-400" />
            </Space>
          </Col>

          <Col xs={24} md={16}>
            <h2 className="text-2xl font-bold mb-8 mt-4" style={{marginTop:80, marginBottom:50, fontSize:25}}>Modifica Profilo</h2>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              className="space-y-4"
              requiredMark={false}
              initialValues={initialValues}
              onValuesChange={handleFormChange}
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
                  disabled={!isFormChanged}
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