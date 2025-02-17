import React, { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const ModificaProfilo = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  // Estrai i dati dalla location, con fallback a un oggetto vuoto
  const { username = "", email = "", id = "" } = location.state || {};

  const [initialData, setInitialData] = useState({ username, email, password: "" });

  useEffect(() => {
    console.log("Dati passati:", location.state); // Aggiungi per il debug
    console.log(JSON.parse(localStorage.getItem("user")));
  
    if (username && email !== null) {
      form.setFieldsValue({
        username,
        email,
        password: "", // Campo password vuoto per poterlo modificare
      });
      setInitialData({ username, email, password: "" });
    }
  }, [form, username, email]);
  

  const handleUpdateProfile = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user ? user.id : null;
  
    if (!userId) {
      message.error("ID utente non trovato");
      return;
    }
  
    try {
      const response = await axios.put(`${apiUrl}/api/users/${userId}`, {
        username,
        email
      });
  
      console.log("Profilo aggiornato:", response.data);
      message.success("Profilo aggiornato con successo");
  
      // Dopo l'aggiornamento, aggiorna il localStorage con il nuovo token e i dati dell'utente
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error("Errore durante l'aggiornamento", error);
      message.error("Errore durante l'aggiornamento del profilo");
    }
  };
  
  

  return (
    <div
      style={{
        backgroundImage:
          "url(https://images.rawpixel.com/image_800/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcm0zODAtMDIuanBn.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "10px 10px",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 700, margin: "80px auto", padding: 20, background: "#fff", borderRadius: 10, boxShadow: "0px 0px 10px rgba(0,0,0,0.1)" }}>
          <h2>Modifica Profilo</h2>
          <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
            <Form.Item name="username" label="Email" rules={[{ required: true, message: "Inserisci il tuo username!" }]}>
              <Input defaultValue={username} />
            </Form.Item>
            <Form.Item name="email" label="Username" rules={[{ required: true, message: "Inserisci la tua email!" }]}>
              <Input defaultValue={email} disabled />
            </Form.Item>
            <Form.Item name="password" label="Nuova Password">
              <Input.Password disabled />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block disabled>
                Aggiorna Profilo
              </Button>
            </Form.Item>
          </Form>
          <Button type="default" block onClick={() => navigate("/")}>
            Torna alla Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModificaProfilo;
