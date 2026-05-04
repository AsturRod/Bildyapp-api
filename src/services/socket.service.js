let ioInstance = null;

const setSocketIO = (io) => {
	ioInstance = io;
	return ioInstance;
};

const getSocketIO = () => ioInstance;

const emitToCompany = (companyId, eventName, payload) => {
	if (!ioInstance || !companyId) return false;

	ioInstance.to(`company:${companyId}`).emit(eventName, payload);
	return true;
};

export { setSocketIO, getSocketIO, emitToCompany };