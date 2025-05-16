import React, { useState, useEffect } from 'react';
import { Box, TextField, MenuItem, CircularProgress, Typography } from '@mui/material';
import Plot from 'react-plotly.js';
import { DataGrid, GridToolbar } from '@mui/x-data-grid'; // Importamos GridToolbar para exportación
import { useAuth } from './../components/AuthContext';
import axios from 'axios';

const PlaneacionDemandaResultados = () => {
  const { user } = useAuth();
  const [combinations, setCombinations] = useState([]);
  const [selectedCombination, setSelectedCombination] = useState('');
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState([]);

  useEffect(() => {
    const fetchCombinations = async () => {
      if (!user || !user.AppUser || !user.dbName) {
        console.error('Credenciales de usuario no disponibles.');
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/api/forecast/combinations', {
          params: { appUser: user.AppUser, dbName: user.dbName },
        });
        setCombinations(response.data.combinations);
      } catch (error) {
        console.error('Error al obtener combinaciones:', error);
      }
    };

    fetchCombinations();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.AppUser || !user.dbName) {
        console.error('Credenciales de usuario no disponibles.');
        return;
      }

      setLoading(true);
      try {
        const forecastResponse = await axios.get('http://localhost:3000/api/forecast/data', {
          params: { appUser: user.AppUser, dbName: user.dbName },
        });

        const formattedForecastData = forecastResponse.data.forecastData.map((d, id) => ({
          id, // Requerido para DataGrid
          ...d,
          Fecha: new Date(d.Fecha).toISOString().split('T')[0],
        }));

        setForecastData(formattedForecastData);
      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCombinationChange = async (event) => {
    const combination = event.target.value;
    setSelectedCombination(combination);

    if (!user || !user.AppUser || !user.dbName) {
      console.error('Credenciales de usuario no disponibles.');
      return;
    }

    try {
      const response = await axios.get('http://localhost:3000/api/forecast/graphs', {
        params: { appUser: user.AppUser, dbName: user.dbName, combination },
      });

      const graphData = response.data.forecastData.map((d) => ({
        ...d,
        Fecha: new Date(d.Fecha).toISOString().split('T')[0],
      }));

      setGraphData(graphData);
    } catch (error) {
      console.error('Error al obtener datos para la gráfica:', error);
    }
  };

  const columnsForecast = [
    { field: 'Product', headerName: 'Producto', flex: 1 },
    { field: 'Channel', headerName: 'Canal', flex: 1 },
    { field: 'Loc', headerName: 'Localidad', flex: 1 },
    { field: 'Fecha', headerName: 'Fecha', flex: 1 },
    {
      field: 'Demanda Predicha',
      headerName: 'Demanda Predicha',
      flex: 1},
    { field: 'forecast_date', headerName: 'Fecha de forecast', flex: 1 },
  ];

  return (
    <Box sx={{ width: '80%', margin: '0 auto', padding: '20px', height: '100vh', overflowY: 'auto', boxSizing: 'border-box' }}>
      <h1>Visualización de Resultados</h1>

      <TextField
        label="Seleccionar Combinación"
        select
        value={selectedCombination}
        onChange={handleCombinationChange}
        fullWidth
        sx={{ marginBottom: '20px' }}
      >
        {combinations.map((combination, index) => (
          <MenuItem key={index} value={combination}>
            {combination}
          </MenuItem>
        ))}
      </TextField>

      {loading && <CircularProgress />}

      {!loading && graphData.length > 0 && (
        <Plot
          data={[
            {
              x: graphData.map((d) => d.Fecha),
              y: graphData.map((d) => d['DemandaReal']),
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Demanda Real',
              marker: { color: 'blue' },
            },
            {
              x: graphData.map((d) => d.Fecha),
              y: graphData.map((d) => d['DemandaPredicha']),
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Demanda Predicha',
              marker: { color: 'orange' },
            },
          ]}
          layout={{ title: `Forecast para ${selectedCombination}`, xaxis: { title: 'Fecha' }, yaxis: { title: 'Cantidad' } }}
          style={{ width: '100%', height: '500px' }}
        />
      )}

      {/* Título para la tabla de forecast */}
      <Typography variant="h4" sx={{ marginTop: '20px', marginBottom: '10px' }}>
        Forecast Actual
      </Typography>

      {!loading && (
        <Box sx={{ marginTop: '20px', height: 400 }}>
          <DataGrid
            rows={forecastData}
            columns={columnsForecast}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            autoHeight
            slots={{ toolbar: GridToolbar }} // Aquí agregamos la barra de herramientas con exportación
          />
        </Box>
      )}
    </Box>
  );
};

export default PlaneacionDemandaResultados;