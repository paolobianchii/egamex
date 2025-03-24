import React from 'react'

function MarqueeGiochi() {
  return (
    <div>
      {/* Carosello di loghi */}
      <h2
          style={{
            color: "white",
            textAlign: "left",
            marginBottom: "20px",
            fontSize: 34,
            marginLeft: 5,
            fontWeight: "700",
          }}
        >
          Giochi
        </h2>
        <div
          style={{
            background: "rgba(15, 14, 23, 0.1)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <div style={{ overflow: "hidden", width: "100%" }}>
            <div
              style={{
                display: "flex",
                animation: "scroll 10s linear infinite",
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

              {/* Duplica il contenuto per far sembrare che l'animazione sia infinita */}
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
  )
}

export default MarqueeGiochi
