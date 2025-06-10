import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Fade,
  Container,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Autocomplete,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress
} from '@mui/material';
import { DataGrid, GridToolbar, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton, GridToolbarColumnsButton } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import TimelineIcon from '@mui/icons-material/Timeline';
import TableChartIcon from '@mui/icons-material/TableChart';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { useAuth } from './../components/AuthContext';

// Componentes estilizados
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1),
  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
  },
}));

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const ActionButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  borderRadius: theme.spacing(0.75),
  fontWeight: 500,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-2px)'
  }
}));

// Funciones auxiliares para cálculos CORREGIDAS
const calculateMAPE = (data) => {
  if (!data || data.length === 0) return 0;
  
  // Filtrar solo registros con valores reales válidos Y predicciones
  const validData = data.filter(d => {
    return d.DemandaReal !== null && 
           d.DemandaReal !== undefined && 
           d.DemandaReal > 0 &&
           d.DemandaPredicha !== null && 
           d.DemandaPredicha !== undefined &&
           !isNaN(d.DemandaReal) && 
           !isNaN(d.DemandaPredicha);
  });
  
  if (validData.length === 0) return 0;
  
  const sum = validData.reduce((acc, d) => {
    return acc + Math.abs((d.DemandaReal - d.DemandaPredicha) / d.DemandaReal);
  }, 0);
  
  console.log(`MAPE calculado con ${validData.length} registros válidos de ${data.length} totales`);
  
  return (sum / validData.length) * 100;
};

const calculateMAE = (data) => {
  if (!data || data.length === 0) return 0;
  
  // Mismo filtro que MAPE
  const validData = data.filter(d => {
    return d.DemandaReal !== null && 
           d.DemandaReal !== undefined && 
           d.DemandaPredicha !== null && 
           d.DemandaPredicha !== undefined &&
           !isNaN(d.DemandaReal) && 
           !isNaN(d.DemandaPredicha);
  });
  
  if (validData.length === 0) return 0;
  
  const sum = validData.reduce((acc, d) => {
    return acc + Math.abs(d.DemandaReal - d.DemandaPredicha);
  }, 0);
  
  return sum / validData.length;
};

const calculateRMSE = (data) => {
  if (!data || data.length === 0) return 0;
  
  const validData = data.filter(d => {
    return d.DemandaReal !== null && 
           d.DemandaReal !== undefined && 
           d.DemandaPredicha !== null && 
           d.DemandaPredicha !== undefined &&
           !isNaN(d.DemandaReal) && 
           !isNaN(d.DemandaPredicha);
  });
  
  if (validData.length === 0) return 0;
  
  const sum = validData.reduce((acc, d) => {
    return acc + Math.pow(d.DemandaReal - d.DemandaPredicha, 2);
  }, 0);
  
  return Math.sqrt(sum / validData.length);
};

const calculateBias = (data) => {
  if (!data || data.length === 0) return 0;
  
  const validData = data.filter(d => {
    return d.DemandaReal !== null && 
           d.DemandaReal !== undefined && 
           d.DemandaPredicha !== null && 
           d.DemandaPredicha !== undefined &&
           !isNaN(d.DemandaReal) && 
           !isNaN(d.DemandaPredicha);
  });
  
  if (validData.length === 0) return 0;
  
  const sum = validData.reduce((acc, d) => {
    return acc + (d.DemandaPredicha - d.DemandaReal);
  }, 0);
  
  return sum / validData.length;
};

// Función para separar datos históricos de predicciones futuras
const separateHistoricalAndFuture = (data) => {
  const today = new Date();
  
  const historical = data.filter(d => {
    const recordDate = new Date(d.Fecha);
    return recordDate <= today && 
           d.DemandaReal !== null && 
           d.DemandaReal !== undefined;
  });
  
  const future = data.filter(d => {
    const recordDate = new Date(d.Fecha);
    return recordDate > today || 
           d.DemandaReal === null || 
           d.DemandaReal === undefined;
  });
  
  return { historical, future };
};

