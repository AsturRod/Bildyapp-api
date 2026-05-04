import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authenticateSocket = async (socket, next) => {
	const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

	if (!token) {
		return next(new Error('Token de autenticación requerido'));
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
		const user = await User.findById(decoded.id).select('_id company deleted').lean();

		if (!user || user.deleted) {
			return next(new Error('Usuario no válido para Socket.IO'));
		}

		socket.userId = user._id.toString();
		socket.companyId = user.company ? user.company.toString() : null;
		return next();
	} catch (error) {
		return next(new Error('Token inválido o expirado'));
	}
};

export default authenticateSocket;