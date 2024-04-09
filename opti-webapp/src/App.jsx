/* eslint-disable no-unused-vars */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Grid from '@mui/material/Unstable_Grid2';

// pages
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';
import PolInformacion from './pages/polInformacion';
import PolParametros from './pages/polParametros';
import PolResultados from './pages/polResultados';
import PlanArchivos from './pages/planArchivos';
import PlanResultados from './pages/planResultados';

// components
import NavbarLayout from './components/NavbarLayout';

import './App.css';

// verificar autenticacion
const ProtectedRoutes = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Outlet /> : <Navigate replace to="/login" />;
};

// rutas de la aplicacion
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<NavbarLayout />}>
          <Route index element={<Welcome />} />
          <Route path="politicas-de-inventario/informacion" element={<PolInformacion />} />
          <Route path="politicas-de-inventario/parametros" element={<PolParametros />} />
          <Route path="politicas-de-inventario/resultados" element={<PolResultados />} />
          <Route path="plan-de-reposicion/archivos" element={<PlanArchivos />} />
          <Route path="plan-de-reposicion/resultados" element={<PlanResultados />} />
        </Route>
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;