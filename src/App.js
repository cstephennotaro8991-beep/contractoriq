import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie, Legend } from "recharts";

// ─── MOCK DATA (mirrors QuickBooks export) ───────────────────────────────────

const QB_CUSTOMERS = [
  { Id: "C001", DisplayName: "Johnson Family", FullyQualifiedName: "Johnson Family", Job: false, Active: true, Balance: 0 },
  { Id: "J001", DisplayName: "Kitchen Remodel", FullyQualifiedName: "Johnson Family:Kitchen Remodel", Job: true, ParentRef: { value: "C001" }, Active: false, Balance: 0 },
  { Id: "C002", DisplayName: "M. Perez", FullyQualifiedName: "M. Perez", Job: false, Active: true, Balance: 2200 },
  { Id: "J002", DisplayName: "Bathroom Addition", FullyQualifiedName: "M. Perez:Bathroom Addition", Job: true, ParentRef: { value: "C002" }, Active: false, Balance: 2200 },
  { Id: "C003", DisplayName: "T. Harrison", FullyQualifiedName: "T. Harrison", Job: false, Active: true, Balance: 0 },
  { Id: "J003", DisplayName: "Elmwood Deck Build", FullyQualifiedName: "T. Harrison:Elmwood Deck Build", Job: true, ParentRef: { value: "C003" }, Active: false, Balance: 0 },
  { Id: "C004", DisplayName: "Apex Corp", FullyQualifiedName: "Apex Corp", Job: false, Active: true, Balance: 0 },
  { Id: "J004", DisplayName: "Downtown Office Fitout", FullyQualifiedName: "Apex Corp:Downtown Office Fitout", Job: true, ParentRef: { value: "C004" }, Active: false, Balance: 0 },
  { Id: "C005", DisplayName: "L. Kim", FullyQualifiedName: "L. Kim", Job: false, Active: true, Balance: 0 },
  { Id: "J005", DisplayName: "Cedar Ridge Roof", FullyQualifiedName: "L. Kim:Cedar Ridge Roof", Job: true, ParentRef: { value: "C005" }, Active: false, Balance: 0 },
  { Id: "C006", DisplayName: "D. Okonkwo", FullyQualifiedName: "D. Okonkwo", Job: false, Active: true, Balance: 18600 },
  { Id: "J006", DisplayName: "Maplewood Full Reno", FullyQualifiedName: "D. Okonkwo:Maplewood Full Reno", Job: true, ParentRef: { value: "C006" }, Active: true, Balance: 18600 },
  { Id: "C007", DisplayName: "Westbrook HOA", FullyQualifiedName: "Westbrook HOA", Job: false, Active: true, Balance: 0 },
  { Id: "J007", DisplayName: "Pine Ave Foundation Fix", FullyQualifiedName: "Westbrook HOA:Pine Ave Foundation Fix", Job: true, ParentRef: { value: "C007" }, Active: false, Balance: 0 },
  { Id: "C008", DisplayName: "R. Nakamura", FullyQualifiedName: "R. Nakamura", Job: false, Active: true, Balance: 0 },
  { Id: "J008", DisplayName: "Sunset Garage Conversion", FullyQualifiedName: "R. Nakamura:Sunset Garage Conversion", Job: true, ParentRef: { value: "C008" }, Active: false, Balance: 0 },
  { Id: "C009", DisplayName: "Chen-Williams", FullyQualifiedName: "Chen-Williams", Job: false, Active: true, Balance: 22000 },
  { Id: "J009", DisplayName: "Lakeview Master Suite", FullyQualifiedName: "Chen-Williams:Lakeview Master Suite", Job: true, ParentRef: { value: "C009" }, Active: true, Balance: 22000 },
  { Id: "C010", DisplayName: "Invest. Group LLC", FullyQualifiedName: "Invest. Group LLC", Job: false, Active: true, Balance: 0 },
  { Id: "J010", DisplayName: "Harbor Condo Flip", FullyQualifiedName: "Invest. Group LLC:Harbor Condo Flip", Job: true, ParentRef: { value: "C010" }, Active: false, Balance: 0 },
];