// Función mejorada para calcular métricas de precisión por registro
const calculateAccuracyMetrics = (data) => {
  if (!data || data.length === 0) return null;
  
  // Calcular distribución de precisión SOLO para registros con datos reales
  const accuracyRanges = {
    excellent: 0,    // > 90% precisión (< 10% error)
    good: 0,         // 80-90% precisión (10-20% error)
    acceptable: 0,   // 70-80% precisión (20-30% error)
    poor: 0          // < 70% precisión (> 30% error)
  };
  
  let validCount = 0;
  
  data.forEach(d => {
    // Solo calcular para registros con valores reales válidos
    if (d.DemandaReal !== null && 
        d.DemandaReal !== undefined && 
        d.DemandaReal > 0 &&
        d.DemandaPredicha !== null && 
        d.DemandaPredicha !== undefined &&
        !isNaN(d.DemandaReal) && 
        !isNaN(d.DemandaPredicha)) {
      
      validCount++;
      const error = Math.abs((d.DemandaReal - d.DemandaPredicha) / d.DemandaReal) * 100;
      
      if (error < 10) accuracyRanges.excellent++;
      else if (error < 20) accuracyRanges.good++;
      else if (error < 30) accuracyRanges.acceptable++;
      else accuracyRanges.poor++;
    }
  });
  
  console.log(`Distribución calculada con ${validCount} registros válidos`);
  
  return accuracyRanges;
};

// Componente actualizado para mostrar distribución de precisión
const AccuracyDistribution = ({ data }) => {
  const { historical } = separateHistoricalAndFuture(data);
  const distribution = calculateAccuracyMetrics(historical);
  
  if (!distribution) return null;
  
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  
  return (
    <StyledPaper sx={{ mb: 3 }}>
      <SectionTitle variant="h6">
        <AssessmentIcon />
        Distribución de Precisión
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          (Basado en {total} registros con datos reales)
        </Typography>
      </SectionTitle>
      
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Box textAlign="center">
            <Typography variant="h4" color="success.main">
              {((distribution.excellent / total) * 100).toFixed(0)}%
            </Typography>
            <Typography variant="caption">
              Excelente<br />(&gt;90% precisión)
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box textAlign="center">
            <Typography variant="h4" color="primary.main">
              {((distribution.good / total) * 100).toFixed(0)}%
            </Typography>
            <Typography variant="caption">
              Bueno<br />(80-90% precisión)
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box textAlign="center">
            <Typography variant="h4" color="warning.main">
              {((distribution.acceptable / total) * 100).toFixed(0)}%
            </Typography>
            <Typography variant="caption">
              Aceptable<br />(70-80% precisión)
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box textAlign="center">
            <Typography variant="h4" color="error.main">
              {((distribution.poor / total) * 100).toFixed(0)}%
            </Typography>
            <Typography variant="caption">
              Bajo<br />(&lt;70% precisión)
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2 }}>
        <LinearProgress 
          variant="determinate" 
          value={(distribution.excellent + distribution.good) / total * 100}
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {(((distribution.excellent + distribution.good) / total) * 100).toFixed(0)}% de las predicciones tienen más del 80% de precisión
        </Typography>
      </Box>
    </StyledPaper>
  );
};

// Componente personalizado para la toolbar del DataGrid
const CustomToolbar = ({ onExportReport }) => {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
      <Box sx={{ flexGrow: 1 }} />
      <Button
        size="small"
        startIcon={<AssessmentIcon />}
        onClick={onExportReport}
        sx={{ mr: 1 }}
      >
        Exportar Reporte Completo
      </Button>
    </GridToolbarContainer>
  );
};

