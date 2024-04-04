import React from 'react';
import Navbar from './Navbar.jsx';
import './../styles/welcome.css'; // Make sure to create a corresponding CSS file
import Grid from '@mui/material/Unstable_Grid2';

function Welcome() {
  return (
    <>
    <Grid container spacing={2}>
        <Navbar />
        <div className='Welcome'>
          <h1 className='text1'>Bienvenido a BTC OPTI</h1>
          <h2>OPTI 2.0</h2>
        </div>
    </Grid>
    </>
  );
}

/*
<div className='Welcome'>
      <Navbar />
      <h1>Bienvenido a BTC OPTI</h1>
    </div>
*/
export default Welcome;
