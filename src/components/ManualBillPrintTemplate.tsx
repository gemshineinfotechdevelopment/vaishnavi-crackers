import React from 'react';
import ganeshaImg from '../assets/ganesha.jpg';

export interface ManualBillItem {
  id: string;
  marks: string;
  particulars: string;
  quantity: string | number;
  rate: string | number;
  ratePs?: string | number;
  per: string;
  amount: string | number;
  amountPs?: string | number;
}

export interface ManualBillData {
  id?: string;
  invoiceNo: string;
  bookSeries?: string; // e.g. "P" or "A"
  date: string;
  customerName: string;
  customerAddress1: string;
  customerAddress2?: string;
  companyName?: string;
  companyAddress?: string;
  gstin?: string;

  items: ManualBillItem[];

  // Despatch / Transport
  despatchedFrom?: string;
  despatchedTo?: string;
  destinationDetails?: string;
  rrLrNo?: string;
  invoiceRef?: string;
  transportDated?: string;
  freightAmount?: string | number;
  freightStatus?: 'To PAY' | 'PAID' | string;
  through?: string;
  transportDate?: string;

  // Calculation Breakdown
  subtotal: number;
  mahamai?: number;
  insurance?: number;
  handlingForwarding?: number;
  totalBeforeTax?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  igstPercent?: number;
  igstAmount?: number;
  totalWithTax?: number;
  lessAdvance?: number;
  balanceDue: number;

  rupeesInWords?: string;
  checkedBy?: string;
  partnerTitle?: string;
  createdAt?: string;
}

interface ManualBillPrintTemplateProps {
  data: ManualBillData;
  copyLabel?: string;
}

// Helper to format currency into separate Rs and Ps
const splitRsPs = (val: number | string | undefined): { rs: string; ps: string } => {
  if (val === undefined || val === null || val === '') return { rs: '', ps: '' };
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(num)) return { rs: String(val), ps: '' };
  if (num === 0) return { rs: '0', ps: '00' };

  const fixed = num.toFixed(2);
  const parts = fixed.split('.');
  const intVal = parseInt(parts[0], 10);
  const rsStr = intVal.toLocaleString('en-IN');
  const psStr = parts[1] === '00' ? '00' : parts[1];
  return { rs: rsStr, ps: psStr };
};

// Flowerpot / Sparkler Anar Icon SVG (Classic Traditional Print Art)
const FlowerpotArt: React.FC<{ size?: number; color?: string }> = ({ size = 26, color = '#003399' }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 30 40" fill="none" style={{ display: 'inline-block' }}>
    {/* Sparkle rays */}
    <path d="M15 2L15 8M9 4L13 9M21 4L17 9M6 8L12 11M24 8L18 11M3 13L11 13M27 13L19 13" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="15" cy="5" r="1.2" fill={color} />
    <circle cx="9" cy="5" r="0.8" fill={color} />
    <circle cx="21" cy="5" r="0.8" fill={color} />
    {/* Anar Cone Shape */}
    <polygon points="15,12 8,36 22,36" fill="none" stroke={color} strokeWidth="1.3" />
    <polygon points="15,14 10,34 20,34" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="0.8" strokeDasharray="1 1" />
    {/* Base */}
    <rect x="7" y="36" width="16" height="3" fill={color} />
  </svg>
);

