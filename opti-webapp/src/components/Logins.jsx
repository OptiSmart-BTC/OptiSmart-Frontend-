import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Logins() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Verifica las credenciales hardcodeadas
    if (username === 'BTC1' && password === 'BTC-OPTI') {
      navigate('/bienvenida'); // Redirige a la página de Bienvenida
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Usuario:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <label>Contraseña:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
}

export default Logins;
