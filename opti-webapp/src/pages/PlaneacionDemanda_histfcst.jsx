import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from 'axios';
import { useAuth } from './../components/AuthContext';


const PlaneacionDemandaHistFCST = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos de métricas al cargar la página
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user || !user.AppUser || !user.dbName) {
        console.error('Credenciales de usuario no disponibles.');
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/forecast/metrics', {
          params: { appUser: user.AppUser, dbName: user.dbName },
        });

        const formattedMetrics = response.data.metrics.map((d, id) => ({
          id, // Requerido para DataGrid
          ...d,
          Fecha: new Date(d.Fecha).toISOString().split('T')[0],
        }));

        setMetrics(formattedMetrics);
      } catch (error) {
        console.error('Error al obtener métricas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user]);

  // Definir columnas de la tabla de métricas
  const columnsMetrics = [
    { field: 'Product', headerName: 'Producto', flex: 1 },
    { field: 'Channel', headerName: 'Canal', flex: 1 },
    { field: 'Loc', headerName: 'Localidad', flex: 1 },
    { field: 'Fecha', headerName: 'Fecha', flex: 1 },
    { field: 'DemandaReal', headerName: 'Demanda Real', flex: 1 },
    { field: 'DemandaPredicha', headerName: 'Demanda Predicha', flex: 1},
    { field: 'MAPE', headerName: 'MAPE (%)', flex: 1},
    { field: 'forecast_date', headerName: 'Fecha de forecast', flex: 1 },
  ];

  return (
    <Box sx={{ width: '80%', margin: '0 auto', padding: '20px', height: '100vh', overflowY: 'auto', boxSizing: 'border-box' }}>
      <Typography variant="h4" sx={{ marginBottom: '20px' }}>
        Histórico de Forecast
      </Typography>

      {loading && <CircularProgress />}

      {!loading && (
        <Box>
          <DataGrid
            rows={metrics}
            columns={columnsMetrics}
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

export default PlaneacionDemandaHistFCST;
