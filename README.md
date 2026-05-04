# BildyApp API

Backend REST para la gestión de albaranes (partes de horas o materiales) entre clientes y proveedores. Implementado con Node.js, Express, MongoDB, Swagger, Jest, Socket.IO, Docker y tecnologías profesionales.

## Estructura del Proyecto

```
bildyapp-api/
├── .github/
│   └── workflows/
│       └── test.yml
├── src/
│   ├── app.js
│   ├── index.js
│   ├── config/
│   │   ├── database.js
│   │   ├── index.js
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── client.controller.js
│   │   ├── deliverynote.controller.js
│   │   ├── project.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error-handler.js
│   │   ├── rate-limit.js
│   │   ├── role.middleware.js
│   │   ├── sanitize.js
│   │   ├── socket-auth.js
│   │   ├── upload.js
│   │   └── validate.js
│   ├── models/
│   │   ├── Client.js
│   │   ├── Company.js
│   │   ├── DeliveryNote.js
│   │   ├── Project.js
│   │   └── User.js
│   ├── routes/
│   │   ├── client.routes.js
│   │   ├── deliverynote.routes.js
│   │   ├── index.js
│   │   ├── project.routes.js
│   │   └── user.routes.js
│   ├── services/
│   │   ├── logger.service.js
│   │   ├── mail.service.js
│   │   ├── notification.service.js
│   │   ├── pdf.service.js
│   │   ├── socket.service.js
│   │   └── storage.service.js
│   ├── utils/
│   │   └── AppError.js
│   └── validators/
│       ├── client.validator.js
│       ├── deliverynote.validator.js
│       ├── project.validator.js
│       └── user.validator.js
├── tests/
│   ├── auth.test.js
│   ├── client.test.js
│   ├── deliverynote.test.js
│   ├── project.test.js
│   ├── setup.js
│   ├── socket-test.js
│   └── helpers/
│       └── auth.js
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── jest.config.js
├── package.json
├── README.md
├── socket-test.html
├── test.http

```

## Instalación y Ejecución

### 1. Clonar el Repositorio

```bash
git clone https://github.com/AsturRod/Bildyapp-api.git
cd Bildyapp-api
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Actualiza el archivo `.env` con tus credenciales:

```env
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/bildyapp
JWT_SECRET=tu-clave-secreta-segura
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=tu-clave-secreta-refresco
JWT_REFRESH_EXPIRES_IN=30d
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=465
SMTP_USER=tu-usuario@mailtrap.io
SMTP_PASSWORD=tu-contraseña-mailtrap
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TU/WEBHOOK/URL
NODE_ENV=development
PORT=3000
```

### 4. Ejecutar la Aplicación

En desarrollo (sin Docker):

```bash
npm start
```

La API estará disponible en http://localhost:3000

## Ejecutar con Docker

Levanta la aplicación y MongoDB con Docker Compose:

Primera vez (construir imágenes):
```bash
docker-compose up --build
```
Luego para iniciar:

```bash
docker-compose up
```

Para parar:

```bash
docker-compose down
```

Para ver logs:

```bash
docker-compose logs -f
```

## Documentación Swagger

La documentación interactiva de la API está disponible en:

http://localhost:3000/api-docs

Aquí puedes explorar todos los endpoints y probar la API directamente.

## Ejecutar Tests

Ejecutar todos los tests:

```bash
npm test
```

Ver cobertura de código:

```bash
npm run test:coverage
```

Tests en modo watch:

```bash
npm run test:watch
```

Los tests incluyen:
- Autenticación y autorización (auth.test.js)
- Gestión de clientes (client.test.js)
- Gestión de proyectos (project.test.js)
- Gestión de albaranes CRUD, firma, PDF (deliverynote.test.js)
- WebSockets y eventos en tiempo real (socket-test.html)

Los tests usan mongodb-memory-server, por lo que se ejecutan con una base de datos en memoria sin requerer MongoDB instalado.

## Probar los Endpoints

En la carpeta `.http/` está disponible el archivo `test.http` con ejemplos de requests para todos los endpoints. Puedes usar:

- VS Code Rest Client (extensión oficial)
- Postman (importar como raw HTTP)
- Cualquier cliente HTTP (curl, Insomnia, etc.)