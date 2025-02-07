import React from 'react';

const MainContent = () => {
  return (
    <div
      style={{
        padding: '24px',
        minHeight: '360px',
        backgroundColor: '#f0f2f5', // Aggiungi uno sfondo leggero per l'area del contenuto
        borderRadius: '8px',
        boxSizing: 'border-box',
        transition: 'padding 0.3s ease', // Aggiungi una transizione per un layout fluido
      }}
    >
      <h2
        style={{
          fontSize: '24px',
          marginBottom: '16px',
          textAlign: 'center',
          color: '#333',
          transition: 'font-size 0.3s ease', // Transizione anche per il font-size
        }}
      >
        Contenuto principale
      </h2>
      <p
        style={{
          fontSize: '16px',
          lineHeight: '1.5',
          color: '#666',
          transition: 'font-size 0.3s ease', // Transizione per il font-size
        }}
      >
        Qui puoi aggiungere il contenuto dinamico per ogni sezione della tua pagina.
      </p>
    </div>
  );
};

export default MainContent;
