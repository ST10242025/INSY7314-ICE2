import express from 'express';
import userController from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/rbac.js';
import { validateUserUpdate } from '../middleware/validators.js';

const router = express.Router();

router.use(auth);
router.get('/me', userController.getMe);
router.put('/me', validateUserUpdate, userController.updateMe);
router.get('/', requireAdmin, userController.getAllUsers);
router.get('/:id', requireAdmin, userController.getUserById);
router.delete('/:id', requireAdmin, userController.deleteUserById);
router.put('/:id/promote', requireAdmin, userController.promoteUserToAdmin);
router.put('/:id/demote', requireAdmin, userController.demoteUserFromAdmin);

export default router; 