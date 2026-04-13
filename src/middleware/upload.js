import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const uploadDir = 'uploads';

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const basename = path
            .basename(file.originalname, ext)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '');

        cb(null, `${basename}-${Date.now()}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if(file.mimetype.startsWith('image/')) {
        return cb(null, true);
    }
    return cb(new Error('Solo se permiten archivos de imagen'));
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,

});

export default upload;