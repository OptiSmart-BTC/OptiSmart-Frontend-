import React from 'react';
import './../styles/pages/welcome.css'; 

function Welcome() {
  return (
    <div className='Welcome'>
      <div className='leftSection'>
        <img src="/images/fondowel.jpg" alt="Fondo" className='fondowel' />
      </div>
      <div className='rightSection'>
        <h1>¡Bienvenido a la Optimización!</h1>
        <p className='description'>
          La herramienta diseñada específicamente para facilitar  la gestión de tu inventario.
        </p>
        <p className='description'>
         Ayudándote a optimizar tus procesos y a tomar decisiones      más informadas.
        </p>
      </div>
      <img src="/images/btccolor.png" alt="Icono" className='smallIcon' />
    </div>
  );
}

export default Welcome;