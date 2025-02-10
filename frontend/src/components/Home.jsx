import React, { useEffect, useState } from "react";
import { Card, Button, Row, Col, Empty, Badge, Input } from "antd";
import axios from "axios";
import { CalendarOutlined } from "@ant-design/icons"; // Importa l'icona
import debounce from "lodash.debounce"; // Importa il debounce

const { Meta } = Card;

const Home = () => {
  const [tornei, setTornei] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Stato per la ricerca
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    axios
      .get(`${apiUrl}/api/tournaments`)
      .then((response) => {
        console.log(response.data); // Verifica i dati ricevuti
        setTornei(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("C'è stato un errore nel recupero dei tornei:", error);
        setLoading(false);
      });
  }, []);

  // Funzione debounce per gestire la ricerca
  const handleSearchChange = debounce((value) => {
    setSearchTerm(value);
  }, 100); // Ritarda di 500ms prima di aggiornare lo stato



  const currentDate = new Date();
  const fiveDaysAgo = new Date(currentDate);
  fiveDaysAgo.setDate(currentDate.getDate() - 5);
  const futureTornei = [];
  const inCorsoTornei = [];
  const passatiTornei = [];

  // Assicurati che `tornei` sia un array prima di eseguire il ciclo
if (Array.isArray(tornei)) {
  tornei.forEach((torneo) => {
    // Assicurati che `torneo.data` sia una data valida
    const torneoDate = new Date(torneo.data);

    // Verifica che la data del torneo sia valida
    if (isNaN(torneoDate)) {
      console.error(`Data del torneo non valida: ${torneo.data}`);
      return; // Salta questo torneo se la data non è valida
    }

    // Confronta le date
    if (torneoDate > currentDate) {
      futureTornei.push(torneo); // Tornei futuri
    } else if (torneoDate >= fiveDaysAgo) {
      inCorsoTornei.push(torneo); // Tornei in corso
    } else {
      passatiTornei.push(torneo); // Tornei passati
    }
  });
} else {
  console.error('tornei non è un array valido:', tornei);
}


  const getDaysRemaining = (torneoDate) => {
    const diffTime = torneoDate - currentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTimeRemaining = (torneoDate) => {
    const endOfDay = new Date(torneoDate);
    endOfDay.setHours(23, 59, 59, 999); // Imposta l'ora alla fine della giornata

    const diffTime = endOfDay - currentDate;
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMinutes}m`;
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
          padding: "50px 20px",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ fontSize: 32, color: "white", fontWeight: "800" }}>
          Home
        </h1>
        {/* Barra di ricerca visibile solo su desktop */}
        <div style={{ display:"none", marginBottom: "20px" }}>
          <Input
            placeholder="Cerca tornei"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: "300px",
              marginBottom: "20px",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          />
        </div>

        <Row gutter={16} style={{ marginBottom: "40px" }}>
          {/* Tornei in corso */}
          <Col span={24} md={12}>
            <div
              style={{
                background: "#0F0E17", // Colore di sfondo personalizzato
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Ombra
                padding: "20px", // Aggiungi padding per distanziare il contenuto dal bordo
                borderRadius: "8px", // Per arrotondare gli angoli
                border: "0.8px solid #493473",
              }}
            >
              <h2
                style={{
                  color: "white",
                  textAlign: "left",
                  marginBottom: "20px",
                  fontSize: 28,
                  marginLeft: 5,
                  fontWeight: "700",
                }}
              >
                Tornei in corso ({inCorsoTornei.length})
              </h2>
              <Row gutter={16}>
                {loading ? (
                  <p>Loading tornei...</p>
                ) : inCorsoTornei.length > 0 ? (
                  inCorsoTornei.map((torneo) => (
                    <Col span={24} sm={12} md={18} lg={12} key={torneo.id}>
                      <Card
                        hoverable
                        style={{ marginBottom: "20px" }}
                        cover={
                          <img
                            alt={torneo.titolo}
                            src={torneo.image}
                            style={{ height: "200px", objectFit: "cover" }}
                          />
                        }
                      >
                        {/* Badge sopra l'immagine */}
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            backgroundColor: "#ff4d4f",
                            color: "white",
                            padding: "5px 10px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                          }}
                        >
                          {`Scade tra ${getTimeRemaining(
                            new Date(torneo.data)
                          )}`}
                        </div>
                        <Meta
                          title={
                            <h3
                              style={{
                                fontWeight: "700",
                                fontSize: "18px",
                                color: "#282828",
                              }}
                            >
                              {torneo.titolo}
                            </h3>
                          }
                          description={
                            <Badge
                              count={`Modalità: ${torneo.modalita}`}
                              style={{
                                backgroundColor: "#282828", // Colore del badge (puoi cambiarlo)
                                color: "white", // Colore del testo
                                padding: "12px", // Padding per fare un po' di spazio attorno al testo
                                display: "flex",
                                marginTop: -20,
                                justifyContent: "center",
                                alignItems: "center",
                                borderRadius: "6px", // Per rendere gli angoli arrotondati
                                fontSize: "14px", // Regola la dimensione del font
                              }}
                            />
                          }
                        />
                        <p style={{ marginTop: 15 }}>
                          <CalendarOutlined style={{ fontSize: 18 }} />{" "}
                          {new Date(torneo.data).toLocaleDateString()}
                        </p>

                        <Button
                          type="primary"
                          disabled={
                            new Date(torneo.data).toLocaleDateString() !==
                            currentDate.toLocaleDateString()
                          }
                        >
                          {new Date(torneo.data).toLocaleDateString() ===
                          currentDate.toLocaleDateString()
                            ? `Partecipa`
                            : `Mancano ${getDaysRemaining(
                                new Date(torneo.data)
                              )} giorni`}
                        </Button>
                      </Card>
                    </Col>
                  ))
                ) : (
                  <Empty
                    description={
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#fff",
                          textAlign: "center",
                        }}
                      >
                        Non ci sono tornei in corso
                      </div>
                    }
                  />
                )}
              </Row>
            </div>
          </Col>

          {/* Tornei a breve */}
          <Col span={24} md={12}>
            <div
              style={{
                background: "#0F0E17", // Colore di sfondo personalizzato
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Ombra
                padding: "20px", // Aggiungi padding per distanziare il contenuto dal bordo
                borderRadius: "8px", // Per arrotondare gli angoli
                border: "0.8px solid #493473",
              }}
            >
              <h2
                style={{
                  color: "white",
                  textAlign: "left",
                  marginBottom: "20px",
                  fontSize: 28,
                  marginLeft: 5,
                  fontWeight: "700",
                }}
              >
                Tornei a breve ({futureTornei.length})
              </h2>
              <Row gutter={16}>
                {futureTornei.length > 0 ? (
                  futureTornei.map((torneo) => (
                    <Col span={24} sm={12} md={18} lg={12} key={torneo.id}>
                      <Card
                        hoverable
                        style={{ marginBottom: "20px" }}
                        cover={
                          <img
                            alt={torneo.titolo}
                            src={torneo.image}
                            style={{ height: "200px", objectFit: "cover" }}
                          />
                        }
                      >
                        <Meta
                          title={
                            <h3
                              style={{
                                fontWeight: "700",
                                fontSize: "18px",
                                color: "#282828",
                              }}
                            >
                              {torneo.titolo}
                            </h3>
                          }
                          description={
                            <p style={{ color: "#282828", fontSize: "16px" }}>
                              Modalità: {torneo.modalita}
                            </p>
                          }
                        />
                        <p>
                          <CalendarOutlined style={{ fontSize: 18 }} />{" "}
                          {new Date(torneo.data).toLocaleDateString()}
                        </p>
                        <Button
                          type="primary"
                          disabled={
                            new Date(torneo.data).toLocaleDateString() !==
                            currentDate.toLocaleDateString()
                          }
                        >
                          {new Date(torneo.data).toLocaleDateString() ===
                          currentDate.toLocaleDateString()
                            ? "Partecipa"
                            : `Mancano ${getDaysRemaining(
                                new Date(torneo.data)
                              )} giorni`}
                        </Button>
                      </Card>
                    </Col>
                  ))
                ) : (
                  <Empty description="Non ci sono tornei a breve" />
                )}
              </Row>
            </div>
          </Col>
        </Row>

        {/* Carosello di loghi */}
        <h2
          style={{
            color: "white",
            textAlign: "left",
            marginBottom: "60px",
            fontSize: 34,
            marginLeft: 5,
            fontWeight: "700",
          }}
        >
          Giochi
        </h2>
        <div style={{ overflow: "hidden", width: "100%" }}>
          <div
            style={{
              display: "flex",
              animation: "scroll 18s linear infinite",
            }}
          >
            <img
              src="https://cdn2.steamgriddb.com/logo_thumb/db6d9e1beb13d90e4a67706afb39e4e8.png"
              alt="Logo 1"
              style={{ height: "50px", marginRight: "100px" }}
            />
            <img
              src="https://www.stormforcegaming.co.uk/wp-content/uploads/2024/04/FortniteLogo-wht.png"
              alt="Logo 2"
              style={{ height: "50px", marginRight: "100px" }}
            />
            <img
              src="https://fifauteam.com/images/fc25/logo/long-white.webp"
              alt="Logo 3"
              style={{ height: "50px", marginRight: "100px" }}
            />
            <img
              src="https://logos-world.net/wp-content/uploads/2020/12/Dota-2-Logo.png"
              alt="Logo 4"
              style={{ height: "50px", marginRight: "100px" }}
            />
            <img
              src="https://freepnglogo.com/images/all_img/1706273096valorant-logo-png-white.png"
              alt="Logo 5"
              style={{ height: "50px", marginRight: "100px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
