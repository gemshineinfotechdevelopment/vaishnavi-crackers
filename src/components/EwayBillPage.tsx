import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';

import { EwayBillsApi, ParticularsApi, CustomersApi } from '../services/api';
import { getStoredSettings } from './SettingsPage';
import { EwayBillPrintTemplate, type EwayBillData } from './EwayBillPrintTemplate';

const TRANSACTION_TYPES = [
  'Regular',
  'Bill To - Ship To',
  'Bill From - Dispatch From',
  'Combination of 2 and 3',
];

const TRANSPORT_REASONS = [
  'Outward - Supply',
  'Export',
  'Job Work',
  'SKD/CKD',
  'Recipient Not Known',
  'For Own Use',
  'Exhibition or Fairs',
  'Line Sales',
  'Others',
];

const TRANSPORT_MODES = ['Road', 'Rail', 'Air', 'Ship'];

// Helper to format date in DD/MM/YYYY hh:mm A
const formatCurrentDateTime = (dateObj: Date = new Date()) => {
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${strHours}:${minutes} ${ampm}`;
};

const formatDateOnly = (dateObj: Date = new Date()) => {
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const EwayBillPage: React.FC = () => {
  const [bills, setBills] = useState<EwayBillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<EwayBillData | null>(null);
  const [previewBill, setPreviewBill] = useState<EwayBillData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Available Bills to import
  const [existingBills, setExistingBills] = useState<any[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [selectedImportBillId, setSelectedImportBillId] = useState<string>('');

  // Form State
  const initialFormState: EwayBillData = {
    ewayBillNo: '',
    ewayBillDate: formatCurrentDateTime(),
    generatedBy: '',
    validFrom: '',
    validUntil: '',
    portal: '1',

    // Part A
    supplierGstin: '',
    supplierName: '',
    dispatchPlace: '',
    recipientGstin: 'URP',
    recipientName: '',
    deliveryPlace: '',
    docNo: '',
    docDate: formatDateOnly(),
    docType: 'Tax Invoice',
    transactionType: 'Regular',
    valueOfGoods: '',
    hsnCode: '3604 - FIREWORKS',
    reasonForTransportation: 'Outward - Supply',
    transporter: '',

    // Part B
    mode: 'Road',
    vehicleNo: '',
    fromPlace: '',
    enteredDate: formatCurrentDateTime(),
    enteredBy: '',
    cewbNo: '-',
    multiVehInfo: '-',
    partBPortal: '1',

    approxDistance: 100,
    remarks: '',
  };

  const [formData, setFormData] = useState<EwayBillData>(initialFormState);

  // Fetch E-Way Bills
  const fetchEwayBills = async () => {
    setLoading(true);
    try {
      const data = await EwayBillsApi.getAll({
        search: searchQuery,
        status: statusFilter,
      });
      setBills(Array.isArray(data) ? data : []);
      setErrorMsg('');
    } catch (err: any) {
      console.error('Failed to fetch E-Way bills:', err);
      setErrorMsg('Failed to load e-Way Bills. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEwayBills();
  }, [searchQuery, statusFilter]);

  // Load existing bills & customers for 1-click import
  useEffect(() => {
    ParticularsApi.getAll()
      .then((data) => {
        if (Array.isArray(data)) {
          setExistingBills(data);
        }
      })
      .catch(() => {});

    CustomersApi.getAll()
      .then((data) => {
        if (Array.isArray(data)) {
          setExistingCustomers(data);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize form with Store Settings defaults
  const handleOpenCreateModal = async () => {
    const settings = getStoredSettings();
    const now = new Date();
    const validUntilDate = new Date();
    validUntilDate.setDate(now.getDate() + 1); // 1 day for 100km default

    const supplierGstin = settings.gstin || '';
    const supplierName = settings.companyName || 'Vaishnavi Crackers';
    const city = settings.city || 'Sivakasi';
    const state = settings.state || 'TAMIL NADU';
    const pincode = settings.pincode ? `-${settings.pincode}` : '-626123';
    const dispatchPlace = `${city},${state}${pincode}`;
    const generatedBy = supplierGstin ? `${supplierGstin} - ${supplierName}` : supplierName;

    // Fetch next eway bill number
    let nextNo = '';
    try {
      const res = await EwayBillsApi.getNextNo();
      if (res && res.ewayBillNo) {
        nextNo = res.ewayBillNo;
      }
    } catch {
      nextNo = `5120 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const ewayDateStr = formatCurrentDateTime(now);
    const validFromStr = `${ewayDateStr} [100Kms]`;
    const validUntilStr = formatDateOnly(validUntilDate);

    setFormData({
      ...initialFormState,
      ewayBillNo: nextNo,
      ewayBillDate: ewayDateStr,
      generatedBy,
      validFrom: validFromStr,
      validUntil: validUntilStr,
      supplierGstin,
      supplierName,
      dispatchPlace,
      fromPlace: city,
      enteredBy: supplierGstin || supplierName,
      enteredDate: ewayDateStr,
    });
    setEditItem(null);
    setSelectedImportBillId('');
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (bill: EwayBillData) => {
    setEditItem(bill);
    setFormData({ ...bill });
    setSelectedImportBillId('');
    setCreateModalOpen(true);
  };

  // Handle Import from Existing Bill
  const handleImportBill = (billId: string) => {
    setSelectedImportBillId(billId);
    if (!billId) return;

    const b = existingBills.find((item) => (item._id || item.id) === billId);
    if (!b) return;

    const custName = b.customerName || '';
    const cust = existingCustomers.find(
      (c) => c.name?.toLowerCase() === custName.toLowerCase()
    );

    const custGstin = b.customerGst || cust?.gstNumber || 'URP';
    const custCity = b.customerCity || cust?.city || 'Sattur';
    const custAddress = b.customerAddress || cust?.address || '';
    const deliveryPlace = [custAddress, custCity, 'TAMIL NADU'].filter(Boolean).join(', ');

    const totalVal = b.grandTotal || b.totalAmount || b.total || 0;
    const docDate = b.date || formatDateOnly();

    setFormData((prev) => ({
      ...prev,
      recipientName: custName,
      recipientGstin: custGstin,
      deliveryPlace: deliveryPlace || `${custCity}, TAMIL NADU-626203`,
      docNo: String(b.billNo || b.invoiceNo || prev.docNo || ''),
      docDate: docDate,
      valueOfGoods: totalVal,
      docType: b.billType === 'GST' ? 'Tax Invoice' : 'Bill of Supply',
      reasonForTransportation: 'Outward - Supply',
      hsnCode: '3604 - FIREWORKS',
    }));
  };

  // Distance change -> Recalculate validity
  const handleDistanceChange = (dist: number) => {
    const daysValid = Math.max(1, Math.ceil(dist / 100)); // 1 day per 100km
    const now = new Date();
    const untilDate = new Date();
    untilDate.setDate(now.getDate() + daysValid);

    const validFromStr = `${formData.ewayBillDate} [${dist}Kms]`;
    const validUntilStr = formatDateOnly(untilDate);

    setFormData((prev) => ({
      ...prev,
      approxDistance: dist,
      validFrom: validFromStr,
      validUntil: validUntilStr,
    }));
  };

  // Save / Submit E-Way Bill
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipientName.trim()) {
      setErrorMsg('Recipient name is required');
      return;
    }
    if (!formData.docNo.trim()) {
      setErrorMsg('Document No. is required');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      if (editItem && editItem._id) {
        await EwayBillsApi.update(editItem._id, formData);
        setSuccessMsg('e-Way Bill updated successfully');
      } else {
        await EwayBillsApi.create(formData);
        setSuccessMsg('e-Way Bill generated successfully');
      }
      setCreateModalOpen(false);
      fetchEwayBills();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error saving e-Way Bill');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete E-Way Bill
  const handleDelete = async (id: string) => {
    try {
      await EwayBillsApi.delete(id);
      setSuccessMsg('e-Way Bill removed');
      setDeleteConfirmId(null);
      fetchEwayBills();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error deleting e-Way Bill');
    }
  };

  // Print Action
  const handlePrint = (bill: EwayBillData) => {
    const printWindow = window.open('', '_blank', 'width=900,height=950');
    if (!printWindow) {
      alert('Please allow popups to print e-Way Bill');
      return;
    }

    const rawNo = (bill.ewayBillNo || '5120 7062 3138').trim();
    const digitsOnly = rawNo.replace(/\s+/g, '');
    const formattedNo = rawNo.includes(' ')
      ? rawNo
      : digitsOnly.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');

    const qrData = encodeURIComponent(
      `EWB:${digitsOnly}|DATE:${bill.ewayBillDate || ''}|FROM:${bill.supplierGstin || ''}|TO:${bill.recipientGstin || ''}|VAL:${bill.valueOfGoods || ''}`
    );
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrData}`;

    const valGoodsNum = typeof bill.valueOfGoods === 'number'
      ? bill.valueOfGoods
      : parseFloat(String(bill.valueOfGoods || 0).replace(/,/g, '')) || 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>e-Way Bill #${formattedNo}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            body {
              font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
              color: #000000;
              margin: 0;
              padding: 0;
              font-size: 11px;
              background-color: #ffffff;
            }
            .header-title {
              text-align: center;
              font-size: 17px;
              font-weight: bold;
              margin-bottom: 6px;
            }
            .qr-box {
              text-align: center;
              margin-bottom: 8px;
            }
            .qr-box img {
              width: 90px;
              height: 90px;
              display: inline-block;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #777777;
              margin-bottom: 8px;
              font-size: 11px;
            }
            td, th {
              padding: 4.5px 8px;
            }
            .border-b { border-bottom: 1px solid #999999; }
            .border-r { border-right: 1px solid #999999; }
            .section-head {
              background-color: #f9f9f9;
              font-weight: bold;
              font-size: 11.5px;
              text-transform: uppercase;
              border-top: 1px solid #555555;
              border-bottom: 1px solid #777777;
            }
            .part-b-th {
              background-color: #f5f5f5;
              border-bottom: 1px solid #777777;
              font-weight: bold;
              font-size: 10.5px;
            }
            .barcode-container {
              text-align: center;
              margin: 14px auto 6px auto;
            }
            .barcode-text {
              font-size: 10px;
              letter-spacing: 0.08em;
              font-weight: bold;
              margin-top: 2px;
            }
            .footer-note {
              border-top: 1px solid #aaaaaa;
              padding-top: 5px;
              font-size: 9.5px;
              font-style: italic;
              color: #333333;
            }
          </style>
        </head>
        <body>
          <div class="header-title">e-Way Bill</div>
          <div class="qr-box">
            <img src="${qrUrl}" alt="QR" />
          </div>

          <table>
            <tbody>
              <tr class="border-b">
                <td style="width: 28%; font-weight: bold;" class="border-r">E-Way Bill No:</td>
                <td style="font-weight: bold; font-size: 13px; letter-spacing: 0.04em;">${formattedNo}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">E-Way Bill Date:</td>
                <td style="font-weight: bold;">${bill.ewayBillDate || '-'}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">Generated By:</td>
                <td>${bill.generatedBy || `${bill.supplierGstin || ''} - ${bill.supplierName || ''}`}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">Valid From:</td>
                <td>${bill.validFrom || '-'}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">Valid Until:</td>
                <td style="font-weight: bold;">${bill.validUntil || '-'}</td>
              </tr>
              <tr class="border-b" style="border-bottom: 1.5px solid #555555;">
                <td style="font-weight: bold;" class="border-r">Portal:</td>
                <td>${bill.portal || '1'}</td>
              </tr>

              <!-- Part - A -->
              <tr>
                <td colspan="2" class="section-head">Part - A</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">GSTIN of Supplier</td>
                <td style="text-transform: uppercase;">${[bill.supplierGstin, bill.supplierName].filter(Boolean).join(',')}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">Place of Dispatch</td>
                <td>${bill.dispatchPlace || '-'}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">GSTIN of Recipient</td>
                <td>${[bill.recipientGstin || 'URP', bill.recipientName].filter(Boolean).join(' , ')}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">Place of Delivery</td>
                <td>${bill.deliveryPlace || '-'}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">Document No.</td>
                <td style="font-weight: bold;">${bill.docNo || '-'}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">Document Date</td>
                <td>${bill.docDate || '-'}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">Transaction Type:</td>
                <td>${bill.transactionType || 'Regular'}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">Value of Goods</td>
                <td style="font-weight: bold;">${valGoodsNum.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">HSN Code</td>
                <td>${bill.hsnCode || '3604 - FIREWORKS'}</td>
              </tr>
              <tr class="border-b">
                <td style="font-weight: bold;" class="border-r">Reason for Transportation</td>
                <td>${bill.reasonForTransportation || 'Outward - Supply'}</td>
              </tr>
              <tr style="border-bottom: 1.5px solid #555555;">
                <td style="font-weight: bold;" class="border-r">Transporter</td>
                <td>${bill.transporter || '-'}</td>
              </tr>

              <!-- Part - B -->
              <tr>
                <td colspan="2" class="section-head">Part - B</td>
              </tr>
            </tbody>
          </table>

          <!-- Part B Table -->
          <table>
            <thead>
              <tr class="part-b-th">
                <th class="border-r" style="width: 9%; text-align: left;">Mode</th>
                <th class="border-r" style="width: 18%; text-align: left;">Vehicle / Trans Doc No & Dt.</th>
                <th class="border-r" style="width: 18%; text-align: left;">From</th>
                <th class="border-r" style="width: 18%; text-align: left;">Entered Date</th>
                <th class="border-r" style="width: 18%; text-align: left;">Entered By</th>
                <th class="border-r" style="width: 10%; text-align: center;">CEWB No. (If any)</th>
                <th class="border-r" style="width: 11%; text-align: center;">Multi Veh.Info (If any)</th>
                <th style="width: 6%; text-align: center;">Portal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border-r">${bill.mode || 'Road'}</td>
                <td class="border-r" style="font-weight: bold;">${bill.vehicleNo || '-'}</td>
                <td class="border-r">${bill.fromPlace || '-'}</td>
                <td class="border-r">${bill.enteredDate || bill.ewayBillDate || '-'}</td>
                <td class="border-r">${bill.enteredBy || bill.supplierGstin || '-'}</td>
                <td class="border-r" style="text-align: center;">${bill.cewbNo || '-'}</td>
                <td class="border-r" style="text-align: center;">${bill.multiVehInfo || '-'}</td>
                <td style="text-align: center;">${bill.partBPortal || bill.portal || '1'}</td>
              </tr>
            </tbody>
          </table>

          <div class="barcode-container">
            <svg width="220" height="38" viewBox="0 0 220 38" style="display: block; margin: 0 auto;">
              <rect x="10" y="0" width="6" height="32" fill="#000" />
              <rect x="19" y="0" width="3" height="32" fill="#000" />
              <rect x="25" y="0" width="9" height="32" fill="#000" />
              <rect x="37" y="0" width="3" height="32" fill="#000" />
              <rect x="43" y="0" width="6" height="32" fill="#000" />
              <rect x="52" y="0" width="9" height="32" fill="#000" />
              <rect x="64" y="0" width="3" height="32" fill="#000" />
              <rect x="70" y="0" width="6" height="32" fill="#000" />
              <rect x="79" y="0" width="9" height="32" fill="#000" />
              <rect x="91" y="0" width="6" height="32" fill="#000" />
              <rect x="100" y="0" width="3" height="32" fill="#000" />
              <rect x="106" y="0" width="9" height="32" fill="#000" />
              <rect x="118" y="0" width="6" height="32" fill="#000" />
              <rect x="127" y="0" width="3" height="32" fill="#000" />
              <rect x="133" y="0" width="9" height="32" fill="#000" />
              <rect x="145" y="0" width="6" height="32" fill="#000" />
              <rect x="154" y="0" width="6" height="32" fill="#000" />
              <rect x="163" y="0" width="3" height="32" fill="#000" />
              <rect x="169" y="0" width="9" height="32" fill="#000" />
              <rect x="181" y="0" width="6" height="32" fill="#000" />
              <rect x="190" y="0" width="9" height="32" fill="#000" />
              <rect x="202" y="0" width="6" height="32" fill="#000" />
            </svg>
            <div class="barcode-text">${digitsOnly}</div>
          </div>

          <div class="footer-note">
            Note: If any discrepancy in information please try after sometime.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Metrics calculation
  const totalBillsCount = bills.length;
  const totalGoodsValue = useMemo(() => {
    return bills.reduce((sum, b) => {
      const val = typeof b.valueOfGoods === 'number'
        ? b.valueOfGoods
        : parseFloat(String(b.valueOfGoods || 0).replace(/,/g, '')) || 0;
      return sum + val;
    }, 0);
  }, [bills]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header Title & Actions */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <LocalShippingRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.01em' }}>
              e-Way Bill Management
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#666', mt: 0.3 }}>
            Generate, manage, and print official GST Electronic Way Bills for fireworks dispatch
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={fetchEwayBills}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#dcdcdc', color: '#444' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenCreateModal}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: '#1976d2',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
              '&:hover': { backgroundColor: '#1565c0' },
              px: 2.5,
            }}
          >
            Generate e-Way Bill
          </Button>
        </Box>
      </Box>

      {/* Notifications */}
      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg('')} sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" onClose={() => setSuccessMsg('')} sx={{ mb: 2 }}>
          {successMsg}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card
          sx={{
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e8e8e8',
            background: 'linear-gradient(135deg, #ffffff 0%, #f9fbff 100%)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="caption" sx={{ color: '#777', fontWeight: 700, textTransform: 'uppercase' }}>
              Total e-Way Bills Generated
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1976d2', mt: 0.5 }}>
              {totalBillsCount}
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e8e8e8',
            background: 'linear-gradient(135deg, #ffffff 0%, #f6fbf7 100%)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="caption" sx={{ color: '#777', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Value of Goods Moved
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#2e7d32', mt: 0.5 }}>
              ₹ {totalGoodsValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e8e8e8',
            background: 'linear-gradient(135deg, #ffffff 0%, #fbf8ff 100%)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="caption" sx={{ color: '#777', fontWeight: 700, textTransform: 'uppercase' }}>
              Dispatch Location
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#6a1b9a', mt: 0.5 }}>
              Sivakasi, Tamil Nadu
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filter / Search Toolbar */}
      <Paper
        sx={{
          p: 1.8,
          mb: 2.5,
          borderRadius: 2,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          border: '1px solid #eaeaea',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        <TextField
          size="small"
          placeholder="Search by e-Way Bill No, Recipient, Vehicle No, Doc No..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1, minWidth: '280px' }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: '#888' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: '150px' }}
        >
          <MenuItem value="ALL">All Status</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="CANCELLED">Cancelled</MenuItem>
          <MenuItem value="EXPIRED">Expired</MenuItem>
        </TextField>
      </Paper>

      {/* E-Way Bills Table */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <Table sx={{ minWidth: 850 }}>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '12px' }}>E-WAY BILL NO</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '12px' }}>DATE & TIME</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '12px' }}>RECIPIENT / CUSTOMER</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '12px' }}>DOC NO / TYPE</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '12px' }}>VALUE OF GOODS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '12px' }}>VEHICLE NO</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '12px' }}>VALID UNTIL</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#334155', fontSize: '12px', textAlign: 'center' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={36} />
                  <Typography variant="body2" sx={{ mt: 1.5, color: '#666' }}>
                    Loading e-Way Bills...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <LocalShippingRoundedIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: '#666', fontWeight: 600 }}>
                    No e-Way Bills Found
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                    Generate your first e-Way Bill for transport of fireworks consignments
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={handleOpenCreateModal}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Generate e-Way Bill
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill) => {
                const valNum = typeof bill.valueOfGoods === 'number'
                  ? bill.valueOfGoods
                  : parseFloat(String(bill.valueOfGoods || 0).replace(/,/g, '')) || 0;

                return (
                  <TableRow
                    key={bill._id || bill.ewayBillNo}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2', letterSpacing: '0.02em' }}>
                      {bill.ewayBillNo}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12.5px', color: '#444' }}>
                      {bill.ewayBillDate}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {bill.recipientName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        GSTIN: {bill.recipientGstin || 'URP'} • {bill.deliveryPlace || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {bill.docNo}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {bill.docType || 'Tax Invoice'} ({bill.docDate})
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                      ₹ {valNum.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={bill.vehicleNo || 'Not Assigned'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '11px',
                          backgroundColor: bill.vehicleNo ? '#f1f5f9' : '#fee2e2',
                          color: bill.vehicleNo ? '#334155' : '#b91c1c',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                      {bill.validUntil}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="View & Print Official Slip">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setPreviewBill(bill)}
                            sx={{ backgroundColor: '#eff6ff', '&:hover': { backgroundColor: '#dbeafe' } }}
                          >
                            <PrintRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit e-Way Bill">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleOpenEditModal(bill)}
                            sx={{ backgroundColor: '#f0fdf4', '&:hover': { backgroundColor: '#dcfce7' } }}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirmId(bill._id || null)}
                            sx={{ backgroundColor: '#fef2f2', '&:hover': { backgroundColor: '#fee2e2' } }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* CREATE / EDIT MODAL */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e5e7eb',
            pb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingRoundedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editItem ? 'Edit e-Way Bill' : 'Generate New e-Way Bill'}
            </Typography>
          </Box>
          <IconButton onClick={() => setCreateModalOpen(false)} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Quick 1-Click Import from Bill */}
            {!editItem && existingBills.length > 0 && (
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  backgroundColor: '#f0f7ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ReceiptLongRoundedIcon sx={{ color: '#1d4ed8', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e40af' }}>
                    Quick Auto-Fill: Import from Existing Customer Bill
                  </Typography>
                </Box>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Select a Customer Bill to Auto-Fill Consignment Details"
                  value={selectedImportBillId}
                  onChange={(e) => handleImportBill(e.target.value)}
                  sx={{ backgroundColor: '#ffffff' }}
                >
                  <MenuItem value="">-- Select Bill to Auto-Fill --</MenuItem>
                  {existingBills.slice(0, 50).map((b) => (
                    <MenuItem key={b._id || b.id} value={b._id || b.id}>
                      Bill #{b.billNo || b.invoiceNo} — {b.customerName} (₹{b.grandTotal || b.totalAmount || 0}) [{b.date}]
                    </MenuItem>
                  ))}
                </TextField>
              </Paper>
            )}

            {/* Top Validity Section */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
              1. E-Way Bill Validity & Generation Details
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
              <TextField
                label="E-Way Bill No."
                fullWidth
                size="small"
                required
                value={formData.ewayBillNo}
                onChange={(e) => setFormData({ ...formData, ewayBillNo: e.target.value })}
                helperText="12 digit Government e-Way Bill Number"
              />
              <TextField
                label="E-Way Bill Date & Time"
                fullWidth
                size="small"
                required
                value={formData.ewayBillDate}
                onChange={(e) => setFormData({ ...formData, ewayBillDate: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
              <TextField
                label="Approx Distance (in Kms)"
                type="number"
                fullWidth
                size="small"
                value={formData.approxDistance || 100}
                onChange={(e) => handleDistanceChange(Number(e.target.value))}
                helperText="Auto calculates validity duration"
              />
              <TextField
                label="Valid From"
                fullWidth
                size="small"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              />
              <TextField
                label="Valid Until"
                fullWidth
                size="small"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2, mb: 3 }}>
              <TextField
                label="Generated By (GSTIN & Name)"
                fullWidth
                size="small"
                value={formData.generatedBy}
                onChange={(e) => setFormData({ ...formData, generatedBy: e.target.value })}
              />
              <TextField
                label="Portal"
                fullWidth
                size="small"
                value={formData.portal || '1'}
                onChange={(e) => setFormData({ ...formData, portal: e.target.value })}
              />
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* Part - A Details */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
              2. Part - A: Consignment & Supplier / Recipient Details
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                label="GSTIN of Supplier"
                fullWidth
                size="small"
                value={formData.supplierGstin}
                onChange={(e) => setFormData({ ...formData, supplierGstin: e.target.value })}
              />
              <TextField
                label="Supplier Name"
                fullWidth
                size="small"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                label="Place of Dispatch"
                fullWidth
                size="small"
                value={formData.dispatchPlace}
                onChange={(e) => setFormData({ ...formData, dispatchPlace: e.target.value })}
                placeholder="e.g. Virudhunagar, TAMIL NADU-626203"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                label="Recipient Name / Customer"
                fullWidth
                size="small"
                required
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              />
              <TextField
                label="GSTIN of Recipient (URP for unregistered)"
                fullWidth
                size="small"
                value={formData.recipientGstin}
                onChange={(e) => setFormData({ ...formData, recipientGstin: e.target.value })}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                label="Place of Delivery"
                fullWidth
                size="small"
                value={formData.deliveryPlace}
                onChange={(e) => setFormData({ ...formData, deliveryPlace: e.target.value })}
                placeholder="e.g. Sattur, TAMIL NADU-626203"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                label="Document No."
                fullWidth
                size="small"
                required
                value={formData.docNo}
                onChange={(e) => setFormData({ ...formData, docNo: e.target.value })}
                placeholder="e.g. 292"
              />
              <TextField
                label="Document Date"
                fullWidth
                size="small"
                value={formData.docDate}
                onChange={(e) => setFormData({ ...formData, docDate: e.target.value })}
              />
              <TextField
                label="Value of Goods (₹)"
                type="number"
                fullWidth
                size="small"
                required
                value={formData.valueOfGoods}
                onChange={(e) => setFormData({ ...formData, valueOfGoods: e.target.value })}
                placeholder="e.g. 39204"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                select
                label="Transaction Type"
                fullWidth
                size="small"
                value={formData.transactionType || 'Regular'}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
              >
                {TRANSACTION_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="HSN Code"
                fullWidth
                size="small"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
              />

              <TextField
                select
                label="Reason for Transportation"
                fullWidth
                size="small"
                value={formData.reasonForTransportation || 'Outward - Supply'}
                onChange={(e) => setFormData({ ...formData, reasonForTransportation: e.target.value })}
              >
                {TRANSPORT_REASONS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                label="Transporter Name / Transporter ID (if any)"
                fullWidth
                size="small"
                value={formData.transporter || ''}
                onChange={(e) => setFormData({ ...formData, transporter: e.target.value })}
                placeholder="e.g. VRL Logistics / TN Transporters"
              />
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* Part - B Details */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
              3. Part - B: Vehicle & Transport Details
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                select
                label="Transport Mode"
                fullWidth
                size="small"
                value={formData.mode || 'Road'}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
              >
                {TRANSPORT_MODES.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Vehicle No. (or Doc No & Dt)"
                fullWidth
                size="small"
                value={formData.vehicleNo}
                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value.toUpperCase() })}
                placeholder="e.g. TN69VS769"
              />

              <TextField
                label="From Location"
                fullWidth
                size="small"
                value={formData.fromPlace}
                onChange={(e) => setFormData({ ...formData, fromPlace: e.target.value })}
                placeholder="e.g. Virudhunagar / Sivakasi"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Entered Date"
                fullWidth
                size="small"
                value={formData.enteredDate}
                onChange={(e) => setFormData({ ...formData, enteredDate: e.target.value })}
              />

              <TextField
                label="Entered By"
                fullWidth
                size="small"
                value={formData.enteredBy}
                onChange={(e) => setFormData({ ...formData, enteredBy: e.target.value })}
              />

              <TextField
                label="CEWB No. (if any)"
                fullWidth
                size="small"
                value={formData.cewbNo || '-'}
                onChange={(e) => setFormData({ ...formData, cewbNo: e.target.value })}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid #e5e7eb' }}>
            <Button onClick={() => setCreateModalOpen(false)} sx={{ textTransform: 'none', color: '#666' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                backgroundColor: '#1976d2',
              }}
            >
              {submitting ? <CircularProgress size={24} /> : editItem ? 'Update e-Way Bill' : 'Save & Generate Slip'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* OFFICIAL SLIP PREVIEW & PRINT MODAL */}
      <Dialog
        open={Boolean(previewBill)}
        onClose={() => setPreviewBill(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e5e7eb',
            pb: 1.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            e-Way Bill Print Preview
          </Typography>
          <IconButton onClick={() => setPreviewBill(null)} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 1, sm: 2.5 }, backgroundColor: '#f3f4f6' }}>
          {previewBill && (
            <Paper
              elevation={2}
              sx={{
                p: { xs: 1.5, sm: 3 },
                maxWidth: '800px',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                borderRadius: 1,
              }}
            >
              <EwayBillPrintTemplate data={previewBill} />
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid #e5e7eb', justifyContent: 'space-between' }}>
          <Button onClick={() => setPreviewBill(null)} sx={{ textTransform: 'none', color: '#666' }}>
            Close
          </Button>
          {previewBill && (
            <Button
              variant="contained"
              startIcon={<PrintRoundedIcon />}
              onClick={() => handlePrint(previewBill)}
              sx={{ textTransform: 'none', fontWeight: 700, px: 3, backgroundColor: '#1976d2' }}
            >
              Print e-Way Bill Slip
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={Boolean(deleteConfirmId)} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#444' }}>
            Are you sure you want to delete this e-Way Bill record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
