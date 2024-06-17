/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import MyButton from '../components/ButtonConsult';
import InfoButton from '../components/InfoButton';
import { useAuth } from './../components/AuthContext';
import Spinner from './../components/Spinner';

import './../styles/pages/polParametros.css';
import './../styles/components/ABCMatrix.css';

function PolParametros() {
    const [historicalHorizon, setHistoricalHorizon] = useState(180);
    const [endOfHorizon, setEndOfHorizon] = useState(new Date());
    const [calendar, setCalendar] = useState('Diario');
    const [loaded, setLoaded] = useState(false);

    const { user } = useAuth();

    const [inputs, setInputs] = useState({
        varAlta: '',
        varMedia: '',
        VaMbDmb: '', VaMaDmb: '', VaMbDb: '', VaMaDb: '',
        VaMbDm: '', VaMaDm: '', VaMbDa: '', VaMaDa: '',
        VmMbDmb: '', VmMaDmb: '', VmMbDb: '', VmMaDb: '',
        VmMbDm: '', VmMaDm: '', VmMbDa: '', VmMaDa: '',
        VbMbDmb: '', VbMaDmb: '', VbMbDb: '', VbMaDb: '',
        VbMbDm: '', VbMaDm: '', VbMbDa: '', VbMaDa: '',
        MbDmb: '', MaDmb: '', MbDb: '', MaDb: '',
        MbDm: '', MaDm: '', MbDa: '', MaDa: '',
        Dmb: '', Db: '', Dm: '', Da: ''
    });

    const [serviceLevels, setServiceLevels] = useState({
        A: 95,
        B: 95,
        C: 95,
        D: 95
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleHistoricalHorizonChange = (event) => {
        setHistoricalHorizon(event.target.value);
    };

    const handleEndOfHorizonChange = (event) => {
        setEndOfHorizon(event.target.value);
    };

    const handleCalendarChange = (event) => {
        setCalendar(event.target.value);
    };

    const handleServiceChange = (label, value) => {
        setServiceLevels({
            ...serviceLevels,
            [label]: value
        });
    };

    const handleSaveChanges = async () => {
        setLoaded(false);
        try {
            const url = 'https://optiscportal.com/saveParams';
    
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    appUser: user.AppUser,
                    appPass: user.password,
                    DBName: user.dbName,
                    NvarAlta: inputs.varAlta,
                    NvarMedia: inputs.varMedia,
                    NVaMbDmb: inputs.VaMbDmb, NVaMaDmb: inputs.VaMaDmb, NVaMbDb: inputs.VaMbDb, NVaMaDb: inputs.VaMaDb,
                    NVaMbDm: inputs.VaMbDm, NVaMaDm: inputs.VaMaDm, NVaMbDa: inputs.VaMbDa, NVaMaDa: inputs.VaMaDa,
                    NVmMbDmb: inputs.VmMbDmb, NVmMaDmb: inputs.VmMaDmb, NVmMbDb: inputs.VmMbDb, NVmMaDb: inputs.VmMaDb,
                    NVmMbDm: inputs.VmMbDm, NVmMaDm: inputs.VmMaDm, NVmMbDa: inputs.VmMbDa, NVmMaDa: inputs.VmMaDa,
                    NVbMbDmb: inputs.VbMbDmb, NVbMaDmb: inputs.VbMaDmb, NVbMbDb: inputs.VbMbDb, NVbMaDb: inputs.VbMaDb,
                    NVbMbDm: inputs.VbMbDm, NVbMaDm: inputs.VbMaDm, NVbMbDa: inputs.VbMbDa, NVbMaDa: inputs.VbMaDa,
                    NMbDmb: inputs.MbDmb, NMaDmb: inputs.MaDmb,
                    NDmb: inputs.Dmb, NDb: inputs.Db, NDm: inputs.Dm, NDa: inputs.Da,
                    NhorHist: historicalHorizon,
                    NfinHist: endOfHorizon,
                    NNSA: serviceLevels.A, NNSB: serviceLevels.B, NNSC: serviceLevels.C, NNSD: serviceLevels.D
                })
            });
    
            if (response.ok) {
                setLoaded(true);
                alert('Se guardaron los parametros');
            } else {
                alert('Error guardando los parametros');
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };
    

    const handleExecuteClassificationAndPolicies = async () => {
        setLoaded(false);
        try {
            const url = calendar === 'Diario' ? 'https://optiscportal.com/runProcess' : 'https://optiscportal.com/runProcessSem';
    
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
    
            if (response.ok) {
                setLoaded(true);
                alert('Se ejecuto correctamente la clasificación y las políticas');
            } else {
                setLoaded(true);
                alert('Error en la ejecucion');
            }
        } catch (error) {
            setLoaded(true);
            console.error('Error en la ejecucion:', error);
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const url = 'https://optiscportal.com/showParams';

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

                if (response.ok) {
                    const result = await response.json();
                    console.log(result);
                    setInputs({
                        varAlta: result[0],
                        varMedia: result[1],
                        varBaja: result[2],
                        VaMbDmb: result[3], VaMaDmb: result[4], VaMbDb: result[5], VaMaDb: result[6],
                        VaMbDm: result[7], VaMaDm: result[8], VaMbDa: result[9], VaMaDa: result[10],
                        VmMbDmb: result[11], VmMaDmb: result[12], VmMbDb: result[13], VmMaDb: result[14],
                        VmMbDm: result[15], VmMaDm: result[16], VmMbDa: result[17], VmMaDa: result[18],
                        VbMbDmb: result[19], VbMaDmb: result[20], VbMbDb: result[21], VbMaDb: result[22],
                        VbMbDm: result[23], VbMaDm: result[24], VbMbDa: result[25], VbMaDa: result[26],
                        MbDmb: result[27], MaDmb: result[28], MbDb: result[27], MaDb: result[28],
                        MbDm: result[27], MaDm: result[28], MbDa: result[27], MaDa: result[28],
                        Dmb: result[29], Db: result[30], Dm: result[31], Da: result[32]
                    });
                    setHistoricalHorizon(result[33]);

                    const parsedDate = new Date(result[34]);
                    const newdate = parsedDate.toISOString().split('T')[0];
                    setEndOfHorizon(newdate);

                    setServiceLevels({
                        A: result[35],
                        B: result[36],
                        C: result[37],
                        D: result[38]
                    });
                    
                    setLoaded(true);
                } else {
                    alert('Error en la carga del archivo');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }

        if (!loaded && user) {
            fetchData();
        }
    }, [user, loaded, endOfHorizon]);


    return (
        <div className='polParametros'>
            {!loaded && <Spinner />}
            <h1 className='titulo'>Parametrización</h1>
            <div className='historicalHorizonInput'>
                <label htmlFor='historicalHorizon'>Horizonte del Histórico: </label>
                <input
                    type='number'
                    id='historicalHorizon'
                    value={historicalHorizon}
                    onChange={handleHistoricalHorizonChange}
                />
            </div>
            <div className='endOfHorizonInput'>
                <label htmlFor='endOfHorizon'>Fin del Horizonte: </label>
                <input
                    type='date'
                    id='endOfHorizon'
                    value={endOfHorizon}
                    onChange={handleEndOfHorizonChange}
                />
            </div>
            <div className='calendarSelect'>
                <label htmlFor='calendar'>Calendario: </label>
                <select id='calendar' value={calendar} onChange={handleCalendarChange}>
                    <option value='Diario'>Diario</option>
                    <option value='Semanal'>Semanal</option>
                    {/*<option value='Mensual'>Mensual</option>*/}
                </select>
            </div>
            <div className='buttons'>
                <MyButton onClick={handleSaveChanges} texto={"Guardar Cambios"} mL='.5vw' height='6vh' mT='1vh' mR='.1vw'  />
                <MyButton onClick={handleExecuteClassificationAndPolicies} texto={"Ejecuta Clasificación y Políticas"} mL='.5vw' height='6vh' mT='1vh' mR='.1vw' />

            </div>

            <div className='sub-header'>
                <h2 className='sub-titulo'>Matriz de Clasificación ABC</h2>
                <InfoButton information='La matriz de clasificación ABC es una herramienta de análisis que permite clasificar los productos de una empresa en función de su importancia relativa.' />  
            </div>
            
            {/* INICIA ABC MATRIX */}

                <div className="row align-items-center">
                    <div className="col-10">
                        <div className="m-2">
                            <div className="table-responsive">
                                <table className="table table-bordered" id="dataTableg" cellSpacing="0" style={{ textAlign: 'center' }}>
                                    <thead>
                                        <tr></tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <th rowSpan="3" style={{ backgroundColor: 'rgb(84, 130, 53)', color: 'white', writingMode: 'vertical-rl', transform: 'rotate(180deg)', lineHeight: '5%', marginTop: '30%', width:'5%' }} className="ml-2">
                                                <br /><br />VARIABILIDAD
                                                <a data-toggle="modal" data-target="#variMod">
                                                    <i className="fas fa-info-circle fa-sm fa-fw mr-2 text-gray-400" data-toggle="modal" data-target="#variMod"></i>
                                                </a>
                                            </th>
                                            <th rowSpan="3" className="verdito">
                                                <p>Alta</p>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    style={{ width: '80%', marginLeft: '10%', marginTop: '10px' }}
                                                    name="varAlta"
                                                    placeholder="varAlta%"
                                                    onChange={handleChange}
                                                    value={inputs.varAlta}
                                                />
                                                <p>Media</p>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    style={{ width: '80%', marginLeft: '10%' }}
                                                    name="varMedia"
                                                    placeholder="varMed%"
                                                    onChange={handleChange}
                                                    value={inputs.varMedia}
                                                />
                                                <p>Baja</p>
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VaMbDmb"
                                                    placeholder="VaMbDmb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VaMbDmb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VaMaDmb"
                                                    placeholder="VaMaDmb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VaMaDmb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VaMbDb"
                                                    placeholder="VaMbDb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VaMbDb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VaMaDb"
                                                    placeholder="VaMaDb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VaMaDb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VaMbDm"
                                                    placeholder="VaMbDm"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VaMbDm}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VaMaDm"
                                                    placeholder="VaMaDm"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VaMaDm}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VaMbDa"
                                                    placeholder="VaMbDa"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VaMbDa}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VaMaDa"
                                                    placeholder="VaMaDa"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VaMaDa}
                                                />
                                            </th>
                                        </tr>
                                        <tr>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VmMbDmb"
                                                    placeholder="VmMbDmb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VmMbDmb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VmMaDmb"
                                                    placeholder="VmMaDmb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VmMaDmb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VmMbDb"
                                                    placeholder="VmMbDb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VmMbDb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VmMaDb"
                                                    placeholder="VmMaDb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VmMaDb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VmMbDm"
                                                    placeholder="VmMbDm"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VmMbDm}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VmMaDm"
                                                    placeholder="VmMaDm"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VmMaDm}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VmMbDa"
                                                    placeholder="VmMbDa"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VmMbDa}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VmMaDa"
                                                    placeholder="VmMaDa"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VmMaDa}
                                                />
                                            </th>
                                        </tr>
                                        <tr>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VbMbDmb"
                                                    placeholder="VbMbDmb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VbMbDmb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VbMaDmb"
                                                    placeholder="VbMaDmb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VbMaDmb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VbMbDb"
                                                    placeholder="VbMbDb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VbMbDb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VbMaDb"
                                                    placeholder="VbMaDb"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VbMaDb}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VbMbDm"
                                                    placeholder="VbMbDm"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VbMbDm}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VbMaDm"
                                                    placeholder="VbMaDm"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VbMaDm}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VbMbDa"
                                                    placeholder="VbMbDa"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VbMbDa}
                                                />
                                            </th>
                                            <th className="amarillito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="VbMaDa"
                                                    placeholder="VbMaDa"
                                                    maxLength="1"
                                                    minLength="1"
                                                    onChange={handleChange}
                                                    value={inputs.VbMaDa}
                                                />
                                            </th>
                                        </tr>
                                        <tr>
                                            <th colSpan="2" rowSpan="2" style={{ backgroundColor: 'rgb(48, 84, 150)', color: 'white'}}>
                                                <br />MARGEN
                                                <a data-toggle="modal" data-target="#margMod">
                                                    <i className="fas fa-info-circle fa-sm fa-fw mr-2 text-gray-400" data-toggle="modal" data-target="#margMod"></i>
                                                </a>
                                            </th>
                                            <th className="azulito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="MbDmb"
                                                    placeholder="mBajo%"
                                                    onChange={handleChange}
                                                    value={inputs.MbDmb}
                                                />
                                            </th>
                                            <th className="azulito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="MaDmb"
                                                    placeholder="%"
                                                    onChange={handleChange}
                                                    value={inputs.MaDmb}
                                                />
                                            </th>
                                            <th className="azulito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="MbDb"
                                                    placeholder="%"
                                                    onChange={handleChange}
                                                    value={inputs.MbDb}
                                                />
                                            </th>
                                            <th className="azulito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="MaDb"
                                                    placeholder="%"
                                                    onChange={handleChange}
                                                    value={inputs.MaDb}
                                                />
                                            </th>
                                            <th className="azulito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="MbDm"
                                                    placeholder="%"
                                                    onChange={handleChange}
                                                    value={inputs.MbDm}
                                                />
                                            </th>
                                            <th className="azulito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="MaDm"
                                                    placeholder="%"
                                                    onChange={handleChange}
                                                    value={inputs.MaDm}
                                                />
                                            </th>
                                            <th className="azulito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="MbDa"
                                                    placeholder="%"
                                                    onChange={handleChange}
                                                    value={inputs.MbDa}
                                                />
                                            </th>
                                            <th className="azulito">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-user text-center"
                                                    name="MaDa"
                                                    placeholder="%"
                                                    onChange={handleChange}
                                                    value={inputs.MaDa}
                                                />
                                            </th>
                                        </tr>
                                        <tr>
                                            <th className="azulito2" >Bajo</th>
                                            <th className="azulito2" >Alto</th>
                                            <th className="azulito2" >Bajo</th>
                                            <th className="azulito2" >Alto</th>
                                            <th className="azulito2" >Bajo</th>
                                            <th className="azulito2" >Alto</th>
                                            <th className="azulito2" >Bajo</th>
                                            <th className="azulito2" >Alto</th>
                                        </tr>
                                        <tr>
                                            <th className="borderless"></th>
                                            <th className="borderless"></th>
                                            <th colSpan="2" className="naranjita">
                                                <input
                                                    type="number"
                                                    className="form-control form-control-user text-center"
                                                    style={{ width: '60%', marginLeft: '15%' }}
                                                    name="Dmb"
                                                    placeholder="Muy Baja %"
                                                    onChange={handleChange}
                                                    value={inputs.Dmb}
                                                />
                                            </th>
                                            <th colSpan="2" className="naranjita">
                                                <input
                                                    type="number"
                                                    className="form-control form-control-user text-center"
                                                    style={{ width: '60%', marginLeft: '15%' }}
                                                    name="Db"
                                                    placeholder="Baja %"
                                                    onChange={handleChange}
                                                    value={inputs.Db}
                                                />
                                            </th>
                                            <th colSpan="2" className="naranjita">
                                                <input
                                                    type="number"
                                                    className="form-control form-control-user text-center"
                                                    style={{ width: '60%', marginLeft: '15%' }}
                                                    name="Dm"
                                                    placeholder="Media %"
                                                    onChange={handleChange}
                                                    value={inputs.Dm}
                                                />
                                            </th>
                                            <th colSpan="2" className="naranjita">
                                                <input
                                                    type="number"
                                                    className="form-control form-control-user text-center"
                                                    style={{ width: '60%', marginLeft: '15%' }}
                                                    name="Da"
                                                    placeholder="Alta %"
                                                    onChange={handleChange}
                                                    value={inputs.Da}
                                                />
                                            </th>
                                        </tr>
                                        <tr>
                                            <th className="borderless"></th>
                                            <th className="borderless"></th>
                                            <th colSpan="2" className="naranjita">Muy Baja</th>
                                            <th colSpan="2" className="naranjita">Baja</th>
                                            <th colSpan="2" className="naranjita">Media</th>
                                            <th colSpan="2" className="naranjita">Alta</th>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th className="borderless"></th>
                                            <th className="borderless"></th>
                                            <th colSpan="8" style={{ backgroundColor: 'rgb(198, 89, 17)', color: 'white', padding:'1.5%' }}>DEMANDA
                                                <a data-toggle="modal" data-target="#demaMod">
                                                    <i className="fas fa-info-circle fa-sm fa-fw mr-2 text-gray-400" data-toggle="modal" data-target="#demaMod"></i>
                                                </a>
                                            </th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="col-1"></div>
                </div>

            {/* TERMINA ABC MATRIX */}

            <div className='sub-header'>
                <h2 className='sub-titulo'>Nivel de Servicio</h2>
                <InfoButton information='El nivel de servicio dice que tanto se debe satisfacer la demanda de dependiendo del producto' />  
            </div>

            <div className='service-level'>
                {['A', 'B', 'C', 'D'].map((label) => (
                    <div key={label} className='service-level-item'>
                        <label>{label}</label>
                        <input
                            type='number'
                            value={serviceLevels[label]}
                            onChange={(e) => handleServiceChange(label, e.target.value)}
                        />
                        <span>%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PolParametros;