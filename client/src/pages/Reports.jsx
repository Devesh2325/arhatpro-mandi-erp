import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FileSpreadsheet, Printer, Download, Eye, CheckCircle, Search, Calendar, ShieldCheck, Filter } from 'lucide-react';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('TEEP'); // TEEP, PURCHA, JFORM, FORMM
  const [arrivals, setArrivals] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [arrRes, lotsRes] = await Promise.all([
        api.getArrivals(),
        api.getSalesLots()
      ]);
      setArrivals(arrRes.arrivals || []);
      setLots(lotsRes.lots || []);
      if (lotsRes.lots?.length > 0) {
        setSelectedItem(lotsRes.lots[0]);
      }
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" />
            Statutory APMC Reports & Vouchers / सरकारी मंडी प्रपत्र
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate Delhi APMC authorized settlement Teep, Buyer Purcha, Farmer J-Form, and Form 'M' returns.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors text-sm"
        >
          <Printer className="w-4 h-4" /> Print Current Document
        </button>
      </div>

      {/* Report Selector Pills */}
      <div className="flex border-b border-gray-200 gap-4 print:hidden">
        {[
          { id: 'TEEP', label: 'Consignor Sealed Teep (पक्का टीप)', desc: 'Farmer Net Settlement' },
          { id: 'PURCHA', label: 'Buyer Mandi Purcha (कच्चा पर्चा)', desc: 'Buyer Trade Slip' },
          { id: 'JFORM', label: 'Farmer J-Form (जे-फॉर्म)', desc: 'Statutory Sale Certificate' },
          { id: 'FORMM', label: 'APMC Form "M" (फॉर्म एम)', desc: 'Market Fee & Cess Return' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`pb-3 text-sm font-bold border-b-2 transition-all text-left ${
              activeReport === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div>{tab.label}</div>
            <div className="text-xs font-normal text-gray-400">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Lot / Consignment Selector for Dynamic Preview */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
          <Filter className="w-4 h-4" /> Select Lot / Consignment:
        </div>
        <select
          value={selectedItem?.id || ''}
          onChange={(e) => {
            const found = lots.find(l => l.id === parseInt(e.target.value, 10));
            setSelectedItem(found || null);
          }}
          className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          {lots.map(l => (
            <option key={l.id} value={l.id}>
              {l.lot_number} — {l.farmer_name} ({l.commodity_name}, {l.total_bags} Bags)
            </option>
          ))}
        </select>
      </div>

      {/* REPORT 1: CONSIGNOR SEALED TEEP */}
      {activeReport === 'TEEP' && selectedItem && (
        <div className="bg-white p-8 rounded-2xl border border-gray-300 shadow-lg max-w-3xl mx-auto space-y-6 text-gray-800 print:shadow-none print:border-none print:p-0">
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-4 text-center space-y-1">
            <div className="text-2xl font-black uppercase tracking-wider text-gray-900">ARHATPRO TRADING CO.</div>
            <div className="text-xs font-bold text-gray-600">LICENSED COMMISSION AGENT (B-CLASS) • APMC AZADPUR, DELHI-110033</div>
            <div className="text-xs text-gray-500">Shop No. C-42, New Subzi Mandi • Phone: +91 98110 23456 • GSTIN: 07AAAAA0000A1Z5</div>
            <div className="inline-block mt-2 px-4 py-1 bg-gray-900 text-white text-xs font-black uppercase rounded tracking-widest">
              CONSIGNOR ACCOUNT SALE / पक्का टीप
            </div>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div><span className="font-bold text-gray-500">Consignor / Farmer:</span> <span className="font-black text-gray-900 text-sm">{selectedItem.farmer_name}</span></div>
              <div><span className="font-bold text-gray-500">Origin / Village:</span> {selectedItem.source_location || 'Himachal Pradesh'}</div>
              <div><span className="font-bold text-gray-500">Truck No:</span> <span className="font-mono font-bold">{selectedItem.truck_no || 'DL-01-AB-8899'}</span></div>
            </div>
            <div className="space-y-1 text-right">
              <div><span className="font-bold text-gray-500">Teep Slip No:</span> <span className="font-mono font-black text-indigo-700">TP-{selectedItem.lot_number}</span></div>
              <div><span className="font-bold text-gray-500">Arrival Date:</span> {new Date(selectedItem.arrival_date || Date.now()).toLocaleDateString('en-IN')}</div>
              <div><span className="font-bold text-gray-500">Settlement Date:</span> {new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          {/* Produce Table */}
          <table className="w-full text-xs text-left border border-gray-300">
            <thead className="bg-gray-100 font-bold border-b border-gray-300">
              <tr>
                <th className="p-2.5">Commodity / Produce</th>
                <th className="p-2.5 text-center">Bags / Crates</th>
                <th className="p-2.5 text-right">Auction Rate (Avg)</th>
                <th className="p-2.5 text-right">Gross Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const bags = selectedItem.total_bags || 100;
                const estRate = 1850;
                const gross = bags * estRate;
                const freight = selectedItem.freight_amount || 4500;
                const advance = selectedItem.advance_paid || 1000;
                const balFreight = freight - advance;
                const unloading = bags * 3; // ₹3 per bag
                const commission = (gross * 6) / 100; // 6% Arhat
                const apmcFee = (gross * 1) / 100; // 1%
                const totalDeductions = balFreight + unloading + commission + apmcFee;
                const netPayable = gross - totalDeductions;

                return (
                  <>
                    <tr className="border-b border-gray-200">
                      <td className="p-2.5 font-bold">{selectedItem.commodity_name}</td>
                      <td className="p-2.5 text-center font-bold">{bags}</td>
                      <td className="p-2.5 text-right font-mono">₹{estRate.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-bold">₹{gross.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan="3" className="p-2.5 text-right uppercase tracking-wider">Gross Produce Value (सकल मूल्य):</td>
                      <td className="p-2.5 text-right font-mono text-sm font-black">₹{gross.toLocaleString()}</td>
                    </tr>
                    {/* Deductions breakdown */}
                    <tr className="border-t border-gray-300">
                      <td colSpan="4" className="p-2 bg-gray-100 font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                        Statutory Mandi Deductions / कटौती विवरण
                      </td>
                    </tr>
                    <tr className="text-gray-600">
                      <td colSpan="3" className="px-2.5 py-1">Balance Freight to Driver (शेष भाड़ा):</td>
                      <td className="px-2.5 py-1 text-right font-mono">₹{balFreight.toLocaleString()}</td>
                    </tr>
                    <tr className="text-gray-600">
                      <td colSpan="3" className="px-2.5 py-1">Palledari / Unloading @ ₹3/bag (पल्लेदारी):</td>
                      <td className="px-2.5 py-1 text-right font-mono">₹{unloading.toLocaleString()}</td>
                    </tr>
                    <tr className="text-gray-600">
                      <td colSpan="3" className="px-2.5 py-1">Commission / Arhat @ 6.0% (आढ़त):</td>
                      <td className="px-2.5 py-1 text-right font-mono">₹{commission.toLocaleString()}</td>
                    </tr>
                    <tr className="text-gray-600">
                      <td colSpan="3" className="px-2.5 py-1">Market Fee / Mandi Cess @ 1.0% (मंडी शुल्क):</td>
                      <td className="px-2.5 py-1 text-right font-mono">₹{apmcFee.toLocaleString()}</td>
                    </tr>
                    <tr className="border-t border-gray-300 font-bold text-rose-700">
                      <td colSpan="3" className="p-2.5 text-right">Total Deductions (कुल कटौती):</td>
                      <td className="p-2.5 text-right font-mono">₹{totalDeductions.toLocaleString()}</td>
                    </tr>
                    <tr className="border-t-2 border-gray-800 bg-emerald-50 font-black text-emerald-950 text-sm">
                      <td colSpan="3" className="p-3 text-right uppercase tracking-wide">Net Payout to Farmer (शुद्ध देय राशि):</td>
                      <td className="p-3 text-right font-mono text-base font-black text-emerald-700">₹{netPayable.toLocaleString()}</td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>

          {/* Footer Signature */}
          <div className="pt-8 border-t border-gray-300 grid grid-cols-2 text-xs font-bold text-gray-500">
            <div>
              <div>Farmer / Receiver Signature</div>
              <div className="text-[10px] font-normal text-gray-400 mt-0.5">Payment credited via Bank Transfer / Cash</div>
            </div>
            <div className="text-right">
              <div>For ARHATPRO TRADING CO.</div>
              <div className="text-[10px] font-normal text-gray-400 mt-0.5">Authorized Partner / Munshi Stamp</div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: BUYER PURCHA */}
      {activeReport === 'PURCHA' && selectedItem && (
        <div className="bg-white p-8 rounded-2xl border border-gray-300 shadow-lg max-w-2xl mx-auto space-y-6 text-gray-800 print:shadow-none print:border-none print:p-0">
          <div className="border-b-2 border-gray-800 pb-3 text-center space-y-1">
            <div className="text-xl font-black uppercase tracking-wider text-gray-900">ARHATPRO TRADING CO.</div>
            <div className="text-xs text-gray-500">Shop No. C-42, APMC Azadpur, Delhi • Phone: +91 98110 23456</div>
            <div className="inline-block px-3 py-0.5 bg-indigo-900 text-white text-xs font-bold uppercase rounded mt-1">
              BUYER AUCTION PURCHA / कच्चा पर्चा
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="font-bold text-gray-500">Buyer Name:</span> <span className="font-black text-gray-900">Super Fruit Agency</span></div>
            <div><span className="font-bold text-gray-500">Purcha No:</span> <span className="font-mono font-bold">PCH-{selectedItem.lot_number}</span></div>
            <div><span className="font-bold text-gray-500">Date:</span> {new Date().toLocaleString('en-IN')}</div>
            <div><span className="font-bold text-gray-500">Payment Term:</span> <span className="font-semibold text-rose-700">15-Day Standard</span></div>
          </div>

          <table className="w-full text-xs text-left border border-gray-300">
            <thead className="bg-gray-100 font-bold border-b border-gray-300">
              <tr>
                <th className="p-2">Lot No</th>
                <th className="p-2">Item</th>
                <th className="p-2 text-center">Bags</th>
                <th className="p-2 text-right">Rate</th>
                <th className="p-2 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-2 font-mono font-bold">{selectedItem.lot_number}</td>
                <td className="p-2 font-medium">{selectedItem.commodity_name}</td>
                <td className="p-2 text-center font-bold">{selectedItem.remaining_bags || selectedItem.total_bags}</td>
                <td className="p-2 text-right font-mono">₹1,950</td>
                <td className="p-2 text-right font-mono font-bold">₹{((selectedItem.remaining_bags || selectedItem.total_bags) * 1950).toLocaleString()}</td>
              </tr>
              <tr className="font-bold bg-gray-50">
                <td colSpan="4" className="p-2 text-right">Buyer Brokerage / Dami (2%):</td>
                <td className="p-2 text-right font-mono">₹{(((selectedItem.remaining_bags || selectedItem.total_bags) * 1950 * 0.02)).toLocaleString()}</td>
              </tr>
              <tr className="font-black bg-indigo-50 text-indigo-950 text-sm border-t-2 border-gray-800">
                <td colSpan="4" className="p-2.5 text-right uppercase">Net Amount Payable:</td>
                <td className="p-2.5 text-right font-mono text-indigo-700 font-black">₹{(((selectedItem.remaining_bags || selectedItem.total_bags) * 1950 * 1.02)).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="text-[11px] text-gray-500 leading-tight">
            * Note: In case payment is not cleared within 15 days of this purcha, interest @ 18% per annum will be charged as per Delhi APMC Rules.
          </div>

          <div className="pt-6 border-t border-gray-300 flex justify-between text-xs font-bold text-gray-500">
            <div>Buyer Signature: ________</div>
            <div>Munshi Signature: ________</div>
          </div>
        </div>
      )}

      {/* REPORT 3: J-FORM */}
      {activeReport === 'JFORM' && selectedItem && (
        <div className="bg-white p-8 rounded-2xl border border-gray-300 shadow-lg max-w-3xl mx-auto space-y-6 text-gray-800 print:shadow-none print:border-none print:p-0">
          <div className="text-center space-y-1 border-b-2 border-gray-800 pb-4">
            <div className="text-xs font-bold text-gray-500 uppercase">FORM 'J' [See Rule 24(1)]</div>
            <div className="text-xl font-black uppercase tracking-wider text-gray-900">DELHI AGRICULTURAL PRODUCE MARKETING COMMITTEE</div>
            <div className="text-xs font-semibold text-gray-700">Sale Voucher of Agricultural Produce under APMC Act, 1998</div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="font-bold text-gray-500">Certificate No:</span> <span className="font-mono font-bold">JF-2026-{selectedItem.id}</span></div>
            <div><span className="font-bold text-gray-500">Market Yard:</span> Azadpur Mandi, Delhi</div>
            <div><span className="font-bold text-gray-500">Farmer / Seller:</span> <span className="font-bold text-gray-900">{selectedItem.farmer_name}</span></div>
            <div><span className="font-bold text-gray-500">Commission Agent:</span> ARHATPRO TRADING CO. (Lic # B-4421)</div>
          </div>

          <table className="w-full text-xs text-left border border-gray-300">
            <thead className="bg-gray-100 font-bold border-b border-gray-300">
              <tr>
                <th className="p-2.5">Name of Agricultural Produce</th>
                <th className="p-2.5 text-center">No. of Bags / Weight</th>
                <th className="p-2.5 text-right">Agreed Price (₹)</th>
                <th className="p-2.5 text-right">Market Charges (₹)</th>
                <th className="p-2.5 text-right">Net Value Paid (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-2.5 font-bold">{selectedItem.commodity_name}</td>
                <td className="p-2.5 text-center">{selectedItem.total_bags} Bags</td>
                <td className="p-2.5 text-right font-mono">₹1,85,000</td>
                <td className="p-2.5 text-right font-mono text-rose-600">₹14,200</td>
                <td className="p-2.5 text-right font-mono font-bold text-emerald-700">₹1,70,800</td>
              </tr>
            </tbody>
          </table>

          <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
            I hereby certify that the agricultural produce mentioned above was sold in the market yard through open auction or electronic platform in my presence and the charges levied are strictly in accordance with the APMC bye-laws.
          </div>

          <div className="pt-6 border-t border-gray-300 flex justify-between text-xs font-bold text-gray-500">
            <div>Seller / Farmer Signature: ________</div>
            <div>Secretary / Inspector, APMC: ________</div>
          </div>
        </div>
      )}

      {/* REPORT 4: FORM M APMC RETURN */}
      {activeReport === 'FORMM' && (
        <div className="bg-white p-8 rounded-2xl border border-gray-300 shadow-lg max-w-3xl mx-auto space-y-6 text-gray-800 print:shadow-none print:border-none print:p-0">
          <div className="text-center space-y-1 border-b-2 border-gray-800 pb-4">
            <div className="text-xs font-bold text-gray-500 uppercase">FORM 'M' [See Rule 29(1)]</div>
            <div className="text-xl font-black uppercase tracking-wider text-gray-900">MONTHLY RETURN OF MARKET FEE &amp; RURAL DEVELOPMENT FUND</div>
            <div className="text-xs font-semibold text-gray-700">Office of the Secretary, APMC Azadpur, Delhi</div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="font-bold text-gray-500">Firm Name:</span> ARHATPRO TRADING CO.</div>
            <div><span className="font-bold text-gray-500">Return Period:</span> September 2026</div>
            <div><span className="font-bold text-gray-500">APMC License:</span> APMC-AZD-DEL-4421</div>
            <div><span className="font-bold text-gray-500">Filing Date:</span> 21-Sep-2026</div>
          </div>

          <table className="w-full text-xs text-left border border-gray-300">
            <thead className="bg-gray-100 font-bold border-b border-gray-300">
              <tr>
                <th className="p-2.5">Category</th>
                <th className="p-2.5 text-center">Consignments</th>
                <th className="p-2.5 text-right">Gross Turn (₹)</th>
                <th className="p-2.5 text-right">APMC Fee @ 1%</th>
                <th className="p-2.5 text-right">RDF @ 1%</th>
                <th className="p-2.5 text-right">Total Cess Payable (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-2.5 font-bold">Fruits (Apple, Kinnow, Mango)</td>
                <td className="p-2.5 text-center">14 Trucks</td>
                <td className="p-2.5 text-right font-mono">₹24,50,000</td>
                <td className="p-2.5 text-right font-mono">₹24,500</td>
                <td className="p-2.5 text-right font-mono">₹24,500</td>
                <td className="p-2.5 text-right font-mono font-bold">₹49,000</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-2.5 font-bold">Vegetables (Potato, Tomato, Onion)</td>
                <td className="p-2.5 text-center">22 Trucks</td>
                <td className="p-2.5 text-right font-mono">₹18,20,000</td>
                <td className="p-2.5 text-right font-mono">₹18,200</td>
                <td className="p-2.5 text-right font-mono">₹18,200</td>
                <td className="p-2.5 text-right font-mono font-bold">₹36,400</td>
              </tr>
              <tr className="font-black bg-gray-100 text-sm">
                <td colSpan="2" className="p-2.5 uppercase">Consolidated Total:</td>
                <td className="p-2.5 text-right font-mono">₹42,70,000</td>
                <td className="p-2.5 text-right font-mono">₹42,700</td>
                <td className="p-2.5 text-right font-mono">₹42,700</td>
                <td className="p-2.5 text-right font-mono text-indigo-700">₹85,400</td>
              </tr>
            </tbody>
          </table>

          <div className="pt-6 border-t border-gray-300 flex justify-between text-xs font-bold text-gray-500">
            <div>Challan / E-Payment Ref: <b>CPN-2026-990812</b></div>
            <div>Authorized Signature &amp; Stamp</div>
          </div>
        </div>
      )}
    </div>
  );
}
