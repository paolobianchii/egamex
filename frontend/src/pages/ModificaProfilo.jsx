import React, { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const ModificaProfilo = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  const { username, email, id } = location.state || {};
  
  // Stato per i valori iniziali
  const [initialData, setInitialData] = useState({ username, email, password: "" });

  useEffect(() => {
    if (username && email) {
      form.setFieldsValue({
        username,
        email,
        password: "", // Campo password vuoto per poterlo modificare
      });
      // Salva i dati iniziali per il controllo delle modifiche
      setInitialData({ username, email, password: "" });
    }
  }, [form, username, email]);

  // Funzione per aggiornare il profilo
  const handleUpdateProfile = async (values) => {
    // Verifica se i dati sono cambiati
    if (
      values.username === initialData.username &&
      values.email === initialData.email &&
      values.password === ""
    ) {
      message.info("Nessuna modifica apportata.");
      return; // Non inviare la richiesta se i dati non sono cambiati
    }

    try {
      const response = await axios.put(`${apiUrl}/api/users/${id}`, {
        username: values.username,
        email: values.email,
        password: values.password, // Passa la nuova password se l'utente la modifica
      });

      message.success("Profilo aggiornato con successo!");
      navigate("/"); // Reindirizza alla home dopo l'aggiornamento
    } catch (error) {
      message.error(error.response?.data?.error || "Errore durante l'aggiornamento.");
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
        <Form.Item name="username" label="Username" rules={[{ required: true, message: "Inserisci il tuo username!" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, message: "Inserisci la tua email!" }]}>
          <Input /> {/* Disabilita la modifica dell'email */}
        </Form.Item>
        <Form.Item name="password" label="Nuova Password">
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>Aggiorna Profilo</Button>
        </Form.Item>
      </Form>
      <Button type="default" block onClick={() => navigate("/")}>Torna alla Home</Button>
    </div>
    </div>
    </div>
  );
};

export default ModificaProfilo;
