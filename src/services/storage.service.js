import { v2 as cloudinary } from 'cloudinary';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const isCloudinaryConfigured = () => {
	return Boolean(
		process.env.CLOUDINARY_CLOUD_NAME &&
			process.env.CLOUDINARY_API_KEY &&
			process.env.CLOUDINARY_API_SECRET
	);
};

let cloudinaryReady = false;

const ensureCloudinaryConfig = () => {
	if (cloudinaryReady || !isCloudinaryConfigured()) {
		return cloudinaryReady;
	}

	cloudinary.config({
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET,
		secure: true,
	});

	cloudinaryReady = true;
	return true;
};

const uploadFile = (filePath, options) => {
	return new Promise((resolve, reject) => {
		cloudinary.uploader.upload(filePath, options, (error, result) => {
			if (error) {
				return reject(error);
			}

			return resolve(result);
		});
	});
};

const uploadBuffer = (buffer, options) => {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
			if (error) {
				return reject(error);
			}

			return resolve(result);
		});

		stream.end(buffer);
	});
};

const removeLocalFile = async (filePath) => {
	if (!filePath) return;

	try {
		await fs.unlink(filePath);
	} catch (_error) {
		
	}
};

export const isCloudStorageEnabled = () => ensureCloudinaryConfig();

export const uploadSignatureFile = async ({ filePath, deliveryNoteId }) => {
	// Optimización Sharp
	try {
		const inputBuffer = await fs.readFile(filePath);
		const optimizedBuffer = await sharp(inputBuffer)
			.resize({ width: 1200, withoutEnlargement: true })
			.png({ compressionLevel: 8 })
			.toBuffer();

		if (!ensureCloudinaryConfig()) {
			await fs.writeFile(filePath, optimizedBuffer);
			return {
				url: path.resolve(filePath),
				publicId: null,
				provider: 'local',
			};
		}

		const result = await uploadBuffer(optimizedBuffer, {
			folder: 'bildyapp/signatures',
			public_id: `signature-${deliveryNoteId}`,
			overwrite: true,
			resource_type: 'image',
		});

		await removeLocalFile(filePath);

		return {
			url: result.secure_url || result.url,
			publicId: result.public_id,
			provider: 'cloudinary',
		};
	} catch (error) {
		
		if (!ensureCloudinaryConfig()) {
			return {
				url: path.resolve(filePath),
				publicId: null,
				provider: 'local',
			};
		}

		const result = await uploadFile(filePath, {
			folder: 'bildyapp/signatures',
			public_id: `signature-${deliveryNoteId}`,
			overwrite: true,
			resource_type: 'image',
		});

		await removeLocalFile(filePath);

		return {
			url: result.secure_url || result.url,
			publicId: result.public_id,
			provider: 'cloudinary',
		};
	}
};

export const uploadDeliveryNotePdf = async ({ buffer, deliveryNoteId }) => {
	if (!ensureCloudinaryConfig()) {
		return {
			url: `/api/deliverynote/pdf/${deliveryNoteId}`,
			publicId: null,
			provider: 'local',
		};
	}

	const result = await uploadBuffer(buffer, {
		folder: 'bildyapp/deliverynotes',
		public_id: `deliverynote-${deliveryNoteId}`,
		overwrite: true,
		resource_type: 'raw',
		format: 'pdf',
	});

	return {
		url: result.secure_url || result.url,
		publicId: result.public_id,
		provider: 'cloudinary',
	};
};

export const getSignedPdfUrl = (publicId, expiresSeconds = 300) => {
	if (!ensureCloudinaryConfig() || !publicId) return null;

	// cloudinary.utils.private_download_url genera una URL firmada para descargar un recurso privado, válida por un tiempo limitado
	try {
		const expiresAt = Math.floor(Date.now() / 1000) + expiresSeconds;
		const url = cloudinary.utils.private_download_url(publicId, {
			resource_type: 'raw',
			expires_at: expiresAt,
		});
		return url;
	} catch (error) {
		return null;
	}
};
