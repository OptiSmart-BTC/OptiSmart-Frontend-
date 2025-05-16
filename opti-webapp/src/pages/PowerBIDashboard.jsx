import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './../components/AuthContext';

import './../styles/pages/PowerBIDashboard.css'; // Asegúrate que los estilos estén correctamente enlazados



function PowerBIDashboard() {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  const loadReportUrl = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/getPwBiUrl`, {
        appUser: user.AppUser,
        appPass: user.password,
        DBName: user.dbName
      });

      if (response.data.url && response.data.url !== 'NA') {
        setEmbedUrl(response.data.url);
      } else {
        setError("URL de Power BI no disponible");
      }
    } catch (err) {
      setError('Error al cargar la URL de Power BI');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='PowerBIDashboard' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', height: '100vh', paddingTop: '20px' }}>
      <h1 style={{ alignSelf: 'flex-start', marginLeft: '20px' }}>Dashboard Power BI</h1>
      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}
      {!embedUrl && (
        <button onClick={loadReportUrl} disabled={loading} style={{ marginTop: '20px', backgroundColor: 'blue', color: 'white', padding: '10px 20px', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }}>
          Mostrar Reporte de Power BI
        </button>
      )}
      {embedUrl && (
        <iframe
          title="Power BI Report"
          src={embedUrl}
          width="100%"
          height="600px"
          allowFullScreen
          style={{ border: 'none', marginTop: '20px' }}
        ></iframe>
      )}
    </div>
  );
}

export default PowerBIDashboard;

