import { Request, Response } from 'express';
import { EwayBill } from '../models/EwayBill';
import { Particular } from '../models/Particular';

const escapeRegex = (text: string): string => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

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
      const escapedRecipient = escapeRegex(String(recipientName).trim());
      filter.recipientName = new RegExp(escapedRecipient, 'i');
    }

    if (search) {
      const rawSearch = String(search).trim();
      const escapedSearch = escapeRegex(rawSearch);
      const escapedNoSpace = escapeRegex(rawSearch.replace(/\s+/g, ''));
      filter.$or = [
        { ewayBillNo: new RegExp(escapedNoSpace, 'i') },
        { ewayBillNo: new RegExp(escapedSearch, 'i') },
        { docNo: new RegExp(escapedSearch, 'i') },
        { recipientName: new RegExp(escapedSearch, 'i') },
        { vehicleNo: new RegExp(escapedSearch, 'i') },
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
    const data = { ...req.body };

    if (!data.ewayBillNo || !data.ewayBillNo.trim()) {
      data.ewayBillNo = await generateEwayBillNo();
    } else {
      data.ewayBillNo = data.ewayBillNo.trim();
    }

    const existing = await EwayBill.findOne({ ewayBillNo: data.ewayBillNo });
    if (existing) {
      res.status(400).json({ success: false, error: 'An e-Way Bill with this number already exists' });
      return;
    }

    // Ensure valueOfGoods is a valid number
    if (data.valueOfGoods !== undefined && data.valueOfGoods !== null) {
      data.valueOfGoods = typeof data.valueOfGoods === 'number'
        ? data.valueOfGoods
        : parseFloat(String(data.valueOfGoods).replace(/,/g, '')) || 0;
    }

    const newBill = new EwayBill(data);
    await newBill.save();

    // Auto sync ewayBillNo and vehicleNo to linked Particular invoice if available
    try {
      if (data.billId) {
        await Particular.findByIdAndUpdate(data.billId, {
          ewayBillNo: newBill.ewayBillNo,
          ...(data.vehicleNo ? { vehicleNo: data.vehicleNo } : {}),
        });
      } else if (data.docNo) {
        await Particular.findOneAndUpdate(
          { billNo: data.docNo },
          {
            ewayBillNo: newBill.ewayBillNo,
            ...(data.vehicleNo ? { vehicleNo: data.vehicleNo } : {}),
          }
        );
      }
    } catch (syncErr) {
      console.warn('Could not sync E-Way bill with Particular:', syncErr);
    }

    res.status(201).json({ success: true, data: newBill });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'An e-Way Bill with this number already exists' });
      return;
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateEwayBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = { ...req.body };
    if (data.ewayBillNo) {
      data.ewayBillNo = data.ewayBillNo.trim();
    }
    if (data.valueOfGoods !== undefined && data.valueOfGoods !== null) {
      data.valueOfGoods = typeof data.valueOfGoods === 'number'
        ? data.valueOfGoods
        : parseFloat(String(data.valueOfGoods).replace(/,/g, '')) || 0;
    }

    const updated = await EwayBill.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404).json({ success: false, error: 'E-Way Bill not found' });
      return;
    }

    // Sync to linked invoice if exists
    try {
      if (updated.billId) {
        await Particular.findByIdAndUpdate(updated.billId, {
          ewayBillNo: updated.ewayBillNo,
          ...(updated.vehicleNo ? { vehicleNo: updated.vehicleNo } : {}),
        });
      } else if (updated.docNo) {
        await Particular.findOneAndUpdate(
          { billNo: updated.docNo },
          {
            ewayBillNo: updated.ewayBillNo,
            ...(updated.vehicleNo ? { vehicleNo: updated.vehicleNo } : {}),
          }
        );
      }
    } catch (syncErr) {
      console.warn('Could not sync E-Way bill update with Particular:', syncErr);
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'An e-Way Bill with this number already exists' });
      return;
    }
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

