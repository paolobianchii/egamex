import React, { useState, useEffect } from 'react';
import { Layout, Button, Badge, Modal, Tabs, Form, Input, message } from 'antd';
import { NotificationOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';


const { Header } = Layout;
const { TabPane } = Tabs;

const Navbar = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      setUsername(localStorage.getItem("username"));
    }
  }, []);

  const showLoginModal = () => setIsModalVisible(true);
  const hideLoginModal = () => setIsModalVisible(false);
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUsername(null);
    message.success("Logout effettuato con successo");
  };

  const handleLogin = async (values) => {
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
        hideLoginModal();
      } else {
        message.error(response.data.error || "Credenziali errate.");
      }
    } catch (error) {
      message.error(error.response?.data?.error || "Errore nel login.");
    }
  };

  const handleRegister = async (values) => {
    try {
      const response = await axios.post(`${apiUrl}/api/register`, {
        email: values.email,
        password: values.password,
        username: values.username,
      });
      message.success(response.data.message);
      hideLoginModal();
    } catch (error) {
      message.error(error.response?.data?.error || "Errore nella registrazione.");
    }
  };

  return (
    <Header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, width: '100%', zIndex: 1000, padding: '0 20px' }}>
      <div className="navbar-left">
    <img src="https://i.postimg.cc/fLns3GRk/white-Logo.png" alt="Logo" style={{ height: '30px' }} />
  </div>
      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center' }}>
        {isLoggedIn ? (
          <Button type="primary" onClick={handleLogout}>Logout</Button>
        ) : (
          <Button type="primary" onClick={showLoginModal}>Accedi</Button>
        )}
      </div>
      <Modal title="Accedi o Registrati" visible={isModalVisible} onCancel={hideLoginModal} footer={null} width={400}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Login" key="login">
            <Form name="login" onFinish={handleLogin} layout="vertical">
              <Form.Item name="email" rules={[{ required: true, message: "Per favore inserisci la tua email!" }]}>
                <Input prefix={<UserOutlined />} placeholder="Email" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: "Per favore inserisci la tua password!" }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" block htmlType="submit">Login</Button>
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab="Registrazione" key="register">
            <Form name="register" onFinish={handleRegister} layout="vertical">
              <Form.Item name="email" rules={[{ required: true, message: "Per favore inserisci la tua email!" }]}>
                <Input prefix={<UserOutlined />} placeholder="Email" />
              </Form.Item>
              <Form.Item name="username" rules={[{ required: true, message: "Per favore inserisci il tuo username!" }]}>
                <Input prefix={<UserOutlined />} placeholder="Username" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: "Per favore inserisci una password!" }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" block htmlType="submit">Registrati</Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Modal>
    </Header>
  );
};

export default Navbar;