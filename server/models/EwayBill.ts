import mongoose, { Schema, Document } from 'mongoose';

export interface IEwayBill extends Document {
  ewayBillNo: string;
  ewayBillDate: string;
  generatedBy: string;
  validFrom: string;
  validUntil: string;
  portal: string;

  // Part A - Consignment Details
  supplierGstin: string;
  supplierName: string;
  dispatchPlace: string;
  recipientGstin: string;
  recipientName: string;
  deliveryPlace: string;
  docNo: string;
  docDate: string;
  docType: string;
  transactionType: string;
  valueOfGoods: number;
  hsnCode: string;
  reasonForTransportation: string;
  transporter: string;

  // Part B - Vehicle & Transport Details
  mode: string;
  vehicleNo: string;
  fromPlace: string;
  enteredDate: string;
  enteredBy: string;
  cewbNo: string;
  multiVehInfo: string;
  partBPortal: string;

  // Meta & Linked Bill
  billId?: mongoose.Types.ObjectId | string;
  approxDistance?: number;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EwayBillSchema: Schema = new Schema(
  {
    ewayBillNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    ewayBillDate: {
      type: String,
      required: true,
      trim: true,
    },
    generatedBy: {
      type: String,
      required: true,
      trim: true,
    },
    validFrom: {
      type: String,
      required: true,
      trim: true,
    },
    validUntil: {
      type: String,
      required: true,
      trim: true,
    },
    portal: {
      type: String,
      default: '1',
      trim: true,
    },

    // Part A
    supplierGstin: {
      type: String,
      default: '',
      trim: true,
    },
    supplierName: {
      type: String,
      default: '',
      trim: true,
    },
    dispatchPlace: {
      type: String,
      default: '',
      trim: true,
    },
    recipientGstin: {
      type: String,
      default: 'URP',
      trim: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryPlace: {
      type: String,
      default: '',
      trim: true,
    },
    docNo: {
      type: String,
      required: true,
      trim: true,
    },
    docDate: {
      type: String,
      required: true,
      trim: true,
    },
    docType: {
      type: String,
      default: 'Tax Invoice',
      trim: true,
    },
    transactionType: {
      type: String,
      default: 'Regular',
      trim: true,
    },
    valueOfGoods: {
      type: Number,
      required: true,
      default: 0,
    },
    hsnCode: {
      type: String,
      default: '3604 - FIREWORKS',
      trim: true,
    },
    reasonForTransportation: {
      type: String,
      default: 'Outward - Supply',
      trim: true,
    },
    transporter: {
      type: String,
      default: '',
      trim: true,
    },

    // Part B
    mode: {
      type: String,
      default: 'Road',
      trim: true,
    },
    vehicleNo: {
      type: String,
      default: '',
      trim: true,
    },
    fromPlace: {
      type: String,
      default: '',
      trim: true,
    },
    enteredDate: {
      type: String,
      default: '',
      trim: true,
    },
    enteredBy: {
      type: String,
      default: '',
      trim: true,
    },
    cewbNo: {
      type: String,
      default: '-',
      trim: true,
    },
    multiVehInfo: {
      type: String,
      default: '-',
      trim: true,
    },
    partBPortal: {
      type: String,
      default: '1',
      trim: true,
    },

    // Meta
    billId: {
      type: Schema.Types.ObjectId,
      ref: 'Particular',
      required: false,
    },
    approxDistance: {
      type: Number,
      default: 100,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const EwayBill = mongoose.model<IEwayBill>('EwayBill', EwayBillSchema);