const QB_INVOICES = [
  { Id: "INV001", DocNumber: "INV-1001", CustomerRef: { value: "J001" }, TxnDate: "2024-01-05", DueDate: "2024-02-05", TotalAmt: 48500, Balance: 0, Line: [{ Description: "Labor - Demo & Framing", Amount: 12000 }, { Description: "Cabinets & Hardware", Amount: 18500 }, { Description: "Countertops & Install", Amount: 11000 }, { Description: "Electrical & Plumbing", Amount: 7000 }] },
  { Id: "INV002", DocNumber: "INV-1002", CustomerRef: { value: "J002" }, TxnDate: "2024-01-20", DueDate: "2024-02-20", TotalAmt: 22000, Balance: 2200, Line: [{ Description: "Bathroom Framing", Amount: 5500 }, { Description: "Tile & Fixtures", Amount: 9800 }, { Description: "Plumbing Rough-in", Amount: 6700 }] },
  { Id: "INV003", DocNumber: "INV-1003", CustomerRef: { value: "J003" }, TxnDate: "2024-02-01", DueDate: "2024-03-01", TotalAmt: 14200, Balance: 0, Line: [{ Description: "Decking Materials", Amount: 6200 }, { Description: "Labor - Build", Amount: 5500 }, { Description: "Railing & Finishing", Amount: 2500 }] },
  { Id: "INV004", DocNumber: "INV-1004", CustomerRef: { value: "J004" }, TxnDate: "2024-02-08", DueDate: "2024-03-08", TotalAmt: 87000, Balance: 0, Line: [{ Description: "Demolition & Prep", Amount: 8000 }, { Description: "Flooring - Commercial Grade", Amount: 22000 }, { Description: "Partition Walls", Amount: 19000 }, { Description: "Electrical & Data", Amount: 24000 }, { Description: "Paint & Finishing", Amount: 14000 }] },
  { Id: "INV005", DocNumber: "INV-1005", CustomerRef: { value: "J005" }, TxnDate: "2024-02-18", DueDate: "2024-03-18", TotalAmt: 18700, Balance: 0, Line: [{ Description: "Tear-off & Disposal", Amount: 3200 }, { Description: "Roofing Materials", Amount: 9800 }, { Description: "Labor - Install", Amount: 5700 }] },
  { Id: "INV006A", DocNumber: "INV-1006A", CustomerRef: { value: "J006" }, TxnDate: "2024-03-01", DueDate: "2024-04-01", TotalAmt: 56000, Balance: 0, Line: [{ Description: "Deposit - Demo & Structural", Amount: 56000 }] },
  { Id: "INV006B", DocNumber: "INV-1006B", CustomerRef: { value: "J006" }, TxnDate: "2024-04-01", DueDate: "2024-05-01", TotalAmt: 56000, Balance: 18600, Line: [{ Description: "Progress - Interior Buildout", Amount: 56000 }] },
  { Id: "INV007", DocNumber: "INV-1007", CustomerRef: { value: "J007" }, TxnDate: "2024-03-05", DueDate: "2024-04-05", TotalAmt: 9800, Balance: 0, Line: [{ Description: "Foundation Inspection & Repair", Amount: 9800 }] },
  { Id: "INV008", DocNumber: "INV-1008", CustomerRef: { value: "J008" }, TxnDate: "2024-03-15", DueDate: "2024-04-15", TotalAmt: 31000, Balance: 0, Line: [{ Description: "Garage Conversion Labor", Amount: 14000 }, { Description: "Insulation & Drywall", Amount: 8500 }, { Description: "Electrical & HVAC", Amount: 8500 }] },
  { Id: "INV009", DocNumber: "INV-1009", CustomerRef: { value: "J009" }, TxnDate: "2024-04-01", DueDate: "2024-05-01", TotalAmt: 55000, Balance: 22000, Line: [{ Description: "Master Suite Addition - Full Scope", Amount: 55000 }] },
  { Id: "INV010", DocNumber: "INV-1010", CustomerRef: { value: "J010" }, TxnDate: "2024-03-20", DueDate: "2024-04-20", TotalAmt: 38000, Balance: 0, Line: [{ Description: "Full Condo Renovation", Amount: 38000 }] },
];

