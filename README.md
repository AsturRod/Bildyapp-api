# Bildyapp-api

bildyapp-api/
├── src/
│   ├── config/
│   │   └── index.js            # Configuración centralizada
│   ├── controllers/
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # Verificación JWT
│   │   ├── error-handler.js    # Middleware centralizado de errores
│   │   ├── role.middleware.js   # Autorización por roles
│   │   ├── upload.js           # Configuración de Multer
│   │   └── validate.js         # Middleware de validación Zod
│   ├── models/
│   │   ├── User.js             # Modelo Mongoose (con virtuals e indexes)
│   │   └── Company.js          # Modelo Mongoose
│   ├── routes/
│   │   └── user.routes.js
│   ├── services/
│   │   └── notification.service.js  # EventEmitter para eventos del usuario
│   ├── utils/
│   │   └── AppError.js         # Clase de errores personalizada
│   ├── validators/
│   │   └── user.validator.js   # Esquemas Zod (con transform y refine)
│   ├── app.js                  # Configuración de Express
│   └── index.js                # Punto de entrada
├── uploads/                    # Archivos subidos (logo)
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md

