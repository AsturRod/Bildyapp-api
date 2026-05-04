import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
	openapi: '3.0.3',
	info: {
		title: 'BildyApp API',
		version: '1.0.0',
		description:
			'Documentacion OpenAPI de BildyApp. Incluye autenticacion JWT, gestion de clientes, proyectos y albaranes.',
	},
	servers: [
		{
			url: '/api',
			description: 'Servidor API',
		},
	],
	tags: [
			{ name: 'User', description: 'Registro, autenticacion y perfil de usuario' },
			{ name: 'Company', description: 'Gestion de la compania del usuario' },
			{ name: 'Client', description: 'Gestion de clientes de la compania' },
			{ name: 'Project', description: 'Gestion de proyectos de la compania' },
			{ name: 'DeliveryNote', description: 'Gestion de albaranes y firma' },
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
			},
		},
		parameters: {
			idParam: {
				in: 'path',
				name: 'id',
				required: true,
				schema: { type: 'string' },
				description: 'ObjectId del recurso',
			},
			pageParam: {
				in: 'query',
				name: 'page',
				schema: { type: 'integer', minimum: 1, default: 1 },
			},
			limitParam: {
				in: 'query',
				name: 'limit',
				schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
			},
			nameParam: {
				in: 'query',
				name: 'name',
				schema: { type: 'string' },
			},
			sortParam: {
				in: 'query',
				name: 'sort',
				schema: { type: 'string' },
			},
			softDeleteParam: {
				in: 'query',
				name: 'soft',
				schema: { type: 'boolean', default: true },
				description: 'Si es true realiza archivo logico. Si es false elimina definitivamente.',
			},
			projectClientParam: {
				in: 'query',
				name: 'client',
				schema: { type: 'string' },
			},
			projectActiveParam: {
				in: 'query',
				name: 'active',
				schema: { type: 'boolean' },
			},
			deliveryProjectParam: {
				in: 'query',
				name: 'project',
				schema: { type: 'string' },
			},
			deliveryFormatParam: {
				in: 'query',
				name: 'format',
				schema: { type: 'string', enum: ['hours', 'material'] },
			},
			deliverySignedParam: {
				in: 'query',
				name: 'signed',
				schema: { type: 'boolean' },
			},
			deliveryFromParam: {
				in: 'query',
				name: 'from',
				schema: { type: 'string', format: 'date' },
			},
			deliveryToParam: {
				in: 'query',
				name: 'to',
				schema: { type: 'string', format: 'date' },
			},
		},
		schemas: {
			ErrorResponse: {
				type: 'object',
				properties: {
					status: { type: 'string', example: 'error' },
					message: { type: 'string', example: 'Error en la solicitud' },
					details: {
						type: 'array',
						items: { type: 'string' },
						nullable: true,
					},
				},
			},
			Pagination: {
				type: 'object',
				properties: {
					currentPage: { type: 'integer', example: 1 },
					totalPages: { type: 'integer', example: 3 },
					totalItems: { type: 'integer', example: 24 },
					hasNext: { type: 'boolean', example: true },
					hasPrev: { type: 'boolean', example: false },
				},
			},
			Address: {
				type: 'object',
				properties: {
					street: { type: 'string', example: 'Calle Mayor' },
					number: { type: 'string', example: '12' },
					postal: { type: 'string', example: '33001' },
					city: { type: 'string', example: 'Oviedo' },
					province: { type: 'string', example: 'Asturias' },
				},
			},
			User: {
				type: 'object',
				properties: {
					_id: { type: 'string', example: '6813b9c8ec9d02f1dd1a1111' },
					email: { type: 'string', format: 'email', example: 'ana@bildyapp.com' },
					name: { type: 'string', nullable: true, example: 'Ana' },
					lastName: { type: 'string', nullable: true, example: 'Garcia' },
					role: { type: 'string', enum: ['admin', 'guest'], example: 'admin' },
					status: { type: 'string', enum: ['pending', 'verified'], example: 'verified' },
					company: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Company' }], nullable: true },
				},
			},
			Company: {
				type: 'object',
				properties: {
					_id: { type: 'string', example: '6813b9c8ec9d02f1dd1a2222' },
					name: { type: 'string', example: 'Construcciones Norte SL' },
					cif: { type: 'string', example: 'B12345678' },
					address: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Address' }] },
					logoUrl: { type: 'string', nullable: true, example: '/uploads/logo-123.png' },
				},
			},
			Client: {
				type: 'object',
				properties: {
					_id: { type: 'string', example: '6813b9c8ec9d02f1dd1a3333' },
					name: { type: 'string', example: 'Cliente Uno' },
					cif: { type: 'string', example: 'A12345678' },
					email: { type: 'string', format: 'email', example: 'cliente@demo.com' },
					phone: { type: 'string', example: '666111222' },
					address: { $ref: '#/components/schemas/Address' },
					deleted: { type: 'boolean', example: false },
				},
			},
			Project: {
				type: 'object',
				properties: {
					_id: { type: 'string', example: '6813b9c8ec9d02f1dd1a4444' },
					name: { type: 'string', example: 'Reforma Oficina Central' },
					projectCode: { type: 'string', example: 'PROJ-001' },
					client: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Client' }] },
					address: { $ref: '#/components/schemas/Address' },
					active: { type: 'boolean', example: true },
					deleted: { type: 'boolean', example: false },
				},
			},
			DeliveryNoteWorker: {
				type: 'object',
				properties: {
					name: { type: 'string', example: 'Operario 1' },
					hours: { type: 'number', example: 4 },
				},
			},
			DeliveryNote: {
				type: 'object',
				properties: {
					_id: { type: 'string', example: '6813b9c8ec9d02f1dd1a5555' },
					project: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Project' }] },
					client: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Client' }] },
					format: { type: 'string', enum: ['material', 'hours'], example: 'hours' },
					description: { type: 'string', example: 'Trabajo de instalacion' },
					workDate: { type: 'string', format: 'date-time' },
					material: { type: 'string', nullable: true, example: 'Tubo PVC 20mm' },
					quantity: { type: 'number', nullable: true, example: 10 },
					unit: { type: 'string', nullable: true, example: 'uds' },
					hours: { type: 'number', nullable: true, example: 8 },
					workers: {
						type: 'array',
						items: { $ref: '#/components/schemas/DeliveryNoteWorker' },
					},
					signed: { type: 'boolean', example: false },
					signedAt: { type: 'string', format: 'date-time', nullable: true },
					signatureUrl: { type: 'string', nullable: true },
					pdfUrl: { type: 'string', nullable: true },
				},
			},
			AuthResponse: {
				type: 'object',
				properties: {
					user: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							email: { type: 'string' },
							name: { type: 'string', nullable: true },
							lastName: { type: 'string', nullable: true },
							fullName: { type: 'string', nullable: true },
							status: { type: 'string' },
							role: { type: 'string' },
							company: { nullable: true, oneOf: [{ type: 'null' }, { $ref: '#/components/schemas/Company' }] },
						},
					},
					accessToken: { type: 'string' },
					refreshToken: { type: 'string' },
				},
			},
			StatusMessage: {
				type: 'object',
				properties: {
					status: { type: 'string', example: 'success' },
					message: { type: 'string', example: 'Operacion realizada correctamente' },
				},
			},
			ClientListResponse: {
				type: 'object',
				properties: {
					status: { type: 'string', example: 'success' },
					data: { type: 'array', items: { $ref: '#/components/schemas/Client' } },
					pagination: { $ref: '#/components/schemas/Pagination' },
				},
			},
			ProjectListResponse: {
				type: 'object',
				properties: {
					status: { type: 'string', example: 'success' },
					data: { type: 'array', items: { $ref: '#/components/schemas/Project' } },
					pagination: { $ref: '#/components/schemas/Pagination' },
				},
			},
			DeliveryNoteListResponse: {
				type: 'object',
				properties: {
					status: { type: 'string', example: 'success' },
					data: { type: 'array', items: { $ref: '#/components/schemas/DeliveryNote' } },
					pagination: { $ref: '#/components/schemas/Pagination' },
				},
			},
		},
		requestBodies: {
			RegisterBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['email', 'password'],
							properties: {
								email: { type: 'string', format: 'email', example: 'ana@bildyapp.test' },
								password: { type: 'string', minLength: 8, example: 'Pass1234!' },
							},
						},
					},
				},
			},
			ValidationBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['code'],
							properties: { code: { type: 'string', example: '123456' } },
						},
					},
				},
			},
			LoginBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['email', 'password'],
							properties: {
								email: { type: 'string', format: 'email', example: 'ana@bildyapp.test' },
								password: { type: 'string', example: 'Pass1234!' },
							},
						},
					},
				},
			},
			PersonalDataBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								name: { type: 'string', example: 'Ana' },
								lastName: { type: 'string', example: 'Garcia' },
								nif: { type: 'string', example: '12345678A' },
							},
						},
					},
				},
			},
			CompanyBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['name', 'cif'],
							properties: {
								name: { type: 'string', example: 'Construcciones Norte SL' },
								cif: { type: 'string', example: 'B12345678' },
								address: { $ref: '#/components/schemas/Address' },
								isFreelance: { type: 'boolean', default: false },
							},
						},
					},
				},
			},
			ClientBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['name', 'cif', 'address'],
							properties: {
								name: { type: 'string', example: 'Cliente Uno' },
								cif: { type: 'string', example: 'A12345678' },
								email: { type: 'string', format: 'email', example: 'cliente@demo.com' },
								phone: { type: 'string', example: '666111222' },
								address: { $ref: '#/components/schemas/Address' },
							},
						},
					},
				},
			},
			ProjectBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['name', 'projectCode', 'client', 'address'],
							properties: {
								name: { type: 'string', example: 'Reforma Oficina Central' },
								projectCode: { type: 'string', example: 'PROJ-001' },
								client: { type: 'string', example: '6813b9c8ec9d02f1dd1a3333' },
								address: { $ref: '#/components/schemas/Address' },
								email: { type: 'string', format: 'email', example: 'obra@demo.com' },
								notes: { type: 'string', example: 'Acceso de 8:00 a 18:00' },
								active: { type: 'boolean', default: true },
							},
						},
					},
				},
			},
			DeliveryNoteBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							required: ['client', 'project', 'format', 'description', 'workDate'],
							properties: {
								client: { type: 'string', example: '6813b9c8ec9d02f1dd1a3333' },
								project: { type: 'string', example: '6813b9c8ec9d02f1dd1a4444' },
								format: { type: 'string', enum: ['material', 'hours'], example: 'hours' },
								description: { type: 'string', example: 'Instalacion electrica en planta 2' },
								workDate: { type: 'string', format: 'date-time', example: '2026-05-01T09:00:00.000Z' },
								material: { type: 'string', example: 'Tubo PVC', nullable: true },
								quantity: { type: 'number', example: 10, nullable: true },
								unit: { type: 'string', example: 'uds', nullable: true },
								hours: { type: 'number', example: 8, nullable: true },
								workers: {
									type: 'array',
									items: { $ref: '#/components/schemas/DeliveryNoteWorker' },
								},
							},
						},
					},
				},
			},
		},
	},
	paths: {
		'/health': {
			get: {
				tags: ['System'],
				summary: 'Comprobar el estado del servidor y MongoDB',
				responses: {
					'200': {
						description: 'Servidor operativo',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: { type: 'string', example: 'ok' },
										db: { type: 'string', enum: ['connected', 'disconnected'], example: 'connected' },
										uptime: { type: 'number', example: 123.45 },
										timestamp: { type: 'string', format: 'date-time' },
									},
								},
							},
						},
					},
				},
			},
		},
		'/user/register': {
			post: {
				tags: ['User'],
				summary: 'Registrar usuario',
				requestBody: { $ref: '#/components/requestBodies/RegisterBody' },
				responses: {
					'201': {
						description: 'Usuario registrado',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
					},
					'400': {
						description: 'Solicitud invalida',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
					},
					'409': {
						description: 'Email ya registrado',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
					},
				},
			},
			put: {
				tags: ['User'],
				summary: 'Completar datos personales',
				security: [{ bearerAuth: [] }],
				requestBody: { $ref: '#/components/requestBodies/PersonalDataBody' },
				responses: {
					'200': { description: 'Datos actualizados' },
					'401': { description: 'No autorizado' },
				},
			},
		},
		'/user/validation': {
			put: {
				tags: ['User'],
				summary: 'Validar email con codigo',
				security: [{ bearerAuth: [] }],
				requestBody: { $ref: '#/components/requestBodies/ValidationBody' },
				responses: {
					'200': { description: 'Usuario validado' },
					'400': { description: 'Codigo invalido' },
					'429': { description: 'Intentos agotados' },
				},
			},
		},
		'/user/validation/resend': {
			post: {
				tags: ['User'],
				summary: 'Reenviar codigo de validacion',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['email'],
								properties: { email: { type: 'string', format: 'email', example: 'ana@bildyapp.test' } },
							},
						},
					},
				},
				responses: {
					'200': { description: 'Codigo reenviado' },
					'404': { description: 'Usuario no encontrado' },
					'429': { description: 'Demasiadas solicitudes' },
				},
			},
		},
		'/user/login': {
			post: {
				tags: ['User'],
				summary: 'Iniciar sesion',
				requestBody: { $ref: '#/components/requestBodies/LoginBody' },
				responses: {
					'200': {
						description: 'Sesion iniciada',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
					},
					'401': { description: 'Credenciales invalidas' },
					'403': { description: 'Usuario no verificado' },
				},
			},
		},
		'/user/refresh': {
			post: {
				tags: ['User'],
				summary: 'Renovar token',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['refreshToken'],
								properties: { refreshToken: { type: 'string' } },
							},
						},
					},
				},
				responses: {
					'200': { description: 'Token renovado' },
					'401': { description: 'Refresh token invalido' },
				},
			},
		},
		'/user/logout': {
			post: {
				tags: ['User'],
				summary: 'Cerrar sesion',
				security: [{ bearerAuth: [] }],
				responses: { '200': { description: 'Sesion cerrada' } },
			},
		},
		'/user': {
			get: {
				tags: ['User'],
				summary: 'Obtener usuario autenticado',
				security: [{ bearerAuth: [] }],
				responses: {
					'200': {
						description: 'Usuario obtenido',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
					},
					'401': { description: 'No autorizado' },
				},
			},
			delete: {
				tags: ['User'],
				summary: 'Eliminar usuario',
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									soft: { type: 'boolean', default: true },
								},
							},
						},
					},
				},
				responses: { '200': { description: 'Usuario eliminado' }, '400': { description: 'Solicitud invalida' } },
			},
		},
		'/user/company': {
			patch: {
				tags: ['Company'],
				summary: 'Crear o actualizar compania',
				security: [{ bearerAuth: [] }],
				requestBody: { $ref: '#/components/requestBodies/CompanyBody' },
				responses: {
					'200': {
						description: 'Compania actualizada',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/Company' } } },
					},
				},
			},
		},
		'/user/logo': {
			patch: {
				tags: ['User'],
				summary: 'Subir logo de compania',
				security: [{ bearerAuth: [] }],
				responses: { '200': { description: 'Logo actualizado' } },
			},
		},
		'/user/password': {
			put: {
				tags: ['User'],
				summary: 'Cambiar contrasena',
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['currentPassword', 'newPassword'],
								properties: {
									currentPassword: { type: 'string', example: 'Pass1234!' },
									newPassword: { type: 'string', example: 'Pass4321!' },
								},
							},
						},
					},
				},
				responses: { '200': { description: 'Contrasena actualizada' }, '401': { description: 'No autorizado' } },
			},
		},
		'/user/invite': {
			post: {
				tags: ['User'],
				summary: 'Invitar usuario (admin)',
				security: [{ bearerAuth: [] }],
				responses: { '201': { description: 'Invitacion creada' }, '403': { description: 'Permisos insuficientes' } },
			},
		},
		'/client': {
			post: {
				tags: ['Client'],
				summary: 'Crear cliente',
				security: [{ bearerAuth: [] }],
				requestBody: { $ref: '#/components/requestBodies/ClientBody' },
				responses: { '201': { description: 'Cliente creado' }, '400': { description: 'Solicitud invalida' } },
			},
			get: {
				tags: ['Client'],
				summary: 'Listar clientes',
				security: [{ bearerAuth: [] }],
				parameters: [
					{ $ref: '#/components/parameters/pageParam' },
					{ $ref: '#/components/parameters/limitParam' },
					{ $ref: '#/components/parameters/nameParam' },
					{ $ref: '#/components/parameters/sortParam' },
				],
				responses: {
					'200': {
						description: 'Listado de clientes',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientListResponse' } } },
					},
				},
			},
		},
		'/client/archived': {
			get: {
				tags: ['Client'],
				summary: 'Listar clientes archivados',
				security: [{ bearerAuth: [] }],
				parameters: [
					{ $ref: '#/components/parameters/pageParam' },
					{ $ref: '#/components/parameters/limitParam' },
					{ $ref: '#/components/parameters/nameParam' },
					{ $ref: '#/components/parameters/sortParam' },
				],
				responses: { '200': { description: 'Listado de clientes archivados' } },
			},
		},
		'/client/{id}': {
			get: {
				tags: ['Client'],
				summary: 'Obtener cliente por ID',
				security: [{ bearerAuth: [] }],
				parameters: [{ $ref: '#/components/parameters/idParam' }],
				responses: { '200': { description: 'Cliente obtenido' }, '404': { description: 'Cliente no encontrado' } },
			},
			put: {
				tags: ['Client'],
				summary: 'Actualizar cliente',
				security: [{ bearerAuth: [] }],
				parameters: [{ $ref: '#/components/parameters/idParam' }],
				requestBody: { $ref: '#/components/requestBodies/ClientBody' },
				responses: { '200': { description: 'Cliente actualizado' }, '404': { description: 'Cliente no encontrado' } },
			},
			delete: {
				tags: ['Client'],
				summary: 'Eliminar cliente (soft o hard)',
				security: [{ bearerAuth: [] }],
				parameters: [
					{ $ref: '#/components/parameters/idParam' },
					{ $ref: '#/components/parameters/softDeleteParam' },
				],
				responses: { '200': { description: 'Cliente eliminado' } },
			},
		},
		'/client/{id}/restore': {
			patch: {
				tags: ['Client'],
				summary: 'Restaurar cliente archivado',
				security: [{ bearerAuth: [] }],
				parameters: [{ $ref: '#/components/parameters/idParam' }],
				responses: { '200': { description: 'Cliente restaurado' }, '404': { description: 'Cliente no encontrado' } },
			},
		},
		'/project': {
			post: {
				tags: ['Project'],
				summary: 'Crear proyecto',
				security: [{ bearerAuth: [] }],
				requestBody: { $ref: '#/components/requestBodies/ProjectBody' },
				responses: { '201': { description: 'Proyecto creado' }, '400': { description: 'Solicitud invalida' } },
			},
			get: {
				tags: ['Project'],
				summary: 'Listar proyectos',
				security: [{ bearerAuth: [] }],
				parameters: [
					{ $ref: '#/components/parameters/pageParam' },
					{ $ref: '#/components/parameters/limitParam' },
					{ $ref: '#/components/parameters/projectClientParam' },
					{ $ref: '#/components/parameters/nameParam' },
					{ $ref: '#/components/parameters/projectActiveParam' },
					{ $ref: '#/components/parameters/sortParam' },
				],
				responses: {
					'200': {
						description: 'Listado de proyectos',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectListResponse' } } },
					},
				},
			},
		},
		'/project/archived': {
			get: {
				tags: ['Project'],
				summary: 'Listar proyectos archivados',
				security: [{ bearerAuth: [] }],
				parameters: [
					{ $ref: '#/components/parameters/pageParam' },
					{ $ref: '#/components/parameters/limitParam' },
					{ $ref: '#/components/parameters/projectClientParam' },
					{ $ref: '#/components/parameters/nameParam' },
					{ $ref: '#/components/parameters/projectActiveParam' },
					{ $ref: '#/components/parameters/sortParam' },
				],
				responses: { '200': { description: 'Listado de proyectos archivados' } },
			},
		},
		'/project/{id}': {
			get: {
				tags: ['Project'],
				summary: 'Obtener proyecto por ID',
				security: [{ bearerAuth: [] }],
				parameters: [{ $ref: '#/components/parameters/idParam' }],
				responses: { '200': { description: 'Proyecto obtenido' }, '404': { description: 'Proyecto no encontrado' } },
			},
			put: {
				tags: ['Project'],
				summary: 'Actualizar proyecto',
				security: [{ bearerAuth: [] }],
				parameters: [{ $ref: '#/components/parameters/idParam' }],
				requestBody: { $ref: '#/components/requestBodies/ProjectBody' },
				responses: { '200': { description: 'Proyecto actualizado' }, '404': { description: 'Proyecto no encontrado' } },
			},
			delete: {
				tags: ['Project'],
				summary: 'Eliminar proyecto (soft o hard)',
				security: [{ bearerAuth: [] }],
				parameters: [
					{ $ref: '#/components/parameters/idParam' },
					{ $ref: '#/components/parameters/softDeleteParam' },
				],
				responses: { '200': { description: 'Proyecto eliminado' } },
			},
		},
		'/project/{id}/restore': {
			patch: {
				tags: ['Project'],
				summary: 'Restaurar proyecto archivado',
				security: [{ bearerAuth: [] }],
				parameters: [{ $ref: '#/components/parameters/idParam' }],
				responses: { '200': { description: 'Proyecto restaurado' }, '404': { description: 'Proyecto no encontrado' } },
			},
		},
		'/deliverynote': {
			post: {
				tags: ['DeliveryNote'],
				summary: 'Crear albaran',
				security: [{ bearerAuth: [] }],
				requestBody: { $ref: '#/components/requestBodies/DeliveryNoteBody' },
				responses: { '201': { description: 'Albaran creado' }, '400': { description: 'Solicitud invalida' } },
			},
			get: {
				tags: ['DeliveryNote'],
				summary: 'Listar albaranes',
				security: [{ bearerAuth: [] }],
				parameters: [
					{ $ref: '#/components/parameters/pageParam' },
					{ $ref: '#/components/parameters/limitParam' },
					{ $ref: '#/components/parameters/deliveryProjectParam' },
					{ $ref: '#/components/parameters/projectClientParam' },
					{ $ref: '#/components/parameters/deliveryFormatParam' },
					{ $ref: '#/components/parameters/deliverySignedParam' },
					{ $ref: '#/components/parameters/deliveryFromParam' },
					{ $ref: '#/components/parameters/deliveryToParam' },
					{ $ref: '#/components/parameters/sortParam' },
				],
				responses: {
					'200': {
						description: 'Listado de albaranes',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/DeliveryNoteListResponse' },
							},
						},
					},
				},
			},
		},
		'/deliverynote/pdf/{id}': {
			get: {
				tags: ['DeliveryNote'],
				summary: 'Descargar albaran PDF',
				security: [{ bearerAuth: [] }],
				parameters: [{ $ref: '#/components/parameters/idParam' }],
				responses: {
					'200': {
						description: 'PDF generado o JSON con url de PDF remoto',
						content: {
							'application/pdf': {
								schema: { type: 'string', format: 'binary' },
							},
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: { type: 'string', example: 'success' },
										data: {
											type: 'object',
											properties: { pdfUrl: { type: 'string', example: 'https://cdn.example.com/albaran.pdf' } },
										},
									},
								},
							},
						},
					},
					'404': { description: 'Albaran no encontrado' },
				},
			},
		},
		'/deliverynote/{id}': {
			get: {
				tags: ['DeliveryNote'],
				summary: 'Obtener albaran por ID',
				security: [{ bearerAuth: [] }],
				parameters: [{ $ref: '#/components/parameters/idParam' }],
				responses: { '200': { description: 'Albaran obtenido' }, '404': { description: 'Albaran no encontrado' } },
			},
			delete: {
				tags: ['DeliveryNote'],
				summary: 'Eliminar albaran',
				security: [{ bearerAuth: [] }],
				parameters: [{ $ref: '#/components/parameters/idParam' }],
				responses: {
					'200': { description: 'Albaran eliminado' },
					'400': { description: 'Albaran firmado no se puede eliminar' },
					'404': { description: 'Albaran no encontrado' },
				},
			},
		},
		'/deliverynote/{id}/sign': {
			patch: {
				tags: ['DeliveryNote'],
				summary: 'Firmar albaran',
				security: [{ bearerAuth: [] }],
				parameters: [{ $ref: '#/components/parameters/idParam' }],
				requestBody: {
					required: true,
					content: {
						'multipart/form-data': {
							schema: {
								type: 'object',
								properties: {
									signature: { type: 'string', format: 'binary' },
								},
							},
						},
					},
				},
				responses: {
					'200': { description: 'Albaran firmado' },
					'400': { description: 'Solicitud invalida' },
					'404': { description: 'Albaran no encontrado' },
				},
			},
		},
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
	apis: [
		'src/routes/*.js',
		'src/models/*.js',
	],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export { swaggerUi, swaggerSpec };
