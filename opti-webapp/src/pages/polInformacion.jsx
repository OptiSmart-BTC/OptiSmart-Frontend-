/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import './../styles/pages/polInformacion.css';

const PolInformacion = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadType, setUploadType] = useState('catalogo');

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

        setIsUploading(true);

        alert(`Se iniciará la carga del archivo: ${selectedFile.name}`);
        // Simular la carga del archivo
        setTimeout(() => {
            setIsUploading(false);
            setSelectedFile(null);
        }, 2000);
    };

    return (
        <div className='polInformacion'>
            <h1 className='titulo'>Gestión de Información</h1>
            <div className='container'>
                <div className='upload-section'>
                    <div className='radio-buttons'>
                        <label>
                            <input type="radio" value="catalogo" checked={uploadType === 'catalogo'} onChange={handleUploadTypeChange} />
                            Catálogo de SKU&apos;s
                        </label>
                        <label>
                            <input type="radio" value="historico" checked={uploadType === 'historico'} onChange={handleUploadTypeChange} />
                            Histórico de Demanda
                        </label>
                    </div>
                    <input type="file" onChange={handleFileChange} />
                    <button onClick={handleFileUpload} disabled={isUploading}>Cargar Nuevo</button>
                    <button>Descargar Actual</button>
                    <button>Descargar Plantillas</button>
                </div>
                <div className='results-section'>
                    <textarea readOnly placeholder='Resultado de la carga de información' />
                    <button>Descargar Log de Resultados</button>
                </div>
            </div>
        </div>
    );
};

export default PolInformacion;

