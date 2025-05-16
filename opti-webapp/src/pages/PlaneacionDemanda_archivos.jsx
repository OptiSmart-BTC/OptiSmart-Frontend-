import React, { useState, useEffect } from 'react';
import { 
  Button, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Stack,
  Typography,
  Container,
  Paper,
  Snackbar,
  Alert,
  Box,
  LinearProgress,
  Collapse,
  TextField,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from './../components/AuthContext';
import axios from 'axios';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import UpdateIcon from '@mui/icons-material/Update';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CloseIcon from '@mui/icons-material/Close';
import Spinner from './../components/Spinner';

// Botón de carga de archivo personalizado
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// Campo de texto para logs con desplazamiento
const LogTextField = styled(TextField)(({ theme }) => ({
  '.MuiInputBase-root': {
    fontFamily: 'monospace',
    fontSize: '0.875rem',
  },
  marginTop: theme.spacing(2)
}));

// Opciones de tablas disponibles
const tableOptions = [
  { value: "historico_demanda", label: "Histórico de demanda" },
  { value: "Listado_productos", label: "Listado de Productos" },
  { value: "Listado_canales", label: "Listado de Canales" },
  { value: "Listado_ubicaciones", label: "Listado de Ubicaciones" }
];

const FileManagement = () => {
  const { user } = useAuth();
  const [selectedTable, setSelectedTable] = useState('historico_demanda');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Estados para la visualización de logs
  const [logContent, setLogContent] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  // Efecto para obtener la URL de la API desde variables de entorno (si estuvieran disponibles)
  useEffect(() => {
    // Si en el futuro implementas variables de entorno, podrías hacer algo como:
    // setApiUrl(process.env.REACT_APP_API_URL || 'http://localhost:3000');
  }, []);

  // Manejador para cambiar la tabla seleccionada
  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
  };

  // Manejador para seleccionar el archivo
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validación básica del tipo de archivo
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
        showNotification('Por favor selecciona un archivo CSV o Excel', 'error');
        return;
      }
      setFile(selectedFile);
      showNotification(`Archivo "${selectedFile.name}" seleccionado`, 'info');
    }
  };

  // Función para mostrar notificaciones
  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  // Manejador para cerrar notificaciones
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Preparar datos para las peticiones
  const prepareFormData = () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('table', selectedTable);
    formData.append('selectedCollection', selectedTable);
    formData.append('appUser', user.AppUser);
    formData.append('DBName', user.dbName);
    return formData;
  };

  // Función para obtener el contenido del archivo de logs
  const fetchLogContent = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/logs`, {
        params: {
          appUser: user.AppUser,
          DBName: user.dbName,
          fileName: 'Logs_demanda.log'
        }
      });
      
      setLogContent(response.data);
      setShowLogs(true);
    } catch (error) {
      console.error('Error al obtener el archivo de logs:', error);
      showNotification('No se pudo cargar el archivo de logs', 'error');
      setLogContent('Error al cargar los logs: ' + (error.response?.data?.message || error.message));
      setShowLogs(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador para subir el archivo
  const handleUpload = async () => {
    if (!file) {
      showNotification('Por favor selecciona un archivo', 'warning');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    try {
      const formData = prepareFormData();
      const response = await axios.post(`${apiUrl}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      showNotification('Archivo subido exitosamente', 'success');
      // Obtener los logs después de completar la acción
      await fetchLogContent();
    } catch (error) {
      showNotification(`Error: ${error.response?.data?.message || 'No se pudo subir el archivo'}`, 'error');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Manejador para descargar el archivo
  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/download-collection`,
        {
          appUser: user.AppUser,
          DBName: user.dbName,
          selectedCollection: selectedTable,
        },
        { responseType: 'blob' }
      );

      // Obtener el nombre de la tabla seleccionada (etiqueta legible)
      const tableInfo = tableOptions.find(option => option.value === selectedTable);
      const fileName = `${tableInfo ? tableInfo.label : selectedTable}.csv`;
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('Descarga iniciada correctamente', 'success');
      // Obtener los logs después de completar la acción
      await fetchLogContent();
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      showNotification('Hubo un error al descargar el archivo', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador para actualizar el archivo
  const handleUpdate = async () => {
    if (!file) {
      showNotification('Por favor selecciona un archivo', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const formData = prepareFormData();
      const response = await axios.post(`${apiUrl}/update-collection`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      showNotification('Archivo actualizado exitosamente', 'success');
      console.log(`Archivo actualizado para ${selectedTable}:`, response.data);
      // Obtener los logs después de completar la acción
      await fetchLogContent();
    } catch (error) {
      console.error('Error al actualizar el archivo:', error);
      showNotification(`Error: ${error.response?.data?.message || 'No se pudo actualizar el archivo'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador para ver logs directamente
  const handleViewLogs = () => {
    fetchLogContent();
  };

  // Manejador para cerrar la vista de logs
  const handleCloseLogs = () => {
    setShowLogs(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {isLoading && <Spinner />}
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Gestión de Información
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#012652' }}>
            Seleccione la tabla a gestionar:
          </Typography>
          
          <RadioGroup value={selectedTable} onChange={handleTableChange}>
            {tableOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio sx={{ color: '#012652', '&.Mui-checked': { color: '#012652' } }} />}
                label={<Typography sx={{ fontSize: '1.1rem' }}>{option.label}</Typography>}
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<DescriptionIcon />}
            sx={{ 
              mb: 2,
              borderColor: '#012652',
              color: '#012652',
              '&:hover': { borderColor: '#014b96', backgroundColor: '#f0f7ff' }
            }}
          >
            {file ? `Archivo: ${file.name}` : "Seleccionar Archivo"}
            <VisuallyHiddenInput type="file" onChange={handleFileChange} />
          </Button>
          
          {file && (
            <Typography variant="body2" color="text.secondary">
              Tamaño: {(file.size / 1024).toFixed(2)} KB | Tipo: {file.type || "Desconocido"}
            </Typography>
          )}
        </Box>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="center"
          sx={{ mt: 2 }}
        >
          <Button 
            variant="contained" 
            onClick={handleUpload} 
            startIcon={<CloudUploadIcon />}
            sx={{ 
              bgcolor: '#012652', 
              '&:hover': { bgcolor: '#014b96' },
              minWidth: '180px'
            }}
          >
            Cargar Nuevo
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleDownload} 
            startIcon={<CloudDownloadIcon />}
            sx={{ 
              bgcolor: '#0a8754', 
              '&:hover': { bgcolor: '#076d43' },
              minWidth: '180px'
            }}
          >
            Descargar Actual
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleUpdate} 
            startIcon={<UpdateIcon />}
            sx={{ 
              bgcolor: '#d17f00', 
              '&:hover': { bgcolor: '#b36b00' },
              minWidth: '180px'
            }}
          >
            Actualizar
          </Button>
        </Stack>

        {/* Botón para ver logs */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleViewLogs}
            startIcon={<AssessmentIcon />}
            sx={{
              borderColor: '#555',
              color: '#555',
              '&:hover': { borderColor: '#333', backgroundColor: '#f5f5f5' }
            }}
          >
            Ver Registro de Actividad
          </Button>
        </Box>

        {/* Área de visualización de logs */}
        <Collapse in={showLogs} sx={{ mt: 3 }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              bgcolor: '#f8f9fa', 
              position: 'relative',
              borderLeft: '4px solid #012652'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" component="h3" sx={{ color: '#012652' }}>
                Registro de Actividad (Logs_demanda.log)
              </Typography>
              <IconButton onClick={handleCloseLogs} size="small" sx={{ color: '#555' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <LogTextField
              multiline
              fullWidth
              variant="outlined"
              value={logContent}
              InputProps={{
                readOnly: true,
              }}
              minRows={8}
              maxRows={15}
            />
          </Paper>
        </Collapse>
      </Paper>
      
      {/* Sistema de notificaciones */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      {isLoading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <Typography variant="body2" align="center">{uploadProgress}%</Typography>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />
        </Box>
      )}
    </Container>
  );
};

export default FileManagement;