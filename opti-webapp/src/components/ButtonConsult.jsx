/* eslint-disable no-unused-vars */
import React from 'react';
import Button from '@mui/material/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PropTypes from 'prop-types';

const MyButton = ({ onClick, texto }) => {
  return (
    <Button
      variant="contained"
      startIcon={<CheckCircleIcon />}
      style={{
        backgroundColor: '#3e4251',
        color: 'white',
        alignContent: 'center',
        marginLeft: '3vw',
        verticalAlign: 'bottom',
        height: '7vh',
        marginTop: '3vh',
        marginRight: '37vw',
      }}
      onClick={onClick}
    >
      {texto}
    </Button>
  );
};

MyButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    texto: PropTypes.string.isRequired,
  };
  

export default MyButton;