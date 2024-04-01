import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Logins from './components/Logins';
import Welcome from './components/Welcome';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Logins />} />
        <Route path="/Welcome" element={<Welcome />} />
      </Routes>
    </div>
  );
}

export default App;
