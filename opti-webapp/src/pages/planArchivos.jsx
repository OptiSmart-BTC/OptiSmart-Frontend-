import React, { useState, useEffect } from 'react';
import Spinner from './../components/Spinner';
import { useAuth } from './../components/AuthContext';
import JSZip from 'jszip';
import './../styles/pages/planArchivos.css';
import InfoButton from '../components/InfoButton';

const PlanArchivos = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadType, setUploadType] = useState('inventario');
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

        let append;
        switch (uploadType) {
            case 'inventario':
                append = 'CargaInvDisponible';
                break;
            case 'transito':
                append = 'CargaInvTrans';
                break;
            case 'confirmados':
                append = 'CargaRequerimientosConfirmados';
                break;
            default:
                alert('Tipo de carga no reconocido');
                return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('doc', selectedFile);
        formData.append('appUser', user.AppUser);
        formData.append('appPass', user.password);
        formData.append('DBName', user.dbName);

        const url = `${import.meta.env.VITE_API_URL}/${append}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.text();
                alert('Carga exitosa');
                console.log(result);
                setResults(result);
            } else {
                alert('Error en la carga del archivo');
                const errorText = await response.text();
                setResults(`Error: ${errorText}`);
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
        const templates = [
            { path: "/templates/template-inventario_disponible.csv", name: "template-inventario_disponible.csv" },
            { path: "/templates/template-inventario_transito.csv", name: "template-inventario_transito.csv" },
            { path: "/templates/template-requerimientos_confirmados.csv", name: "template-requerimientos_confirmados.csv" }
        ];
    
        const zip = new JSZip();
    
        try {
            // Descargar cada archivo y añadirlo al ZIP
            const promises = templates.map(async (template) => {
                const response = await fetch(template.path);
    
                if (!response.ok) {
                    throw new Error(`Error al descargar ${template.name}`);
                }
    
                const fileContent = await response.text(); // Puedes usar `response.blob()` si son archivos binarios
                zip.file(template.name, fileContent); // Agregar el contenido al ZIP
            });
    
            // Esperar que todos los archivos se agreguen al ZIP
            await Promise.all(promises);
    
            // Generar el ZIP y convertirlo en un Blob
            const zipBlob = await zip.generateAsync({ type: 'blob' });
    
            // Crear un enlace para descargar el archivo ZIP
            const a = document.createElement('a');
            const fileUrl = URL.createObjectURL(zipBlob);
            a.href = fileUrl;
            a.download = 'plantillas.zip'; // Nombre del archivo ZIP
            document.body.appendChild(a);
            a.click();
    
            // Liberar memoria usada por el Blob
            URL.revokeObjectURL(fileUrl);
            document.body.removeChild(a);
    
            alert('Plantillas descargadas con éxito.');
        } catch (error) {
            console.error('Error al generar el ZIP:', error);
            alert('Error al descargar las plantillas. Intente nuevamente.');
        }
    };
    

    const descargarActual = async () => {
        const url = `${import.meta.env.VITE_API_URL}/getActualCSVInvDisp`; // Endpoint para obtener los archivos ZIP
    
        setIsUploading(true); // Mostrar spinner mientras se procesa la solicitud
    
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
                throw new Error('Error al conectar con el servidor. Intente nuevamente.');
            }
    
            // Procesar el archivo como un Blob
            const blob = await response.blob();
            const fileUrl = window.URL.createObjectURL(blob);
    
            // Crear un enlace para descargar el archivo ZIP
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = fileUrl;
    
            // Nombre del archivo ZIP (opcional: usar header 'Content-Disposition')
            const filename = response.headers.get('Content-Disposition')
                ? response.headers.get('Content-Disposition').split('filename=')[1].replace(/"/g, '')
                : 'archivos_cargados.zip';
    
            a.download = filename;
            document.body.appendChild(a);
            a.click();
    
            // Liberar memoria utilizada para el Blob
            window.URL.revokeObjectURL(fileUrl);
    
            alert('Descarga exitosa');
        } catch (error) {
            console.error('Error al descargar el archivo:', error);
            alert('Error al descargar los archivos. Intente nuevamente.');
        } finally {
            setIsUploading(false); // Ocultar spinner después de completar la operación
        }
    };
    

    const descargarLog = () => {
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
                                    value="inventario"
                                    checked={uploadType === 'inventario'}
                                    onChange={handleUploadTypeChange}
                                />
                                Inventario Disponible
                                <InfoButton information='Al seleccionar esta opción, permite al usuario cargar el archivo que contiene la información del inventario disponible.' />
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="transito"
                                    checked={uploadType === 'transito'}
                                    onChange={handleUploadTypeChange}
                                />
                                Inventario en Tránsito
                                <InfoButton information='Al seleccionar esta opción, permite al usuario cargar el archivo que contiene la información del inventario en tránsito.' />
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="confirmados"
                                    checked={uploadType === 'confirmados'}
                                    onChange={handleUploadTypeChange}
                                />
                                Requerimientos Confirmados
                                <InfoButton information='Al seleccionar esta opción, permite al usuario cargar el archivo que contiene la información de los requerimientos confirmados.' />
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
            data-permission="Plan-archivos cargar nuevo"
            disabled={!validatePermission("Plan-archivos cargar nuevo")}
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
                                    data-permission="Plan-archivos descargar actual"
                                    disabled={!validatePermission("Plan-archivos descargar actual")}
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
                                    data-permission="Plan-archivos descargar plantillas"
                                    disabled={!validatePermission("Plan-archivos descargar plantillas")}
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
                        <button className='archivos-button' onClick={descargarLog} data-permission="Plan-archivos descargar logs"
                                    disabled={!validatePermission("Plan-archivos descargar logs")}>
                            Descargar Log de Resultados
                        </button>
                        <InfoButton information='Permite exportar los resultados de la carga de información.' />
                    </div>
                </div>
            </div>
        </div>
    );
    
};

export default PlanArchivos;
