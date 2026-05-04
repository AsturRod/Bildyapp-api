import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import config from './config/index.js';

const PORT = config.port || 3000;

let server;

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log('MongoDB conectado');

    server = app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error conectando MongoDB:', error);
    process.exit(1);
  });

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} recibido. Cerrando servidor...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    await mongoose.connection.close();
    console.log('Conexiones cerradas correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error durante el cierre:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));