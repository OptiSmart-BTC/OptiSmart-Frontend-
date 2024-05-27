/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import ABCMatrix from './../components/ABCMatrix';
import MyButton from '../components/ButtonConsult';
import InfoButton from '../components/InfoButton';

import './../styles/pages/polParametros.css';

function PolParametros() {
    const [historicalHorizon, setHistoricalHorizon] = useState(180);
    const [endOfHorizon, setEndOfHorizon] = useState(new Date());
    const [calendar, setCalendar] = useState('Diario');

    const handleHistoricalHorizonChange = (event) => {
        setHistoricalHorizon(event.target.value);
    };

    const handleEndOfHorizonChange = (event) => {
        setEndOfHorizon(event.target.value);
    };

    const handleCalendarChange = (event) => {
        setCalendar(event.target.value);
    };

    const handleSaveChanges = () => {
        // Boton
    };

    const handleExecuteClassificationAndPolicies = () => {
        // Boton
    };  

    return (
        <div className='polParametros'>
            <h1 className='titulo'>Parametrización</h1>
            <div className='historicalHorizonInput'>
                <label htmlFor='historicalHorizon'>Horizonte del Histórico: </label>
                <input
                    type='number'
                    id='historicalHorizon'
                    value={historicalHorizon}
                    onChange={handleHistoricalHorizonChange}
                />
                {/* Tooltip or Info icon here */}
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
                    <option value='Mensual'>Mensual</option>
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
            <ABCMatrix />

            <div className='sub-header'>
                <h2 className='sub-titulo'>Nivel de Servicio</h2>
                <InfoButton information='El nivel de servicio dice que tanto se debe satisfacer la demanda de dependiendo del producto' />  
            </div>

            <div className='service-level'>
                {['A', 'B', 'C', 'D'].map((label) => (
                    <div key={label} className='service-level-item'>
                        <label>{label}</label>
                        <input type='number' defaultValue='95' />
                        <span>%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PolParametros;