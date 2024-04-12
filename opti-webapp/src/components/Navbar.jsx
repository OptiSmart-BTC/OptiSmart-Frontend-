/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import './../styles/navbar.css';
import e from 'cors';


const NavbarItem = ({ label, children, path, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate(); 
  
    const toggleOpen = () => setIsOpen(!isOpen);

    const handleNavigation = () => {
      if (path) {
          navigate(path);
      }
    };

    if(className === 'activeParent' && !isOpen) {
      className = 'active';
    } else if(className != 'active'){
      className = '';
    }

  
    return (
      <>
        <li className={`navbar-item ${className}`} onClick={() => { toggleOpen(); handleNavigation(); }}>
          {label}
          {children && (
            <svg className={`arrow-icon ${isOpen ? 'open' : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </li>
        {isOpen && children}
      </>
    );
};

const DropdownItem = ({ label, path, className }) => {
  const navigate = useNavigate();

  const handleDropdownNavigation = () => {
      if (path) {
          navigate(path);
      }
  };

  return (
      <li className={`dropdown-item ${className}`} onClick={handleDropdownNavigation}>
          {label}
      </li>
  );
};


const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const isActiveParent = (path) => {
    return location.pathname.includes(path);
  }


  return (
    <nav className="navbar">
        <div className="navbar-header">
          {/*<h1>BTC OPTI</h1>*/}
          <img src="/images/Opti_Smart_Blanco.png" alt="BTC Opti" className='headerLogo'/>
        </div>
        
        <ul className="navbar-menu">
          <NavbarItem label="Home" path="/" className={isActive('/') ? 'active' : ''}/>
          <NavbarItem label="Políticas de inventario" className={isActiveParent('/politicas-de-inventario') ? 'activeParent' : ''}>
            <ul className="navbar-dropdown">
              <DropdownItem label="1. Información" path="/politicas-de-inventario/informacion" className={isActive('/politicas-de-inventario/informacion') ? 'active' : ''}/>
              <DropdownItem label="2. Parámetros" path="/politicas-de-inventario/parametros" className={isActive('/politicas-de-inventario/parametros') ? 'active' : ''}/>
              <DropdownItem label="3. Resultados" path="/politicas-de-inventario/resultados" className={isActive('/politicas-de-inventario/resultados') ? 'active' : ''}/>
            </ul>
          </NavbarItem>
          <NavbarItem label="Plan de reposición" className={isActiveParent('/plan-de-reposicion') ? 'activeParent' : ''}>
            <ul className="navbar-dropdown">
              <DropdownItem label="1. Archivos" path="/plan-de-reposicion/archivos" className={isActive('/plan-de-reposicion/archivos') ? 'active' : ''}/>
              <DropdownItem label="2. Resultados" path="/plan-de-reposicion/resultados" className={isActive('/plan-de-reposicion/resultados') ? 'active' : ''}/>
            </ul>
          </NavbarItem>
        </ul>

        <div className="navbar-footer">
          <div className="navbar-documentacion">
            <svg className="navbar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
                Documentación
          </div>
          <div className="navbar-perfil">
            <svg className="navbar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
                Perfil
          </div>
        </div>

    </nav>
  );
};

export default Navbar;



