/* eslint-disable no-unused-vars */
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';

// pages
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import PolInformacion from './pages/polInformacion';
import PolParametros from './pages/polParametros';
import PolResultados from './pages/polResultados';
import PowerBIDashboard from './pages/PowerBIDashboard';
import PlanArchivos from './pages/planArchivos';
import PlanResultados from './pages/planResultados';
import Documentacion from './pages/Documentacion';
import PlaneacionDemandaArchivos from './pages/PlaneacionDemanda_archivos';  
import DemandTable from './pages/PlaneacionDemanda_tablas';
import PlaneacionDemanda_clasificacion from './pages/PlaneacionDemanda_clasificacion';
import PlaneacionDemandaConfiguracion from './pages/PlaneacionDemanda_config';
import PlaneacionDemandaResultados from './pages/PlaneacionDemanda_resultados';
import PlaneacionDemanda_histfcst from './pages/PlaneacionDemanda_histfcst';

import GestorDeRoles from './pages/gestorDeRoles';

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
  const location = useLocation();

  useEffect(() => {
    window.history.replaceState(null, '', '/');
  }, [location]);

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
          <Route path="plan-de-reposicion/dashboard" element={<PowerBIDashboard />} />
          <Route path="Documentacion" element={<Documentacion />} />
          <Route path="planeacion-de-demanda/archivos" element={<PlaneacionDemandaArchivos/>} /> 
          <Route path="planeacion-de-demanda/tablas" element={<DemandTable/>} />
          <Route path="planeacion-de-demanda/clasificacion" element={<PlaneacionDemanda_clasificacion/>} />
          <Route path="planeacion-de-demanda/configuracion" element={<PlaneacionDemandaConfiguracion/>} />
          <Route path="planeacion-de-demanda/resultados" element={<PlaneacionDemandaResultados/>} />
          <Route path="planeacion-de-demanda/historico-forecast" element={<PlaneacionDemanda_histfcst/>} />

          <Route path="Gestor-de-roles" element={<GestorDeRoles />} />
          
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
