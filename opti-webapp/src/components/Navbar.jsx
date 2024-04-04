import React, { useState } from 'react';
import './../styles/navbar.css'; // Make sure to create a corresponding CSS file


const NavbarItem = ({ label, children }) => {
    const [isOpen, setIsOpen] = useState(false);
  
    const toggleOpen = () => setIsOpen(!isOpen);
  
    return (
      <>
        <li className="navbar-item" onClick={toggleOpen}>
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


const Navbar = () => {
  return (
    <nav className="navbar">
        <div className="navbar-header">
          <h1>BTC OPTI</h1>
        </div>
        <ul className="navbar-menu">
          <NavbarItem label="Home"/>
          <NavbarItem label="Políticas de inventario">
            <ul className="navbar-dropdown">
              <li className="dropdown-item">1. Información</li>
              <li className="dropdown-item">2. Parámetros</li>
              <li className="dropdown-item">3. Resultados</li>
            </ul>
          </NavbarItem>
          <NavbarItem label="Plan de reposición">
            <ul className="navbar-dropdown">
              <li className="dropdown-item">1. Archivos</li>
              <li className="dropdown-item">2. Resultados</li>
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



