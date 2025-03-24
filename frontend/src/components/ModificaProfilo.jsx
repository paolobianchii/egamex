import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Card, Upload, Avatar, Divider } from "antd";
import { UserOutlined, UploadOutlined, HomeOutlined } from "@ant-design/icons";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const DEFAULT_AVATAR = "https://cdn3d.iconscout.com/3d/premium/thumb/astronaut-3d-illustration-download-in-png-blend-fbx-gltf-file-formats--space-astronomy-spaceman-avatar-pack-people-illustrations-4715127.png";

const ModificaProfilo = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR); // Stato per gestire l'URL dell'avatar
  const [isUsernameChanged, setIsUsernameChanged] = useState(false);

  const { username = "", email = "", id = "", role = "", avatar = "", created_at = "" } = location.state || {};
  const [initialData, setInitialData] = useState({
    username,
    email,
    role,
    avatarUrl: avatar || DEFAULT_AVATAR,
    createdAt: created_at
  });

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
      setAvatarUrl(avatar || DEFAULT_AVATAR);
    }
  }, [form, username, email, role, avatar, created_at]);

  const handleAvatarChange = (info) => {
    console.log("File selezionato:", info.file);
    if (info.file.status === 'done') {
      setAvatarUrl(info.file.response.url); 
      message.success("Avatar caricato con successo");
    } else if (info.file.status === 'error') {
      message.error("Errore nel caricare l'avatar");
    }
    setFileList(info.fileList);
  };
  

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
        ...response.data.user 
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Aggiornamento completo delle informazioni visualizzate
      setInitialData({
        ...initialData,
        username: form.getFieldValue("username"),
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
                  src={avatarUrl} 
                  alt="Avatar utente"
                  style={{marginTop:70}}
                  className="border-4 border-white shadow-lg"
                />
<Upload
  action={`${apiUrl}/upload`}
  headers={{
    Authorization: `Bearer ${localStorage.getItem("token")}` // Se usi un token di autenticazione
  }}
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
                    onChange={handleUsernameChange} // Aggiungi la gestione del cambiamento dell'username

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
                    disabled={!isUsernameChanged} // Disabilita il pulsante se l'username non è stato cambiato

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
                    Torna indietro
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
