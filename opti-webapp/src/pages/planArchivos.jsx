/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import './../styles/pages/planArchivos.css';
const PlanArchivos = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadType, setUploadType] = useState('inventario');

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUploadTypeChange = (event) => {
        setUploadType(event.target.value);
    };

    const handleFileUpload = () => {
        if (!selectedFile) {
            alert('Por favor selecciona un archivo para subir.');
            return;
        }

        alert(`Se iniciará la carga del archivo: ${selectedFile.name}`);
        // Resetear la selección del archivo
        setSelectedFile(null);
    };

    return (
        <div className='planArchivos'>
            <h1 className='titulo'>Gestión de Archivos</h1>
            <div className='container'>
                <div className='upload-section'>
                    <h2>Carga de Información</h2>
                    <div className='radio-buttons'>
                        <label>
                            <input type="radio" value="inventario" checked={uploadType === 'inventario'} onChange={handleUploadTypeChange} />
                            Inventario Disponible
                        </label>
                        <label>
                            <input type="radio" value="transito" checked={uploadType === 'transito'} onChange={handleUploadTypeChange} />
                            Inventario en Tránsito
                        </label>
                        <label>
                            <input type="radio" value="confirmados" checked={uploadType === 'confirmados'} onChange={handleUploadTypeChange} />
                            Requerimientos Confirmados
                        </label>
                    </div>
                    <input type="file" onChange={handleFileChange} />
                    <button onClick={handleFileUpload}>Cargar Nuevo</button>
                    <button>Descargar Actual</button>
                    <button>Descargar Plantillas</button>
                </div>
                <div className='results-section'>
                    <h2>Resultado de la Carga de Información</h2>
                    <textarea readOnly placeholder='Resultado de la carga de información' />
                    <button>Descargar Log de Resultados</button>
                </div>
            </div>
        </div>
    );
};

export default PlanArchivos;