export const ManualBillPrintTemplate: React.FC<ManualBillPrintTemplateProps> = ({
  data,
  copyLabel,
}) => {
  const invoiceNo = data.invoiceNo || '01';
  const bookSeries = data.bookSeries || 'P';
  const dateStr = data.date || '';
  const customerName = data.customerName || '';
  const customerAddr1 = data.customerAddress1 || '';
  const customerAddr2 = data.customerAddress2 || '';

  const companyName = data.companyName || 'VAISHNAVI PATTASU KADAI';
  const companyAddress =
    data.companyAddress ||
    '4/212-D, E, Muthulingapuram, Etturvattam, (Toll Gate Near) Sattur - 626203.';
  const gstin = data.gstin || '33CRMPS1095L1Z7';

  // Format Items: Guarantee at least 14 rows for authentic ledger form height
  const items = data.items || [];
  const minRows = 14;
  const displayRows: Array<ManualBillItem | null> = [...items];
  while (displayRows.length < minRows) {
    displayRows.push(null);
  }

  // Financial values formatted as Rs | Ps
  const totalSubtotal = splitRsPs(data.subtotal);
  const mahamai = splitRsPs(data.mahamai);
  const insurance = splitRsPs(data.insurance);
  const handling = splitRsPs(data.handlingForwarding);
  const totalBeforeTax = splitRsPs(
    data.totalBeforeTax !== undefined
      ? data.totalBeforeTax
      : data.subtotal + (data.mahamai || 0) + (data.insurance || 0) + (data.handlingForwarding || 0)
  );

  const cgst = splitRsPs(data.cgstAmount);
  const sgst = splitRsPs(data.sgstAmount);
  const igst = splitRsPs(data.igstAmount);

  const totalWithTax = splitRsPs(
    data.totalWithTax !== undefined
      ? data.totalWithTax
      : (data.totalBeforeTax || data.subtotal) +
          (data.cgstAmount || 0) +
          (data.sgstAmount || 0) +
          (data.igstAmount || 0)
  );
  const lessAdvance = splitRsPs(data.lessAdvance);
  const balanceDue = splitRsPs(data.balanceDue);

  const primaryBlue = '#003399';
  const borderBlue = '1px solid #003399';
  const borderBlueThick = '1.5px solid #003399';

  return (
    <div
      className="manual-bill-printable"
      style={{
        width: '100%',
        maxWidth: '760px',
        margin: '0 auto',
        backgroundColor: '#FFFFFF',
        color: primaryBlue,
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        boxSizing: 'border-box',
        padding: '10px 14px',
        fontSize: '11px',
        lineHeight: 1.25,
        border: borderBlueThick,
        position: 'relative',
      }}
    >
      {/* Optional Copy Label Watermark/Badge */}
      {copyLabel && (
        <div
          style={{
            position: 'absolute',
            top: '6px',
            right: '12px',
            fontSize: '9px',
            fontWeight: 700,
            color: '#666666',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {copyLabel}
        </div>
      )}

      {/* TOP ROW: Ganesha + Invoice No + Date + Customer */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
        {/* Top Left: Ganesha Image */}
        <div style={{ width: '80px', flexShrink: 0, textAlign: 'center', marginRight: '6px' }}>
          <img
            src={ganeshaImg}
            alt="Lord Ganesha"
            style={{
              width: '65px',
              height: '65px',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
              filter: 'contrast(120%)',
            }}
          />
        </div>

        {/* Top Center / Right Details */}
        <div style={{ flex: 1 }}>
          {/* Invoice No and Date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '0.02em' }}>INVOICE No.</span>
              <span
                style={{
                  borderBottom: '1px dotted #003399',
                  minWidth: '90px',
                  display: 'inline-block',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: '15px',
                  color: '#002277',
                  padding: '0 4px',
                }}
              >
                {invoiceNo}
              </span>
              <span style={{ fontWeight: 700, fontSize: '11px', textDecoration: 'underline', marginLeft: '4px' }}>
                {bookSeries}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '12px' }}>Date :</span>
              <span
                style={{
                  borderBottom: '1px dotted #003399',
                  minWidth: '120px',
                  display: 'inline-block',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '12px',
                  padding: '0 4px',
                }}
              >
                {dateStr}
              </span>
            </div>
          </div>

          {/* Customer / Messrs Line 1 */}
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px' }}>
            <span style={{ fontWeight: 700, fontSize: '11.5px', whiteSpace: 'nowrap', marginRight: '6px' }}>
              Messrs.
            </span>
            <span
              style={{
                flex: 1,
                borderBottom: '1px dotted #003399',
                minHeight: '16px',
                fontWeight: 700,
                fontSize: '12px',
                paddingLeft: '4px',
              }}
            >
              {customerName}
            </span>
          </div>

          {/* Customer Address Line 2 */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span
              style={{
                width: '100%',
                borderBottom: '1px dotted #003399',
                minHeight: '16px',
                fontSize: '11px',
                paddingLeft: '4px',
              }}
            >
              {[customerAddr1, customerAddr2].filter(Boolean).join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* BANNER HEADER: VAISHNAVI PATTASU KADAI */}
      <div style={{ textAlign: 'center', margin: '4px 0 6px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            border: borderBlueThick,
            borderRadius: '4px',
            padding: '3px 8px',
            backgroundColor: '#f2f6fc',
          }}
        >
          <FlowerpotArt size={22} color={primaryBlue} />
          <h1
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 900,
              letterSpacing: '0.06em',
              color: primaryBlue,
              textTransform: 'uppercase',
              fontFamily: '"Arial Black", Arial, sans-serif',
            }}
          >
            {companyName}
          </h1>
          <FlowerpotArt size={22} color={primaryBlue} />
        </div>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            marginTop: '2px',
            letterSpacing: '0.02em',
            color: '#002277',
          }}
        >
          {companyAddress}
        </div>
        {gstin && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              marginTop: '2px',
              letterSpacing: '0.04em',
              color: primaryBlue,
            }}
          >
            GSTIN : {gstin}
          </div>
        )}
      </div>

      {/* ITEMS TABLE */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: borderBlueThick,
          fontSize: '10.5px',
          marginBottom: '0px',
        }}
      >
        <thead>
          <tr style={{ borderBottom: borderBlueThick, backgroundColor: '#f5f8fd', textAlign: 'center' }}>
            <th style={{ width: '8%', borderRight: borderBlue, padding: '3px 2px', fontWeight: 800 }}>Marks</th>
            <th style={{ width: '42%', borderRight: borderBlue, padding: '3px 4px', fontWeight: 800 }}>
              PARTICULARS
            </th>
            <th style={{ width: '10%', borderRight: borderBlue, padding: '3px 2px', fontWeight: 800 }}>Quantity</th>
            <th style={{ width: '16%', borderRight: borderBlue, padding: '0', fontWeight: 800 }}>
              <div style={{ borderBottom: borderBlue, padding: '2px 0' }}>Rate</div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '70%', borderRight: borderBlue, padding: '1px 0' }}>Rs.</span>
                <span style={{ width: '30%', padding: '1px 0' }}>Ps.</span>
              </div>
            </th>
            <th style={{ width: '8%', borderRight: borderBlue, padding: '3px 2px', fontWeight: 800 }}>PER</th>
            <th style={{ width: '16%', padding: '0', fontWeight: 800 }}>
              <div style={{ borderBottom: borderBlue, padding: '2px 0' }}>Amount</div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: '70%', borderRight: borderBlue, padding: '1px 0' }}>Rs.</span>
                <span style={{ width: '30%', padding: '1px 0' }}>Ps.</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((item, idx) => {
            const hasItem = item && (item.particulars || item.quantity || item.rate || item.amount);
            const rateObj = item ? splitRsPs(item.rate) : { rs: '', ps: '' };
            const amountObj = item ? splitRsPs(item.amount) : { rs: '', ps: '' };

            return (
              <tr
                key={idx}
                style={{
                  height: '21px',
                  borderBottom: borderBlue,
                  fontSize: '10.5px',
                }}
              >
                {/* Marks */}
                <td style={{ borderRight: borderBlue, padding: '1px 4px', textAlign: 'center' }}>
                  {hasItem ? item.marks : ''}
                </td>

                {/* Particulars */}
                <td
                  style={{
                    borderRight: borderBlue,
                    padding: '1px 6px',
                    fontWeight: hasItem ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {hasItem ? item.particulars : ''}
                </td>

                {/* Quantity */}
                <td style={{ borderRight: borderBlue, padding: '1px 4px', textAlign: 'center', fontWeight: 600 }}>
                  {hasItem ? item.quantity : ''}
                </td>

                {/* Rate (Rs | Ps) */}
                <td style={{ borderRight: borderBlue, padding: '0' }}>
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                    <span
                      style={{
                        width: '70%',
                        borderRight: borderBlue,
                        textAlign: 'right',
                        paddingRight: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {hasItem ? rateObj.rs : ''}
                    </span>
                    <span style={{ width: '30%', textAlign: 'center', fontSize: '9.5px' }}>
                      {hasItem ? rateObj.ps : ''}
                    </span>
                  </div>
                </td>

                {/* PER (Unit) */}
                <td style={{ borderRight: borderBlue, padding: '1px 2px', textAlign: 'center' }}>
                  {hasItem ? item.per : ''}
                </td>

                {/* Amount (Rs | Ps) */}
                <td style={{ padding: '0' }}>
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                    <span
                      style={{
                        width: '70%',
                        borderRight: borderBlue,
                        textAlign: 'right',
                        paddingRight: '4px',
                        fontWeight: 700,
                      }}
                    >
                      {hasItem ? amountObj.rs : ''}
                    </span>
                    <span style={{ width: '30%', textAlign: 'center', fontSize: '9.5px', fontWeight: 600 }}>
                      {hasItem ? amountObj.ps : ''}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* BOTTOM SECTION: 2 COLUMNS (Despatch Details on Left, Calculation on Right) */}
      <div
        style={{
          display: 'flex',
          borderLeft: borderBlueThick,
          borderRight: borderBlueThick,
          borderBottom: borderBlueThick,
        }}
      >
        {/* Left Column: Despatch / Transport info */}
        <div
          style={{
            width: '60%',
            borderRight: borderBlueThick,
            padding: '6px 8px',
            fontSize: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Despatched from ... to ... */}
          <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span>Despatched from</span>
            <span
              style={{
                borderBottom: '1px dotted #003399',
                minWidth: '100px',
                display: 'inline-block',
                fontWeight: 600,
                padding: '0 4px',
                margin: '0 4px',
              }}
            >
              {data.despatchedFrom || 'Sattur'}
            </span>
            <span>to</span>
            <span
              style={{
                flex: 1,
                borderBottom: '1px dotted #003399',
                minWidth: '80px',
                display: 'inline-block',
                fontWeight: 600,
                padding: '0 4px',
                marginLeft: '4px',
              }}
            >
              {data.despatchedTo || ''}
            </span>
          </div>

          {/* Destination Details line 2 */}
          <div style={{ marginBottom: '5px' }}>
            <div style={{ borderBottom: '1px dotted #003399', minHeight: '14px', paddingLeft: '4px' }}>
              {data.destinationDetails || ''}
            </div>
          </div>

          {/* R.R. / L.R. No. and Invoice */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', width: '55%' }}>
              <span style={{ whiteSpace: 'nowrap' }}>R.R. / L.R. No.</span>
              <span
                style={{
                  flex: 1,
                  borderBottom: '1px dotted #003399',
                  minHeight: '14px',
                  marginLeft: '4px',
                  fontWeight: 600,
                  paddingLeft: '4px',
                }}
              >
                {data.rrLrNo || ''}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', width: '42%' }}>
              <span style={{ whiteSpace: 'nowrap' }}>Invoice</span>
              <span
                style={{
                  flex: 1,
                  borderBottom: '1px dotted #003399',
                  minHeight: '14px',
                  marginLeft: '4px',
                  fontWeight: 600,
                  paddingLeft: '4px',
                }}
              >
                {data.invoiceRef || invoiceNo}
              </span>
            </div>
          </div>

          {/* Dated and Freight Rs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', width: '50%' }}>
              <span style={{ whiteSpace: 'nowrap' }}>Dated</span>
              <span
                style={{
                  flex: 1,
                  borderBottom: '1px dotted #003399',
                  minHeight: '14px',
                  marginLeft: '4px',
                  paddingLeft: '4px',
                }}
              >
                {data.transportDated || dateStr}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', width: '48%' }}>
              <span style={{ whiteSpace: 'nowrap' }}>Freight Rs.</span>
              <span
                style={{
                  flex: 1,
                  borderBottom: '1px dotted #003399',
                  minHeight: '14px',
                  marginLeft: '4px',
                  fontWeight: 600,
                  paddingLeft: '4px',
                }}
              >
                {data.freightAmount || ''}
              </span>
            </div>
          </div>

          {/* Freight Status: To PAY / PAID */}
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '5px' }}>
            <span style={{ borderBottom: '1px dotted #003399', width: '60px', display: 'inline-block', marginRight: '6px' }}></span>
            <span style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '0.04em' }}>
              {data.freightStatus ? `${data.freightStatus}` : 'To PAY / PAID'}
            </span>
          </div>

          {/* Through */}
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '5px' }}>
            <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>Through</span>
            <span
              style={{
                flex: 1,
                borderBottom: '1px dotted #003399',
                minHeight: '14px',
                fontWeight: 600,
                paddingLeft: '4px',
              }}
            >
              {data.through || ''}
            </span>
          </div>

          {/* Date */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>Date</span>
            <span
              style={{
                width: '160px',
                borderBottom: '1px dotted #003399',
                minHeight: '14px',
                paddingLeft: '4px',
              }}
            >
              {data.transportDate || dateStr}
            </span>
          </div>
        </div>

        {/* Right Column: Calculation Breakdown (2-column ledger with Rs | Ps) */}
        <div style={{ width: '40%', fontSize: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {/* Total Items Rs */}
              <tr style={{ borderBottom: borderBlue, height: '18px' }}>
                <td style={{ width: '60%', padding: '1px 6px', fontWeight: 600 }}>Total Rs.</td>
                <td style={{ width: '28%', borderLeft: borderBlue, borderRight: borderBlue, textAlign: 'right', paddingRight: '4px', fontWeight: 700 }}>
                  {totalSubtotal.rs}
                </td>
                <td style={{ width: '12%', textAlign: 'center', fontSize: '9px' }}>{totalSubtotal.ps}</td>
              </tr>

              {/* Mahamai Rs. */}
              <tr style={{ borderBottom: borderBlue, height: '18px' }}>
                <td style={{ padding: '1px 6px' }}>Mahamai Rs.</td>
                <td style={{ borderLeft: borderBlue, borderRight: borderBlue, textAlign: 'right', paddingRight: '4px' }}>
                  {mahamai.rs}
                </td>
                <td style={{ textAlign: 'center', fontSize: '9px' }}>{mahamai.ps}</td>
              </tr>

              {/* Insurance Rs. */}
              <tr style={{ borderBottom: borderBlue, height: '18px' }}>
                <td style={{ padding: '1px 6px' }}>Insurance Rs.</td>
                <td style={{ borderLeft: borderBlue, borderRight: borderBlue, textAlign: 'right', paddingRight: '4px' }}>
                  {insurance.rs}
                </td>
                <td style={{ textAlign: 'center', fontSize: '9px' }}>{insurance.ps}</td>
              </tr>

              {/* Handling & Forwarding Rs. */}
              <tr style={{ borderBottom: borderBlue, height: '18px' }}>
                <td style={{ padding: '1px 4px', fontSize: '9.5px', whiteSpace: 'nowrap' }}>
                  Handing & Forwarding Rs.
                </td>
                <td style={{ borderLeft: borderBlue, borderRight: borderBlue, textAlign: 'right', paddingRight: '4px' }}>
                  {handling.rs}
                </td>
                <td style={{ textAlign: 'center', fontSize: '9px' }}>{handling.ps}</td>
              </tr>

              {/* Subtotal / Total Rs. */}
              <tr style={{ borderBottom: borderBlue, height: '18px', backgroundColor: '#f5f8fd' }}>
                <td style={{ padding: '1px 6px', fontWeight: 700 }}>Total Rs.</td>
                <td style={{ borderLeft: borderBlue, borderRight: borderBlue, textAlign: 'right', paddingRight: '4px', fontWeight: 700 }}>
                  {totalBeforeTax.rs}
                </td>
                <td style={{ textAlign: 'center', fontSize: '9px', fontWeight: 600 }}>{totalBeforeTax.ps}</td>
              </tr>

              {/* CGST */}
              <tr style={{ borderBottom: borderBlue, height: '18px' }}>
                <td style={{ padding: '1px 6px' }}>
                  CGST {data.cgstPercent !== undefined && data.cgstPercent > 0 ? `${data.cgstPercent}%` : '%'}
                </td>
                <td style={{ borderLeft: borderBlue, borderRight: borderBlue, textAlign: 'right', paddingRight: '4px' }}>
                  {cgst.rs}
                </td>
                <td style={{ textAlign: 'center', fontSize: '9px' }}>{cgst.ps}</td>
              </tr>

              {/* SGST */}
              <tr style={{ borderBottom: borderBlue, height: '18px' }}>
                <td style={{ padding: '1px 6px' }}>
                  SGST {data.sgstPercent !== undefined && data.sgstPercent > 0 ? `${data.sgstPercent}%` : '%'}
                </td>
                <td style={{ borderLeft: borderBlue, borderRight: borderBlue, textAlign: 'right', paddingRight: '4px' }}>
                  {sgst.rs}
                </td>
                <td style={{ textAlign: 'center', fontSize: '9px' }}>{sgst.ps}</td>
              </tr>

              {/* IGST */}
              <tr style={{ borderBottom: borderBlue, height: '18px' }}>
                <td style={{ padding: '1px 6px' }}>
                  IGST {data.igstPercent !== undefined && data.igstPercent > 0 ? `${data.igstPercent}%` : '%'}
                </td>
                <td style={{ borderLeft: borderBlue, borderRight: borderBlue, textAlign: 'right', paddingRight: '4px' }}>
                  {igst.rs}
                </td>
                <td style={{ textAlign: 'center', fontSize: '9px' }}>{igst.ps}</td>
              </tr>

              {/* Total Rs. */}
              <tr style={{ borderBottom: borderBlue, height: '18px', backgroundColor: '#f5f8fd' }}>
                <td style={{ padding: '1px 6px', fontWeight: 700 }}>Total Rs.</td>
                <td style={{ borderLeft: borderBlue, borderRight: borderBlue, textAlign: 'right', paddingRight: '4px', fontWeight: 700 }}>
                  {totalWithTax.rs}
                </td>
                <td style={{ textAlign: 'center', fontSize: '9px', fontWeight: 600 }}>{totalWithTax.ps}</td>
              </tr>

              {/* Less Advance Rs. */}
              <tr style={{ borderBottom: borderBlue, height: '18px' }}>
                <td style={{ padding: '1px 6px' }}>Less Advance Rs.</td>
                <td style={{ borderLeft: borderBlue, borderRight: borderBlue, textAlign: 'right', paddingRight: '4px' }}>
                  {lessAdvance.rs}
                </td>
                <td style={{ textAlign: 'center', fontSize: '9px' }}>{lessAdvance.ps}</td>
              </tr>

              {/* Balance Due Rs. */}
              <tr style={{ height: '20px', backgroundColor: '#e9f0fb' }}>
                <td style={{ padding: '2px 6px', fontWeight: 800, fontSize: '10.5px' }}>Balance Due Rs.</td>
                <td style={{ borderLeft: borderBlue, borderRight: borderBlue, textAlign: 'right', paddingRight: '4px', fontWeight: 800, fontSize: '11px' }}>
                  {balanceDue.rs}
                </td>
                <td style={{ textAlign: 'center', fontSize: '9.5px', fontWeight: 700 }}>{balanceDue.ps}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTTOM FOOTER SECTION */}
      {/* Rupees in Words */}
      <div
        style={{
          borderLeft: borderBlueThick,
          borderRight: borderBlueThick,
          borderBottom: borderBlue,
          padding: '4px 8px',
          fontSize: '10.5px',
          display: 'flex',
          alignItems: 'baseline',
        }}
      >
        <span style={{ fontWeight: 700, marginRight: '6px', whiteSpace: 'nowrap' }}>Rupees</span>
        <span
          style={{
            flex: 1,
            borderBottom: '1px dotted #003399',
            minHeight: '14px',
            fontStyle: 'italic',
            fontWeight: 600,
            paddingLeft: '4px',
          }}
        >
          {data.rupeesInWords || ''}
        </span>
        <span style={{ fontWeight: 700, marginLeft: '4px' }}>only.</span>
      </div>

      {/* Final Signatures */}
      <div
        style={{
          borderLeft: borderBlueThick,
          borderRight: borderBlueThick,
          borderBottom: borderBlueThick,
          padding: '6px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        {/* Left: Checked By / E & O.E. */}
        <div style={{ fontSize: '10.5px' }}>
          <div style={{ fontWeight: 700, marginBottom: '2px' }}>Checked by :</div>
          <div style={{ fontStyle: 'italic', fontWeight: 800, letterSpacing: '0.04em' }}>E & O.E.</div>
        </div>

        {/* Right: Company Signature */}
        <div style={{ textAlign: 'right', fontSize: '10.5px' }}>
          <div style={{ fontWeight: 700 }}>For {companyName}</div>
          <div style={{ height: '22px' }}></div>
          <div style={{ fontWeight: 700 }}>{data.partnerTitle || 'Partner.'}</div>
        </div>
      </div>
    </div>
  );
};
