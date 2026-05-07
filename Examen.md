**Parte 2 — Preguntas socráticas sobre TU código (responder en EXAMEN.md):**

1. En `src/controllers/deliverynote.controller.js:195` usas `AppError.badRequest` (400) para rechazar el borrado de un albarán firmado. ¿Cuál es la diferencia semántica entre un 400 y un 409? ¿Cuándo debería un cliente esperar un 400 frente a un 409?

	Un 400(Bad Request) indica que la petición está mal formadao o que no ha pasado la validación de entreada, sea porque faltan campos, el formato es incorrecto o los datos no son interpretables. En cambio, un 409 (conflict) indica que la petición está bien formada, pero no puede aplicarse porque choca con el estado actual del recurso o con una regla de negocio, como intentar borrar un albarán ya firmado.

	Por tanto, un cliente debería esperar 400 cuando el problema está en lo que envía y puede corregirse cambiando el payload. Debería esperar `409` cuando la petición es correcta, pero la operación entra en conflicto con el estado de ese recurso.

2. En `src/controllers/project.controller.js:268` el `Project.countDocuments(filter)` no lleva `.setOptions({includeDeleted:true})`. ¿Qué devuelve ese `countDocuments` y por qué? ¿Cómo afecta a `totalPages` y `totalItems`?

	Devolvería el mismo número, unicamente con los proyectos archivados que coincidan con el filtro.
	

3. En `src/controllers/client.controller.js:26` el filtro es `{ company: companyId }` sin `deleted:{ $ne:true }`, pero los archivados no aparecen en el listado. ¿Por qué funciona correctamente y en qué archivo y línea está el código que lo garantiza?

    Funciona porque el modelo de Cliente tiene un hook pre(find) que añade automaticamente la condicion de borrado, por eso aunque el filtro no lo incluya, los clientes archivados no se devuelven.


4. Imagina que un cliente React muestra "datos incorrectos" al recibir 400 y "recargar estado" al recibir 409. ¿Qué experiencia de usuario incorrecta se produce si mantienes 400 en lugar de 409 para el borrado de firmados?

    Si se mantiene el 400 en lugar de 409, el cliente interpreta que se debe a un error en el input enviado, a pesar de que la petición es correcta, en vez de mostrar el 409 correspondiente indicando que es un problema de estado con un recurso.



5. En `src/validators/deliverynote.validator.js:43` validas con `.superRefine()` y en `src/models/DeliveryNote.js:128` repites la misma comprobación con un hook `pre('validate')`. ¿Por qué tienes las dos capas? ¿Podrías eliminar una sin perder seguridad? ¿Cuál dejarías y por qué?

    La primera capa con el superrefine se encarga de validad la entrada del cliente, asegurando el formato a nivel de petición, mientras que el hook pre(validate) se asegura de que se cumpla la regla de negocio a nivel de modelo antes de la persistencia en la BD.
    No conviene eliminarla porque cada una cumple una función distinta para proteger la integridad de los datos. Si tuviera que contestar una dejaria el pre(validate) porque es la que valida e interactua a nivel de modelo para proteger y garantizar datos validados antes de entrar a la BBDD.