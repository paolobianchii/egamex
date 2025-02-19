import React, { useState } from "react";
import { Layout } from "antd";
import { HashRouter as Router, Routes, Route } from "react-router-dom"; // Usa Routes invece di Switch
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import Tornei from "./components/Tornei";
import Store from "./components/Store";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import ModificaProfiloPage from "./pages/ModificaProfiloPage";
import ModificaProfilo from "./pages/ModificaProfilo";
import AdminDashboard from "./components/AdminDashboard";
import PrivateRoute from "./pages/PrivateRoute";

const { Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Router>
        <Layout style={{ minHeight: "100vh" }}>
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <Navbar />
          <Layout style={{ marginLeft: collapsed ? "80px" : "250px" }}>
            <Content>
              <Routes>
                <Route exact path="/" element={<Home />} />
                <Route path="/tornei" element={<Tornei />} />
                <Route path="/store" element={<Store />} />
                <Route path="/edit" element={<ModificaProfilo />} />
                <Route
                  path="/adminDashboard"
                  element={
                    <PrivateRoute
                      element={<AdminDashboard />}
                      roleRequired="admin"
                    />
                  }
                />
                <Route path="/login" element={<Login />} />{" "}
                {/* Aggiungi la route per la pagina di login */}
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </>
  );
};

export default App;
