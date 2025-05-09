import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';



// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// For any other routes, send back the index.html file from the Vite build directory
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});



// Start HTTP server
http.createServer(app).listen(80, () => {
  console.log('HTTP server running on port 80');
});


