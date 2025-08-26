import express from 'express';
import photoController from '../controllers/photoController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { validatePhotoUpdate } from '../middleware/validators.js';
import requireAdmin from '../middleware/rbac.js';

const router = express.Router();

router.use(auth);

router.post('/', upload.single('image'), photoController.createPhoto);
router.get('/', photoController.getPhotos);
router.get('/all', requireAdmin, photoController.getAllPhotos);
router.get('/:id', photoController.getPhotoById);
router.put('/:id', upload.single('image'), validatePhotoUpdate, photoController.updatePhoto);
router.delete('/:id', photoController.deletePhoto);

// Multer error handler
router.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default router; 