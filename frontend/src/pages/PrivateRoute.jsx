import { Route, Navigate } from 'react-router-dom';

// Componente PrivateRoute per proteggere le rotte
const PrivateRoute = ({ element, roleRequired, ...rest }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role'); // Ruolo dell'utente salvato nel localStorage

  // Se l'utente non è loggato, reindirizza alla pagina di login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Se il ruolo non corrisponde a quello richiesto, reindirizza alla home
  if (role !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  // Se l'utente è loggato e ha il ruolo corretto, mostra l'elemento
  return element;
};

export default PrivateRoute;
