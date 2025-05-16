import React, { useState } from 'react';
import { Box, Button, CircularProgress, TextField, MenuItem } from '@mui/material';
import { useAuth } from './../components/AuthContext';
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // Ícono relacionado al forecast
import axios from 'axios';

const PlaneacionDemandaConfiguracion = () => {
  const { user } = useAuth(); // Obtener las credenciales del usuario
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('prophet'); // Algoritmo seleccionado
  const [loading, setLoading] = useState(false); // Controlar el estado de carga
  const [message, setMessage] = useState(''); // Mensajes de estado o error
  const [parameters, setParameters] = useState({
    minRegistros: 100,
    maxPorcentajeCeros: 0.1,
    periodoAPredecir: 52,
  }); // Parámetros de configuración

  // Cambiar algoritmo seleccionado
  const handleAlgorithmChange = (event) => {
    setSelectedAlgorithm(event.target.value);
    setMessage('');
  };

  // Manejar cambios en los parámetros
  const handleParameterChange = (event) => {
    const { name, value } = event.target;
    setParameters((prev) => ({
      ...prev,
      [name]: name === 'maxPorcentajeCeros' ? parseFloat(value) : parseInt(value, 10),
    }));
  };

  // Ejecutar forecast
  const handleExecuteForecast = async () => {
    setLoading(true);
    setMessage('');
    try {
      console.log('Ejecutando forecast con parámetros:', parameters);
      const response = await axios.post('http://localhost:3000/api/forecast/run', {
        appUser: user.AppUser,
        dbName: user.dbName,
        algorithm: selectedAlgorithm,
        parameters,
      });
      console.log('Respuesta del servidor:', response.data);
      setMessage('Forecast ejecutado correctamente.');
    } catch (error) {
      console.error('Error al ejecutar el forecast:', error);
      setMessage('Error al ejecutar el forecast. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '80vh',
        width: '80%',
        margin: '0 auto', // Centrar horizontalmente
        padding: '20px',
        borderRadius: '10px', // Bordes redondeados
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Sombra para diseño
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f9f9f9',
      }}
    >
      <h1>Planeación de Demanda - Configurar Forecast</h1>

      {/* Selector de Algoritmo */}
      <TextField
        label="Elegir Algoritmo"
        select
        value={selectedAlgorithm}
        onChange={handleAlgorithmChange}
        fullWidth
        sx={{ marginBottom: '20px' }}
      >
        <MenuItem value="prophet">Prophet</MenuItem>
        {/* Opciones futuras */}
        <MenuItem value="otro">Otro Algoritmo (futuro)</MenuItem>
      </TextField>

      {/* Parámetros del Forecast */}
      <TextField
        label="Mínimo de Registros"
        type="number"
        name="minRegistros"
        value={parameters.minRegistros}
        onChange={handleParameterChange}
        variant="outlined"
        fullWidth
        sx={{ marginBottom: '20px' }}
      />
      <TextField
        label="Máximo Porcentaje de Ceros"
        type="number"
        name="maxPorcentajeCeros"
        value={parameters.maxPorcentajeCeros}
        onChange={handleParameterChange}
        inputProps={{ step: '0.01' }}
        variant="outlined"
        fullWidth
        sx={{ marginBottom: '20px' }}
      />
      <TextField
        label="Período a Predecir"
        type="number"
        name="periodoAPredecir"
        value={parameters.periodoAPredecir}
        onChange={handleParameterChange}
        variant="outlined"
        fullWidth
        sx={{ marginBottom: '20px' }}
      />

      {/* Botón de ejecución */}
      <Button
        variant="contained"
        onClick={handleExecuteForecast}
        disabled={loading}
        sx={{
          padding: '16px 30px', // Espaciado interno
          border: 'none', // Sin bordes
          borderRadius: '10px', // Bordes redondeados
          fontWeight: '600', // Texto en negrita
          color: 'white', // Texto blanco
          fontSize: '1.1em', // Tamaño de fuente más grande
          backgroundColor: '#2196f3', // Azul oscuro Opti
          cursor: 'pointer',
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.2)', // Sombra
          transition: 'background-color 0.3s ease-in-out, transform 0.2s', // Animación al pasar el mouse
          '&:hover': {
            backgroundColor: '#014A8F', // Azul más claro
            transform: 'scale(1.05)', // Efecto de escala
          },
          '&:disabled': {
            backgroundColor: '#8a9aa3', // Gris para estado deshabilitado
            cursor: 'not-allowed',
          },
        }}
        startIcon={<TrendingUpIcon />} // Icono antes del texto
      >
        Ejecutar Forecast
      </Button>
      {loading && <CircularProgress sx={{ marginLeft: '20px' }} />}
      {message && (
        <p style={{ marginTop: '20px', color: loading ? 'blue' : 'green' }}>{message}</p>
      )}
    </Box>
  );
};

export default PlaneacionDemandaConfiguracion;
