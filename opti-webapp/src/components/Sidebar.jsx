<<<<<<< HEAD
=======
// components/Sidebar.js
>>>>>>> origin/frontendtest
import React from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './../styles/components/Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <nav>
        <ul>
          <li><NavLink to="/" end>Inicio</NavLink></li>
          <li><NavLink to="/politicas-de-inventario/informacion">Información de Políticas</NavLink></li>
          <li><NavLink to="/politicas-de-inventario/parametros">Parámetros de Políticas</NavLink></li>
          <li><NavLink to="/politicas-de-inventario/resultados">Resultados de Políticas</NavLink></li>
<<<<<<< HEAD
          <li><NavLink to="/plan-de-reposicion/archivos">Archivos de Reposición</NavLink></li>
          <li><NavLink to="/plan-de-reposicion/resultados">Resultados de Reposición</NavLink></li>
          <li><NavLink to="/Documentacion">Documentación</NavLink></li>
          <li><NavLink to="/planeacion-demanda/archivos">Archivos de Demanda</NavLink></li> 
          <li><NavLink to="/planeacion-demanda/tablas">Tablas de Demanda</NavLink></li>
          <li><NavLink to="/planeacion-demanda/clasificacion">Clasificacion de Demanda</NavLink></li>
          <li><NavLink to="/planeacion-demanda/configuracion">Configuracion de forecast Demanda</NavLink></li>
          <li><NavLink to="/planeacion-demanda/resultados">Resultados forecast Demanda</NavLink></li>
          <li><NavLink to="/planeacion-demanda/historico-forecast">Historia de Forecast</NavLink></li>
=======
          
          <li><NavLink to="/plan-de-reposicion/archivos">Archivos de Reposición</NavLink></li>
          <li><NavLink to="/plan-de-reposicion/resultados">Resultados de Reposición</NavLink></li>
          <li><NavLink to="/plan-de-reposicion/dashboard">Dashboard Power BI</NavLink></li> {/* Nuevo enlace */}

          <li><NavLink to="/Documentacion">Documentación</NavLink></li>
>>>>>>> origin/frontendtest
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
<<<<<<< HEAD

=======
>>>>>>> origin/frontendtest
