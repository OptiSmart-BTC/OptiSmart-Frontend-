/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, InputLabel, FormControl, TablePagination, TextField } from '@mui/material';
import MyButton from '../components/ButtonConsult';
import InfoButton from '../components/InfoButton';
import './../styles/pages/planResultados.css';

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

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleNoChange = (event) => {
        /* hola */
    };

    const handleButtonClick = () => {
        const filePath = '/resultados_test.csv';

        // Fetch the CSV file
        fetch(filePath)
            .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
            })
            .then(text => {
            // Parse the CSV text
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                setData(results.data);
                },
            });
            })
            .catch(error => {
                console.error('Error while fetching and parsing the CSV file:', error);
        });
    };

    const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);

    return (
        <div className='planResultados'>
            <h1 className='titulo'>Resultados</h1>
            <div className='ParamsDiv'>
                <FormControl variant="outlined" className='Form' style={{ marginTop: '3vh' }}>
                    <InputLabel id="cal-label">Calendario</InputLabel>
                    <Select
                    labelId="cal-label"
                    id="cal"
                    label="Calendario"
                    onChange={handleNoChange}
                    >
                        {["Diario", "Semanal", "Mensual"].map((tiempo) => (
                            <MenuItem key={tiempo} value={tiempo}>
                                {tiempo}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <MyButton onClick={handleButtonClick} texto={"Consultar"} mL='3vw' height='7vh' mT='3vh' mR='.1vw' />
                <InfoButton information={"Aquí se muestran los resultados de la simulación"} />
            </div>

            <div className='TablaDiv'>
                <TableContainer component={Paper} className='tableContainer'>
                    <Table stickyHeader aria-label="simple table">
                        <TableHead>
                        <TableRow>
                        {data.length > 0 && Object.keys(data[0]).map((key) => (
                        <TableCell
                            key={key} style={key === 'SKU' ? stickyHeadStyle : null}
                        > 
                            {key}
                        </TableCell>
                        ))}
                        </TableRow>
                        </TableHead>
                        <TableBody>
                            {rowsPerPage > 0
                                ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                    {Object.keys(data[0]).map((colKey, colIndex) => (
                                        <TableCell key={colIndex} style={colKey === 'SKU' ? stickyColumnStyle : null}>
                                        {row[colKey]}
                                        </TableCell>
                                    ))}
                                    </TableRow>
                                ))
                                : null}

                            {emptyRows > 0 && (
                                <TableRow style={{ height: 53 * emptyRows }}>
                                <TableCell colSpan={6} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 100]}
                component="div"
                count={data.length}
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
