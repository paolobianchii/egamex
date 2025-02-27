import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Card, Upload, Avatar, Divider } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, UploadOutlined, HomeOutlined } from "@ant-design/icons";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const DEFAULT_AVATAR = "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg";

const ModificaProfilo = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const [loading, setLoading] = useState(false);

  const { username = "", email = "", id = "", role = "", avatar = "", created_at = "" } = location.state || {};
  const [initialData, setInitialData] = useState({ 
    username, 
    email, 
    role, 
    avatarUrl: avatar || DEFAULT_AVATAR,
    createdAt: created_at
  });
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (username && email !== null) {
      form.setFieldsValue({
        username,
        email,
        role,
        password: "",
      });
      setInitialData({ 
        username, 
        email, 
        role, 
        avatarUrl: avatar || DEFAULT_AVATAR,
        createdAt: created_at
      });
    }
  }, [form, username, email, role, avatar, created_at]);

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
        avatar: initialData.avatarUrl,
        password: form.getFieldValue("password") || undefined,
      });
  
      message.success("Profilo aggiornato con successo");
  
      // Aggiorna il localStorage con i nuovi dati
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
  
      const updatedUser = { 
        ...JSON.parse(localStorage.getItem("user")), 
        ...response.data.user 
      };
  
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Aggiornamento completo delle informazioni visualizzate
      setInitialData({
        ...initialData,
        username: form.getFieldValue("username"),
      });
      window.location.reload();
      navigate("/adminDashboard");
    } catch (error) {
      console.error("Errore durante l'aggiornamento", error);
      message.error("Errore durante l'aggiornamento del profilo");
    } finally {
      window.location.reload();
      setLoading(false);
      
    }
  };
  
  const handleAvatarChange = (info) => {
    if (info.file.status === 'done') {
      setInitialData({ ...initialData, avatarUrl: info.file.response.url });
      message.success("Avatar caricato con successo");
    } else if (info.file.status === 'error') {
      message.error("Errore nel caricare l'avatar");
    }
    setFileList(info.fileList);
  };

  const handleResetAvatar = () => {
    setInitialData({ ...initialData, avatarUrl: DEFAULT_AVATAR });
    setFileList([]);
    message.success("Avatar reimpostato");
  };

// Funzione per formattare il timestamp in "Mese Anno"
const formatDate = (timestamp) => {
  const date = new Date(timestamp); // Crea un oggetto Date dal timestamp
  if (isNaN(date)) {
    // Se la data non è valida, restituisci un messaggio predefinito
    return "Data non valida";
  }
  const options = { year: "numeric", month: "long" }; // Mese e anno
  return date.toLocaleDateString("it-IT", options); // Formattazione in italiano
};


  return (
    <div className="bg-gradient-to-r from-indigo-900 to-purple-900 min-h-screen ">
      <div className="container mx-auto px-6 py-12">
        <Card 
          className="max-w-4xl mx-auto shadow-2xl rounded-xl overflow-hidden"
          bordered={false}
        >
          <div className="flex flex-col md:flex-row">
            {/* Sidebar/Header con Avatar e Info Base */}
            <div className="w-full md:w-1/3 bg-gradient-to-b from-indigo-700 to-purple-800 p-8 text-center">
              <div className="relative mb-8 mx-auto">
                <Avatar 
                  size={128} 
                  src={initialData.avatarUrl} 
                  alt="Avatar utente"
                  style={{marginTop:70}}
                  className="border-4 border-white shadow-lg"
                />
                <Upload
                  action="/upload"
                  showUploadList={false}
                  fileList={fileList}
                  onChange={handleAvatarChange}
                  beforeUpload={() => false}
                >
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<UploadOutlined />} 
                    size="large"
                    className="absolute bottom-0 right-0 bg-blue-500"
                  />
                </Upload>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1" style={{marginTop:20}}>{initialData.username}</h3>
              <p className="text-indigo-200 mb-6">{initialData.email}</p>
              
              
              <Divider className="border-indigo-400" />


            </div>
            
            {/* Area Contenuto Principale */}
            <div className="w-full md:w-2/3 p-8">
              <h2 className="text-2xl font-bold mb-8">Modifica Profilo</h2>
              
              <Form 
                form={form} 
                layout="vertical" 
                onFinish={handleUpdateProfile} 
                className="space-y-4"
                requiredMark={false}
                initialValues={{
                  username: initialData.username,
                  email: initialData.email,
                  password: ""
                }}
              >
                <Form.Item 
                  name="username" 
                  label="Username" 
                  rules={[{ required: true, message: "Inserisci il tuo username" }]}
                >
                  <Input 
                    prefix={<UserOutlined className="text-gray-400" />} 
                    placeholder="Username"
                    size="large"
                  />
                </Form.Item>
                
                
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-10 pt-4">
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0"
                    size="large"
                    loading={loading}
                    block
                  >
                    Salva Modifiche
                  </Button>
                  
                  <Button 
                    type="default" 
                    onClick={() => navigate("/adminDashboard")} 
                    icon={<HomeOutlined />}
                    style={{marginTop:20}}
                    size="large"
                  >
                    Torna alla Dashboard
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ModificaProfilo;
