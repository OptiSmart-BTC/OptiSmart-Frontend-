import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Paper,
  Divider,
  LinearProgress,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  InputAdornment,
  Container
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from 'axios';
import { useAuth } from './../components/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  FilterList,
  Refresh,
  Download,
  Analytics,
  CheckCircle,
  Warning,
  Error,
  Search,
  CalendarMonth
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PlaneacionDemandaHistFCST = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    producto: '',
    canal: '',
    ubicacion: '',
    mapeMin: '',
    mapeMax: '',
    fechaInicio: null,
    fechaFin: null,
    searchText: ''
  });

  // Función para determinar el color según el MAPE
  const getMapeColor = (mape) => {
    if (mape === null || mape === undefined) return '#9e9e9e';
    if (mape <= 10) return '#4caf50'; // Verde - Excelente
    if (mape <= 20) return '#8bc34a'; // Verde claro - Muy bueno
    if (mape <= 30) return '#ffc107'; // Amarillo - Aceptable
    if (mape <= 50) return '#ff9800'; // Naranja - Mejorable
    return '#f44336'; // Rojo - Requiere atención
  };

  // Función para obtener el ícono de tendencia
  const getTrendIcon = (mape) => {
    if (mape === null || mape === undefined) return <TrendingFlat color="disabled" />;
    if (mape <= 20) return <TrendingDown sx={{ color: '#4caf50' }} />;
    if (mape <= 40) return <TrendingFlat sx={{ color: '#ffc107' }} />;
    return <TrendingUp sx={{ color: '#f44336' }} />;
  };

  // Calcular métricas resumidas
  const summaryMetrics = useMemo(() => {
    if (metrics.length === 0) return null;
    
    const validMapes = metrics.filter(m => m.MAPE !== null && m.MAPE !== undefined).map(m => parseFloat(m.MAPE));
    const avgMape = validMapes.reduce((a, b) => a + b, 0) / validMapes.length;
    const excellentCount = validMapes.filter(m => m <= 10).length;
    const goodCount = validMapes.filter(m => m > 10 && m <= 30).length;
    const poorCount = validMapes.filter(m => m > 30).length;
    
    return {
      avgMape: avgMape.toFixed(2),
      totalPredictions: metrics.length,
      excellentCount,
      goodCount,
      poorCount,
      accuracy: ((excellentCount + goodCount) / validMapes.length * 100).toFixed(1)
    };
  }, [metrics]);

  // Cargar datos existentes
  useEffect(() => {
    const fetchExistingMetrics = async () => {
      if (!user || !user.AppUser || !user.dbName) {
        console.error('Credenciales de usuario no disponibles.');
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/forecast/existing-metrics', {
          params: { appUser: user.AppUser, dbName: user.dbName },
        });

        if (response.data.metrics && response.data.metrics.length > 0) {
          const formattedMetrics = response.data.metrics.map((d, id) => ({
            id,
            ...d,
            Fecha: new Date(d.Fecha).toISOString().split('T')[0],
            MAPE: d.MAPE ? parseFloat(d.MAPE) : null
          }));
          setMetrics(formattedMetrics);
          setMessage('Métricas cargadas exitosamente.');
          setMessageType('success');
        } else {
          setMessage('No hay métricas calculadas. Presiona "Calcular MAPE" para generar nuevas métricas.');
          setMessageType('info');
        }
      } catch (error) {
        console.error('Error al obtener métricas existentes:', error);
        setMessage('Error al cargar métricas existentes.');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };

    fetchExistingMetrics();
  }, [user]);

  // Función para calcular MAPE
  const handleCalculateMape = async () => {
    if (!user || !user.AppUser || !user.dbName) {
      setMessage('Credenciales de usuario no disponibles.');
      setMessageType('error');
      return;
    }

    setCalculating(true);
    setMessage('Calculando MAPE... Esto puede tomar unos momentos.');
    setMessageType('info');

    try {
      const response = await axios.post('http://localhost:3000/api/forecast/calculate-metrics', {
        appUser: user.AppUser,
        dbName: user.dbName,
      });

      const formattedMetrics = response.data.metrics.map((d, id) => ({
        id,
        ...d,
        Fecha: new Date(d.Fecha).toISOString().split('T')[0],
        MAPE: d.MAPE ? parseFloat(d.MAPE) : null
      }));

      setMetrics(formattedMetrics);
      setMessage(`MAPE calculado exitosamente. Se procesaron ${formattedMetrics.length} registros.`);
      setMessageType('success');
    } catch (error) {
      console.error('Error al calcular MAPE:', error);
      setMessage('Error al calcular MAPE. Por favor, inténtalo nuevamente.');
      setMessageType('error');
    } finally {
      setCalculating(false);
    }
  };

  // Aplicar filtros
  const filteredMetrics = useMemo(() => {
    return metrics.filter(row => {
      if (filters.producto && !row.Producto.toLowerCase().includes(filters.producto.toLowerCase())) return false;
      if (filters.canal && !row.Canal.toLowerCase().includes(filters.canal.toLowerCase())) return false;
      if (filters.ubicacion && !row.Ubicacion.toLowerCase().includes(filters.ubicacion.toLowerCase())) return false;
      if (filters.mapeMin && row.MAPE < parseFloat(filters.mapeMin)) return false;
      if (filters.mapeMax && row.MAPE > parseFloat(filters.mapeMax)) return false;
      if (filters.fechaInicio && new Date(row.Fecha) < filters.fechaInicio) return false;
      if (filters.fechaFin && new Date(row.Fecha) > filters.fechaFin) return false;
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        return Object.values(row).some(val => 
          val && val.toString().toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [metrics, filters]);

  // Definir columnas mejoradas
  const columnsMetrics = [
    { 
      field: 'Producto', 
      headerName: 'Producto', 
      flex: 1,
      renderCell: (params) => (
        <Tooltip title={`Producto: ${params.value}`}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.value}
          </Typography>
        </Tooltip>
      )
    },
    { 
      field: 'Canal', 
      headerName: 'Canal', 
      flex: 1,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          variant="outlined"
          sx={{ borderColor: '#1976d2', color: '#1976d2' }}
        />
      )
    },
    { 
      field: 'Ubicacion', 
      headerName: 'Localidad', 
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#666' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'Fecha', 
      headerName: 'Fecha', 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CalendarMonth sx={{ fontSize: 16, color: '#999' }} />
          <Typography variant="body2">
            {format(new Date(params.value), 'dd/MM/yyyy', { locale: es })}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'DemandaReal', 
      headerName: 'Demanda Real', 
      flex: 1,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {params.value ? params.value.toLocaleString('es-MX') : 'N/A'}
        </Typography>
      )
    },
    { 
      field: 'DemandaPredicha', 
      headerName: 'Demanda Predicha', 
      flex: 1,
      type: 'number',
      renderCell: (params) => {
        if (!params.value || !params.row.DemandaReal) {
          return (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              N/A
            </Typography>
          );
        }
        const diff = params.row.DemandaPredicha - params.row.DemandaReal;
        const isPositive = diff > 0;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {params.value.toLocaleString('es-MX')}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: isPositive ? '#f44336' : '#4caf50',
                fontSize: '0.7rem'
              }}
            >
              {isPositive ? '+' : ''}{diff.toLocaleString('es-MX')}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'MAPE', 
      headerName: 'MAPE (%)', 
      flex: 1.2,
      renderCell: (params) => {
        if (params.value === null || params.value === undefined) {
          return <Chip label="N/A" size="small" />;
        }
        const mape = parseFloat(params.value);
        const color = getMapeColor(mape);
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            {getTrendIcon(mape)}
            <Chip
              label={`${mape.toFixed(2)}%`}
              size="small"
              sx={{ 
                backgroundColor: color,
                color: '#fff',
                fontWeight: 600,
                minWidth: 70
              }}
            />
            <LinearProgress 
              variant="determinate" 
              value={Math.min(mape, 100)} 
              sx={{ 
                flexGrow: 1, 
                height: 6, 
                borderRadius: 3,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color
                }
              }}
            />
          </Box>
        );
      }
    },
    { 
      field: 'forecast_date', 
      headerName: 'Fecha de Forecast', 
      flex: 1,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: '#888' }}>
          {params.value}
        </Typography>
      )
    },
  ];

  // Función para exportar datos
  const handleExport = () => {
    const csvContent = [
      ['Producto', 'Canal', 'Ubicacion', 'Fecha', 'Demanda Real', 'Demanda Predicha', 'MAPE (%)', 'Fecha Forecast'],
      ...filteredMetrics.map(row => [
        row.Producto,
        row.Canal,
        row.Ubicacion,
        row.Fecha,
        row.DemandaReal,
        row.DemandaPredicha,
        row.MAPE || 'N/A',
        row.forecast_date
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_forecast_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    a.click();
  };

  return (
    <Box sx={{ 
      height: '100vh',
      overflowY: 'auto',
      paddingRight: '8px',
      '&::-webkit-scrollbar': {
        width: '10px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'rgba(0, 0, 0, 0.05)',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '10px',
        '&:hover': {
          background: 'rgba(0, 0, 0, 0.3)',
        },
      },
    }}>
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
            Histórico de Forecast
          </Typography>
          <Typography variant="body1" sx={{ color: '#666' }}>
            Analiza el rendimiento histórico de las predicciones y calcula métricas de precisión
          </Typography>
        </Box>

        {/* Cards de métricas resumidas */}
        {summaryMetrics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                        {summaryMetrics.avgMape}%
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                        MAPE Promedio
                      </Typography>
                    </Box>
                    <Analytics sx={{ fontSize: 24, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                        {summaryMetrics.totalPredictions}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                        Total Predicciones
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 24, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                        {summaryMetrics.accuracy}%
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                        Precisión General
                      </Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 24, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#666', fontSize: '0.875rem' }}>
                    Distribución de Calidad
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4caf50' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Excelente</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                        {summaryMetrics.excellentCount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffc107' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Bueno</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                        {summaryMetrics.goodCount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f44336' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Mejorable</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                        {summaryMetrics.poorCount}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Barra de acciones */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleCalculateMape}
                disabled={calculating || loading}
                startIcon={calculating ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                sx={{ 
                  minWidth: '150px',
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                }}
              >
                {calculating ? 'Calculando...' : 'Calcular MAPE'}
              </Button>

              <Button
                variant="outlined"
                onClick={() => setShowFilters(!showFilters)}
                startIcon={<FilterList />}
                sx={{ borderColor: '#1976d2' }}
              >
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </Button>

              <Button
                variant="outlined"
                onClick={handleExport}
                startIcon={<Download />}
                disabled={filteredMetrics.length === 0}
              >
                Exportar
              </Button>
            </Box>

            {/* Búsqueda rápida */}
            <TextField
              size="small"
              variant="outlined"
              placeholder="Buscar..."
              value={filters.searchText}
              onChange={(e) => setFilters({...filters, searchText: e.target.value})}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
          </Box>

          {/* Panel de filtros colapsable */}
          <Collapse in={showFilters}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Producto"
                  value={filters.producto}
                  onChange={(e) => setFilters({...filters, producto: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Canal"
                  value={filters.canal}
                  onChange={(e) => setFilters({...filters, canal: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Ubicación"
                  value={filters.ubicacion}
                  onChange={(e) => setFilters({...filters, ubicacion: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="MAPE Mín %"
                  type="number"
                  value={filters.mapeMin}
                  onChange={(e) => setFilters({...filters, mapeMin: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="MAPE Máx %"
                  type="number"
                  value={filters.mapeMax}
                  onChange={(e) => setFilters({...filters, mapeMax: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setFilters({
                    producto: '',
                    canal: '',
                    ubicacion: '',
                    mapeMin: '',
                    mapeMax: '',
                    fechaInicio: null,
                    fechaFin: null,
                    searchText: ''
                  })}
                  sx={{ height: '100%' }}
                >
                  Limpiar Filtros
                </Button>
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {/* Mensaje de estado */}
        <Collapse in={!!message}>
          <Alert 
            severity={messageType} 
            sx={{ mb: 2 }}
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        </Collapse>

        {/* Tabla de métricas mejorada */}
        <Paper sx={{ width: '100%', flexGrow: 1 }}>
          <DataGrid
            rows={filteredMetrics}
            columns={columnsMetrics}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20, 50]}
            slots={{ toolbar: GridToolbar }}
            loading={calculating || loading}
            autoHeight
            sx={{
              '& .MuiDataGrid-row': {
                '&:nth-of-type(even)': {
                  backgroundColor: '#fafafa',
                },
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f0f0f0',
                fontWeight: 600,
              },
              '& .MuiDataGrid-cell': {
                borderRight: '1px solid #e0e0e0',
              },
            }}
            getRowClassName={(params) => {
              if (params.row.MAPE !== null && params.row.MAPE !== undefined) {
                const mape = parseFloat(params.row.MAPE);
                if (mape <= 10) return 'excellent-row';
                if (mape > 50) return 'poor-row';
              }
              return '';
            }}
          />
        </Paper>
      </Container>
    </LocalizationProvider>
  </Box>
  );
};

export default PlaneacionDemandaHistFCST;