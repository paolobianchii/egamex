import React, { useState } from 'react';
import { Layout } from 'antd';
import { HashRouter as Router, Routes, Route } from 'react-router-dom'; // Usa Routes invece di Switch
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Tornei from './components/Tornei';
import Store from './components/Store';
import Login from './components/Login'; 

const { Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <Layout style={{ marginLeft: collapsed ? '80px' : '250px' }}>
          <Content style={{ padding: '0px' }}>
            <Routes>
              <Route exact path="/" element={<Home />} />
              <Route path="/tornei" element={<Tornei />} />
              <Route path="/store" element={<Store />} />
              <Route path="/login" element={<Login />} /> {/* Aggiungi la route per la pagina di login */}
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;
