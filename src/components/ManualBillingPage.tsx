import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  Autocomplete,
} from '@mui/material';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';

// @ts-ignore
import html2pdf from 'html2pdf.js';

import {
  ManualBillPrintTemplate,
  type ManualBillData,
  type ManualBillItem,
} from './ManualBillPrintTemplate';
import { numberToIndianWords } from '../utils/numberToWords';
import { CustomersApi, ProductsApi } from '../services/api';
import { getStoredSettings } from './SettingsPage';

const UNIT_OPTIONS = ['Pkt', 'Box', 'Dzn', 'Case', 'Bag', 'Nos', 'Pcs', 'Roll', 'Set'];

const formatDateToday = (): string => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const createEmptyItem = (index: number): ManualBillItem => ({
  id: `item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
  marks: '',
  particulars: '',
  quantity: '',
  rate: '',
  per: 'Box',
  amount: '',
});

const STORAGE_KEY = 'vaishnavi_manual_bills_v1';
const NEXT_NO_KEY = 'vaishnavi_manual_next_inv_no';

export const ManualBillingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Form Entry, 1: Paper Preview, 2: History
  const [savedBills, setSavedBills] = useState<ManualBillData[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Autocomplete data
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  // Print & PDF states
  const [previewBillData, setPreviewBillData] = useState<ManualBillData | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const paperPreviewRef = useRef<HTMLDivElement>(null);
  const modalPrintRef = useRef<HTMLDivElement>(null);

  // Form Initial State
  const getInitialInvoiceNo = (): string => {
    const stored = localStorage.getItem(NEXT_NO_KEY);
    if (stored) return stored;
    return '01';
  };

  const initialFormState: ManualBillData = {
    invoiceNo: getInitialInvoiceNo(),
    bookSeries: 'P',
    date: formatDateToday(),
    customerName: '',
    customerAddress1: '',
    customerAddress2: '',
    companyName: 'VAISHNAVI PATTASU KADAI',
    companyAddress: '4/212-D, E, Muthulingapuram, Etturvattam, (Toll Gate Near) Sattur - 626203.',
    gstin: '33CRMPS1095L1Z7',

    items: Array.from({ length: 8 }, (_, i) => createEmptyItem(i)),

    // Despatch / Transport
    despatchedFrom: 'Sattur',
    despatchedTo: '',
    destinationDetails: '',
    rrLrNo: '',
    invoiceRef: '',
    transportDated: formatDateToday(),
    freightAmount: '',
    freightStatus: 'To PAY',
    through: '',
    transportDate: formatDateToday(),

    // Financials
    subtotal: 0,
    mahamai: 0,
    insurance: 0,
    handlingForwarding: 0,
    totalBeforeTax: 0,
    cgstPercent: 0,
    cgstAmount: 0,
    sgstPercent: 0,
    sgstAmount: 0,
    igstPercent: 0,
    igstAmount: 0,
    totalWithTax: 0,
    lessAdvance: 0,
    balanceDue: 0,
    rupeesInWords: 'Zero Rupees Only',
    checkedBy: '',
    partnerTitle: 'Partner.',
  };

  const [formData, setFormData] = useState<ManualBillData>(initialFormState);

  // Load Saved Bills & Customers/Products on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedBills(parsed);
      }
    } catch (e) {
      console.error('Error loading manual bills from localStorage:', e);
    }

    CustomersApi.getAll()
      .then((data) => Array.isArray(data) && setCustomersList(data))
      .catch(() => {});

    ProductsApi.getAll()
      .then((data) => Array.isArray(data) && setProductsList(data))
      .catch(() => {});

    // Sync Store settings
    const settings = getStoredSettings();
    if (settings.companyName) {
      setFormData((prev) => ({
        ...prev,
        companyName: prev.companyName || settings.companyName,
        gstin: prev.gstin || settings.gstin || '33CRMPS1095L1Z7',
      }));
    }
  }, []);

  // Recalculate Financial Breakdown whenever items or extra charges change
  useEffect(() => {
    // 1. Calculate Items Subtotal
    const itemsTotal = formData.items.reduce((sum, item) => {
      const amt = typeof item.amount === 'number'
        ? item.amount
        : parseFloat(String(item.amount || 0).replace(/,/g, '')) || 0;
      return sum + amt;
    }, 0);

    const mahamaiVal = Number(formData.mahamai) || 0;
    const insuranceVal = Number(formData.insurance) || 0;
    const handlingVal = Number(formData.handlingForwarding) || 0;

    const totalBeforeTax = itemsTotal + mahamaiVal + insuranceVal + handlingVal;

    // Taxes
    const cgstPct = Number(formData.cgstPercent) || 0;
    const sgstPct = Number(formData.sgstPercent) || 0;
    const igstPct = Number(formData.igstPercent) || 0;

    const cgstAmt = cgstPct > 0 ? (totalBeforeTax * cgstPct) / 100 : Number(formData.cgstAmount) || 0;
    const sgstAmt = sgstPct > 0 ? (totalBeforeTax * sgstPct) / 100 : Number(formData.sgstAmount) || 0;
    const igstAmt = igstPct > 0 ? (totalBeforeTax * igstPct) / 100 : Number(formData.igstAmount) || 0;

    const totalWithTax = totalBeforeTax + cgstAmt + sgstAmt + igstAmt;
    const advanceVal = Number(formData.lessAdvance) || 0;
    const balanceDue = Math.max(0, totalWithTax - advanceVal);

    const words = numberToIndianWords(balanceDue > 0 ? balanceDue : totalWithTax);

    setFormData((prev) => ({
      ...prev,
      subtotal: Math.round(itemsTotal * 100) / 100,
      totalBeforeTax: Math.round(totalBeforeTax * 100) / 100,
      cgstAmount: Math.round(cgstAmt * 100) / 100,
      sgstAmount: Math.round(sgstAmt * 100) / 100,
      igstAmount: Math.round(igstAmt * 100) / 100,
      totalWithTax: Math.round(totalWithTax * 100) / 100,
      balanceDue: Math.round(balanceDue * 100) / 100,
      rupeesInWords: prev.rupeesInWords && prev.rupeesInWords !== 'Zero Rupees Only' && prev.rupeesInWords !== words
        ? prev.rupeesInWords
        : words,
    }));
  }, [
    formData.items,
    formData.mahamai,
    formData.insurance,
    formData.handlingForwarding,
    formData.cgstPercent,
    formData.sgstPercent,
    formData.igstPercent,
    formData.lessAdvance,
  ]);

  // Handle Item Row Changes
  const handleItemChange = (index: number, field: keyof ManualBillItem, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      const current = { ...updated[index], [field]: value };

      // Auto calculate amount when quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        const q = parseFloat(String(field === 'quantity' ? value : current.quantity)) || 0;
        const r = parseFloat(String(field === 'rate' ? value : current.rate)) || 0;
        if (q > 0 && r > 0) {
          current.amount = (q * r).toFixed(2);
        }
      }

      updated[index] = current;
      return { ...prev, items: updated };
    });
  };

  const handleAddRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem(prev.items.length)],
    }));
  };

  const handleAddMultipleRows = (count: number = 5) => {
    setFormData((prev) => {
      const newRows = Array.from({ length: count }, (_, i) =>
        createEmptyItem(prev.items.length + i)
      );
      return { ...prev, items: [...prev.items, ...newRows] };
    });
  };

  const handleRemoveRow = (index: number) => {
    setFormData((prev) => {
      const updated = prev.items.filter((_, i) => i !== index);
      return {
        ...prev,
        items: updated.length > 0 ? updated : [createEmptyItem(0)],
      };
    });
  };

  const handleClearItems = () => {
    setFormData((prev) => ({
      ...prev,
      items: Array.from({ length: 8 }, (_, i) => createEmptyItem(i)),
    }));
  };

  // Quick Customer Select
  const handleCustomerSelect = (cust: any) => {
    if (!cust) return;
    const name = cust.name || cust.customerName || '';
    const addr = cust.address || '';
    const city = cust.city || '';
    const state = cust.state || 'TAMIL NADU';
    const pin = cust.pincode ? `-${cust.pincode}` : '';
    const addr2 = [city, `${state}${pin}`].filter(Boolean).join(', ');

    setFormData((prev) => ({
      ...prev,
      customerName: name,
      customerAddress1: addr || addr2,
      customerAddress2: addr ? addr2 : '',
      despatchedTo: city || prev.despatchedTo,
    }));
  };

  // Save Bill to Local History
  const handleSaveBill = () => {
    if (!formData.customerName.trim()) {
      setErrorMsg('Please enter customer / Messrs name');
      return;
    }

    const billToSave: ManualBillData = {
      ...formData,
      id: formData.id || `mb_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const existingIdx = savedBills.findIndex((b) => b.id === billToSave.id);
    let updatedList: ManualBillData[];
    if (existingIdx >= 0) {
      updatedList = [...savedBills];
      updatedList[existingIdx] = billToSave;
    } else {
      updatedList = [billToSave, ...savedBills];
    }

    setSavedBills(updatedList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

    // Auto-increment next invoice number if numeric
    const currentNum = parseInt(formData.invoiceNo, 10);
    if (!isNaN(currentNum)) {
      const nextNo = String(currentNum + 1).padStart(formData.invoiceNo.length, '0');
      localStorage.setItem(NEXT_NO_KEY, nextNo);
    }

    setSuccessMsg(`Invoice #${formData.invoiceNo} saved successfully!`);
    setErrorMsg('');
  };

  // New / Reset Bill
  const handleNewBill = () => {
    const nextNo = getInitialInvoiceNo();
    setFormData({
      ...initialFormState,
      invoiceNo: nextNo,
      date: formatDateToday(),
      transportDated: formatDateToday(),
      transportDate: formatDateToday(),
      items: Array.from({ length: 8 }, (_, i) => createEmptyItem(i)),
    });
    setSuccessMsg('New manual bill draft created');
    setErrorMsg('');
  };

  // Load Bill for Editing
  const handleEditSavedBill = (bill: ManualBillData) => {
    setFormData({ ...bill });
    setActiveTab(0);
    setSuccessMsg(`Loaded Invoice #${bill.invoiceNo} for editing`);
  };

  // Delete from saved history
  const handleDeleteSavedBill = (id: string) => {
    const filtered = savedBills.filter((b) => b.id !== id);
    setSavedBills(filtered);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    setDeleteConfirmId(null);
    setSuccessMsg('Saved bill deleted from history');
  };

  // Print Action - 100% exact match with Live View & Ganesha image
  const handlePrint = (billData: ManualBillData = formData) => {
    // Look for rendered preview in active tab, modal preview, or hidden print target
    const printSource =
      document.getElementById('modal-print-container') ||
      document.getElementById('paper-preview-container') ||
      document.getElementById('manual-bill-hidden-print-target');

    let renderedHtml = '';
    if (printSource) {
      renderedHtml = printSource.innerHTML;
    }

    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      alert('Please allow popups to print the bill');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${billData.invoiceNo || '01'} - ${billData.companyName || 'VAISHNAVI PATTASU KADAI'}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @page {
              size: A4 portrait;
              margin: 6mm 8mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body {
              font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
              color: #003399;
              margin: 0;
              padding: 0;
              background-color: #ffffff;
            }
            .manual-bill-printable {
              width: 100% !important;
              max-width: 740px !important;
              margin: 0 auto !important;
              border: 1.5px solid #003399 !important;
              background-color: #ffffff !important;
            }
            table {
              border-collapse: collapse !important;
            }
            img {
              max-width: 100% !important;
              height: auto !important;
              display: block !important;
            }
          </style>
        </head>
        <body>
          ${renderedHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      try {
        printWindow.focus();
      } catch (_) {}
    }, 450);
  };

  // WhatsApp Share
  const handleShareWhatsApp = (billData: ManualBillData = formData) => {
    const text =
      `*Invoice #${billData.invoiceNo} - ${billData.companyName || 'Vaishnavi Pattasu Kadai'}*\n\n` +
      `📅 *Date:* ${billData.date}\n` +
      `👤 *Customer:* ${billData.customerName}\n` +
      `📍 *Destination:* ${billData.despatchedTo || billData.customerAddress1 || 'Sattur'}\n` +
      `📦 *Total Items:* ${billData.items.filter((i) => i.particulars).length}\n` +
      `💰 *Subtotal:* ₹ ${billData.subtotal.toLocaleString('en-IN')}\n` +
      `💵 *Grand Total:* ₹ ${billData.totalWithTax?.toLocaleString('en-IN') || billData.subtotal.toLocaleString('en-IN')}\n` +
      `💳 *Advance Paid:* ₹ ${billData.lessAdvance || 0}\n` +
      `⭐ *Balance Due:* ₹ ${billData.balanceDue.toLocaleString('en-IN')}\n` +
      `🚛 *Through / Lorry:* ${billData.through || 'Direct'}\n` +
      `🧾 *GSTIN:* ${billData.gstin || '33CRMPS1095L1Z7'}\n\n` +
      `_Thank you for your business!_`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Download PDF
  const handleDownloadPdf = async (billData: ManualBillData = formData) => {
    const targetElem = modalPrintRef.current || paperPreviewRef.current;
    if (!targetElem) return;
    setDownloadingPdf(true);
    try {
      const filename = `Manual_Invoice_${billData.invoiceNo || '01'}.pdf`;
      const opt = {
        margin: [4, 5, 4, 5] as [number, number, number, number],
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const,
        },
      };

      const worker = html2pdf().set(opt).from(targetElem);
      await worker.save();
      setSuccessMsg(`PDF downloaded successfully as ${filename}`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setErrorMsg('Failed to generate PDF file.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Filtered Saved Bills History
  const filteredSavedBills = useMemo(() => {
    if (!historySearch.trim()) return savedBills;
    const q = historySearch.toLowerCase();
    return savedBills.filter(
      (b) =>
        b.invoiceNo.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        (b.despatchedTo || '').toLowerCase().includes(q)
    );
  }, [savedBills, historySearch]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header & Quick Action Buttons */}
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
            <ReceiptLongRoundedIcon sx={{ fontSize: 32, color: '#003399' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#002b66', letterSpacing: '-0.01em' }}>
              Manual Billing (Traditional Paper Voucher Format)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#555', mt: 0.3 }}>
            Type complete bill details manually with physical ledger layout, auto-calculation, and exact replica print
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RestartAltRoundedIcon />}
            onClick={handleNewBill}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#444', borderColor: '#ccc' }}
          >
            New / Clear
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<SaveRoundedIcon />}
            onClick={handleSaveBill}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Save Bill
          </Button>

          <Button
            variant="contained"
            startIcon={<PrintRoundedIcon />}
            onClick={() => handlePrint(formData)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: '#003399',
              '&:hover': { backgroundColor: '#002277' },
              px: 2.5,
            }}
          >
            Print Slip
          </Button>

          <Button
            variant="outlined"
            startIcon={<WhatsAppIcon />}
            onClick={() => handleShareWhatsApp(formData)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#16a34a',
              borderColor: '#86efac',
              '&:hover': { backgroundColor: '#f0fdf4' },
            }}
          >
            WhatsApp
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

      {/* Top View Mode Tabs */}
      <Paper sx={{ mb: 2.5, borderRadius: 2, border: '1px solid #e5e7eb' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '14px', py: 1.5 },
          }}
        >
          <Tab icon={<ReceiptLongRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="1. Bill Entry Form" />
          <Tab icon={<VisibilityRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="2. Live Paper Voucher View" />
          <Tab
            icon={<HistoryRoundedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`3. Saved Bills History (${savedBills.length})`}
          />
        </Tabs>
      </Paper>

      {/* TAB 0: BILL ENTRY FORM */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 1. Header Information Box */}
          <Card sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#003399', mb: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLongRoundedIcon fontSize="small" /> 1. Invoice & Customer (Messrs) Details
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 2fr' }, gap: 2, mb: 2 }}>
                <TextField
                  label="INVOICE No."
                  size="small"
                  required
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                  placeholder="01"
                  helperText="e.g. 01, 105, GST-01"
                />
                <TextField
                  label="Book Series / Prefix"
                  size="small"
                  value={formData.bookSeries || 'P'}
                  onChange={(e) => setFormData({ ...formData, bookSeries: e.target.value })}
                  placeholder="P"
                />
                <TextField
                  label="Invoice Date"
                  size="small"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="DD/MM/YYYY"
                />
              </Box>

              {/* Customer Auto-complete or Manual Type */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <Autocomplete
                  freeSolo
                  options={customersList}
                  getOptionLabel={(option: any) => (typeof option === 'string' ? option : option.name || option.customerName || '')}
                  inputValue={formData.customerName}
                  onInputChange={(_, newInputValue) => {
                    setFormData((prev) => ({ ...prev, customerName: newInputValue }));
                  }}
                  onChange={(_, selected: any) => {
                    if (selected && typeof selected === 'object') {
                      handleCustomerSelect(selected);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Messrs. (Customer / Shop Name)"
                      size="small"
                      required
                      placeholder="Type or select customer name"
                    />
                  )}
                />

                <TextField
                  label="Customer Address Line 1"
                  size="small"
                  value={formData.customerAddress1}
                  onChange={(e) => setFormData({ ...formData, customerAddress1: e.target.value })}
                  placeholder="e.g. 12/4 Bazaar Street"
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Customer Address Line 2 (City, State)"
                  size="small"
                  value={formData.customerAddress2}
                  onChange={(e) => setFormData({ ...formData, customerAddress2: e.target.value })}
                  placeholder="e.g. Sattur - 626203, TAMIL NADU"
                />
                <TextField
                  label="Company Name"
                  size="small"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
                <TextField
                  label="GSTIN"
                  size="small"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                />
              </Box>
            </CardContent>
          </Card>

          {/* 2. Items Table Section */}
          <Card sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#003399' }}>
                  2. Particulars & Itemized Goods (Table Rows)
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddRoundedIcon />}
                    onClick={handleAddRow}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    + Add Row
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleAddMultipleRows(5)}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    + Add 5 Rows
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={handleClearItems}
                    sx={{ textTransform: 'none', fontSize: '12px' }}
                  >
                    Clear All
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, maxHeight: 500, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { backgroundColor: '#f1f5f9', fontWeight: 800, color: '#003399', fontSize: '12px' } }}>
                      <TableCell sx={{ width: '50px', textAlign: 'center' }}>#</TableCell>
                      <TableCell sx={{ width: '100px' }}>Marks</TableCell>
                      <TableCell sx={{ minWidth: '240px' }}>PARTICULARS (Product Description)</TableCell>
                      <TableCell sx={{ width: '110px' }}>Quantity</TableCell>
                      <TableCell sx={{ width: '130px' }}>Rate (₹)</TableCell>
                      <TableCell sx={{ width: '110px' }}>PER</TableCell>
                      <TableCell sx={{ width: '140px' }}>Amount (₹)</TableCell>
                      <TableCell sx={{ width: '50px', textAlign: 'center' }}>DEL</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item, idx) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#888' }}>
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            fullWidth
                            value={item.marks}
                            onChange={(e) => handleItemChange(idx, 'marks', e.target.value)}
                            placeholder="Mark"
                          />
                        </TableCell>
                        <TableCell>
                          <Autocomplete
                            freeSolo
                            options={productsList}
                            getOptionLabel={(option: any) =>
                              typeof option === 'string' ? option : option.name || option.productName || ''
                            }
                            inputValue={item.particulars}
                            onInputChange={(_, newInputValue) => {
                              handleItemChange(idx, 'particulars', newInputValue);
                            }}
                            onChange={(_, selected: any) => {
                              if (selected && typeof selected === 'object') {
                                handleItemChange(idx, 'particulars', selected.name || selected.productName || '');
                                if (selected.rate || selected.price) {
                                  handleItemChange(idx, 'rate', selected.rate || selected.price);
                                }
                                if (selected.per || selected.unit) {
                                  handleItemChange(idx, 'per', selected.per || selected.unit);
                                }
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                variant="standard"
                                fullWidth
                                placeholder="e.g. 28 Giant Crackers"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            type="number"
                            fullWidth
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            placeholder="10"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            type="number"
                            fullWidth
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                            placeholder="120.00"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            variant="standard"
                            fullWidth
                            value={item.per || 'Box'}
                            onChange={(e) => handleItemChange(idx, 'per', e.target.value)}
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <MenuItem key={u} value={u}>
                                {u}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            variant="standard"
                            fullWidth
                            value={item.amount}
                            onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                            placeholder="0.00"
                            sx={{ input: { fontWeight: 700, color: '#002b66' } }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveRow(idx)}
                            disabled={formData.items.length <= 1}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* 3. Despatch Details (Bottom Left) & Calculations (Bottom Right) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Left: Despatch / Transport */}
            <Card sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#003399', mb: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalShippingRoundedIcon fontSize="small" /> 3. Despatch & Transport Info (Bottom Left)
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <TextField
                    label="Despatched From"
                    size="small"
                    value={formData.despatchedFrom || 'Sattur'}
                    onChange={(e) => setFormData({ ...formData, despatchedFrom: e.target.value })}
                  />
                  <TextField
                    label="Despatched To"
                    size="small"
                    value={formData.despatchedTo}
                    onChange={(e) => setFormData({ ...formData, despatchedTo: e.target.value })}
                    placeholder="Destination place"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="Destination Details"
                    size="small"
                    fullWidth
                    value={formData.destinationDetails}
                    onChange={(e) => setFormData({ ...formData, destinationDetails: e.target.value })}
                    placeholder="e.g. Near Toll Gate / Customer Shop"
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <TextField
                    label="R.R. / L.R. No."
                    size="small"
                    value={formData.rrLrNo}
                    onChange={(e) => setFormData({ ...formData, rrLrNo: e.target.value })}
                    placeholder="LR1029"
                  />
                  <TextField
                    label="Invoice Reference"
                    size="small"
                    value={formData.invoiceRef || formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceRef: e.target.value })}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                  <TextField
                    label="Dated"
                    size="small"
                    value={formData.transportDated || formData.date}
                    onChange={(e) => setFormData({ ...formData, transportDated: e.target.value })}
                  />
                  <TextField
                    label="Freight Rs."
                    size="small"
                    value={formData.freightAmount}
                    onChange={(e) => setFormData({ ...formData, freightAmount: e.target.value })}
                    placeholder="0.00"
                  />
                  <TextField
                    select
                    label="Freight Status"
                    size="small"
                    value={formData.freightStatus || 'To PAY'}
                    onChange={(e) => setFormData({ ...formData, freightStatus: e.target.value })}
                  >
                    <MenuItem value="To PAY">To PAY</MenuItem>
                    <MenuItem value="PAID">PAID</MenuItem>
                    <MenuItem value="To PAY / PAID">To PAY / PAID</MenuItem>
                  </TextField>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
                  <TextField
                    label="Through (Transporter Name / Service)"
                    size="small"
                    value={formData.through}
                    onChange={(e) => setFormData({ ...formData, through: e.target.value })}
                    placeholder="e.g. VRL Logistics / TN Roadways"
                  />
                  <TextField
                    label="Transport Date"
                    size="small"
                    value={formData.transportDate || formData.date}
                    onChange={(e) => setFormData({ ...formData, transportDate: e.target.value })}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Right: Calculations & Charges */}
            <Card sx={{ borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#003399', mb: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalculateRoundedIcon fontSize="small" /> 4. Calculation & Charges Breakdown (Bottom Right)
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <TextField
                    label="Items Subtotal (₹)"
                    size="small"
                    value={formData.subtotal}
                    disabled
                    sx={{ input: { fontWeight: 700 } }}
                  />
                  <TextField
                    label="Mahamai Rs."
                    size="small"
                    type="number"
                    value={formData.mahamai || ''}
                    onChange={(e) => setFormData({ ...formData, mahamai: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <TextField
                    label="Insurance Rs."
                    size="small"
                    type="number"
                    value={formData.insurance || ''}
                    onChange={(e) => setFormData({ ...formData, insurance: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                  <TextField
                    label="Handling & Forwarding Rs."
                    size="small"
                    type="number"
                    value={formData.handlingForwarding || ''}
                    onChange={(e) => setFormData({ ...formData, handlingForwarding: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Tax Inputs */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 2 }}>
                  <TextField
                    label="CGST %"
                    size="small"
                    type="number"
                    value={formData.cgstPercent || ''}
                    onChange={(e) => setFormData({ ...formData, cgstPercent: Number(e.target.value) })}
                    placeholder="9%"
                  />
                  <TextField
                    label="SGST %"
                    size="small"
                    type="number"
                    value={formData.sgstPercent || ''}
                    onChange={(e) => setFormData({ ...formData, sgstPercent: Number(e.target.value) })}
                    placeholder="9%"
                  />
                  <TextField
                    label="IGST %"
                    size="small"
                    type="number"
                    value={formData.igstPercent || ''}
                    onChange={(e) => setFormData({ ...formData, igstPercent: Number(e.target.value) })}
                    placeholder="18%"
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <TextField
                    label="Total With Tax (₹)"
                    size="small"
                    value={formData.totalWithTax}
                    disabled
                    sx={{ input: { fontWeight: 800, color: '#003399' } }}
                  />
                  <TextField
                    label="Less Advance Rs."
                    size="small"
                    type="number"
                    value={formData.lessAdvance || ''}
                    onChange={(e) => setFormData({ ...formData, lessAdvance: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="Balance Due Rs."
                    size="small"
                    fullWidth
                    value={formData.balanceDue}
                    disabled
                    sx={{
                      backgroundColor: '#f0fdf4',
                      borderRadius: 1,
                      input: { fontWeight: 900, color: '#166534', fontSize: '16px' },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 1 }}>
                  <TextField
                    label="Rupees in Words"
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                    value={formData.rupeesInWords}
                    onChange={(e) => setFormData({ ...formData, rupeesInWords: e.target.value })}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Bottom Action Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1, mb: 4 }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<VisibilityRoundedIcon />}
              onClick={() => setActiveTab(1)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              View Live Voucher
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SaveRoundedIcon />}
              onClick={handleSaveBill}
              sx={{ textTransform: 'none', fontWeight: 700, px: 3 }}
            >
              Save Manual Bill
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<PrintRoundedIcon />}
              onClick={() => handlePrint(formData)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: '#003399',
                '&:hover': { backgroundColor: '#002277' },
                px: 3.5,
              }}
            >
              Print Receipt Slip
            </Button>
          </Box>
        </Box>
      )}

      {/* TAB 1: LIVE RECEIPT PAPER PREVIEW */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: '100%',
              maxWidth: '800px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
              mb: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#003399' }}>
              Real-time Print Voucher Preview (Blue Ink Traditional Receipt)
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<EditRoundedIcon />}
                onClick={() => setActiveTab(0)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Back to Edit
              </Button>
              <Button
                variant="outlined"
                startIcon={downloadingPdf ? <span /> : <PictureAsPdfRoundedIcon />}
                disabled={downloadingPdf}
                onClick={() => handleDownloadPdf(formData)}
                sx={{ textTransform: 'none', fontWeight: 600, color: '#dc2626', borderColor: '#fca5a5' }}
              >
                Download PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintRoundedIcon />}
                onClick={() => handlePrint(formData)}
                sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: '#003399' }}
              >
                Print Voucher
              </Button>
            </Box>
          </Box>

          <Paper
            id="paper-preview-container"
            elevation={3}
            ref={paperPreviewRef}
            sx={{
              p: { xs: 1, sm: 3 },
              maxWidth: '780px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: 1,
              boxShadow: '0 4px 20px rgba(0, 51, 153, 0.08)',
            }}
          >
            <ManualBillPrintTemplate data={formData} />
          </Paper>
        </Box>
      )}

      {/* TAB 2: SAVED BILLS HISTORY */}
      {activeTab === 2 && (
        <Box>
          <Paper
            sx={{
              p: 1.8,
              mb: 2.5,
              borderRadius: 2,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              border: '1px solid #eaeaea',
            }}
          >
            <TextField
              size="small"
              placeholder="Search saved bills by Invoice No, Customer, Destination..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              sx={{ flex: 1 }}
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
          </Paper>

          <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#003399' }}>INVOICE NO</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#003399' }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#003399' }}>CUSTOMER (MESSRS)</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#003399' }}>DESPATCH TO</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#003399' }}>ITEMS COUNT</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#003399' }}>TOTAL AMOUNT</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#003399' }}>BALANCE DUE</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#003399', textAlign: 'center' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSavedBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <ReceiptLongRoundedIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                      <Typography variant="h6" sx={{ color: '#666', fontWeight: 600 }}>
                        No Saved Manual Bills Found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888' }}>
                        Bills you create and save will be stored here for instant reprinting and editing
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSavedBills.map((b) => (
                    <TableRow key={b.id} hover>
                      <TableCell sx={{ fontWeight: 800, color: '#003399' }}>
                        #{b.invoiceNo} {b.bookSeries ? `(${b.bookSeries})` : ''}
                      </TableCell>
                      <TableCell>{b.date}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{b.customerName}</TableCell>
                      <TableCell>{b.despatchedTo || '-'}</TableCell>
                      <TableCell>{(b.items || []).filter((i) => i.particulars).length} items</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        ₹ {(b.totalWithTax || b.subtotal || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#166534' }}>
                        ₹ {(b.balanceDue || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="Preview & Print">
                            <IconButton
                              size="small"
                              onClick={() => setPreviewBillData(b)}
                              sx={{ backgroundColor: '#eff6ff', color: '#003399' }}
                            >
                              <PrintRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="WhatsApp Share">
                            <IconButton
                              size="small"
                              onClick={() => handleShareWhatsApp(b)}
                              sx={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
                            >
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Load to Edit">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleEditSavedBill(b)}
                              sx={{ backgroundColor: '#f8fafc' }}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteConfirmId(b.id || null)}
                              sx={{ backgroundColor: '#fef2f2' }}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* MODAL PRINT PREVIEW */}
      <Dialog
        open={Boolean(previewBillData)}
        onClose={() => setPreviewBillData(null)}
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#003399' }}>
            Invoice #{previewBillData?.invoiceNo} Voucher Preview
          </Typography>
          <IconButton onClick={() => setPreviewBillData(null)} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 1, sm: 2.5 }, backgroundColor: '#f3f4f6' }}>
          {previewBillData && (
            <Paper
              id="modal-print-container"
              elevation={2}
              ref={modalPrintRef}
              sx={{
                p: { xs: 1, sm: 2.5 },
                maxWidth: '780px',
                margin: '0 auto',
                backgroundColor: '#ffffff',
              }}
            >
              <ManualBillPrintTemplate data={previewBillData} />
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid #e5e7eb', justifyContent: 'space-between' }}>
          <Button onClick={() => setPreviewBillData(null)} sx={{ textTransform: 'none', color: '#666' }}>
            Close
          </Button>

          {previewBillData && (
            <Box sx={{ display: 'flex', gap: 1.2 }}>
              <Button
                variant="outlined"
                startIcon={<WhatsAppIcon />}
                onClick={() => handleShareWhatsApp(previewBillData)}
                sx={{ textTransform: 'none', fontWeight: 600, color: '#16a34a', borderColor: '#86efac' }}
              >
                Share WhatsApp
              </Button>
              <Button
                variant="outlined"
                startIcon={downloadingPdf ? <span /> : <PictureAsPdfRoundedIcon />}
                disabled={downloadingPdf}
                onClick={() => handleDownloadPdf(previewBillData)}
                sx={{ textTransform: 'none', fontWeight: 600, color: '#dc2626', borderColor: '#fca5a5' }}
              >
                Download PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintRoundedIcon />}
                onClick={() => handlePrint(previewBillData)}
                sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: '#003399' }}
              >
                Print Slip
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={Boolean(deleteConfirmId)} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this saved manual bill? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirmId && handleDeleteSavedBill(deleteConfirmId)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ALWAYS PRESENT HIDDEN PRINT SOURCE CONTAINER FOR 100% IDENTICAL PRINTING */}
      <div
        id="manual-bill-hidden-print-target"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '740px',
          pointerEvents: 'none',
          opacity: 0,
          zIndex: -999,
        }}
      >
        <ManualBillPrintTemplate data={previewBillData || formData} />
      </div>
    </Box>
  );
};
