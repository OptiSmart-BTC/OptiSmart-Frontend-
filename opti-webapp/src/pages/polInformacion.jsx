/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useAuth } from './../components/AuthContext';
import Spinner from './../components/Spinner';
import InfoButton from '../components/InfoButton';
import JSZip from 'jszip';
import './../styles/pages/polInformacion.css';

const PolInformacion = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadType, setUploadType] = useState('catalogo');
    const [results, setResults] = useState('Resultado de la carga de información');

    const { user } = useAuth();
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
    
        // Construir la URL dinámicamente con VITE_API_URL
        const url = `${import.meta.env.VITE_API_URL}/${append}`;
    
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });
    
            if (response.ok) {
                const result = await response.text();
                alert('Carga exitosa');
                console.log(result); // Muestra o procesa el resultado según sea necesario
                setResults(result);
            } else {
                const errorDetail = await response.text(); // Captura el error en texto plano
                console.error('Error en la carga del archivo:', errorDetail);
                alert(`Error en la carga del archivo: ${errorDetail}`);
            }
        } catch (error) {
            console.error('Error de conexión o en el servidor:', error.message);
            alert(`Error de conexión. Por favor, intente nuevamente. Detalle: ${error.message}`);
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
        }
    };
    

    

const descargarTemplates = async () => {
    const skuPath = "/templates/template-sku.csv";
    const histPath = "/templates/template-historico_demanda.csv";

    try {
        const zip = new JSZip();

        // Obtener el contenido del archivo SKU
        const skuResponse = await fetch(skuPath);
        if (!skuResponse.ok) throw new Error("Error al descargar el archivo SKU");
        const skuData = await skuResponse.blob();

        // Obtener el contenido del archivo histórico
        const histResponse = await fetch(histPath);
        if (!histResponse.ok) throw new Error("Error al descargar el archivo Histórico");
        const histData = await histResponse.blob();

        // Agregar los archivos al ZIP
        zip.file("template-sku.csv", skuData);
        zip.file("template-historico_demanda.csv", histData);

        // Generar el archivo ZIP
        const zipContent = await zip.generateAsync({ type: "blob" });

        // Crear un enlace para descargar el ZIP
        const url = URL.createObjectURL(zipContent);
        const a = document.createElement("a");
        a.href = url;
        a.download = "templates.zip"; // Nombre del archivo ZIP
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert("Descarga de templates exitosa");
    } catch (error) {
        console.error("Error al generar el archivo ZIP:", error);
        alert("Ocurrió un error al descargar los templates.");
    }
};

    const descargarActual = async () => {
        const url = `${import.meta.env.VITE_API_URL}/getActualCSVPol`;

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
        <div className='planArchivos'>
            {isUploading && <Spinner />}
            <h1 className='titulo'>Archivos de Entrada</h1>
            <div className='container'>
                <div className='upload-section'>
                    <h2>Carga de Información</h2>
    
                    {/* Contenedor principal para selectores y botones */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        {/* Selectores de información */}
                        <div className='radio-buttons' style={{ flex: 1, width: '50%' }}>
                            <label>
                                <input
                                    type="radio"
                                    value="catalogo"
                                    checked={uploadType === 'catalogo'}
                                    onChange={handleUploadTypeChange}
                                />
                                Catálogo de SKU&apos;s
                                <InfoButton information="Con esta casilla activa los procesos ejecutados modificarán o descargarán los datos de SKU´S." />
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="historico"
                                    checked={uploadType === 'historico'}
                                    onChange={handleUploadTypeChange}
                                />
                                Histórico de Demanda
                                <InfoButton information="Con esta casilla activa los procesos ejecutados modificarán o descargarán los datos del Histórico de Ventas de los productos." />
                            </label>
                            
                            {/* Campo de carga de archivos y botón justo debajo */}
<div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <input 
        type="file" 
        onChange={handleFileChange} 
        style={{ width: '90%' }} 
    />
    <div 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.5rem' }}
    >
        <button
            className="archivos-button"
            onClick={handleFileUpload}
            data-permission="Politica-archivos cargar nuevo"
            disabled={!validatePermission("Politica-archivos cargar nuevo")}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: '100' }}
        >
            Cargar Nuevo
        </button>
        <InfoButton
            information="Permite cargar nuevos archivos reemplazando los actuales."
        />
    </div>
</div>
                        </div>
    
                        {/* Botones de descarga */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '40%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '120%', marginBottom: '1rem' }}>
                                <button
                                    className='archivos-button'
                                    onClick={descargarActual}
                                    data-permission="Politica-archivos descargar actuales"
                                    disabled={!validatePermission("Politica-archivos descargar actuales")}
                                    style={{ flex: 1 }}
                                >
                                    Descargar Actuales
                                </button>
                                <InfoButton information='Exporta la información actual cargada en la herramienta.' style={{ marginLeft: '0.5rem' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', width: '120%' }}>
                                <button
                                    className='archivos-button'
                                    onClick={descargarTemplates}
                                    data-permission="Politica-archivos descargar plantillas"
                                    disabled={!validatePermission("Politica-archivos descargar plantillas")}
                                    style={{ flex: 1 }}
                                >
                                    Descargar Plantillas
                                </button>
                                <InfoButton information='Descarga plantillas base para cargar datos correctamente.' style={{ marginLeft: '0.5rem' }} />
                            </div>
                        </div>
                    </div>
                </div>
    
                <div className='results-section'>
                    <textarea readOnly value={results} style={{ width: '100%' }} />
                    <div className='button-info'>
                        <button className='archivos-button' onClick={descargarLog} data-permission="Politica-archivos descargar logs"
            disabled={!validatePermission("Politica-archivos descargar logs")}>
                            Descargar Log de Resultados
                        </button>
                        <InfoButton information='Permite exportar los resultados de la carga de información.' />
                    </div>
                </div>
            </div>
        </div>
    );

};

export default PolInformacion;

 