const QB_PURCHASES = [
  // J001 Kitchen
  { Id: "PUR001", DocNumber: "PO-201", EntityRef: { name: "BuildRight Supply Co" }, TxnDate: "2023-12-15", TotalAmt: 18500, PaymentType: "Check", Line: [{ Amount: 18500, Description: "Cabinets, countertops, hardware", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J001" } } }] },
  { Id: "PUR002", DocNumber: "PO-202", EntityRef: { name: "City Plumbing Wholesale" }, TxnDate: "2024-01-03", TotalAmt: 4200, PaymentType: "CreditCard", Line: [{ Amount: 4200, Description: "Plumbing fixtures & pipe", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J001" } } }] },
  { Id: "PUR003", DocNumber: "PO-203", EntityRef: { name: "FastSpark Electric" }, TxnDate: "2024-01-08", TotalAmt: 3800, PaymentType: "Check", Line: [{ Amount: 3800, Description: "Electrical sub - kitchen", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J001" } } }] },
  { Id: "PUR004", DocNumber: "PO-204", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-01-12", TotalAmt: 4700, PaymentType: "Check", Line: [{ Amount: 4700, Description: "Crew labor - framing & demo", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J001" } } }] },
  // J002 Bathroom
  { Id: "PUR005", DocNumber: "PO-205", EntityRef: { name: "Tile & Stone Direct" }, TxnDate: "2024-01-10", TotalAmt: 6200, PaymentType: "CreditCard", Line: [{ Amount: 6200, Description: "Tile, grout, fixtures", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J002" } } }] },
  { Id: "PUR006", DocNumber: "PO-206", EntityRef: { name: "City Plumbing Wholesale" }, TxnDate: "2024-01-15", TotalAmt: 4800, PaymentType: "Check", Line: [{ Amount: 4800, Description: "Plumbing - bathroom addition", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J002" } } }] },
  { Id: "PUR007", DocNumber: "PO-207", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-01-22", TotalAmt: 8800, PaymentType: "Check", Line: [{ Amount: 8800, Description: "Labor - bathroom build", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J002" } } }] },
  // J003 Deck
  { Id: "PUR008", DocNumber: "PO-208", EntityRef: { name: "Pacific Lumber Yard" }, TxnDate: "2024-01-28", TotalAmt: 4800, PaymentType: "CreditCard", Line: [{ Amount: 4800, Description: "Composite decking & lumber", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J003" } } }] },
  { Id: "PUR009", DocNumber: "PO-209", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-02-02", TotalAmt: 4100, PaymentType: "Check", Line: [{ Amount: 4100, Description: "Crew labor - deck build", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J003" } } }] },
  // J004 Office Fitout
  { Id: "PUR010", DocNumber: "PO-210", EntityRef: { name: "Commercial Floors Inc" }, TxnDate: "2024-02-01", TotalAmt: 28000, PaymentType: "Check", Line: [{ Amount: 28000, Description: "Commercial flooring - materials & install", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J004" } } }] },
  { Id: "PUR011", DocNumber: "PO-211", EntityRef: { name: "StructurePro LLC" }, TxnDate: "2024-02-05", TotalAmt: 22000, PaymentType: "Check", Line: [{ Amount: 22000, Description: "Partition walls & doors", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J004" } } }] },
  { Id: "PUR012", DocNumber: "PO-212", EntityRef: { name: "FastSpark Electric" }, TxnDate: "2024-02-08", TotalAmt: 31200, PaymentType: "Check", Line: [{ Amount: 31200, Description: "Electrical & data cabling - office", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J004" } } }] },
  { Id: "PUR013", DocNumber: "PO-213", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-02-10", TotalAmt: 10000, PaymentType: "Check", Line: [{ Amount: 10000, Description: "Crew - demo, paint, finishing", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J004" } } }] },
  // J005 Roof
  { Id: "PUR014", DocNumber: "PO-214", EntityRef: { name: "Western Roofing Supply" }, TxnDate: "2024-02-14", TotalAmt: 7400, PaymentType: "CreditCard", Line: [{ Amount: 7400, Description: "Shingles, underlayment, flashing", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J005" } } }] },
  { Id: "PUR015", DocNumber: "PO-215", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-02-20", TotalAmt: 3800, PaymentType: "Check", Line: [{ Amount: 3800, Description: "Roofing crew labor", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J005" } } }] },
  // J006 Maplewood
  { Id: "PUR016", DocNumber: "PO-216", EntityRef: { name: "BuildRight Supply Co" }, TxnDate: "2024-03-05", TotalAmt: 34000, PaymentType: "Check", Line: [{ Amount: 34000, Description: "Structural materials - full reno", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J006" } } }] },
  { Id: "PUR017", DocNumber: "PO-217", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-03-15", TotalAmt: 28000, PaymentType: "Check", Line: [{ Amount: 28000, Description: "Crew - 6 weeks full reno", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J006" } } }] },
  { Id: "PUR018", DocNumber: "PO-218", EntityRef: { name: "FastSpark Electric" }, TxnDate: "2024-03-20", TotalAmt: 18400, PaymentType: "Check", Line: [{ Amount: 18400, Description: "Full electrical rewire", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J006" } } }] },
  { Id: "PUR019", DocNumber: "PO-219", EntityRef: { name: "City Plumbing Wholesale" }, TxnDate: "2024-03-25", TotalAmt: 18000, PaymentType: "Check", Line: [{ Amount: 18000, Description: "Plumbing - full reno", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J006" } } }] },
  // J007 Foundation
  { Id: "PUR020", DocNumber: "PO-220", EntityRef: { name: "StructurePro LLC" }, TxnDate: "2024-03-01", TotalAmt: 9800, PaymentType: "Check", Line: [{ Amount: 9800, Description: "Foundation repair - materials & labor", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J007" } } }] },
  { Id: "PUR021", DocNumber: "PO-221", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-03-05", TotalAmt: 3600, PaymentType: "Check", Line: [{ Amount: 3600, Description: "Additional crew - excavation", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J007" } } }] },
  // J008 Garage
  { Id: "PUR022", DocNumber: "PO-222", EntityRef: { name: "BuildRight Supply Co" }, TxnDate: "2024-03-10", TotalAmt: 8200, PaymentType: "CreditCard", Line: [{ Amount: 8200, Description: "Insulation, drywall, finishes", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J008" } } }] },
  { Id: "PUR023", DocNumber: "PO-223", EntityRef: { name: "FastSpark Electric" }, TxnDate: "2024-03-12", TotalAmt: 5800, PaymentType: "Check", Line: [{ Amount: 5800, Description: "Electrical & mini-split HVAC", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J008" } } }] },
  { Id: "PUR024", DocNumber: "PO-224", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-03-14", TotalAmt: 5700, PaymentType: "Check", Line: [{ Amount: 5700, Description: "Crew labor - garage conversion", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J008" } } }] },
  // J009 Master Suite
  { Id: "PUR025", DocNumber: "PO-225", EntityRef: { name: "BuildRight Supply Co" }, TxnDate: "2024-04-03", TotalAmt: 22000, PaymentType: "Check", Line: [{ Amount: 22000, Description: "Framing, drywall, flooring materials", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J009" } } }] },
  { Id: "PUR026", DocNumber: "PO-226", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-04-08", TotalAmt: 18500, PaymentType: "Check", Line: [{ Amount: 18500, Description: "Crew - addition build", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J009" } } }] },
  { Id: "PUR027", DocNumber: "PO-227", EntityRef: { name: "City Plumbing Wholesale" }, TxnDate: "2024-04-10", TotalAmt: 9800, PaymentType: "Check", Line: [{ Amount: 9800, Description: "Plumbing - ensuite bathroom", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J009" } } }] },
  { Id: "PUR028", DocNumber: "PO-228", EntityRef: { name: "FastSpark Electric" }, TxnDate: "2024-04-12", TotalAmt: 6900, PaymentType: "Check", Line: [{ Amount: 6900, Description: "Electrical - master suite", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J009" } } }] },
  // J010 Condo
  { Id: "PUR029", DocNumber: "PO-229", EntityRef: { name: "BuildRight Supply Co" }, TxnDate: "2024-03-18", TotalAmt: 12400, PaymentType: "CreditCard", Line: [{ Amount: 12400, Description: "Materials - full condo reno", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J010" } } }] },
  { Id: "PUR030", DocNumber: "PO-230", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-03-22", TotalAmt: 11700, PaymentType: "Check", Line: [{ Amount: 11700, Description: "Crew labor - condo flip", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J010" } } }] },
];

// ─── DERIVED / COMPUTED DATA ─────────────────────────────────────────────────

const JOB_META = {
  J001: { type: "Remodel", status: "Complete" },
  J002: { type: "Addition", status: "Complete" },
  J003: { type: "New Build", status: "Complete" },
  J004: { type: "Commercial", status: "Complete" },
  J005: { type: "Roofing", status: "Complete" },
  J006: { type: "Remodel", status: "In Progress" },
  J007: { type: "Structural", status: "Complete" },
  J008: { type: "Addition", status: "Complete" },
  J009: { type: "Addition", status: "In Progress" },
  J010: { type: "Remodel", status: "Complete" },
};

function buildJobSummaries() {
  const jobs = QB_CUSTOMERS.filter(c => c.Job);
  return jobs.map(job => {
    const invoices = QB_INVOICES.filter(i => i.CustomerRef.value === job.Id);
    const purchases = QB_PURCHASES.filter(p =>
      p.Line.some(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.Id)
    );
    const revenue = invoices.reduce((s, i) => s + i.TotalAmt, 0);
    const costs = purchases.reduce((s, p) =>
      s + p.Line.filter(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.Id)
               .reduce((ls, l) => ls + l.Amount, 0), 0);
    const client = QB_CUSTOMERS.find(c => c.Id === job.ParentRef?.value);
    const allDates = invoices.map(i => i.TxnDate).sort();
    const costByVendor = {};
    purchases.forEach(p => {
      p.Line.filter(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.Id).forEach(l => {
        const vendor = p.EntityRef.name;
        costByVendor[vendor] = (costByVendor[vendor] || 0) + l.Amount;
      });
    });
    return {
      id: job.Id,
      name: job.DisplayName,
      clientName: client?.DisplayName || "",
      ...JOB_META[job.Id],
      revenue,
      costs,
      profit: revenue - costs,
      marginPct: revenue > 0 ? (((revenue - costs) / revenue) * 100).toFixed(1) : "0.0",
      invoices,
      purchases,
      firstDate: allDates[0] || "",
      lastDate: allDates[allDates.length - 1] || "",
      costByVendor,
      outstanding: invoices.reduce((s, i) => s + i.Balance, 0),
    };
  });
}

const JOB_SUMMARIES = buildJobSummaries();

const MONTHLY_TREND = [
  { month: "Sep '23", revenue: 38000, costs: 29000 },
  { month: "Oct '23", revenue: 52000, costs: 44000 },
  { month: "Nov '23", revenue: 61000, costs: 48000 },
  { month: "Dec '23", revenue: 29000, costs: 22000 },
  { month: "Jan '24", revenue: 70500, costs: 51000 },
  { month: "Feb '24", revenue: 120100, costs: 110400 },
  { month: "Mar '24", revenue: 98800, costs: 57200 },
  { month: "Apr '24", revenue: 55000, costs: 57200 },
].map(d => ({ ...d, profit: d.revenue - d.costs }));

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const $ = n => `$${Math.abs(n).toLocaleString()}`;
const $k = n => n >= 1000 || n <= -1000 ? `$${(Math.abs(n) / 1000).toFixed(1)}k` : `$${Math.abs(n)}`;

const ACCENT = "#B8F04A";
const RED = "#FF5757";
const BG = "#0C0E13";
const CARD = "#13161E";
const BORDER = "#1E2230";
const DIM = "#4A5068";
const MID = "#8A90A8";

// ─── STYLES ──────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${BG}; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${BG}; }
  ::-webkit-scrollbar-thumb { background: #2A2D3A; border-radius: 2px; }
  .nav-tab { cursor:pointer; padding:10px 20px; font-size:13px; font-weight:500; letter-spacing:0.02em; border-bottom:2px solid transparent; color:${DIM}; transition:all 0.15s; white-space:nowrap; }
  .nav-tab:hover { color:${MID}; }
  .nav-tab.active { color:${ACCENT}; border-bottom-color:${ACCENT}; }
  .kpi { background:${CARD}; border:1px solid ${BORDER}; border-radius:10px; padding:20px 24px; }
  .kpi.hi { border-color:rgba(184,240,74,0.3); background:linear-gradient(135deg,${CARD},#141C0E); }
  .chip { display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600; }
  .chip.g { background:rgba(184,240,74,0.12);color:${ACCENT}; }
  .chip.r { background:rgba(255,87,87,0.12);color:${RED}; }
  .trow { display:grid;border-bottom:1px solid ${BORDER};cursor:pointer;transition:background 0.1s; }
  .trow:hover { background:#171A24; }
  .trow.sel { background:#171A24;border-left:3px solid ${ACCENT}; }
  .tcell { padding:13px 16px;font-size:12px;display:flex;align-items:center; }
  .thead { display:grid;background:#0F1118;border-bottom:1px solid ${BORDER}; }
  .th { padding:9px 16px;font-size:9px;letter-spacing:0.14em;color:${DIM};text-transform:uppercase; }
  .btn { cursor:pointer;padding:7px 16px;border-radius:6px;font-size:11px;font-weight:600;letter-spacing:0.06em;transition:all 0.15s;border:1px solid ${BORDER};color:${MID};background:transparent;font-family:inherit; }
  .btn:hover { border-color:${ACCENT};color:${ACCENT}; }
  .btn.act { border-color:${ACCENT};color:#0C0E13;background:${ACCENT}; }
  .card { background:${CARD};border:1px solid ${BORDER};border-radius:10px; }
  .mono { font-family:'JetBrains Mono',monospace; }
  .chat-bubble-user { background:#1E2230;border-radius:12px 12px 4px 12px;padding:12px 16px;font-size:13px;color:#D0D4E8;max-width:80%;align-self:flex-end; }
  .chat-bubble-ai { background:#141C0E;border:1px solid rgba(184,240,74,0.2);border-radius:12px 12px 12px 4px;padding:14px 18px;font-size:13px;color:#C8CCDE;max-width:88%;align-self:flex-start;line-height:1.65; }
  .chat-input { background:#13161E;border:1px solid ${BORDER};border-radius:8px;padding:12px 16px;color:#D0D4E8;font-size:13px;width:100%;font-family:'Space Grotesk',sans-serif;outline:none;transition:border 0.15s; }
  .chat-input:focus { border-color:rgba(184,240,74,0.4); }
  .raw-table { width:100%;border-collapse:collapse; }
  .raw-table th { padding:9px 14px;font-size:9px;letter-spacing:0.14em;color:${DIM};text-transform:uppercase;background:#0F1118;border-bottom:1px solid ${BORDER};text-align:left;white-space:nowrap; }
  .raw-table td { padding:10px 14px;font-size:12px;color:${MID};border-bottom:1px solid #181B26;white-space:nowrap; }
  .raw-table tr:hover td { background:#171A24; }
  .raw-table td.mono { color:#9AA8C8;font-size:11px; }
  .tag { display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;background:#1E2230;color:${MID}; }
  .thinking { display:flex;gap:4px;align-items:center;padding:4px 0; }
  .thinking span { width:7px;height:7px;border-radius:50%;background:${ACCENT};animation:bounce 1.2s infinite; }
  .thinking span:nth-child(2) { animation-delay:0.2s; }
  .thinking span:nth-child(3) { animation-delay:0.4s; }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-6px);opacity:1} }
`;

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1A1D2A", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
      <div style={{ color: DIM, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 3 }}>{p.name}: {$(p.value)}</div>
      ))}
    </div>
  );
};

// ─── TAB: DASHBOARD ───────────────────────────────────────────────────────────

function Dashboard({ onJobClick }) {
  const [sort, setSort] = useState("profit");
  const sorted = [...JOB_SUMMARIES].sort((a, b) => {
    if (sort === "profit") return b.profit - a.profit;
    if (sort === "margin") return parseFloat(b.marginPct) - parseFloat(a.marginPct);
    return b.revenue - a.revenue;
  });
  const totalRev = JOB_SUMMARIES.reduce((s, j) => s + j.revenue, 0);
  const totalCost = JOB_SUMMARIES.reduce((s, j) => s + j.costs, 0);
  const totalProfit = totalRev - totalCost;
  const winners = JOB_SUMMARIES.filter(j => j.profit > 0).length;
  const losers = JOB_SUMMARIES.filter(j => j.profit <= 0).length;
  const outstanding = JOB_SUMMARIES.reduce((s, j) => s + j.outstanding, 0);

  const barData = sorted.map(j => ({
    name: j.name.length > 16 ? j.name.slice(0, 16) + "…" : j.name,
    fullName: j.name,
    profit: j.profit,
  }));

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Revenue", val: $(totalRev), sub: "all jobs billed", hi: false },
          { label: "Total Profit", val: $(totalProfit), sub: `${((totalProfit/totalRev)*100).toFixed(1)}% overall margin`, hi: true },
          { label: "Jobs Profitable", val: `${winners} / ${JOB_SUMMARIES.length}`, sub: "in the green", hi: false },
          { label: "Outstanding A/R", val: $(outstanding), sub: `${losers} job${losers!==1?"s":""} losing money`, hi: false },
        ].map((k, i) => (
          <div key={i} className={`kpi${k.hi?" hi":""}`}>
            <div style={{ fontSize: 9, letterSpacing: "0.18em", color: DIM, textTransform: "uppercase", marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: k.hi ? ACCENT : "#D8DCF0", letterSpacing: "-0.02em" }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#3A4055", marginTop: 5 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.16em", color: DIM, textTransform: "uppercase", marginBottom: 4 }}>Profit By Job</div>
              <div style={{ fontSize: 13, color: MID }}>Which jobs made money?</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["profit","$ PROFIT"],["margin","% MARGIN"],["revenue","REVENUE"]].map(([k,l])=>(
                <button key={k} className={`btn${sort===k?" act":""}`} onClick={()=>setSort(k)}>{l}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={barData} margin={{ top:4, right:4, left:0, bottom:48 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1A1D2A" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize:9, fill:DIM, fontFamily:"JetBrains Mono" }} angle={-38} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize:10, fill:DIM, fontFamily:"JetBrains Mono" }} tickFormatter={$k} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload }) => {
                if (!active||!payload?.length) return null;
                const d = payload[0].payload;
                return <div style={{ background:"#1A1D2A",border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px",fontFamily:"JetBrains Mono,monospace",fontSize:11 }}>
                  <div style={{ color:DIM,marginBottom:4 }}>{d.fullName}</div>
                  <div style={{ color: d.profit>=0?ACCENT:RED,fontSize:14,fontWeight:600 }}>{d.profit>=0?"+":"-"}{$(d.profit)}</div>
                </div>;
              }} />
              <ReferenceLine y={0} stroke="#2A2D3A" />
              <Bar dataKey="profit" radius={[3,3,0,0]}>
                {barData.map((e,i)=><Cell key={i} fill={e.profit>=0?ACCENT:RED} opacity={0.9}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding:"20px 24px" }}>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:9,letterSpacing:"0.16em",color:DIM,textTransform:"uppercase",marginBottom:4 }}>Monthly Trend</div>
            <div style={{ fontSize:13,color:MID }}>How is profitability tracking?</div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={MONTHLY_TREND} margin={{ top:4,right:16,left:0,bottom:0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1A1D2A" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:10,fill:DIM,fontFamily:"JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10,fill:DIM,fontFamily:"JetBrains Mono" }} tickFormatter={$k} axisLine={false} tickLine={false} />
              <Tooltip content={ChartTip} />
              <Line type="monotone" dataKey="revenue" stroke="#4A5580" strokeWidth={1.5} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="costs" stroke={RED} strokeWidth={1.5} dot={false} name="Costs" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="profit" stroke={ACCENT} strokeWidth={2.5} dot={{ r:3,fill:ACCENT }} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display:"flex",gap:20,marginTop:10,justifyContent:"flex-end" }}>
            {[["Revenue","#4A5580",false],["Costs",RED,true],["Profit",ACCENT,false]].map(([l,c,d])=>(
              <div key={l} style={{ display:"flex",alignItems:"center",gap:6,fontSize:10,color:DIM }}>
                <div style={{ width:16,height:2,background:d?"transparent":c,borderRadius:2,borderBottom:d?`2px dashed ${c}`:"none" }}/>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Job Table */}
      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ padding:"18px 16px 14px",borderBottom:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ fontSize:13,color:MID }}>All Jobs — click a row to see full breakdown</div>
          <div style={{ display:"flex",gap:12,alignItems:"center",fontSize:10,color:DIM }}>
            <span style={{ color:ACCENT }}>■</span> Profitable &nbsp;&nbsp;
            <span style={{ color:RED }}>■</span> Losing Money
          </div>
        </div>
        <div className="thead" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 80px" }}>
          {["Job Name","Client","Revenue","Costs","Profit / Loss","Status"].map(h=>(
            <div key={h} className="th">{h}</div>
          ))}
        </div>
        {sorted.map(j => {
          const win = j.profit > 0;
          return (
            <div key={j.id} className="trow" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 80px", borderLeft:`3px solid ${win?"rgba(184,240,74,0.3)":"rgba(255,87,87,0.3)"}` }} onClick={()=>onJobClick(j)}>
              <div className="tcell" style={{ flexDirection:"column",alignItems:"flex-start",gap:3 }}>
                <span style={{ color:"#C8CCE0",fontWeight:600 }}>{j.name}</span>
                <span style={{ fontSize:10,color:DIM }}>{j.type}</span>
              </div>
              <div className="tcell" style={{ color:MID }}>{j.clientName}</div>
              <div className="tcell mono" style={{ color:MID }}>{$(j.revenue)}</div>
              <div className="tcell mono" style={{ color:MID }}>{$(j.costs)}</div>
              <div className="tcell">
                <span className={`chip ${win?"g":"r"}`}>{win?"+":"-"}{$(j.profit)} ({j.marginPct}%)</span>
              </div>
              <div className="tcell" style={{ fontSize:10,color:j.status==="Complete"?DIM:"#C8A040",letterSpacing:"0.04em" }}>
                {j.status==="Complete"?"✓ Done":"● Active"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TAB: JOB DETAIL ─────────────────────────────────────────────────────────

function JobDetail({ job, onBack }) {
  if (!job) return (
    <div style={{ padding:60,textAlign:"center",color:DIM }}>
      <div style={{ fontSize:32,marginBottom:12 }}>←</div>
      <div style={{ fontSize:14 }}>Select a job from the Dashboard tab to see its full breakdown</div>
    </div>
  );

  const win = job.profit > 0;
  const vendorData = Object.entries(job.costByVendor).map(([name,value])=>({ name, value })).sort((a,b)=>b.value-a.value);
  const COLORS = [ACCENT,"#4A9FFF","#FF9F40","#C879FF","#FF6B6B","#40E0D0"];

  const invoiceLines = job.invoices.flatMap(inv =>
    inv.Line.map(l => ({ doc: inv.DocNumber, date: inv.TxnDate, desc: l.Description, amount: l.Amount, type: "Revenue" }))
  );
  const costLines = job.purchases.flatMap(p =>
    p.Line.filter(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.id)
      .map(l => ({ doc: p.DocNumber, date: p.TxnDate, desc: l.Description, amount: l.Amount, vendor: p.EntityRef.name, type: "Cost" }))
  );
  const allLines = [...invoiceLines, ...costLines].sort((a,b)=>a.date.localeCompare(b.date));

  return (
    <div style={{ padding:"24px 32px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:24 }}>
        <button className="btn" onClick={onBack}>← All Jobs</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20,fontWeight:700,color:"#D8DCF0",letterSpacing:"-0.01em" }}>{job.name}</div>
          <div style={{ fontSize:12,color:DIM,marginTop:2 }}>{job.clientName} · {job.type} · {job.status}</div>
        </div>
        <span className={`chip ${win?"g":"r"}`} style={{ fontSize:13,padding:"6px 16px" }}>
          {win?"+":"-"}{$(job.profit)} &nbsp; {job.marginPct}% margin
        </span>
      </div>

      {/* KPI strip */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:22 }}>
        {[
          { label:"Revenue", val:$(job.revenue) },
          { label:"Total Costs", val:$(job.costs) },
          { label:"Gross Profit", val:(win?"+":"-")+$(job.profit) },
          { label:"Margin", val:job.marginPct+"%" },
          { label:"Outstanding", val:$(job.outstanding) },
        ].map((k,i)=>(
          <div key={i} className="kpi">
            <div style={{ fontSize:9,letterSpacing:"0.16em",color:DIM,textTransform:"uppercase",marginBottom:8 }}>{k.label}</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700,color:i===2?(win?ACCENT:RED):i===4&&job.outstanding>0?"#C8A040":"#D8DCF0" }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:22 }}>
        {/* Cost breakdown donut */}
        <div className="card" style={{ padding:"20px 24px" }}>
          <div style={{ fontSize:9,letterSpacing:"0.16em",color:DIM,textTransform:"uppercase",marginBottom:4 }}>Cost Breakdown by Vendor</div>
          <div style={{ fontSize:12,color:MID,marginBottom:16 }}>Where did the money go?</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={vendorData} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={2}>
                {vendorData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} opacity={0.9}/>)}
              </Pie>
              <Legend formatter={(v)=><span style={{ fontSize:11,color:MID }}>{v}</span>} />
              <Tooltip formatter={(v)=>[$(v),"Cost"]} contentStyle={{ background:"#1A1D2A",border:`1px solid ${BORDER}`,borderRadius:8,fontFamily:"JetBrains Mono",fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Cost bar */}
        <div className="card" style={{ padding:"20px 24px" }}>
          <div style={{ fontSize:9,letterSpacing:"0.16em",color:DIM,textTransform:"uppercase",marginBottom:4 }}>Revenue vs Costs</div>
          <div style={{ fontSize:12,color:MID,marginBottom:16 }}>Side by side comparison</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name:"This Job",revenue:job.revenue,costs:job.costs,profit:job.profit }]} margin={{ top:4,right:4,left:0,bottom:0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1A1D2A" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize:11,fill:DIM }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10,fill:DIM,fontFamily:"JetBrains Mono" }} tickFormatter={$k} axisLine={false} tickLine={false}/>
              <Tooltip content={ChartTip}/>
              <Bar dataKey="revenue" name="Revenue" fill="#4A5580" radius={[4,4,0,0]}/>
              <Bar dataKey="costs" name="Costs" fill={RED} radius={[4,4,0,0]} opacity={0.8}/>
              <Bar dataKey="profit" name="Profit" fill={win?ACCENT:RED} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction log */}
      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ padding:"16px 20px",borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ fontSize:13,color:MID }}>Transaction Log — all invoices & expenses for this job</div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table className="raw-table">
            <thead><tr>
              {["Date","Doc #","Type","Vendor / Description","Amount"].map(h=><th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {allLines.map((l,i)=>(
                <tr key={i}>
                  <td className="mono">{l.date}</td>
                  <td className="mono">{l.doc}</td>
                  <td><span style={{ display:"inline-block",padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:l.type==="Revenue"?"rgba(184,240,74,0.1)":"rgba(255,87,87,0.1)",color:l.type==="Revenue"?ACCENT:RED }}>{l.type}</span></td>
                  <td style={{ color:"#9AA8C8",maxWidth:320 }}>{l.vendor ? <span style={{ color:DIM,marginRight:8 }}>[{l.vendor}]</span> : null}{l.desc}</td>
                  <td className="mono" style={{ color:l.type==="Revenue"?ACCENT:RED }}>{l.type==="Revenue"?"+":"-"}{$(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: AI CHAT ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a sharp, no-nonsense financial analyst for a small contracting business. You have access to all job data below. Answer questions about profitability, trends, and business performance concisely and in plain English — like a smart bookkeeper talking to a busy contractor. Be direct. Use dollar figures and percentages. Flag problems clearly. Keep responses under 200 words unless a detailed breakdown is asked for.

JOB SUMMARY DATA:
${JSON.stringify(JOB_SUMMARIES.map(j=>({ id:j.id, name:j.name, client:j.clientName, type:j.type, status:j.status, revenue:j.revenue, costs:j.costs, profit:j.profit, marginPct:j.marginPct+"%" })), null, 2)}

MONTHLY TREND DATA:
${JSON.stringify(MONTHLY_TREND, null, 2)}`;

function AIChat() {
  const [messages, setMessages] = useState([
    { role:"assistant", content:"Hey — I've got your full job data loaded. Ask me anything: which jobs are killing your margin, why a month looked bad, which job type is most profitable, or what to watch out for. What do you want to know?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  const SUGGESTIONS = [
    "Which jobs are losing me money?",
    "Why did February look so bad?",
    "What job type has the best margins?",
    "Which vendor is costing me the most?",
  ];

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const newMessages = [...messages, { role:"user", content:msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m=>({ role:m.role, content:m.content }))
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("") || "Sorry, I couldn't get a response.";
      setMessages([...newMessages, { role:"assistant", content:reply }]);
    } catch(e) {
      setMessages([...newMessages, { role:"assistant", content:"Error connecting to Claude API. Make sure you're running this with API access." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 120px)",padding:"0 32px 24px" }}>
      <div style={{ paddingTop:24,paddingBottom:16,borderBottom:`1px solid ${BORDER}`,marginBottom:20 }}>
        <div style={{ fontSize:9,letterSpacing:"0.18em",color:DIM,textTransform:"uppercase",marginBottom:6 }}>AI Business Analyst</div>
        <div style={{ fontSize:14,color:MID }}>Ask anything about your jobs, margins, or trends — in plain English.</div>
      </div>

      {/* Suggestion chips */}
      {messages.length <= 1 && (
        <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:20 }}>
          {SUGGESTIONS.map((s,i)=>(
            <button key={i} onClick={()=>send(s)} style={{ cursor:"pointer",padding:"8px 14px",borderRadius:20,fontSize:12,border:`1px solid ${BORDER}`,color:MID,background:"transparent",fontFamily:"'Space Grotesk',sans-serif",transition:"all 0.15s" }}
              onMouseOver={e=>{e.target.style.borderColor=ACCENT;e.target.style.color=ACCENT;}}
              onMouseOut={e=>{e.target.style.borderColor=BORDER;e.target.style.color=MID;}}
            >{s}</button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:14,paddingRight:8 }}>
        {messages.map((m,i)=>(
          <div key={i} className={m.role==="user"?"chat-bubble-user":"chat-bubble-ai"} style={{ whiteSpace:"pre-wrap" }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-ai">
            <div className="thinking"><span/><span/><span/></div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ display:"flex",gap:10,marginTop:16 }}>
        <input
          className="chat-input"
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Ask about your jobs, margins, costs..."
        />
        <button className="btn act" onClick={()=>send()} style={{ whiteSpace:"nowrap",padding:"10px 20px" }}>Send →</button>
      </div>
    </div>
  );
}

// ─── TAB: RAW DATA ────────────────────────────────────────────────────────────

function RawData() {
  const [view, setView] = useState("customers");

  const VIEWS = [
    { key:"customers", label:"Customers / Jobs" },
    { key:"invoices", label:"Invoices" },
    { key:"purchases", label:"Purchases & Bills" },
  ];

  return (
    <div style={{ padding:"24px 32px" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:9,letterSpacing:"0.18em",color:DIM,textTransform:"uppercase",marginBottom:8 }}>QuickBooks Raw Data Export</div>
        <div style={{ fontSize:13,color:MID,marginBottom:16 }}>This mirrors exactly what the QB API returns. In production, this data would be synced nightly into your Supabase database.</div>
        <div style={{ display:"flex",gap:8 }}>
          {VIEWS.map(v=>(
            <button key={v.key} className={`btn${view===v.key?" act":""}`} onClick={()=>setView(v.key)}>{v.label} <span style={{ opacity:0.6,fontSize:10 }}>({v.key==="customers"?QB_CUSTOMERS.length:v.key==="invoices"?QB_INVOICES.length:QB_PURCHASES.length})</span></button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          {view==="customers" && (
            <table className="raw-table">
              <thead><tr>{["Id","DisplayName","FullyQualifiedName","Job","ParentRef.value","Active","Balance"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {QB_CUSTOMERS.map(c=>(
                  <tr key={c.Id}>
                    <td className="mono">{c.Id}</td>
                    <td style={{ color:"#C8CCE0",fontWeight:500 }}>{c.DisplayName}</td>
                    <td style={{ color:"#9AA8C8" }}>{c.FullyQualifiedName}</td>
                    <td><span style={{ display:"inline-block",padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:c.Job?"rgba(184,240,74,0.1)":"rgba(74,80,104,0.3)",color:c.Job?ACCENT:DIM }}>{c.Job?"true":"false"}</span></td>
                    <td className="mono">{c.ParentRef?.value || <span style={{ color:DIM }}>null</span>}</td>
                    <td><span style={{ color:c.Active?ACCENT:DIM }}>{c.Active?"true":"false"}</span></td>
                    <td className="mono" style={{ color:c.Balance>0?"#C8A040":DIM }}>${c.Balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {view==="invoices" && (
            <table className="raw-table">
              <thead><tr>{["Id","DocNumber","CustomerRef.value","TxnDate","DueDate","TotalAmt","Balance","Lines"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {QB_INVOICES.map(inv=>(
                  <tr key={inv.Id}>
                    <td className="mono">{inv.Id}</td>
                    <td className="mono">{inv.DocNumber}</td>
                    <td className="mono" style={{ color:ACCENT }}>{inv.CustomerRef.value}</td>
                    <td className="mono">{inv.TxnDate}</td>
                    <td className="mono">{inv.DueDate}</td>
                    <td className="mono" style={{ color:ACCENT }}>${inv.TotalAmt.toLocaleString()}</td>
                    <td className="mono" style={{ color:inv.Balance>0?"#C8A040":DIM }}>${inv.Balance.toLocaleString()}</td>
                    <td>
                      <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
                        {inv.Line.map((l,i)=>(
                          <div key={i} style={{ fontSize:10,color:MID }}>{l.Description}: <span style={{ color:ACCENT }}>${l.Amount.toLocaleString()}</span></div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {view==="purchases" && (
            <table className="raw-table">
              <thead><tr>{["Id","DocNumber","Vendor","TxnDate","PaymentType","TotalAmt","Job (from Line)","Description"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {QB_PURCHASES.map(p=>(
                  <tr key={p.Id}>
                    <td className="mono">{p.Id}</td>
                    <td className="mono">{p.DocNumber}</td>
                    <td style={{ color:"#9AA8C8" }}>{p.EntityRef.name}</td>
                    <td className="mono">{p.TxnDate}</td>
                    <td><span className="tag">{p.PaymentType}</span></td>
                    <td className="mono" style={{ color:RED }}>${p.TotalAmt.toLocaleString()}</td>
                    <td className="mono" style={{ color:"#C8A040" }}>{p.Line[0]?.AccountBasedExpenseLineDetail?.CustomerRef?.value}</td>
                    <td style={{ color:MID,maxWidth:240 }}>{p.Line[0]?.Description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Data note */}
      <div style={{ marginTop:20,padding:"16px 20px",borderRadius:8,border:`1px solid rgba(184,240,74,0.15)`,background:"rgba(184,240,74,0.04)",fontSize:12,color:DIM,lineHeight:1.7 }}>
        <span style={{ color:ACCENT,fontWeight:600 }}>Note: </span>
        This is mock data structured to mirror real QuickBooks API responses. The key field to notice is <span style={{ color:ACCENT,fontFamily:"JetBrains Mono",fontSize:11 }}>AccountBasedExpenseLineDetail.CustomerRef.value</span> inside each Purchase Line — this is how QB links a cost to a specific job. The Dashboard and Job Detail tabs compute profitability by joining Invoices and Purchases on this field.
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [selectedJob, setSelectedJob] = useState(null);

  function handleJobClick(job) {
    setSelectedJob(job);
    setTab("detail");
  }

  return (
    <div style={{ fontFamily:"'Space Grotesk',sans-serif", background:BG, minHeight:"100vh", color:"#D0D4E8" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${BORDER}`, background:"rgba(12,14,19,0.95)", backdropFilter:"blur(8px)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ padding:"0 32px", display:"flex", alignItems:"center", gap:0 }}>
          <div style={{ marginRight:32, paddingTop:14, paddingBottom:14 }}>
            <div style={{ fontSize:10, letterSpacing:"0.2em", color:DIM, textTransform:"uppercase" }}>Contractor</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#D8DCF0", letterSpacing:"-0.01em" }}>Profit<span style={{ color:ACCENT }}>IQ</span></div>
          </div>
          {[
            { key:"dashboard", label:"Dashboard" },
            { key:"detail", label:"Job Detail" },
            { key:"chat", label:"AI Analyst" },
            { key:"raw", label:"Raw Data" },
          ].map(t=>(
            <div key={t.key} className={`nav-tab${tab===t.key?" active":""}`} onClick={()=>setTab(t.key)}>
              {t.label}
              {t.key==="detail" && selectedJob && <span style={{ marginLeft:8,fontSize:10,color:ACCENT }}>· {selectedJob.name.split(" ")[0]}</span>}
              {t.key==="chat" && <span style={{ marginLeft:6,fontSize:9,padding:"2px 6px",borderRadius:10,background:"rgba(184,240,74,0.15)",color:ACCENT }}>AI</span>}
            </div>
          ))}
          <div style={{ marginLeft:"auto",fontSize:10,color:DIM,display:"flex",alignItems:"center",gap:6 }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:ACCENT,boxShadow:`0 0 6px ${ACCENT}` }}/>
            Mock Data · QuickBooks format
          </div>
        </div>
      </div>

      {/* Content */}
      {tab==="dashboard" && <Dashboard onJobClick={handleJobClick}/>}
      {tab==="detail" && <JobDetail job={selectedJob} onBack={()=>setTab("dashboard")}/>}
      {tab==="chat" && <AIChat/>}
      {tab==="raw" && <RawData/>}
    </div>
  );
}
