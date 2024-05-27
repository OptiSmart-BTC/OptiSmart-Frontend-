/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock } from 'react-icons/fi';
import { useAuth } from './../components/AuthContext';

import './../styles/pages/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'BTC1' && password === 'BTC-OPTI') {
      login(username);
      navigate('/');
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  };

  useEffect(() => {
    if (isLoading) {
      return <div>Cargando...</div>;
    }

    if (isAuthenticated) {
      navigate('/');
    }
  });

  return (
    <div className="login-wrapper">
      <img src="/images/logoBTC.png" alt="Logo BTC" className="logo-btc" />
      <div className="login-background"></div>
      {/* Bienvenido a BTC OPTI*/}
      <div className="welcome-text">Bienvenido a BTC OPTI</div>
      <form onSubmit={handleSubmit} className="login-form">
        <h2>INICIO DE SESIÓN</h2>
        <div className="input-field">
          <FiUser className="input-icon" />
          <input
            id="username"
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="input-field">
          <FiLock className="input-icon" />
          <input
            id="password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="checkbox-container">
          <input type="checkbox" id="remember-me" />
          <label htmlFor="remember-me">Recordarme</label>
        </div>
        <button type="submit" className="login-button">Login</button>
        <a href="/recover" className="recover">Recuperar contraseña?</a>
      </form>
    </div>
  );
}

export default Login;
