const express = require('express');
const serverless = require('serverless-http');
const tokenRoutes = require('../../src/routes/tokenRoutes'); // Ajusta la ruta según tu estructura
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Solo para pruebas locales, Netlify ignora esto

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de solicitudes
app.use((req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://rugpull.foo');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Ruta de prueba
app.get('/health', (req, res) => {
  res.json({ status: 'Servidor OK', timestamp: new Date().toISOString() });
});

// Rutas de la API
app.use('/api', tokenRoutes);

// Exportar como función serverless
module.exports.handler = serverless(app);

// Solo para pruebas locales
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Prueba de salud: http://localhost:${PORT}/health`);
  });
}