import React, { useState, useEffect, useMemo } from 'react';
import TablaClasificacionDemanda from './TablaClasificacionDemanda';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  Paper, 
  Divider, 
  Grid, 
  Card, 
  CardContent,
  Chip,
  Alert,
  Fade,
  Container,
  Tooltip,
  IconButton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import TableChartIcon from '@mui/icons-material/TableChart';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { useAuth } from './../components/AuthContext';



// Componentes estilizados personalizados
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1),
  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
  },
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
  },
  '&:active': {
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(0)'
  }
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

// Estilos para el scrollbar personalizado
const ScrollableContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  overflowY: 'auto',
  paddingRight: theme.spacing(2),
  scrollbarWidth: 'thin',
  '&::-webkit-scrollbar': {
    width: '10px',
    background: 'transparent',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    borderRadius: '10px',
    transition: 'background 0.2s ease',
    '&:hover': {
      background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
    },
  },
  // Asegurar que el scrollbar esté siempre visible
  '&::-webkit-scrollbar-thumb:vertical': {
    minHeight: '30px',
  },
}));

const getColorForString = (str) => {
  if (!str) return '#757575';
  
  // Colores predefinidos para consistencia
  const colors = [
    '#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', 
    '#d32f2f', '#0288d1', '#388e3c', '#f57c00', 
    '#7b1fa2', '#c2185b'
  ];
  
  // Crear un hash simple basado en el nombre del string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Usar el hash para seleccionar un color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const PlaneacionDemanda_clasificacion = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: '', severity: 'info' });
  const [classificationData, setClassificationData] = useState([]);
  const [pieData, setPieData] = useState(null);
  const [scatterData, setScatterData] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Manejador para mostrar alertas temporales
  const showAlert = (message, severity = 'info') => {
    setAlertInfo({ show: true, message, severity });
    setTimeout(() => setAlertInfo({ ...alertInfo, show: false }), 5000);
  };

  // Definición de columnas para AG Grid con estilos mejorados
  const columnDefs = useMemo(() => [
    { 
      headerName: "Producto", 
      field: "Producto", 
      sortable: true, 
      filter: true,
      minWidth: 120,
      cellStyle: { fontWeight: 500 }
    },
    { 
      headerName: "Canal", 
      field: "Canal", 
      sortable: true, 
      filter: true,
      minWidth: 150,
      cellRenderer: params => {
        // Comprobar si params.value es undefined o null
        if (!params.value) return '<div style="color: #757575;">Sin datos</div>';
        
        const color = typeof params.value === 'string' 
          ? getColorForString(params.value) 
          : '#757575';
        
        return `<div style="display: inline-block; padding: 2px 8px; border-radius: 12px; background-color: ${color}; color: white; font-size: 0.75rem;">${params.value}</div>`;
      }
    },
    { 
      headerName: "Ubicación", 
      field: "Ubicacion", 
      sortable: true, 
      filter: true,
      minWidth: 120
    },
    { 
      headerName: "ADI", 
      field: "ADI", 
      sortable: true, 
      filter: true,
      minWidth: 100,
      valueFormatter: params => params.value ? params.value.toFixed(4) : '-',
      cellStyle: params => ({ 
        backgroundColor: params.value > 3 ? 'rgba(255, 152, 0, 0.15)' : 'inherit',
        textAlign: 'right'
      })
    },
    { 
      headerName: "CV²", 
      field: "CV2", 
      sortable: true, 
      filter: true,
      minWidth: 100,
      valueFormatter: params => params.value ? params.value.toFixed(4) : '-',
      cellStyle: params => ({ 
        backgroundColor: params.value > 0.5 ? 'rgba(244, 67, 54, 0.15)' : 'inherit',
        textAlign: 'right'
      })
    },
    { 
      headerName: "Categoría", 
      field: "Category", 
      sortable: true, 
      filter: true,
      minWidth: 140,
      cellRenderer: params => {
        if (!params.value) return '<div style="color: #757575;">Sin datos</div>';
        
        // Mapeo conocido + colores dinámicos para categorías desconocidas
        const categoryColors = {
          'Suave': '#1976d2',
          'Intermitente': '#2e7d32',
          'Lumpy/Irregular': '#d32f2f',
          'Errática': '#ed6c02'
        };
        
        const color = categoryColors[params.value] || getColorForString(params.value);
        
        return `<div style="display: inline-block; padding: 2px 8px; border-radius: 12px; background-color: ${color}; color: white; font-size: 0.75rem;">${params.value}</div>`;
      }
    },
    { 
      headerName: "Datos", 
      field: "Data_Points", 
      sortable: true, 
      filter: true,
      minWidth: 100,
      cellStyle: { textAlign: 'right' },
      cellRenderer: params => {
        if (params.value === undefined || params.value === null) return '-';
        
        const value = params.value;
        let color = 'inherit';
        if (value < 10) color = '#d32f2f';
        else if (value < 30) color = '#ed6c02';
        return `<span style="color: ${color};">${value}</span>`;
      }
    },
    { 
      headerName: "Fecha Clasificación", 
      field: "fecha_clasificacion", 
      sortable: true, 
      filter: true,
      minWidth: 180,
      valueFormatter: params => {
        if (!params.value) return '';
        const date = new Date(params.value);
        return date.toLocaleString('es-MX');
      }
    },
    { 
      headerName: "Modelos Recomendados", 
      field: "recommended_models", 
      sortable: true, 
      filter: true,
      minWidth: 240,
      wrapText: true,
      autoHeight: true,
      cellRenderer: params => {
        if (!params.value) return '';
        
        const models = Array.isArray(params.value) ? params.value : [params.value];
        return models.map(model => 
          `<div style="display: inline-block; margin: 2px; padding: 3px 8px; background-color: #f5f5f5; border-radius: 12px; border: 1px solid #e0e0e0; font-size: 0.75rem;">${model}</div>`
        ).join(' ');
      }
    }
  ], []);

  // Definición personalizada para AG Grid
  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    filter: true,
    sortable: true,
    resizable: true
  }), []);

  // Función para obtener los datos de clasificación (GET)
  const fetchClassificationData = async (showLoadingIndicator = true) => {
    if (!user || !user.AppUser || !user.dbName) {
      showAlert('Credenciales de usuario no disponibles.', 'error');
      return;
    }
    
    if (showLoadingIndicator) {
      setIsLoading(true);
      setRefreshing(true);
    }
    
    try {
      const response = await axios.get('http://localhost:3000/obtenerClasificacion', {
        params: { appUser: user.AppUser, dbName: user.dbName }
      });
      
      // Capturar los datos en una variable local
      let localData = response.data.classificationData || [];
      
      // Transformar los datos antes de actualizarlos
      localData = localData.map(item => ({
        ...item,
        // Asegurar que estos campos existan para evitar errores
        Producto: item.Product || item.Producto || "",
        Canal: item.Channel || item.Canal || "",
        Ubicacion: item.Loc || item.Ubicacion || "",
        // El resto de campos
        Category: item.Category || "",
        ADI: item.ADI || 0,
        CV2: item.CV2 || 0,
        Data_Points: item.Data_Points || 0,
        fecha_clasificacion: item.fecha_clasificacion || new Date(),
        recommended_models: item.recommended_models || []
      }));
      
      // Verificar que los datos transformados sean válidos
      if (!Array.isArray(localData)) {
        console.error('Los datos no son un array después de la transformación');
        localData = [];
      }
      
      // Actualizar estados en orden
      setClassificationData(localData);
      
      // Solo procesar gráficos si hay datos
      if (localData.length > 0) {
        prepareCharts(localData);
        calculateSummaryStats(localData);
      } else {
        // Establecer estados vacíos explícitos
        setPieData(null);
        setScatterData([]);
        setSummaryStats(null);
      }
      
      // Mostrar alerta solo después de todo el procesamiento
      if (localData.length === 0) {
        showAlert('No hay datos de clasificación disponibles.', 'info');
      }

      setDataReady(true);
    } catch (error) {
      console.error('Error al obtener datos de clasificación:', error);
      showAlert('Error al obtener datos de clasificación', 'error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Función para calcular estadísticas resumidas
  const calculateSummaryStats = (data) => {
    if (!data || data.length === 0) {
      setSummaryStats(null);
      return;
    }

    // Agrupar por categorías
    const categoryGroups = data.reduce((acc, item) => {
      if (!acc[item.Category]) {
        acc[item.Category] = [];
      }
      acc[item.Category].push(item);
      return acc;
    }, {});

    // Calcular estadísticas para cada categoría
    const stats = {
      totalItems: data.length,
      categories: Object.keys(categoryGroups).map(category => ({
        name: category,
        count: categoryGroups[category].length,
        percentage: ((categoryGroups[category].length / data.length) * 100).toFixed(1),
        avgADI: categoryGroups[category]
          .filter(item => item.ADI)
          .reduce((sum, item) => sum + item.ADI, 0) / 
          (categoryGroups[category].filter(item => item.ADI).length || 1),
        avgCV2: categoryGroups[category]
          .filter(item => item.CV2)
          .reduce((sum, item) => sum + item.CV2, 0) / 
          (categoryGroups[category].filter(item => item.CV2).length || 1),
        totalDataPoints: categoryGroups[category].reduce((sum, item) => sum + (item.Data_Points || 0), 0)
      }))
    };

    setSummaryStats(stats);
  };

  // Función para preparar datos para las gráficas
  const prepareCharts = (data) => {
    console.log('prepareCharts llamado con datos:', data?.length || 0);
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        setPieData(null);
        setScatterData([]);
        return;
      }

      // Gráfica de pastel: distribución de series por categoría
      const counts = data.reduce((acc, item) => {
        if (item.Category) {
          acc[item.Category] = (acc[item.Category] || 0) + 1;
        }
        return acc;
      }, {});
      
      const labels = Object.keys(counts);
      const values = Object.values(counts);
      
      // Paleta de colores personalizada con asociación directa a categorías
      const categoryColorMap = {
        'Suave': '#1976d2', // azul
        'Intermitente': '#2e7d32', // verde
        'Lumpy/Irregular': '#d32f2f', // rojo
        'Errática': '#ed6c02' // naranja
      };

      // Asignar colores según las etiquetas
      const pieColors = labels.map(label => categoryColorMap[label] || '#757575');

      setPieData([
        {
          labels,
          values,
          type: 'pie',
          hoverinfo: 'label+percent+value',
          textinfo: 'percent',
          marker: {
            colors: pieColors,
            line: {
              color: '#ffffff',
              width: 2
            }
          },
          textfont: {
            size: 14,
            color: '#ffffff'
          }
        }
      ]);

      // Gráfica de dispersión: ADI vs CV² por categoría
      const categories = Array.from(new Set(data.filter(item => item.Category).map(item => item.Category)));
      
      const scatterTraces = categories.map((category, index) => {
        const filtered = data.filter(item => item.Category === category && item.ADI && item.CV2);
        
        return {
          x: filtered.map(item => item.ADI),
          y: filtered.map(item => item.CV2),
          mode: 'markers',
          type: 'scatter',
          name: category,
          marker: {
            size: 10,
            color: pieColors[index % pieColors.length],
            opacity: 0.7,
            line: {
              color: 'white',
              width: 1
            }
          },
        };
      });
      
      setScatterData(scatterTraces);
    } catch (error) {
      console.error('Error en prepareCharts:', error);
      // Valores por defecto para evitar romper UI
      setPieData(null);
      setScatterData([]);
    }
  };

  // Función para ejecutar la clasificación (POST)
  const runClassification = async () => {
    if (!user || !user.AppUser || !user.dbName) {
      showAlert('Credenciales de usuario no disponibles.', 'error');
      return;
    }
    
    setLoading(true);
    showAlert('Ejecutando proceso de clasificación...', 'info');
    
    try {
      const response = await axios.post('http://localhost:3000/runClassification', {
        dbName: user.dbName,
        appUser: user.AppUser
      });
      
      showAlert(response.data.message || 'Proceso ejecutado exitosamente.', 'success');
      await fetchClassificationData(false);
    } catch (error) {
      console.error('Error al ejecutar la clasificación:', error);
      showAlert('Error al ejecutar clasificación', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para exportar datos a CSV
  const exportToCSV = () => {
    if (!classificationData || classificationData.length === 0) {
      showAlert('No hay datos para exportar', 'warning');
      return;
    }

    // Convertir a CSV
    const headers = Object.keys(classificationData[0]).join(',');
    const csvRows = classificationData.map(row => {
      return Object.values(row).map(value => {
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        }
        return typeof value === 'string' ? `"${value}"` : value;
      }).join(',');
    });
    const csvString = [headers, ...csvRows].join('\n');
    
    // Crear y descargar el archivo
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clasificacion_demanda_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Al montar el componente, se cargan los datos existentes
  useEffect(() => {
    if (user) {
      fetchClassificationData();
    }
  }, [user]);

  // Configuración de layout para las gráficas
  const pieLayout = {
    height: 400,
    margin: { t: 30, b: 10, l: 10, r: 10 },
    title: '',
    font: { family: 'Roboto, Arial, sans-serif' },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)'
  };

  const scatterLayout = {
    height: 400,
    margin: { t: 30, b: 60, l: 60, r: 30 },
    title: '',
    font: { family: 'Roboto, Arial, sans-serif' },
    xaxis: { 
      title: 'ADI',
      gridcolor: '#f0f0f0',
      zeroline: true,
      zerolinecolor: '#e0e0e0',
      titlefont: { size: 14 },
      showline: true,
      linecolor: '#e0e0e0'
    },
    yaxis: { 
      title: 'CV²',
      gridcolor: '#f0f0f0',
      zeroline: true,
      zerolinecolor: '#e0e0e0',
      titlefont: { size: 14 },
      showline: true,
      linecolor: '#e0e0e0'
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    showlegend: true,
    legend: { orientation: 'h', yanchor: 'bottom', y: -0.2, xanchor: 'center', x: 0.5 },
    shapes: [
      // Líneas divisorias para categorías de clasificación
      {
        type: 'line',
        x0: 1.32,
        y0: 0,
        x1: 1.32,
        y1: 2.5,
        line: { color: 'gray', width: 1, dash: 'dash' }
      },
      {
        type: 'line',
        x0: 0,
        y0: 0.49,
        x1: 25,
        y1: 0.49,
        line: { color: 'gray', width: 1, dash: 'dash' }
      }
    ],
    annotations: [
      { 
        x: 0.7, y: 0.25, 
        text: 'Suave', 
        showarrow: false, 
        font: { size: 12, color: '#1976d2' }
      },
      { 
        x: 0.7, y: 1.5, 
        text: 'Errática', 
        showarrow: false, 
        font: { size: 12, color: '#ed6c02' }
      },
      { 
        x: 10, y: 0.25, 
        text: 'Intermitente', 
        showarrow: false, 
        font: { size: 12, color: '#2e7d32' }
      },
      { 
        x: 10, y: 1.5, 
        text: 'Lumpy/Irregular', 
        showarrow: false, 
        font: { size: 12, color: '#d32f2f' }
      }
    ]
  };

  // Función para manejar el evento de scroll y aplicar efectos
  const handleScroll = (e) => {
    // Puedes añadir aquí lógica adicional para efectos al hacer scroll
    // Por ejemplo, mostrar/ocultar elementos al hacer scroll
    // O aplicar animaciones basadas en la posición del scroll
  };

  // Añadir al inicio del componente, después de los useState
  useEffect(() => {
    const errorHandler = (event) => {
      // Detener propagación del error para debugging
      event.preventDefault();
      
      // Mostrar información detallada
      console.error('Error detectado:', {
        message: event.error?.message,
        stack: event.error?.stack,
        // Datos en ese momento
        dataLength: classificationData?.length || 0,
        // Ayuda a identificar qué objeto está causando el problema
        sampleData: classificationData?.[0] || null
      });
    };

    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, [classificationData]);

  // Al principio de render
  console.log('Renderizando con datos:', {
    hayDatos: classificationData?.length > 0,
    datosLength: classificationData?.length || 0
  });

  // En useEffect después de montar
  useEffect(() => {
    console.log('Componente montado, user:', !!user);
  }, []);

  return (
    <ScrollableContainer onScroll={handleScroll}>
      <Container maxWidth="xl">
        <StyledPaper sx={{ mb: 3, p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" fontWeight="500" color="primary">
                Clasificación de Demanda
              </Typography>
              <Typography variant="body1" color="text.secondary" mt={1}>
                Categorización de series de tiempo basada en los índices ADI (Average Demand Interval) y CV² (Squared Coefficient of Variation)
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2 }}>
              <ActionButton 
                variant="contained" 
                color="primary" 
                onClick={runClassification} 
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
              >
                Ejecutar Clasificación
              </ActionButton>
              
              <Tooltip title="Exportar datos">
                <IconButton 
                  color="primary" 
                  onClick={exportToCSV}
                  disabled={!classificationData.length}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </StyledPaper>

        <Fade in={alertInfo.show}>
          <Alert 
            severity={alertInfo.severity} 
            sx={{ mb: 3 }}
            onClose={() => setAlertInfo({ ...alertInfo, show: false })}
          >
            {alertInfo.message}
          </Alert>
        </Fade>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : !dataReady || classificationData.length === 0 ? (
          <StyledPaper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No hay datos de clasificación disponibles.
            </Typography>
          </StyledPaper>
        ) : (
          <React.Fragment>
            {summaryStats && (
              <StyledPaper sx={{ mb: 3 }}>
                <SectionTitle variant="h6">
                  Resumen de Clasificación
                </SectionTitle>
                <Grid container spacing={2}>
                  {summaryStats.categories.map((category) => (
                    <Grid item xs={12} sm={6} md={3} key={category.name}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            {category.name}
                          </Typography>
                          <Typography variant="h5" fontWeight="medium" mt={1}>
                            {category.count}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              ({category.percentage}%)
                            </Typography>
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              ADI promedio: <span style={{ fontWeight: 500 }}>{category.avgADI.toFixed(2)}</span>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              CV² promedio: <span style={{ fontWeight: 500 }}>{category.avgCV2.toFixed(2)}</span>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Puntos de datos: <span style={{ fontWeight: 500 }}>{category.totalDataPoints}</span>
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </StyledPaper>
            )}
            
            <Grid container spacing={3}>
              {pieData ? (
                <Grid item xs={12} md={6}>
                  <StyledPaper>
                    <SectionTitle variant="h6">
                      <span>Distribución de Categorías</span>
                      <Tooltip title="Distribución porcentual de las series de tiempo por categoría de demanda">
                        <InfoIcon fontSize="small" color="action" />
                      </Tooltip>
                    </SectionTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Plot
                        data={pieData}
                        layout={pieLayout}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </Box>
                  </StyledPaper>
                </Grid>
              ) : null}
              
              {scatterData.length > 0 && (
                <Grid item xs={12} md={6}>
                  <StyledPaper>
                    <SectionTitle variant="h6">
                      <span>Dispersión (ADI vs CV²)</span>
                      <Tooltip title="Visualización de la relación entre el intervalo promedio de demanda (ADI) y el coeficiente de variación al cuadrado (CV²)">
                        <InfoIcon fontSize="small" color="action" />
                      </Tooltip>
                    </SectionTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Plot
                        data={scatterData}
                        layout={scatterLayout}
                        config={{ responsive: true }}
                      />
                    </Box>
                  </StyledPaper>
                </Grid>
              )}
            </Grid>
            
            <StyledPaper sx={{ mt: 3 }}>
              <SectionTitle variant="h6">
                <TableChartIcon fontSize="small" sx={{ mr: 1 }} />
                Datos de Clasificación
                {refreshing && <CircularProgress size={20} sx={{ ml: 2 }} />}
              </SectionTitle>
              <TablaClasificacionDemanda data={classificationData} />
            </StyledPaper>
          </React.Fragment>
        )}
      </Container>
    </ScrollableContainer>
  );
};

export default PlaneacionDemanda_clasificacion;
export { getColorForString };
