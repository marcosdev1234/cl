const express = require('express');
const tokenRoutes = require('./routes/tokenRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares para parsear el cuerpo de la solicitud
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('PUMP_API_KEY cargada:', process.env.PUMP_API_KEY);
// Log para depurar la solicitud entrante
app.use((req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Permitir CORS desde el frontend
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Prueba de salud: http://localhost:${PORT}/health`);
});