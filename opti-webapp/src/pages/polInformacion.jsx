/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useAuth } from './../components/AuthContext';
import Spinner from './../components/Spinner';

import './../styles/pages/polInformacion.css';

const PolInformacion = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadType, setUploadType] = useState('catalogo');
    const [results, setResults] = useState('Resultado de la carga de información');

    const { user } = useAuth();

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUploadTypeChange = (event) => {
        setUploadType(event.target.value);
    };

    

    const handleFileUpload = async () => {
        if (!selectedFile) {
            alert('Por favor selecciona un archivo para subir.');
            return;
        }

        let append = uploadType === 'catalogo' ? 'CargaCSVsku' : 'CargaCSVhist';

        setIsUploading(true);

        const formData = new FormData();
        formData.append('doc', selectedFile);
        formData.append('appUser', user.AppUser);
        formData.append('appPass', user.password);
        formData.append('DBName', user.dbName); 

        const url = `https://optiscportal.com/${append}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.text();
                alert('Carga exitosa');
                console.log(result); // Display or process the result as needed
                setResults(result);
            } else {
                alert('Error en la carga del archivo');
            }
        } catch (error) {
            console.error('Error al cargar el archivo:', error);
            alert('Error de conexión. Por favor, intente nuevamente.');
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
        }
    };

    const descargarTemplates = async () => {
        // descargar templates en la carpeta templates de public

        const skuPath = "/templates/template-sku.csv";
        const histPath = "/templates/template-historico_demanda.csv";


        const a = document.createElement('a');
        a.href = skuPath;
        a.download = 'template-sku.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        const b = document.createElement('a');
        b.href = histPath;
        b.download = 'template-historico_demanda.csv';
        document.body.appendChild(b);
        b.click();
        document.body.removeChild(b);
    }

    const descargarActual = async () => {
        const url = 'https://optiscportal.com/getActualCSVPol';

        setIsUploading(true);

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
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const blob = await response.blob();
            const fileUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = fileUrl;

            // Obtén el nombre del archivo de los encabezados de la respuesta si está presente
            const filename = response.headers.get('Content-Disposition')
                ? response.headers.get('Content-Disposition').split('filename=')[1].replace(/"/g, '')
                : 'csv_actual.zip';

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(fileUrl);

            alert('Descarga exitosa');

            setIsUploading(false);

        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión. Por favor, intente nuevamente.');
            setIsUploading(false);
        }
    }

    const descargarLog = async () => {
        const blob = new Blob([results], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'log-resultados.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }


    

    return (
        <div className='polInformacion'>
            {isUploading && <Spinner />}
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
                    <button className='informacion-buttons' onClick={handleFileUpload} disabled={isUploading}>Cargar Nuevo</button>
                    <button className='informacion-buttons' onClick={descargarActual}>Descargar Actual</button>
                    <button className='informacion-buttons' onClick={descargarTemplates}>Descargar Plantillas</button>
                </div>
                <div className='results-section'>
                    <textarea readOnly placeholder={results} />
                    <button className='informacion-buttons' onClick={descargarLog}>Descargar Log de Resultados</button>
                </div>
            </div>
        </div>
    );
};

export default PolInformacion;

