import { Router } from 'express';
import { getAllTypes } from './pdfs-types.controller.js';

const router = Router();

router.get('/', getAllTypes);

export default router;
