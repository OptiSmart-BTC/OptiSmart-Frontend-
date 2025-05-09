/* eslint-disable no-unused-vars -TEST */
import React, { useState } from 'react';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, InputLabel, TextField, FormControl, TablePagination, Button } from '@mui/material';
import MyButton from '../components/ButtonConsult';
import InfoButton from '../components/InfoButton';
import './../styles/pages/planResultados.css';
import Spinner from './../components/Spinner';
import { useAuth } from './../components/AuthContext';



const stickyColumnStyle = {
    backgroundColor: '#012148',
    position: 'sticky',
    left: 0,
    zIndex: 1000,
    color: 'white',
    boxShadow: '2px 0px 5px rgba(0,0,0,0.5)', 
};

const stickyHeadStyle = {
    position: 'sticky',
    left: 0,
    boxShadow: '2px 0px 5px rgba(0,0,0,0.5)',
    zIndex: 1200,
};

function PlanResultados() {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [loaded, setLoaded] = useState(false); // Estado para controlar la carga
    const [calendar, setCalendar] = useState('');  // Estado para controlar el calendario
    const [error, setError] = useState(''); // Estado para manejar errores
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState('CSV'); // Estado para el tipo de reporte
    const { user } = useAuth();
    const [overrideValues, setOverrideValues] = useState({});
    const [filteredData, setFilteredData] = useState([]); // Para mostrar datos filtrados
    const [searchTerm, setSearchTerm] = useState(''); // Para almacenar el término de búsqueda
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleCalendarChange = (event) => {
        setCalendar(event.target.value);
    };

    const handleSearchChange = (event) => {
        const term = event.target.value.toLowerCase();
        setSearchTerm(term);
        if (term === '') {
            setFilteredData(data); // Mostrar todos los datos si el filtro está vacío
        } else {
            const filtered = data.filter((row) =>
                Object.values(row).some((value) =>
                    value.toString().toLowerCase().includes(term)
                )
            );
            setFilteredData(filtered);
        }
    };

    // Asegúrate de actualizar filteredData cuando se actualice data
    React.useEffect(() => {
        setFilteredData(data);
    }, [data]);

    const handleExecutePlanReposicion = async () => {
        setLoading(true); // Activar el spinner al inicio de la operación
        try {
            if (calendar !== 'Ambos') {
                const url = calendar === 'Diario' ? `${import.meta.env.VITE_API_URL}/runPlanReposicionDiario` : `${import.meta.env.VITE_API_URL}/runPlanReposicionSemanal`;
    
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        appUser: user.AppUser,
                        appPass: user.password,
                        DBName: user.dbName
                    })
                });
    
                if (!response.ok) {
                    throw new Error('Error en la ejecución');
                }
            } else {
                // Ejecutar ambas funciones asincrónicamente y esperar que ambas terminen
                const [response, response2] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/runPlanReposicionDiario`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            appUser: user.AppUser,
                            appPass: user.password,
                            DBName: user.dbName
                        })
                    }),
                    fetch(`${import.meta.env.VITE_API_URL}/runPlanReposicionSemanal`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            appUser: user.AppUser,
                            appPass: user.password,
                            DBName: user.dbName
                        })
                    })
                ]);
    
                if (!response.ok || !response2.ok) {
                    throw new Error('Error en la ejecución');
                }
            }
            alert('Se ejecutó correctamente el Plan de Reposición');
        } catch (error) {
            console.error('Error en la ejecución:', error);
            alert('Error en la ejecución');
        } finally {
            setLoading(false); // Desactivar el spinner al finalizar todas las operaciones
        }
    };

    const handleButtonClick = async () => {
        setLoading(true);

        if (reportType === 'CSV') {
            const url = `${import.meta.env.VITE_API_URL}/getCSVPlanReposicion`;
    
            if (url && calendar) {
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            appUser: user.AppUser,
                            appPass: user.password,
                            DBName: user.dbName,
                            type: 'PlanReposicion',
                            cal: calendar,
                        }),
                    });
    
                    if (!response.ok) {
                        throw new Error(`Network response was not ok: ${response.statusText}`);
                    }
    
                    const blob = await response.blob();
                    const reader = new FileReader();
    
                    reader.onload = (event) => {
                        const text = event.target.result;
                        Papa.parse(text, {
                            header: true,
                            skipEmptyLines: true,
                            complete: (results) => {
                                setData(results.data);
                                setLoading(false);
                            },
                        });
                    };
    
                    reader.readAsText(blob);
                } catch (error) {
                    console.error('Error while fetching and parsing the CSV file:', error);
                    setError(`Error: ${error.message}`);
                    setLoading(false);
                }
            } else {
                alert('Por favor selecciona un calendario');
                setLoading(false);
            }
        } else if (reportType === 'Dashboard') {
            setLoading(false);
        }
    };

    const handleDownloadClick = () => {
        // Crear una copia de los datos originales
        const updatedData = data.map((row, index) => {
            // Si hay un valor de override para la fila actual, lo agregamos al objeto
            if (overrideValues[index] !== undefined) {
                return {
                    ...row,
                    'Plan_Firme_Pallets': overrideValues[index], // Añadir la columna con el valor de override
                };
            }
            return row; // Si no hay override, retornamos la fila tal como está
        });
    
        // Generar el CSV con los datos actualizados
        const csv = Papa.unparse(updatedData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resultados.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleOverrideChange = (rowIndex, value) => {
        setOverrideValues((prev) => ({
            ...prev,
            [rowIndex]: value, // Guardamos el valor ingresado en la celda correspondiente
        }));
    };
    
    const handleApplyOverride = async () => {
        setLoading(true);
        try {
            const commonBody = {
                appUser: user.AppUser,
                appPass: user.password,
                DBName: user.dbName,
                overrideValues, // Agregamos los valores de las celdas al cuerpo de la petición
            };
            console.log('Enviando overrideValues:', overrideValues);  // Verifica los valores aquí
    
            let response;
        
            if (calendar === 'Diario') {
                // Ejecutar solo el endpoint de Diario
                response = await fetch(`${import.meta.env.VITE_API_URL}/runOverridePlanReposicion`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(commonBody) // Mandamos el cuerpo con los valores de las celdas
                });
            } else if (calendar === 'Semanal') {
                // Ejecutar solo el endpoint de Semanal
                response = await fetch(`${import.meta.env.VITE_API_URL}/runOverridePlanReposicion_Sem`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(commonBody) // Mandamos el cuerpo con los valores de las celdas
                });
            } else if (calendar === 'Ambos') {
                // Ejecutar ambos endpoints (Diario y luego Semanal)
                const responseDiario = await fetch(`${import.meta.env.VITE_API_URL}/runOverridePlanReposicion`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(commonBody)
                });
        
                if (!responseDiario.ok) {
                    throw new Error('Error en la ejecución del endpoint Diario');
                }
        
                const responseSemanal = await fetch(`${import.meta.env.VITE_API_URL}/runOverridePlanReposicion_Sem`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(commonBody)
                });
        
                if (!responseSemanal.ok) {
                    throw new Error('Error en la ejecución del endpoint Semanal');
                }
        
                alert('Se ejecutaron correctamente ambos overrides');
                return; // Salir de la función después de ejecutar ambos endpoints
            } else {
                throw new Error('Tipo de calendario no soportado');
            }
        
            if (!response.ok) {
                throw new Error('Error en la ejecución');
            }
        
            alert('Se ejecutó correctamente el Override');
        } catch (error) {
            console.error('Error en la ejecución:', error);
            alert('Error en la ejecución');
        } finally {
            setLoading(false); // Desactivar el spinner al finalizar todas las operaciones
        }
    };
    

    return (
        <div className='planResultados' style={{ maxHeight: '90vh' }}>
    {loading && (
        <div className="spinner-overlay">
            <Spinner />
        </div>
    )}
    {error && <div className='error'>{error}</div>}
    <h1 className='titulo'>Ejecución y Resultados</h1>

    {/* Contenedor de selector de calendario y botones */}
    <div className="ParamsDiv">
        <FormControl variant="outlined" style={{ minWidth: 200 }}>
            <InputLabel id="cal-label">Calendario</InputLabel>
            <Select
                labelId="cal-label"
                id="cal"
                value={calendar}
                onChange={handleCalendarChange}
                label="Calendario"
            >
                <MenuItem value="Diario">Diario</MenuItem>
                <MenuItem value="Semanal">Semanal</MenuItem>
                <MenuItem value="Ambos">Ambos</MenuItem>
            </Select>
        </FormControl>

        {/* Botones */}
        <div className="button-info">
            <MyButton onClick={handleExecutePlanReposicion} texto={"Ejecutar Plan de Reposición"} />
            <MyButton onClick={handleButtonClick} texto={"Consultar Resultados"} />
            <MyButton className="resultados-button" onClick={handleDownloadClick} texto={"Descargar Resultados"} />
        </div>
    </div>



    
            {/* Campo de búsqueda (solo aparece si hay datos) */}
            {filteredData.length > 0 && (
                <div style={{ marginTop: '2vh' }}>
                    <TextField
                        variant="outlined"
                        placeholder="Buscar en los resultados..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        style={{ maxWidth: '300px' }}
                    />
                </div>
            )}
    
            {/* Tabla con datos filtrados */}
            <div className='TablaDiv'>
                {filteredData.length > 0 && (
                    <TableContainer component={Paper} className='tableContainer'>
                        <Table stickyHeader aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    {Object.keys(filteredData[0]).map((key) => (
                                        <TableCell key={key}>
                                            {key}
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        Override_Plan_Firme_Pallets
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {Object.keys(row).map((colKey, colIndex) => (
                                            <TableCell key={colIndex}>
                                                {row[colKey]}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                value={overrideValues[rowIndex] || ''}
                                                onChange={(e) => handleOverrideChange(rowIndex, e.target.value)}
                                                variant="outlined"
                                                inputProps={{ min: "0" }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </div>
    
            {/* Botón para aplicar override (solo aparece si hay datos) */}
            {filteredData.length > 0 && (
                <Button
                    onClick={handleApplyOverride}
                    variant="contained"
                    color="primary"
                    style={{ marginTop: '3vh' }}
                >
                    Aplicar Override
                </Button>
            )}
    
            {/* Paginación */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 100]}
                component="div"
                count={filteredData.length}
                labelRowsPerPage={"Filas por página"}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </div>
    );
    
    
    
}

export default PlanResultados;