const PlaneacionDemandaResultados = () => {
  const { user } = useAuth();
  
  // Estados
  const [combinations, setCombinations] = useState([]);
  const [selectedCombination, setSelectedCombination] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: '', severity: 'info' });
  
  
  const [showStatistics, setShowStatistics] = useState(true);
  const [viewMode, setViewMode] = useState('both'); // 'graph', 'table', 'both'
  
  // Estadísticas
  const [statistics, setStatistics] = useState({
    mape: 0,
    mae: 0,
    rmse: 0,
    bias: 0,
    totalForecast: 0,
    totalReal: 0,
    recordCount: 0,
    futureCount: 0
  });

  // Mostrar alertas temporales
  const showAlert = (message, severity = 'info') => {
    setAlertInfo({ show: true, message, severity });
    setTimeout(() => setAlertInfo({ ...alertInfo, show: false }), 5000);
  };

  // Cargar combinaciones disponibles
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
        
        // Transformar las combinaciones para el Autocomplete
        const formattedCombinations = response.data.combinations.map(combo => ({
          label: combo,
          value: combo,
          // Extraer información adicional del string
          producto: combo.split('-')[0] || '',
          canal: combo.split('-')[1] || '',
          ubicacion: combo.split('-')[2] || ''
        }));
        
        setCombinations(formattedCombinations);
      } catch (error) {
        console.error('Error al obtener combinaciones:', error);
        showAlert('Error al cargar las combinaciones disponibles', 'error');
      }
    };

    fetchCombinations();
  }, [user]);

  // Cargar datos iniciales del forecast
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

        console.log('raw forecastData sample:', forecastResponse.data.forecastData[0]);
        
        const formattedForecastData = forecastResponse.data.forecastData.map((d, id) => ({
          id,
          Producto:      d.Producto,
          Canal:         d.Canal,
          Ubicacion:     d.Ubicacion,
          Fecha:         new Date(d.Fecha),
          DemandaPredicha:  d['Demanda Predicha'],
          forecast_date: d.forecast_date
        }));

        setForecastData(formattedForecastData);
        
        if (formattedForecastData.length === 0) {
          showAlert('No hay datos de forecast disponibles', 'info');
        }
      } catch (error) {
        console.error('Error al obtener datos:', error);
        showAlert('Error al cargar los datos del forecast', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Manejar cambio de combinación actualizado
  const handleCombinationChange = async (event, newValue) => {
    setSelectedCombination(newValue);
    
    if (!newValue || !user || !user.AppUser || !user.dbName) {
      return;
    }

    setRefreshing(true);
    try {
      const response = await axios.get('http://localhost:3000/api/forecast/graphs', {
        params: { 
          appUser: user.AppUser, 
          dbName: user.dbName, 
          combination: newValue.value,
        },
      });

      const graphData = response.data.forecastData.map((d) => ({
        ...d,
        Fecha: new Date(d.Fecha).toISOString().split('T')[0],
      }));

      setGraphData(graphData);
      
      // Separar datos históricos de futuros
      const { historical, future } = separateHistoricalAndFuture(graphData);
      
      console.log(`Total registros: ${graphData.length}`);
      console.log(`Registros históricos (con datos reales): ${historical.length}`);
      console.log(`Registros futuros (solo predicción): ${future.length}`);
      
      // Calcular estadísticas SOLO con datos históricos
      if (historical.length > 0) {
        const stats = {
          mape: calculateMAPE(historical),
          mae: calculateMAE(historical),
          rmse: calculateRMSE(historical),
          bias: calculateBias(historical),
          totalForecast: historical.reduce((sum, d) => sum + (d.DemandaPredicha || 0), 0),
          totalReal: historical.reduce((sum, d) => sum + (d.DemandaReal || 0), 0),
          recordCount: historical.length,
          futureCount: future.length
        };
        setStatistics(stats);
        
        // Mostrar alerta informativa
        if (future.length > 0) {
          showAlert(
            `Métricas calculadas con ${historical.length} registros históricos. ` +
            `Hay ${future.length} predicciones futuras que no se incluyen en el cálculo de precisión.`,
            'info'
          );
        }
      } else {
        // No hay datos históricos para calcular métricas
        setStatistics({
          mape: 0,
          mae: 0,
          rmse: 0,
          bias: 0,
          totalForecast: 0,
          totalReal: 0,
          recordCount: 0,
          futureCount: future.length
        });
        
        showAlert('Solo hay predicciones futuras disponibles. No se pueden calcular métricas de precisión sin datos históricos.', 'warning');
      }
    } catch (error) {
      console.error('Error al obtener datos para la gráfica:', error);
      showAlert('Error al cargar los datos de la gráfica', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Refrescar datos
  const handleRefresh = () => {
    if (selectedCombination) {
      handleCombinationChange(null, selectedCombination);
    }
  };

  // Exportar reporte completo
  const handleExportReport = () => {
    // Aquí implementarías la lógica para generar un reporte PDF o Excel completo
    showAlert('Función de exportación de reporte completo en desarrollo', 'info');
  };

  // Definir columnas mejoradas para el DataGrid
  const columns = useMemo(() => [
    { 
      field: 'Producto', 
      headerName: 'Producto', 
      flex: 1,
      minWidth: 120
    },
    { 
      field: 'Canal', 
      headerName: 'Canal', 
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color="primary" variant="outlined" />
      )
    },
    { 
      field: 'Ubicacion', 
      headerName: 'Localidad', 
      flex: 1,
      minWidth: 120
    },
    { 
      field: 'Fecha', 
      headerName: 'Fecha', 
      flex: 1,
      minWidth: 110,
      renderCell: (params) => 
        params.value instanceof Date 
          ? params.value.toLocaleDateString('es-MX') 
          : '-'
    },
    {
      field: 'DemandaPredicha',
      headerName: 'Demanda Predicha',
      flex: 1,
      minWidth: 140,
      type: 'number',
      headerAlign: 'left',
      renderCell: (params) => {
        const value = params.value;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              {value ? value.toLocaleString('es-MX', { maximumFractionDigits: 2 }) : '-'}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'forecast_date', 
      headerName: 'Fecha de Forecast', 
      flex: 1,
      minWidth: 160,
      renderCell: (params) => {
        const date = new Date(params.value);
        return (
          <Tooltip title={date.toLocaleString('es-MX')}>
            <Typography variant="caption" color="text.secondary">
              {date.toLocaleDateString('es-MX')}
            </Typography>
          </Tooltip>
        );
      }
    }
  ], []);

  // Configuración mejorada del gráfico
  const plotLayout = {
    height: 500,
    title: {
      text: selectedCombination ? `Forecast: ${selectedCombination.label}` : 'Seleccione una combinación',
      font: { size: 18, family: 'Roboto, Arial, sans-serif' }
    },
    xaxis: { 
      title: 'Fecha',
      gridcolor: '#f0f0f0',
      tickformat: '%b %Y',
      hoverformat: '%d %b %Y',
      tickangle: -45,
      showline: true,
      linecolor: '#e0e0e0'
    },
    yaxis: { 
      title: 'Cantidad',
      gridcolor: '#f0f0f0',
      tickformat: ',.0f',
      showline: true,
      linecolor: '#e0e0e0'
    },
    hovermode: 'x unified',
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: -0.35,
      xanchor: 'center',
      x: 0.5
    },
    margin: { t: 100, r: 30, b: 100, l: 80 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    // Agregar anotaciones con estadísticas si están disponibles
    annotations: [
      ...(statistics.mape > 0 ? [{
        xref: 'paper',
        yref: 'paper',
        x: 0,
        y: 1.15,
        text: `Error (MAPE): ${statistics.mape.toFixed(2)}% | Precisión: ${(100 - statistics.mape).toFixed(2)}% | Basado en ${statistics.recordCount} registros históricos`,
        showarrow: false,
        font: { size: 12, color: '#666' },
        xanchor: 'left'
      }] : []),
    ]
  };

  // Componente de tarjetas de métricas mejorado
  const MetricCards = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {/* Tarjeta de MAPE con precisión */}
      <Grid item xs={6} sm={3}>
        <MetricCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="caption">
                  Error Promedio (MAPE)
                </Typography>
                <Typography variant="h5" component="div" color="error.main">
                  {statistics.mape.toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                  Precisión: {(100 - statistics.mape).toFixed(2)}%
                </Typography>
              </Box>
              <Tooltip title="Mean Absolute Percentage Error - Porcentaje de error promedio en las predicciones">
                <InfoIcon color="action" fontSize="small" />
              </Tooltip>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color={statistics.mape < 10 ? 'success.main' : statistics.mape < 20 ? 'warning.main' : 'error.main'}>
              {statistics.mape < 10 ? '✓ Excelente' : statistics.mape < 20 ? '⚠ Bueno' : '✗ Necesita mejora'}
            </Typography>
          </CardContent>
        </MetricCard>
      </Grid>
      
      {/* Tarjeta de MAE */}
      <Grid item xs={6} sm={3}>
        <MetricCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="caption">
                  Error Absoluto (MAE)
                </Typography>
                <Typography variant="h5" component="div">
                  {statistics.mae.toFixed(0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  unidades promedio
                </Typography>
              </Box>
              <Tooltip title="Mean Absolute Error - Diferencia promedio en unidades entre predicción y realidad">
                <InfoIcon color="action" fontSize="small" />
              </Tooltip>
            </Box>
          </CardContent>
        </MetricCard>
      </Grid>
      
      {/* Tarjeta de Sesgo mejorada */}
      <Grid item xs={6} sm={3}>
        <MetricCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="caption">
                  Sesgo (Bias)
                </Typography>
                <Typography variant="h5" component="div">
                  {Math.abs(statistics.bias).toFixed(0)}
                </Typography>
                <Typography variant="caption" color={Math.abs(statistics.bias) < 100 ? 'success.main' : 'warning.main'}>
                  {statistics.totalReal > 0 ? 
                    `${Math.abs(statistics.bias / statistics.totalReal * 100).toFixed(1)}% del total` : 
                    'N/A'
                  }
                </Typography>
              </Box>
              {statistics.bias > 0 ? 
                <Tooltip title="Las predicciones tienden a ser mayores que la demanda real">
                  <TrendingUpIcon color="warning" />
                </Tooltip> : 
                <Tooltip title="Las predicciones tienden a ser menores que la demanda real">
                  <TrendingDownIcon color="info" />
                </Tooltip>
              }
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {statistics.bias > 0 ? 'Sobreestimación' : 'Subestimación'}
            </Typography>
          </CardContent>
        </MetricCard>
      </Grid>
      
      {/* Tarjeta de RMSE */}
      <Grid item xs={6} sm={3}>
        <MetricCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="caption">
                  Desv. Cuadrática (RMSE)
                </Typography>
                <Typography variant="h5" component="div">
                  {statistics.rmse.toFixed(0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  penaliza errores grandes
                </Typography>
              </Box>
              <Tooltip title="Root Mean Square Error - Penaliza más los errores grandes que los pequeños">
                <InfoIcon color="action" fontSize="small" />
              </Tooltip>
            </Box>
          </CardContent>
        </MetricCard>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <StyledPaper sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" fontWeight="500" color="primary" gutterBottom>
              Visualización de Resultados
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Análisis y visualización del forecast más reciente con métricas de precisión
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="graph">
                <Tooltip title="Solo gráfico">
                  <TimelineIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="table">
                <Tooltip title="Solo tabla">
                  <TableChartIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="both">
                <Tooltip title="Ambos">
                  <span>Ambos</span>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Tooltip title="Refrescar datos">
              <IconButton 
                onClick={handleRefresh}
                disabled={refreshing || !selectedCombination}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </StyledPaper>

      {/* Alertas */}
      <Fade in={alertInfo.show}>
        <Alert 
          severity={alertInfo.severity} 
          sx={{ mb: 3 }}
          onClose={() => setAlertInfo({ ...alertInfo, show: false })}
        >
          {alertInfo.message}
        </Alert>
      </Fade>

      {/* Controles y filtros */}
      <StyledPaper sx={{ mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Autocomplete
              value={selectedCombination}
              onChange={handleCombinationChange}
              options={combinations}
              getOptionLabel={(option) => option.label || ''}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.producto} • {option.canal} • {option.ubicacion}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seleccionar Combinación"
                  placeholder="Buscar producto-canal-ubicación..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <TimelineIcon sx={{ color: 'action.active', mr: 1 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              fullWidth
              loading={loading}
              loadingText="Cargando combinaciones..."
              noOptionsText="No se encontraron combinaciones"
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {statistics.futureCount > 0 && (
            <Typography variant="caption" color="info.main">
              ℹ️ Hay {statistics.futureCount} predicciones futuras no incluidas en las métricas
            </Typography>
          )}
          <FormControlLabel
            control={
              <Switch 
                checked={showStatistics} 
                onChange={(e) => setShowStatistics(e.target.checked)}
              />
            }
            label="Mostrar estadísticas"
          />
        </Box>
      </StyledPaper>

      {/* Contenido principal */}
      {loading ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={200} />
          </Grid>
        </Grid>
      ) : (
        <>
          {/* Métricas */}
          {showStatistics && selectedCombination && graphData.length > 0 && (
            <Fade in={true}>
              <Box>
                <MetricCards />
                <AccuracyDistribution data={graphData} />
              </Box>
            </Fade>
          )}

          {/* Gráfico */}
          {(viewMode === 'graph' || viewMode === 'both') && (
            <Fade in={true}>
              <StyledPaper sx={{ mb: 3 }}>
                <SectionTitle variant="h6">
                  <TimelineIcon />
                  Gráfico de Forecast
                  {refreshing && <CircularProgress size={20} sx={{ ml: 2 }} />}
                </SectionTitle>
                
                {graphData.length > 0 ? (
                  <Plot
                    data={[
                      // Demanda Real (solo histórica)
                      {
                        x: graphData.filter(d => d.DemandaReal !== null && d.DemandaReal !== undefined).map(d => d.Fecha),
                        y: graphData.filter(d => d.DemandaReal !== null && d.DemandaReal !== undefined).map(d => d.DemandaReal),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Demanda Real',
                        line: { color: '#1976d2', width: 2 },
                        marker: { size: 6 },
                        hovertemplate: 'Fecha: %{x}<br>Real: %{y:,.0f}<extra></extra>'
                      },
                      // Demanda Predicha Histórica (donde hay valores reales)
                      {
                        x: graphData.filter(d => d.DemandaReal !== null && d.DemandaReal !== undefined).map(d => d.Fecha),
                        y: graphData.filter(d => d.DemandaReal !== null && d.DemandaReal !== undefined).map(d => d.DemandaPredicha),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Predicción (Histórica)',
                        line: { color: '#ff9800', width: 2 },
                        marker: { size: 6 },
                        hovertemplate: 'Fecha: %{x}<br>Predicha: %{y:,.0f}<extra></extra>'
                      },
                      // Demanda Predicha Futura (sin valores reales)
                      {
                        x: graphData.filter(d => d.DemandaReal === null || d.DemandaReal === undefined).map(d => d.Fecha),
                        y: graphData.filter(d => d.DemandaReal === null || d.DemandaReal === undefined).map(d => d.DemandaPredicha),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Predicción (Futura)',
                        line: { color: '#ff9800', width: 2, dash: 'dash' },
                        marker: { size: 6, symbol: 'circle-open' },
                        hovertemplate: 'Fecha: %{x}<br>Predicción: %{y:,.0f}<br>(Sin valor real)<extra></extra>'
                      }
                    ]}
                    layout={plotLayout}
                    config={{ 
                      responsive: true,
                      displayModeBar: true,
                      displaylogo: false,
                      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                      toImageButtonOptions: {
                        format: 'png',
                        filename: `forecast_${selectedCombination?.label || 'grafico'}`,
                        height: 600,
                        width: 1200,
                        scale: 1
                      }
                    }}
                    style={{ width: '100%', height: '500px' }}
                  />
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      {selectedCombination ? 
                        'No hay datos disponibles para la combinación seleccionada' : 
                        'Seleccione una combinación para visualizar el gráfico'
                      }
                    </Typography>
                  </Box>
                )}
              </StyledPaper>
            </Fade>
          )}

          {/* Tabla */}
          {(viewMode === 'table' || viewMode === 'both') && (
            <Fade in={true}>
              <StyledPaper>
                <SectionTitle variant="h6">
                  <TableChartIcon />
                  Forecast Actual
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    ({forecastData.length} registros)
                  </Typography>
                </SectionTitle>
                
                <Box sx={{ height: 600, width: '100%' }}>
                  <DataGrid
                    rows={forecastData}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[5, 10, 20, 50, 100]}
                    disableSelectionOnClick
                    components={{
                      Toolbar: () => <CustomToolbar onExportReport={handleExportReport} />
                    }}
                    sx={{
                      '& .MuiDataGrid-cell:hover': {
                        color: 'primary.main',
                      },
                      '& .MuiDataGrid-row:hover': {
                        backgroundColor: 'action.hover',
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: 'background.paper',
                        color: 'text.primary',
                        fontSize: 14,
                      },
                    }}
                    localeText={{
                      toolbarColumns: 'Columnas',
                      toolbarFilters: 'Filtros',
                      toolbarExport: 'Exportar',
                      toolbarExportCSV: 'Descargar como CSV',
                      toolbarExportPrint: 'Imprimir',
                      columnsPanelTextFieldLabel: 'Buscar columna',
                      columnsPanelShowAllButton: 'Mostrar todo',
                      columnsPanelHideAllButton: 'Ocultar todo',
                      filterPanelAddFilter: 'Agregar filtro',
                      filterPanelDeleteIconLabel: 'Eliminar',
                      filterPanelOperators: 'Operadores',
                      filterOperatorContains: 'contiene',
                      filterOperatorEquals: 'igual a',
                      filterOperatorStartsWith: 'empieza con',
                      filterOperatorEndsWith: 'termina con',
                      filterOperatorIsEmpty: 'está vacío',
                      filterOperatorIsNotEmpty: 'no está vacío',
                      filterOperatorIsAnyOf: 'es cualquiera de',
                      filterPanelInputLabel: 'Valor',
                      filterPanelInputPlaceholder: 'Valor del filtro',
                      columnMenuLabel: 'Menú',
                      columnMenuShowColumns: 'Mostrar columnas',
                      columnMenuFilter: 'Filtrar',
                      columnMenuHideColumn: 'Ocultar',
                      columnMenuUnsort: 'Desordenar',
                      columnMenuSortAsc: 'Ordenar ASC',
                      columnMenuSortDesc: 'Ordenar DESC',
                      footerTotalRows: 'Total de filas:',
                      noRowsLabel: 'No hay datos disponibles',
                      noResultsOverlayLabel: 'No se encontraron resultados.',
                      errorOverlayDefaultLabel: 'Ha ocurrido un error.',
                      footerRowSelected: (count) => 
                        count !== 1
                          ? `${count.toLocaleString()} filas seleccionadas`
                          : `${count.toLocaleString()} fila seleccionada`,
                      footerTotalVisibleRows: (visibleCount, totalCount) =>
                        `${visibleCount.toLocaleString()} de ${totalCount.toLocaleString()}`,
                    }}
                  />
                </Box>
              </StyledPaper>
            </Fade>
          )}
        </>
      )}
    </Container>
  );
};

export default PlaneacionDemandaResultados;