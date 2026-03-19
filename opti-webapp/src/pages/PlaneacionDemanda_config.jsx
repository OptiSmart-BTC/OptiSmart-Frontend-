// eslint-disable-next-line no-unused-vars
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Paper,
  Typography,
  Grid,
  Divider,
} from '@mui/material';
import { useAuth } from './../components/AuthContext';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axios from 'axios';

import TablaPlaneacionDemanda_ModelosManual from './PlaneacionDemanda_TablaModelosManual';

const PlaneacionDemandaConfiguracion = () => {
  const { user } = useAuth();

  const [selectedAlgorithm, setSelectedAlgorithm] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [parameters, setParameters] = useState({
    minRegistros: 100,
    maxPorcentajeCeros: 0.1,
    periodoAPredecir: 52,
  });

  const [dfuRows, setDfuRows] = useState([]);
  const [loadingDfus, setLoadingDfus] = useState(false);
  const [dfuMessage, setDfuMessage] = useState('');

  const availableModels = useMemo(() => (['prophet', 'croston', 'tsb', 'arima']), []);
  const apiBase = 'http://localhost:3000';

  const handleAlgorithmChange = (event) => {
    setSelectedAlgorithm(event.target.value);
    setMessage('');
    setDfuMessage('');
  };

  const handleParameterChange = (event) => {
    const { name, value } = event.target;
    setParameters((prev) => ({
      ...prev,
      [name]: name === 'maxPorcentajeCeros' ? parseFloat(value) : parseInt(value, 10),
    }));
  };

  const paramsAreValid = () => {
    const { minRegistros, maxPorcentajeCeros, periodoAPredecir } = parameters;
    return (
      minRegistros > 0 &&
      maxPorcentajeCeros >= 0 &&
      maxPorcentajeCeros <= 1 &&
      periodoAPredecir > 0
    );
  };

  useEffect(() => {
    const shouldLoad = selectedAlgorithm === 'manual' && paramsAreValid();
    if (!shouldLoad) return;

    fetchManualDfus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlgorithm, parameters.minRegistros, parameters.maxPorcentajeCeros]);

  const fetchManualDfus = async () => {
    setLoadingDfus(true);
    setDfuMessage('');
    try {
      const response = await axios.get(`${apiBase}/api/forecast/manual/dfus`, {
        params: {
          appUser: user.AppUser,
          dbName: user.dbName,
          minRegistros: parameters.minRegistros,
          maxPorcentajeCeros: parameters.maxPorcentajeCeros,
        },
      });

      const rows = response.data?.rows || [];

      const normalized = rows.map((r) => {
        const modelo = (r.Modelo || r.selected_model || (r.recommended_models?.[0] ?? '') || '')
          .toString()
          .toLowerCase();

        return {
          ...r,
          Modelo: availableModels.includes(modelo) ? modelo : 'prophet',
          Category: r.Category ?? r.Categoria ?? null,
          Categoria: r.Categoria ?? r.Category ?? null,
        };
      });

      setDfuRows(normalized);
      setDfuMessage(`DFUs cargados: ${normalized.length}`);
    } catch (error) {
      console.error('Error al cargar DFUs manuales:', error);
      setDfuRows([]);
      setDfuMessage('Error al cargar DFUs. Revisa consola.');
    } finally {
      setLoadingDfus(false);
    }
  };

  const handleExecuteForecast = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post(`${apiBase}/api/forecast/run`, {
        appUser: user.AppUser,
        dbName: user.dbName,
        algorithm: selectedAlgorithm,
        parameters,
      });
      console.log('Respuesta del servidor:', response.data);
      setMessage(`Forecast ejecutado correctamente. (modo: ${selectedAlgorithm})`);
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
        //minHeight: 'calc(100vh - 64px)',
        backgroundColor: '#f5f7fb',
        p: 3,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
          Planeación de Demanda - Configurar Forecast
        </Typography>

        {/* CARD 1: Configuración */}
        <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Configuración
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Modo"
                select
                value={selectedAlgorithm}
                onChange={handleAlgorithmChange}
                fullWidth
              >
                <MenuItem value="auto">Automático</MenuItem>
                <MenuItem value="manual">Selección Manual</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Mínimo de Registros"
                type="number"
                name="minRegistros"
                value={parameters.minRegistros}
                onChange={handleParameterChange}
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Máximo Porcentaje de Ceros"
                type="number"
                name="maxPorcentajeCeros"
                value={parameters.maxPorcentajeCeros}
                onChange={handleParameterChange}
                inputProps={{ step: '0.01' }}
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Período a Predecir"
                type="number"
                name="periodoAPredecir"
                value={parameters.periodoAPredecir}
                onChange={handleParameterChange}
                variant="outlined"
                fullWidth
              />
            </Grid>
          </Grid>
        </Paper>

        {/* CARD 2: Manual DFUs */}
        {selectedAlgorithm === 'manual' && (
          <Paper
            sx={{
              mt: 2.5,
              p: 2.5,
              borderRadius: 3,
              boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Selección de Modelos por DFU
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Cambia el modelo por DFU y se guardará en <b>selected_model</b>.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={fetchManualDfus}
                  disabled={loadingDfus || !paramsAreValid()}
                >
                  {loadingDfus ? 'Cargando...' : 'Recargar DFUs'}
                </Button>
                {loadingDfus && <CircularProgress size={20} />}
              </Box>
            </Box>

            {dfuMessage && (
              <Typography sx={{ mt: 1.5, color: '#012652', fontWeight: 700 }}>
                {dfuMessage}
              </Typography>
            )}

            <Box sx={{ mt: 2 }}>
              <TablaPlaneacionDemanda_ModelosManual
                data={dfuRows}
                allowedModels={availableModels}
                maxHeight={420}
                rowsPerPageOptions={[15, 25, 50]}
                onModelChange={async (row, newModelLower) => {
                  await axios.put(`${apiBase}/api/forecast/manual/selected-model`, {
                    appUser: user.AppUser,
                    dbName: user.dbName,
                    Producto: row.Producto,
                    Canal: row.Canal,
                    Ubicacion: row.Ubicacion,
                    selected_model: newModelLower,
                  });

                  setDfuRows((prev) =>
                    prev.map((x) =>
                      x.Producto === row.Producto &&
                      x.Canal === row.Canal &&
                      x.Ubicacion === row.Ubicacion
                        ? { ...x, Modelo: newModelLower, selected_model: newModelLower }
                        : x
                    )
                  );

                  setDfuMessage(`Guardado: ${row.Producto}|${row.Canal}|${row.Ubicacion} -> ${newModelLower}`);
                }}
              />
            </Box>
          </Paper>
        )}

        {/* CARD 3: Ejecutar */}
        <Paper
          sx={{
            mt: 2.5,
            p: 2.5,
            borderRadius: 3,
            boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleExecuteForecast}
              disabled={loading || (selectedAlgorithm === 'manual' && loadingDfus)}
              startIcon={<TrendingUpIcon />}
              sx={{
                padding: '14px 26px',
                borderRadius: 2,
                fontWeight: 800,
                backgroundColor: '#2196f3',
                '&:hover': { backgroundColor: '#014A8F' },
              }}
            >
              Ejecutar Forecast
            </Button>

            {loading && <CircularProgress size={22} />}
            {message && (
              <Typography sx={{ color: loading ? 'info.main' : 'success.main', fontWeight: 700 }}>
                {message}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default PlaneacionDemandaConfiguracion;
