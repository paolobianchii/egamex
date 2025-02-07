import React, { useState } from 'react';
import { Modal, Button, Form, Input, Tabs, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, GithubOutlined } from '@ant-design/icons';
import axios from "axios"; // ⬅ Importa axios per chiamare il backend

const { TabPane } = Tabs;

const Login = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('login'); // Stato per gestire il tab attivo

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleDiscordLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) console.error("Errore login Discord:", error.message);
  };

  const handleLogin = async (values) => {
    try {
      const response = await axios.post("http://localhost:5002/api/login", {
        username: values.username,
        password: values.password,
      });
  
      message.success(response.data.message);
      setIsModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.error || "Credenziali errate.");
    }
  };
  

  // Metodo di registrazione
  const handleRegister = async (values) => {
    try {
      // Invia i dati di registrazione (email, password, username)
      const response = await axios.post("http://localhost:5002/api/register", {
        email: values.email,
        password: values.password,
        username: values.username,
      });
  
      message.success(response.data.message); // Mostra messaggio di successo
      setIsModalVisible(false); // Chiudi la modale
    } catch (error) {
      // Mostra errore in caso di problemi
      message.error(error.response?.data?.error || "Errore nella registrazione.");
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
              name="username"
              rules={[{ required: true, message: 'Per favore inserisci il tuo username!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Per favore inserisci la tua password!' }]}
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
              rules={[{ required: true, message: 'Per favore inserisci la tua email!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email" />
            </Form.Item>
            

            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Per favore inserisci il tuo username!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Per favore inserisci una password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              rules={[
                { required: true, message: 'Per favore conferma la tua password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Le password non corrispondono!');
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
    </>
  );
};

export default Login;
