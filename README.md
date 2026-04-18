# Bildyapp-api

```
bildyapp-api/
├── src/
│   ├── config/
│   │   ├── index.js            # Configuración centralizada
│   │   ├── database.js         # Conexión a MongoDB
│   │   └── swagger.js          # Configuración Swagger/OpenAPI
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── client.controller.js
│   │   ├── project.controller.js
│   │   └── deliverynote.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # Verificación JWT
│   │   ├── error-handler.js    # Middleware centralizado de errores
│   │   ├── rate-limit.js       # Rate limiting
│   │   ├── sanitize.js         # Sanitización NoSQL
│   │   ├── upload.js           # Configuración de Multer
│   │   └── validate.js         # Middleware de validación Zod
│   ├── models/
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── Client.js
│   │   ├── Project.js
│   │   └── DeliveryNote.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── user.routes.js
│   │   ├── client.routes.js
│   │   ├── project.routes.js
│   │   └── deliverynote.routes.js
│   ├── services/
│   │   ├── logger.service.js   # Logger con Slack
│   │   ├── mail.service.js     # Envío de emails
│   │   ├── pdf.service.js      # Generación de PDFs
│   │   └── storage.service.js  # Subida a Cloudinary/R2/S3
│   ├── utils/
│   │   └── AppError.js
│   ├── validators/
│   │   ├── user.validator.js
│   │   ├── client.validator.js
│   │   ├── project.validator.js
│   │   └── deliverynote.validator.js
│   ├── app.js                  # Configuración de Express + Socket.IO
│   └── index.js                # Punto de entrada
├── tests/
│   ├── setup.js                # Configuración de mongodb-memory-server
│   ├── auth.test.js
│   ├── client.test.js
│   ├── project.test.js
│   └── deliverynote.test.js
├── Dockerfile
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── test.yml            # GitHub Actions
├── .env
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
└── README.md
```