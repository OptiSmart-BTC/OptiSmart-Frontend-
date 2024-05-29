/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock } from 'react-icons/fi';
import { useAuth } from './../components/AuthContext';

import './../styles/pages/Login.css';

function Login() {
  const [username, setUsername] = useState('Usuario');
  const [password, setPassword] = useState('Pass');

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
      <img src="/images/Opti_Smart_Blanco.png" alt="Logo BTC" className="logo-btc" />
      <div className="login-background"></div>
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className='titulo'>INICIO DE SESIÓN</h2>
        <div className='inputs'>
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
          <a href="/recover" className="recover">Recuperar contraseña?</a>
        </div>
        <div className="checkbox-container">
          <input type="checkbox" id="remember-me" />
          <label htmlFor="remember-me">Recordarme</label>
        </div>
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
}

export default Login;
