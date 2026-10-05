import { Router } from 'express';
import {
  getAllEwayBills,
  getEwayBillById,
  createEwayBill,
  updateEwayBill,
  deleteEwayBill,
  getNextEwayBillNo,
} from '../controllers/ewayBillController';

const router = Router();

router.get('/next-no', getNextEwayBillNo);
router.get('/', getAllEwayBills);
router.get('/:id', getEwayBillById);
router.post('/', createEwayBill);
router.put('/:id', updateEwayBill);
router.delete('/:id', deleteEwayBill);

export default router;
