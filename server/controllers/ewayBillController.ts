import { Request, Response } from 'express';
import { EwayBill } from '../models/EwayBill';

// Helper to generate realistic 12-digit e-way bill number
const generateEwayBillNo = async (): Promise<string> => {
  // Format: 12-digit number like "5120 7062 3138"
  const prefix = '5120';
  const mid = Math.floor(1000 + Math.random() * 9000).toString();
  const end = Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix} ${mid} ${end}`;
};

export const getNextEwayBillNo = async (_req: Request, res: Response): Promise<void> => {
  try {
    let billNo = await generateEwayBillNo();
    // Ensure uniqueness
    let exists = await EwayBill.findOne({ ewayBillNo: billNo });
    while (exists) {
      billNo = await generateEwayBillNo();
      exists = await EwayBill.findOne({ ewayBillNo: billNo });
    }
    res.status(200).json({ success: true, ewayBillNo: billNo });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllEwayBills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, recipientName, status } = req.query;
    const filter: any = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (recipientName && recipientName !== 'ALL') {
      filter.recipientName = new RegExp(String(recipientName), 'i');
    }

    if (search) {
      const s = String(search).trim();
      filter.$or = [
        { ewayBillNo: new RegExp(s.replace(/\s+/g, ''), 'i') },
        { ewayBillNo: new RegExp(s, 'i') },
        { docNo: new RegExp(s, 'i') },
        { recipientName: new RegExp(s, 'i') },
        { vehicleNo: new RegExp(s, 'i') },
      ];
    }

    const bills = await EwayBill.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bills.length, data: bills });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEwayBillById = async (req: Request, res: Response): Promise<void> => {
  try {
    const bill = await EwayBill.findById(req.params.id);
    if (!bill) {
      res.status(404).json({ success: false, error: 'E-Way Bill not found' });
      return;
    }
    res.status(200).json({ success: true, data: bill });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createEwayBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;

    if (!data.ewayBillNo) {
      data.ewayBillNo = await generateEwayBillNo();
    }

    const existing = await EwayBill.findOne({ ewayBillNo: data.ewayBillNo.trim() });
    if (existing) {
      res.status(400).json({ success: false, error: 'An e-Way Bill with this number already exists' });
      return;
    }

    const newBill = new EwayBill(data);
    await newBill.save();

    res.status(201).json({ success: true, data: newBill });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateEwayBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await EwayBill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404).json({ success: false, error: 'E-Way Bill not found' });
      return;
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteEwayBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await EwayBill.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'E-Way Bill not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'E-Way Bill deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
