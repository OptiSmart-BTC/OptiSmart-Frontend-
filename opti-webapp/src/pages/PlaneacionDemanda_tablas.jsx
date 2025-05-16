import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Button, Typography, Chip, IconButton, Divider, Card, CardContent } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { TextField, MenuItem, InputAdornment } from '@mui/material';
import { useAuth } from './../components/AuthContext';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Configuración de columnas por tabla
const columnsConfig = {
  historico_demanda: [
    { field: 'Producto', headerName: 'Unidad de Demanda', width: 180, headerClassName: 'super-app-theme--header', headerAlign: 'center' },
    { field: 'Canal', headerName: 'Grupo de Demanda', width: 180, headerClassName: 'super-app-theme--header', headerAlign: 'center' },
    { field: 'Ubicacion', headerName: 'Ubicación', width: 150, headerClassName: 'super-app-theme--header', headerAlign: 'center' },
    { field: 'Fecha', headerName: 'Fecha de Inicio', width: 200, headerClassName: 'super-app-theme--header', headerAlign: 'center' },
    { field: 'Cantidad', headerName: 'Cantidad', width: 130, headerClassName: 'super-app-theme--header', headerAlign: 'center' },
  ],
  Listado_productos: [
    { field: 'Producto', headerName: 'Producto', width: 150, headerClassName: 'super-app-theme--header', headerAlign: 'center' },
    { field: 'Desc', headerName: 'Descripción', width: 250, headerClassName: 'super-app-theme--header', headerAlign: 'center' },
  ],
  Listado_canales: [
    { field: 'Canal', headerName: 'Canal', width: 150, headerClassName: 'super-app-theme--header', headerAlign: 'center' },
    { field: 'Desc', headerName: 'Descripción', width: 250, headerClassName: 'super-app-theme--header', headerAlign: 'center' },
  ],
  Listado_ubicaciones: [
    { field: 'Ubicacion', headerName: 'Ubicación', width: 150, headerClassName: 'super-app-theme--header', headerAlign: 'center' },
    { field: 'Desc', headerName: 'Descripción', width: 250, headerClassName: 'super-app-theme--header', headerAlign: 'center' },
  ],
};

const DemandTable = () => {
  const { user } = useAuth();
  const [selectedTable, setSelectedTable] = useState('historico_demanda');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortModel, setSortModel] = useState([]);

  // Cambiar tabla seleccionada
  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
    setData([]); // Limpiar datos al cambiar de tabla
    setFilters({}); // Limpiar filtros
  };

  // Cargar datos según tabla seleccionada
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/api/${selectedTable}?appUser=${user.AppUser}&DBName=${user.dbName}`
        );
        const result = await response.json();
        const formattedData = result.map((item, index) => ({
          id: index,
          ...item,
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTable, user]);

  const columns = columnsConfig[selectedTable];

  const uniqueValues = (field) => {
    return [...new Set(data.map((item) => item[field]))];
  };

  const filteredData = data.filter((row) =>
    Object.keys(filters).every((key) =>
      filters[key] ? row[key]?.toString().includes(filters[key]) : true
    )
  );

  const handleFilterChange = (field) => (event) => {
    setFilters({ ...filters, [field]: event.target.value });
  };

  // Función para refrescar los datos
  const handleRefresh = () => {
    fetchData();
  };

  // Función para busqueda global
  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  // Aplicar filtro de búsqueda global a los datos
  const globalFilteredData = filteredData.filter(
    (row) => 
      !searchText || 
      Object.keys(row).some(
        (key) => 
          typeof row[key] === 'string' && 
          row[key].toLowerCase().includes(searchText.toLowerCase())
      )
  );

  // Manejar exportación personalizada
  const handleExport = () => {
    const csvContent = 
      columns.map(col => col.headerName).join(',') + 
      '\n' + 
      globalFilteredData.map(row => 
        columns.map(col => row[col.field]).join(',')
      ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card sx={{ m: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom color="primary">
          Planeación de Demanda
        </Typography>
        
        <Divider sx={{ mb: 2 }} />

        <Tabs
          value={selectedTable}
          onChange={(e, newValue) => setSelectedTable(newValue)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab value="historico_demanda" label="Histórico de Demanda" />
          <Tab value="Listado_productos" label="Productos" />
          <Tab value="Listado_canales" label="Canales" />
          <Tab value="Listado_ubicaciones" label="Ubicaciones" />
        </Tabs>

        <Box sx={{ display: 'flex', mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            label="Buscar"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={handleSearchChange}
            sx={{ width: '300px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Box>
            <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? "primary" : "default"}>
              <FilterListIcon />
            </IconButton>
            <IconButton onClick={handleRefresh} color="default">
              <RefreshIcon />
            </IconButton>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              size="small"
              sx={{ ml: 1 }}
            >
              Exportar
            </Button>
          </Box>
        </Box>

        {showFilters && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            {columns.map((column) => (
              <TextField
                key={column.field}
                select
                label={`Filtrar ${column.headerName}`}
                value={filters[column.field] || ''}
                onChange={handleFilterChange(column.field)}
                variant="outlined"
                size="small"
                sx={{ minWidth: '200px', flexGrow: 1 }}
              >
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {uniqueValues(column.field).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            ))}
            {Object.keys(filters).length > 0 && (
              <Button 
                variant="outlined"
                onClick={() => setFilters({})}
                size="small"
              >
                Limpiar filtros
              </Button>
            )}
          </Box>
        )}

        {Object.keys(filters).length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {Object.entries(filters).filter(([_, value]) => value).map(([key, value]) => (
              <Chip
                key={key}
                label={`${columns.find(col => col.field === key)?.headerName}: ${value}`}
                onDelete={() => setFilters({...filters, [key]: ''})}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        )}

        <Box sx={{ height: '70vh', width: '100%' }}>
          <DataGrid
            rows={globalFilteredData}
            columns={columns.map(col => ({
              ...col,
              renderCell: (params) => {
                // Formatos específicos según tipo de datos
                if (col.field === 'Fecha' && params.value) {
                  // Parsear explícitamente como UTC y formatear con la configuración local
                  return format(parseISO(params.value), 'dd/MM/yyyy', { locale: es });
                }
                if (col.field === 'Cantidad' && params.value) {
                  return Number(params.value).toLocaleString();
                }
                return params.value;
              }
            }))}
            pagination
            pageSize={pageSize}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            page={page}
            onPageChange={(newPage) => setPage(newPage)}
            sortModel={sortModel}
            onSortModelChange={(model) => setSortModel(model)}
            disableSelectionOnClick
            loading={loading}
            density="standard"
            components={{
              Toolbar: GridToolbar,
            }}
            componentsProps={{
              toolbar: {
                showQuickFilter: false,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            sx={{
              '& .MuiDataGrid-cell': {
                fontSize: '14px',
              },
              '& .super-app-theme--header': {
                backgroundColor: '#012652',
                color: 'white',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-row:nth-of-type(odd)': {
                backgroundColor: '#f5f5f5',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#e3f2fd',
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default DemandTable;