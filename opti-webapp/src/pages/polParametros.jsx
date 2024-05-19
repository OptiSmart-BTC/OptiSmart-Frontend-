/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import './../styles/polParametros.css';
import ABCMatrix from './../components/ABCMatrix';

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
        // Implement the logic to save changes
    };

    const handleExecuteClassificationAndPolicies = () => {
        // Implement the logic to execute classification and policies
    };  

    // Add more states and handlers as needed for your inputs and buttons

    return (
        <div className='polParametros'>
            <h1>Parametrización</h1>
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
                {/* Tooltip or Info icon here */}
            </div>
            <div className='calendarSelect'>
                <label htmlFor='calendar'>Calendario: </label>
                <select id='calendar' value={calendar} onChange={handleCalendarChange}>
                    <option value='Diario'>Diario</option>
                    <option value='Semanal'>Semanal</option>
                    <option value='Mensual'>Mensual</option>
                </select>
                {/* Tooltip or Info icon here */}
            </div>
            <div className='buttons'>
                <button onClick={handleSaveChanges}>Guardar Cambios</button>
                <button onClick={handleExecuteClassificationAndPolicies}>Ejecuta Clasificación y Políticas</button>
            </div>

            {/* Implementar aqui la matriz */}
            <ABCMatrix />

        </div>
    );
}

export default PolParametros;