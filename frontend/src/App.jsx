import React, { useState } from "react";
import { Layout } from "antd";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Usa BrowserRouter
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import Tornei from "./components/Tornei";
import Store from "./components/Store";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import ModificaProfiloPage from "./pages/ModificaProfiloPage";
import ModificaProfilo from "./components/ModificaProfilo";
import AdminDashboard from "./components/AdminDashboard";
import PrivateRoute from "./pages/PrivateRoute";
import GestioneTornei from "./components/GestioneTornei";
import GestioneUtenti from "./components/GestioneUtenti";
import Teams from "./components/Teams";
import TeamDetails from "./components/TeamDetails";
import GestioneGiochi from "./components/GestioneGiochi";
import GestioneAdmin from "./components/GestioneAdmin";

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
                <Route
                  path="/gestione-tornei"
                  element={
                    <PrivateRoute
                      element={<GestioneTornei />}
                      roleRequired="admin"
                    />
                  }
                />
                <Route
                  path="/gestione-giochi"
                  element={
                    <PrivateRoute
                      element={<GestioneGiochi />}
                      roleRequired="admin"
                    />
                  }
                />
                <Route
                  path="/gestione-admin"
                  element={
                    <PrivateRoute
                      element={<GestioneAdmin />}
                      roleRequired="admin"
                    />
                  }
                />
                <Route
                  path="/gestione-utenti"
                  element={
                    <PrivateRoute
                      element={<GestioneUtenti />}
                      roleRequired="admin"
                    />
                  }
                />
                <Route
                  path="/teams"
                  element={
                    <PrivateRoute
                      element={<Teams />}
                      roleRequired="admin"
                    />
                  }
                />
                        <Route path="/teams/:teamId" element={<TeamDetails />} />  {/* Aggiungi questa riga */}

                <Route path="/login" element={<Login />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </>
  );
};

export default App;
