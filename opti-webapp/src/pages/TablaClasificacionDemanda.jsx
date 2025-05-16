import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  Tooltip,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { getColorForString } from './PlaneacionDemanda_clasificacion';


// Componente estilizado para la tabla
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
    fontWeight: 600,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.2s ease',
  },
  // ocultar el borde inferior de la última fila
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const TablaClasificacionDemanda = ({ data }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('Producto');
  const [filteredData, setFilteredData] = useState(data);

  // Función para realizar el ordenamiento
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);

    // Ordenar datos
    const sortedData = [...filteredData].sort((a, b) => {
      // Si es un número
      if (typeof a[property] === 'number' && typeof b[property] === 'number') {
        return isAsc 
          ? a[property] - b[property] 
          : b[property] - a[property];
      }
      // Si es una cadena
      if (a[property] && b[property]) {
        return isAsc 
          ? a[property].toString().localeCompare(b[property].toString()) 
          : b[property].toString().localeCompare(a[property].toString());
      }
      return 0;
    });
    
    setFilteredData(sortedData);
  };

  // Función para manejar el cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Función para manejar el cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Creamos un componente para renderizar las celdas con color según categoría
  const CategoryCell = ({ category }) => {
    const categoryColors = {
      'Suave': '#1976d2', // azul
      'Intermitente': '#2e7d32', // verde
      'Lumpy/Irregular': '#d32f2f', // rojo
      'Errática': '#ed6c02' // naranja
    };
    const color = categoryColors[category] || '#757575';
    
    return (
      <Chip 
        label={category} 
        size="small"
        sx={{ 
          bgcolor: color, 
          color: 'white',
          fontWeight: 500,
        }} 
      />
    );
  };

  // Componente para el canal con color
  const ChannelCell = ({ canal }) => {
    if (!canal) {
      return (
        <Chip 
          label="Sin canal" 
          size="small"
          sx={{ 
            bgcolor: '#757575', 
            color: 'white',
            fontWeight: 500,
          }} 
        />
      );
    }
    
    // Generar color dinámico basado en el nombre del canal
    const color = getColorForString(canal);
    
    return (
      <Chip 
        label={canal} 
        size="small"
        sx={{ 
          bgcolor: color, 
          color: 'white',
          fontWeight: 500,
        }} 
      />
    );
  };

  // Componente para renderizar modelos recomendados
  const RecommendedModelsCell = ({ models }) => {
    if (!models) return null;
    
    const modelList = Array.isArray(models) ? models : [models];
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {modelList.map((model, index) => (
          <Chip 
            key={index}
            label={model}
            size="small"
            variant="outlined"
            sx={{ 
              bgcolor: '#f5f5f5', 
              border: '1px solid #e0e0e0',
              fontSize: '0.75rem',
            }} 
          />
        ))}
      </Box>
    );
  };

  // Formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('es-MX');
  };

  // Verificar si hay datos
  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No hay datos de clasificación disponibles.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader aria-label="tabla de clasificación de demanda">
          <TableHead>
            <TableRow>
              <StyledTableCell>
                <TableSortLabel
                  active={orderBy === 'Producto'}
                  direction={orderBy === 'Producto' ? order : 'asc'}
                  onClick={() => handleRequestSort('Producto')}
                >
                  Producto
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>
                <TableSortLabel
                  active={orderBy === 'Canal'}
                  direction={orderBy === 'Canal' ? order : 'asc'}
                  onClick={() => handleRequestSort('Canal')}
                >
                  Canal
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>
                <TableSortLabel
                  active={orderBy === 'Ubicacion'}
                  direction={orderBy === 'Ubicacion' ? order : 'asc'}
                  onClick={() => handleRequestSort('Ubicacion')}
                >
                  Ubicación
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell align="right">
                <TableSortLabel
                  active={orderBy === 'ADI'}
                  direction={orderBy === 'ADI' ? order : 'asc'}
                  onClick={() => handleRequestSort('ADI')}
                >
                  ADI
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell align="right">
                <TableSortLabel
                  active={orderBy === 'CV2'}
                  direction={orderBy === 'CV2' ? order : 'asc'}
                  onClick={() => handleRequestSort('CV2')}
                >
                  CV²
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>
                <TableSortLabel
                  active={orderBy === 'Category'}
                  direction={orderBy === 'Category' ? order : 'asc'}
                  onClick={() => handleRequestSort('Category')}
                >
                  Categoría
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell align="right">
                <TableSortLabel
                  active={orderBy === 'Data_Points'}
                  direction={orderBy === 'Data_Points' ? order : 'asc'}
                  onClick={() => handleRequestSort('Data_Points')}
                >
                  Datos
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>
                <TableSortLabel
                  active={orderBy === 'fecha_clasificacion'}
                  direction={orderBy === 'fecha_clasificacion' ? order : 'asc'}
                  onClick={() => handleRequestSort('fecha_clasificacion')}
                >
                  Fecha Clasificación
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell>Modelos Recomendados</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <StyledTableRow key={index}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                    {row.Producto}
                  </TableCell>
                  <TableCell>
                    <ChannelCell canal={row.Canal} />
                  </TableCell>
                  <TableCell>{row.Ubicacion}</TableCell>
                  <TableCell align="right" 
                    sx={{ 
                      bgcolor: row.ADI > 3 ? 'rgba(255, 152, 0, 0.15)' : 'inherit'
                    }}
                  >
                    {row.ADI ? row.ADI.toFixed(4) : '-'}
                  </TableCell>
                  <TableCell align="right"
                    sx={{ 
                      bgcolor: row.CV2 > 0.5 ? 'rgba(244, 67, 54, 0.15)' : 'inherit'
                    }}
                  >
                    {row.CV2 ? row.CV2.toFixed(4) : '-'}
                  </TableCell>
                  <TableCell>
                    <CategoryCell category={row.Category} />
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    color: row.Data_Points < 10 ? '#d32f2f' : 
                           row.Data_Points < 30 ? '#ed6c02' : 'inherit'
                  }}>
                    {row.Data_Points}
                  </TableCell>
                  <TableCell>{formatDate(row.fecha_clasificacion)}</TableCell>
                  <TableCell>
                    <RecommendedModelsCell models={row.recommended_models} />
                  </TableCell>
                </StyledTableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[15, 25, 50]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Box>
  );
};

export default TablaClasificacionDemanda;