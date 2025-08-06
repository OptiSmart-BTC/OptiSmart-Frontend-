// pages/UsoPoliticaGuardada.jsx
import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  TextField,
} from '@mui/material';
import Spinner from '../components/Spinner';
import '../styles/pages/UsoPoliticaGuardada.css';

const UsoPoliticaGuardada = () => {
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const appUser = userData.userName;
  const appPass = userData.password;
  const DBName = userData.dbName || appUser;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [politicas, setPoliticas] = useState([]);
  const [politicaSeleccionada, setPoliticaSeleccionada] = useState('');
  const [opcion, setOpcion] = useState('modificar'); // Cambiar valor por defecto
  const [comentario, setComentario] = useState('');

  // Validar credenciales al cargar el componente
  useEffect(() => {
    console.log('[DEBUG] userData:', userData);
    console.log('[DEBUG] Credenciales:', { 
      appUser: appUser ? 'presente' : 'ausente',
      appPass: appPass ? 'presente' : 'ausente',
      DBName: DBName ? 'presente' : 'ausente'
    });
    
    if (!appUser || !appPass || !DBName) {
      setError('Faltan credenciales de usuario. Por favor, inicia sesión nuevamente.');
      return;
    }
  }, [appUser, appPass, DBName]);

  // Cargar políticas
  useEffect(() => {
    const fetchPoliticas = async () => {
      // No hacer la llamada si faltan credenciales
      if (!appUser || !appPass || !DBName) {
        console.warn('[ADVERTENCIA] No se pueden cargar políticas sin credenciales completas');
        return;
      }

      try {
        setLoading(true);
        setError(''); // Limpiar errores previos
        
        console.log('[DEBUG] Enviando solicitud con:', { appUser, DBName });
        
        const res = await fetch(`${import.meta.env.VITE_API_URL}/getPoliticasGuardadas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appUser, appPass, DBName }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Error HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log('[DEBUG] Políticas recibidas:', data);
        
        if (Array.isArray(data)) {
          setPoliticas(data);
        } else {
          console.error('[ERROR] Respuesta no es un array:', data);
          setError('Formato de respuesta inválido del servidor');
        }
        
      } catch (err) {
        console.error('[ERROR] Fallo al cargar políticas:', err);
        setError(`Error al cargar políticas guardadas: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPoliticas();
  }, [appUser, appPass, DBName]);

  const handleEjecutar = async () => {
    if (!politicaSeleccionada) {
      setError('Selecciona una política');
      return;
    }

    // Validar credenciales antes de ejecutar
    if (!appUser || !appPass || !DBName) {
      setError('Faltan credenciales de usuario');
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('[DEBUG] Ejecutando con:', {
        idPolitica: politicaSeleccionada,
        modoUso: opcion,
        comentario: comentario || 'Sin comentario'
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/runUsoPoliticaGuardada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appUser,
          appPass,
          DBName,
          idPolitica: politicaSeleccionada,
          modoUso: opcion, // Usar directamente el valor del radio
          comentario: comentario || 'Sin comentario',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error HTTP ${res.status}`);
      }

      alert('Proceso ejecutado correctamente');
      
    } catch (err) {
      console.error('[ERROR] Fallo al ejecutar política:', err);
      setError(`Error al ejecutar política: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar mensaje si faltan credenciales
  if (!appUser || !appPass || !DBName) {
    return (
      <div className="usoPolitica">
        <h1 className="titulo">Uso de Política Guardada</h1>
        <div className="container">
          <div className="error">
            No se encontraron credenciales válidas. Por favor, inicia sesión nuevamente.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="usoPolitica">
      {loading && (
        <div className="spinner-overlay">
          <Spinner />
        </div>
      )}

      <h1 className="titulo">Uso de Política Guardada</h1>

      <div className="container">
        {error && <div className="error">{error}</div>}

        <div className="selector-politica">
          <FormControl fullWidth variant="outlined">
            <InputLabel id="politica-label">Seleccionar Política Guardada</InputLabel>
            <Select
              labelId="politica-label"
              id="politica"
              value={politicaSeleccionada}
              onChange={(e) => setPoliticaSeleccionada(e.target.value)}
              label="Seleccionar Política Guardada"
              disabled={loading || politicas.length === 0}
            >
              {politicas.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.comentario || 'Sin comentario'} — {p.fecha ? p.fecha.split('T')[0] : 'sin fecha'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {politicas.length === 0 && !loading && (
            <div style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
              No se encontraron políticas guardadas
            </div>
          )}
        </div>

        <div className="radio-group">
          <RadioGroup value={opcion} onChange={(e) => setOpcion(e.target.value)}>
            <FormControlLabel
              value="modificar"
              control={<Radio />}
              label="Realizar cambios a política"
            />
            <FormControlLabel
              value="restaurar"
              control={<Radio />}
              label="Usar directamente la política seleccionada"
            />
          </RadioGroup>
        </div>

        <TextField
          label="Comentario (opcional)"
          fullWidth
          variant="outlined"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          margin="normal"
        />

        <div className="button-info">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleEjecutar}
            disabled={!politicaSeleccionada || loading}
          >
            Ejecutar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UsoPoliticaGuardada;