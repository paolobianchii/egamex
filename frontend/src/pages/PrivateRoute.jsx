import { Route, Navigate } from 'react-router-dom';

const PrivateRoute = ({ element, roleRequired }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role'); 

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  return element; // Rende l'elemento passata come prop
};

export default PrivateRoute;
