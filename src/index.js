import mongoose from 'mongoose';
import app from './app.js';
import config from './config/index.js';



const PORT = process.env.PORT || 3000;

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error conectando MongoDB:', error);
    process.exit(1);
  });