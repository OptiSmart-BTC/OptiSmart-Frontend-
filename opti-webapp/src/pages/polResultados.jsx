/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, InputLabel, FormControl, TablePagination, Radio, RadioGroup, FormControlLabel, TextField, Button } from '@mui/material';
import MyButton from '../components/ButtonConsult';
import { useAuth } from './../components/AuthContext';
import Spinner from './../components/Spinner';
import './../styles/pages/polResultados.css';
import InfoButton from '../components/InfoButton';


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

const PolResultados = () => {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [selectedValue, setSelectedValue] = useState('clasifABCD');
    const [calendar, setCalendar] = useState('');
    const [subtype, setSubtype] = useState('');

    const [loading, setLoading] = useState(false);
    const [overrideValues, setOverrideValues] = useState({});
    const [generalOverride, setGeneralOverride] = useState(0); // Estado para controlar el valor del override general
    const [selectedOverride, setSelectedOverride] = useState('individual'); // Nuevo estado para controlar el override
    const [overrideType, setOverrideType] = useState('SS_Cantidad'); // Estado para el selector de SS_Cantidad o ROP
    const [searchFilter, setSearchFilter] = useState("");

    const { user } = useAuth();
    useEffect(() => {
        const createInitialBackup = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/backupInitialData`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        appUser: user.AppUser,
                        appPass: user.password,
                        DBName: user.dbName,
                        tipoProceso: 'Diario' 
                    })
                });
    
                if (!response.ok) {
                    const errorMessage = await response.text();
                    console.warn('Advertencia al crear el backup:', errorMessage);
                    return;
                }
    
                console.log('Respuesta del backup:', await response.text());
            } catch (error) {
                console.error('Error al crear el backup inicial:', error);
            }
        };
    
        createInitialBackup();
    }, [user]);

    const [userRole, setUserRole] = useState(null); // Rol del usuario
    const [rolePermissions, setRolePermissions] = useState([]); // Permisos del rol

  // Función para obtener el rol y permisos del usuario al cargar el componente
  useEffect(() => {
    const fetchUserRoleAndPermissions = async () => {
      try {
        // Consultar la API para obtener los datos del usuario
        const userResponse = await fetch(
          `http://localhost:3000/api/users?AppUser=${user.AppUser}`
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log("Datos del usuario obtenidos:", userData);

          // Buscar el documento donde aparece el usuario actual
          const matchingUserDoc = userData.find((doc) =>
            doc.UserUI.some((uiUser) => uiUser.AppUser === user.AppUser)
          );

          if (matchingUserDoc) {
            // Buscar el usuario específico en el array UserUI
            const matchingUser = matchingUserDoc.UserUI.find(
              (uiUser) => uiUser.AppUser === user.AppUser
            );

            // Validar si el usuario tiene el campo `rol` asignado
            if (matchingUser && matchingUser.rol) {
              const roleName = matchingUser.rol;
              setUserRole(roleName); // Guardar el rol del usuario
              console.log(`Rol asignado al usuario: ${roleName}`);

              // Obtener los permisos del rol desde la colección de roles
              const rolesResponse = await fetch(
                "http://localhost:3000/api/roles"
              );
              if (rolesResponse.ok) {
                const rolesData = await rolesResponse.json();
                const roleData = rolesData.find(
                  (role) => role.name === roleName
                );

                if (roleData) {
                  setRolePermissions(roleData.permissions);
                  console.log(
                    `Permisos del rol '${roleName}':`,
                    roleData.permissions
                  );
                } else {
                  console.error(
                    `No se encontraron datos para el rol '${roleName}'.`
                  );
                }
              } else {
                console.error("Error al obtener los datos de roles.");
              }
            } else {
              console.warn(
                `El usuario '${user.AppUser}' no tiene un rol asignado.`
              );
              setUserRole(null); // El usuario no tiene rol asignado
            }
          } else {
            console.error(
              `No se encontró el usuario '${user.AppUser}' en los datos.`
            );
          }
        } else {
          console.error("No se pudo obtener la información del usuario.");
        }
      } catch (error) {
        console.error("Error en la conexión:", error);
      }
    };

    fetchUserRoleAndPermissions();
  }, [user.AppUser]);

  // Valida si el usuario tiene un permiso específico
  const validatePermission = (permission) => {
    return rolePermissions.includes(permission);
  };
    

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleRadioChange = (event) => {
        setSelectedValue(event.target.value);
        setSubtype(''); // Reinicia la selección al cambiar de tipo
    };


    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleCalendarChange = (event) => {
        setCalendar(event.target.value);
        setSubtype(''); // Reinicia la selección al cambiar entre Diario y Semanal
    };

    const handleSubtypeChange = (event) => {
        setSubtype(event.target.value);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/getCSVPol1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appUser: user.username,
                    appPass: user.password,
                    DBName: user.dbName,
                    type: selectedValue,
                    cal: cal,
                    subtype: subtype
                })
            });

            if (!response.ok) throw new Error('Error en la consulta');

            const data = await response.blob();
            const url = window.URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `datos_${subtype}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Opciones para el selector de subtype
    const subtypeOptions = {
        Diario: [
            { label: 'Costo', value: 'costo' },
            { label: 'Días de Cobertura', value: 'dias_cobertura' },
            { label: 'Pallets', value: 'pallets' },
            { label: 'UOM', value: 'uom' }
        ],
        Semanal: [
            { label: 'Costo', value: 'costo' },
            { label: 'Días de Cobertura', value: 'dias_cobertura' },
            { label: 'Pallets', value: 'pallets' },
            { label: 'UOM', value: 'uom' }
        ]
    };

    const handleButtonClick = async () => {
        setLoading(true);

        const url = `${import.meta.env.VITE_API_URL}/getCSVPol`;

        if(url && selectedValue && calendar) {
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
                        type: selectedValue,
                        cal: calendar
                    }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const blob = await response.blob();
                const reader = new FileReader();

                reader.onload = function(event) {
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
                setLoading(false);
            }
        } else {
            alert('Por favor selecciona una clasificación y un calendario');
            setLoading(false);
        }
    };

    /*const handleDownloadClick = () => {
        const updatedData = data.map((row, index) => {
            if (overrideValues[index] !== undefined) {
                return {
                    ...row,
                    [`Override_${overrideType}`]: overrideValues[index],
                };
            }
            return row;
        });

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
    };*/
	const handleDownloadClick = () => {
		const updatedData = data.map((row, index) => {
			if (overrideValues[index] !== undefined) {
				return {
					...row,
					[`Override_${overrideType}`]: overrideValues[index],
				};
			}
			return row;
		});

		const csv = Papa.unparse(updatedData);
		
		// Agregar BOM para que Excel reconozca correctamente UTF-8
		const bom = '\uFEFF';
		const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'resultados.csv';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};


    const handleOverrideChange = (sku, value) => {
        setOverrideValues((prev) => ({
            ...prev,
            [sku]: Number(value),
        }));
    };

    const handleApplyGeneralOverride = async () => {
        // Calcular los overrides aplicando suma o resta correctamente
        const updatedOverrides = data.reduce((acc, row) => {
            const currentValue = row.ssCantidad || 0; // Asegúrate de usar el valor actual de ssCantidad
            acc[row.SKU] = currentValue + generalOverride; // Suma o resta desde el valor actual
            return acc;
        }, {});
        
    
        console.log('Overrides calculados:', updatedOverrides); // Verifica los valores calculados
    
        setLoading(true);
        try {
            const commonBody = {
                appUser: user.AppUser,
                appPass: user.password,
                DBName: user.dbName,
                overrideValues: updatedOverrides,
                tipoOverride: overrideType,
                tipoProceso: calendar,
            };
    
            console.log('Cuerpo enviado al backend:', commonBody); // Verifica el cuerpo de la solicitud
    
            const endpointUrl = 
              overrideType === 'SS_Cantidad' 
                ? `${import.meta.env.VITE_API_URL}/applyGeneralOverride` 
                : `${import.meta.env.VITE_API_URL}/applyGeneralOverride_ROP`;
    
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commonBody),
            });
    
            if (!response.ok) throw new Error('Error en la ejecución');
    
            alert('Override aplicado correctamente');
            handleButtonClick();
        } catch (error) {
            console.error('Error al aplicar override:', error);
            alert('Error al aplicar el override');
        } finally {
            setLoading(false);
        }
    };
    
    const handleApplyOverride = async () => {
        setLoading(true);
        try {
            const commonBody = {
                appUser: user.AppUser,
                appPass: user.password,
                DBName: user.dbName,
                overrideValues,
                tipoOverride: overrideType, // Enviar el tipo de override (SS_Cantidad o ROP)
            };
    
            let response;
            // Verificar si es SS_Cantidad o ROP
            if (calendar === 'Diario') {
                if (overrideType === 'SS_Cantidad') {
                    response = await fetch(`${import.meta.env.VITE_API_URL}/runOverridePoliticaInventarios`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(commonBody)
                    });
                } else if (overrideType === 'ROP') {
                    response = await fetch(`${import.meta.env.VITE_API_URL}/runOverridePoliticaInventarios_ROP`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(commonBody)
                    });
                }
            } else if (calendar === 'Semanal') {
                if (overrideType === 'SS_Cantidad') {
                    response = await fetch(`${import.meta.env.VITE_API_URL}/runOverridePoliticaInventarios_Sem`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(commonBody)
                    });
                } else if (overrideType === 'ROP') {
                    response = await fetch(`${import.meta.env.VITE_API_URL}/runOverridePoliticaInventarios_ROP_SEM`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(commonBody)
                    });
                }
            } else {
                throw new Error('Tipo de calendario no soportado');
            }
    
            if (!response.ok) {
                throw new Error('Error en la ejecución');
            }
    
            alert('Se ejecutó correctamente el Override');
            handleButtonClick();
        } catch (error) {
            console.error('Error en la ejecución:', error);
            alert('Error en la ejecución');
        } finally {
            setLoading(false);
        }
    };
    
    const handleOverrideSelectionChange = (event) => {
        setSelectedOverride(event.target.value);
    };

    const handleOverrideTypeChange = (event) => {
        setOverrideType(event.target.value);
    };

    const handleRevertChanges = async () => {
        if (!calendar || (calendar !== 'Diario' && calendar !== 'Semanal')) {
            alert('Por favor selecciona un valor válido para el calendario (Diario o Semanal).');
            return;
        }
    
        if (!window.confirm('¿Estás seguro de que deseas restaurar los valores iniciales? Esta acción no se puede deshacer.')) {
            return;
        }
    
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/revertGeneralOverride`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    appUser: user.AppUser,
                    appPass: user.password,
                    DBName: user.dbName,
                    tipoProceso: calendar
                })
            });
    
            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Error al restaurar los valores: ${errorMessage}`);
            }
    
            alert('Valores restaurados correctamente');
            
            // Recargar los datos en el frontend para reflejar los cambios restaurados
            await handleButtonClick();
        } catch (error) {
            console.error('Error al restaurar los valores:', error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    
    
    

    return (
        <div className="polResultados">
            {loading && <Spinner />}
            <h1 className="titulo">Resultados</h1>
    
            {/* Parte superior: Clasificación ABCD y Políticas de Inventario */}
            <div className="ParamsDiv">
                <div className="radio">
                    <FormControl component="fieldset">
                        <RadioGroup
                            aria-label="classification"
                            name="classification"
                            value={selectedValue}
                            onChange={handleRadioChange}
                            style={{ flexDirection: "column" }}
                        >
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <FormControlLabel
                                    value="clasifABCD"
                                    control={<Radio />}
                                    label="Clasificación ABCD"
                                />
                                <InfoButton information="Cuando se selecciona esta opción, la consulta generada muestra la salida del proceso de cálculo de clasificación ABCD a nivel Producto-Ubicación." />
                            </div>
    
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <FormControlLabel
                                    value="polInv"
                                    control={<Radio />}
                                    label="Políticas de Inventario"
                                />
                                <InfoButton information="Cuando se selecciona esta opción, la consulta generada muestra la salida del proceso de cálculo de políticas de inventario a nivel Producto-Ubicación." />
                            </div>
                        </RadioGroup>
                    </FormControl>
                </div>
    
                <FormControl
                    variant="outlined"
                    className="Form"
                    style={{ marginTop: "3vh", width: "150px" }}
                >
                    <InputLabel id="cal-label">Calendario</InputLabel>
                    <Select
                        labelId="cal-label"
                        id="cal"
                        label="Calendario"
                        value={calendar}
                        onChange={handleCalendarChange}
                    >
                        {["Diario", "Semanal"].map((tiempo) => (
                            <MenuItem key={tiempo} value={tiempo}>
                                {tiempo}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <InfoButton information="Elige la granularidad de los periodos de tiempo con los que se calculó la política de inventarios." />

                <FormControl
                    variant="outlined"
                    className="Form"
                    style={{ marginTop: "3vh", width: "150px" }}
                >
                    <InputLabel id="cal-label">Tipo de tabla</InputLabel>
                    <Select
                        labelId="cal-label"
                        id="cal"
                        label="Calendario"
                        value={calendar}
                        onChange={handleSubtypeChange}
                    >
                        {["Diario", "Semanal"].map((tiempo) => (
                            <MenuItem key={tiempo} value={tiempo}>
                                {tiempo}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
    
                <div style={{ display: "flex", alignItems: "center", marginTop: "3vh" }}>
                    <MyButton
                        onClick={handleButtonClick}
                        texto={"Consultar"}
                        data-permission="Politica-resultados consultar politica" 
                        disabled={!validatePermission("Politica-resultados consultar politica")}
                        mL="3vw"
                        height="7vh"
                        mT="0"
                        mR=".5vw"
                        backColor="#3e4251"
                    />
                    <MyButton
                        onClick={handleDownloadClick}
                        texto={"Descargar Resultados"}
                        data-permission="Politica-resultados descargar resultados" 
                        disabled={!validatePermission("Politica-resultados descargar resultados")}
                        height="7vh"
                        mT="0"
                        mR=".5vw"
                        backColor="#3d4c87"
                    />
                </div>
            </div>
    
            {/* Filtro de búsqueda (solo visible cuando hay datos) */}
            {data.length > 0 && (
                <div style={{ margin: "2vh 0" }}>
                    <TextField
                        id="search-filter"
                        label="Buscar en los resultados"
                        variant="outlined"
                        fullWidth
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Filtra por SKU, producto, etc."
                        style={{ maxWidth: '300px' }}
                    />
                </div>
            )}
    
            {/* Tabla de resultados */}
            <div className="TablaDiv">
                <TableContainer component={Paper} className="tableContainer">
                    <Table stickyHeader aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                {data.length > 0 &&
                                    Object.keys(data[0]).map((key) => (
                                        <TableCell key={key} style={key === "SKU" ? stickyHeadStyle : null}>
                                            {key}
                                        </TableCell>
                                    ))}
                                {data.length > 0 && (
                                    <TableCell>
                                        Override_{overrideType}
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>
    
                        <TableBody>
                            {data
                                .filter((row) =>
                                    Object.values(row).some((value) =>
                                        value
                                            .toString()
                                            .toLowerCase()
                                            .includes(searchFilter.toLowerCase())
                                    )
                                )
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {Object.keys(row).map((colKey, colIndex) => (
                                            <TableCell
                                                key={colIndex}
                                                style={colKey === "SKU" ? stickyColumnStyle : null}
                                            >
                                                {row[colKey]}
                                            </TableCell>
                                        ))}
                                        {data.length > 0 && selectedOverride === "individual" && (
                                            <TableCell>
                                                <TextField
                                                    type="number"
                                                    value={overrideValues[row.SKU] || ""}
                                                    onChange={(e) =>
                                                        handleOverrideChange(row.SKU, e.target.value)
                                                    }
                                                    variant="outlined"
                                                    inputProps={{ min: "0" }}
                                                />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
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
    
            {data.length > 0 && (
                <>
                    <Button
                        onClick={handleApplyOverride}
                        variant="contained"
                        color="primary"
                        style={{ marginLeft: "2vw", marginTop: "3vh" }}
                        data-permission="Politica-resultados aplicar override" 
                        disabled={!validatePermission("Politica-resultados aplicar override")}
                    >
                        Aplicar Override
                    </Button>
                </>
            )}

            {/* Selector Override Individual - General */}
            <FormControl component="fieldset" style={{ marginTop: '3vh' }}>
                <RadioGroup
                    aria-label="override-type"
                    name="override-type"
                    value={selectedOverride}
                    onChange={handleOverrideSelectionChange}
                    style={{ flexDirection: 'row' }}
                >
                    <FormControlLabel value="individual" control={<Radio />} label="Override Individual" />
                    <FormControlLabel value="general" control={<Radio />} label="Override General" />
                </RadioGroup>
            </FormControl>

            {/* Selector SS_Cantidad - ROP (fijo) */}
            <FormControl variant="outlined" className='Form' style={{ marginTop: '3vh' }}>
                <InputLabel id="override-type-label">Tipo de Override</InputLabel>
                <Select
                    labelId="override-type-label"
                    id="override-type"
                    label="Tipo de Override"
                    value={overrideType}
                    onChange={handleOverrideTypeChange}
                >
                    {["SS_Cantidad", "ROP"].map((tipo) => (
                        <MenuItem key={tipo} value={tipo}>
                            {tipo}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Control de override general (solo si es General) */}
            {selectedOverride === 'general' && (
                <div style={{ marginTop: '4vh' }}>
                    <h3>Aplicar Override General</h3>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '2vh' }}>
                        <Button variant="contained" color="primary" onClick={() => setGeneralOverride(prev => prev - 1)} style={{ marginRight: '1vw' }}>
                            -
                        </Button>
                        <TextField
                            type="number"
                            value={generalOverride}
                            onChange={(e) => setGeneralOverride(Number(e.target.value))}
                            inputProps={{ min: -Infinity, max: Infinity, step: 1 }}
                            variant="outlined"
                            style={{ width: '100px', marginRight: '1vw' }}
                        />
                        <Button variant="contained" color="primary" onClick={() => setGeneralOverride(prev => prev + 1)} style={{ marginRight: '2vw' }}>
                            +
                        </Button>
                        <Button variant="contained" data-permission="Politica-resultados aplicar override general" 
                        disabled={!validatePermission("Politica-resultados aplicar override general")} color="secondary" onClick={handleApplyGeneralOverride}>
                            Aplicar Override General
                        </Button>
                    </div>
                </div>
            )}
            <div>
            <Button variant="contained" color="secondary" onClick={handleRevertChanges} disabled={loading}>
                Restaurar Valores Iniciales
            </Button>
            {/*  */}
        </div>
   
        </div>
    );
};

export default PolResultados;
