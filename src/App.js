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
  { Id: "PUR001", DocNumber: "PO-201", EntityRef: { name: "BuildRight Supply Co" }, TxnDate: "2023-12-15", TotalAmt: 18500, PaymentType: "Check", Line: [{ Amount: 18500, Description: "Cabinets, countertops, hardware", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J001" } } }] },
  { Id: "PUR002", DocNumber: "PO-202", EntityRef: { name: "City Plumbing Wholesale" }, TxnDate: "2024-01-03", TotalAmt: 4200, PaymentType: "CreditCard", Line: [{ Amount: 4200, Description: "Plumbing fixtures & pipe", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J001" } } }] },
  { Id: "PUR003", DocNumber: "PO-203", EntityRef: { name: "FastSpark Electric" }, TxnDate: "2024-01-08", TotalAmt: 3800, PaymentType: "Check", Line: [{ Amount: 3800, Description: "Electrical sub - kitchen", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J001" } } }] },
  { Id: "PUR004", DocNumber: "PO-204", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-01-12", TotalAmt: 4700, PaymentType: "Check", Line: [{ Amount: 4700, Description: "Crew labor - framing & demo", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J001" } } }] },
  { Id: "PUR005", DocNumber: "PO-205", EntityRef: { name: "Tile & Stone Direct" }, TxnDate: "2024-01-10", TotalAmt: 6200, PaymentType: "CreditCard", Line: [{ Amount: 6200, Description: "Tile, grout, fixtures", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J002" } } }] },
  { Id: "PUR006", DocNumber: "PO-206", EntityRef: { name: "City Plumbing Wholesale" }, TxnDate: "2024-01-15", TotalAmt: 4800, PaymentType: "Check", Line: [{ Amount: 4800, Description: "Plumbing - bathroom addition", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J002" } } }] },
  { Id: "PUR007", DocNumber: "PO-207", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-01-22", TotalAmt: 8800, PaymentType: "Check", Line: [{ Amount: 8800, Description: "Labor - bathroom build", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J002" } } }] },
  { Id: "PUR008", DocNumber: "PO-208", EntityRef: { name: "Pacific Lumber Yard" }, TxnDate: "2024-01-28", TotalAmt: 4800, PaymentType: "CreditCard", Line: [{ Amount: 4800, Description: "Composite decking & lumber", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J003" } } }] },
  { Id: "PUR009", DocNumber: "PO-209", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-02-02", TotalAmt: 4100, PaymentType: "Check", Line: [{ Amount: 4100, Description: "Crew labor - deck build", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J003" } } }] },
  { Id: "PUR010", DocNumber: "PO-210", EntityRef: { name: "Commercial Floors Inc" }, TxnDate: "2024-02-01", TotalAmt: 28000, PaymentType: "Check", Line: [{ Amount: 28000, Description: "Commercial flooring - materials & install", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J004" } } }] },
  { Id: "PUR011", DocNumber: "PO-211", EntityRef: { name: "StructurePro LLC" }, TxnDate: "2024-02-05", TotalAmt: 22000, PaymentType: "Check", Line: [{ Amount: 22000, Description: "Partition walls & doors", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J004" } } }] },
  { Id: "PUR012", DocNumber: "PO-212", EntityRef: { name: "FastSpark Electric" }, TxnDate: "2024-02-08", TotalAmt: 31200, PaymentType: "Check", Line: [{ Amount: 31200, Description: "Electrical & data cabling - office", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J004" } } }] },
  { Id: "PUR013", DocNumber: "PO-213", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-02-10", TotalAmt: 10000, PaymentType: "Check", Line: [{ Amount: 10000, Description: "Crew - demo, paint, finishing", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J004" } } }] },
  { Id: "PUR014", DocNumber: "PO-214", EntityRef: { name: "Western Roofing Supply" }, TxnDate: "2024-02-14", TotalAmt: 7400, PaymentType: "CreditCard", Line: [{ Amount: 7400, Description: "Shingles, underlayment, flashing", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J005" } } }] },
  { Id: "PUR015", DocNumber: "PO-215", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-02-20", TotalAmt: 3800, PaymentType: "Check", Line: [{ Amount: 3800, Description: "Roofing crew labor", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J005" } } }] },
  { Id: "PUR016", DocNumber: "PO-216", EntityRef: { name: "BuildRight Supply Co" }, TxnDate: "2024-03-05", TotalAmt: 34000, PaymentType: "Check", Line: [{ Amount: 34000, Description: "Structural materials - full reno", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J006" } } }] },
  { Id: "PUR017", DocNumber: "PO-217", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-03-15", TotalAmt: 28000, PaymentType: "Check", Line: [{ Amount: 28000, Description: "Crew - 6 weeks full reno", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J006" } } }] },
  { Id: "PUR018", DocNumber: "PO-218", EntityRef: { name: "FastSpark Electric" }, TxnDate: "2024-03-20", TotalAmt: 18400, PaymentType: "Check", Line: [{ Amount: 18400, Description: "Full electrical rewire", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J006" } } }] },
  { Id: "PUR019", DocNumber: "PO-219", EntityRef: { name: "City Plumbing Wholesale" }, TxnDate: "2024-03-25", TotalAmt: 18000, PaymentType: "Check", Line: [{ Amount: 18000, Description: "Plumbing - full reno", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J006" } } }] },
  { Id: "PUR020", DocNumber: "PO-220", EntityRef: { name: "StructurePro LLC" }, TxnDate: "2024-03-01", TotalAmt: 9800, PaymentType: "Check", Line: [{ Amount: 9800, Description: "Foundation repair - materials & labor", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J007" } } }] },
  { Id: "PUR021", DocNumber: "PO-221", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-03-05", TotalAmt: 3600, PaymentType: "Check", Line: [{ Amount: 3600, Description: "Additional crew - excavation", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J007" } } }] },
  { Id: "PUR022", DocNumber: "PO-222", EntityRef: { name: "BuildRight Supply Co" }, TxnDate: "2024-03-10", TotalAmt: 8200, PaymentType: "CreditCard", Line: [{ Amount: 8200, Description: "Insulation, drywall, finishes", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J008" } } }] },
  { Id: "PUR023", DocNumber: "PO-223", EntityRef: { name: "FastSpark Electric" }, TxnDate: "2024-03-12", TotalAmt: 5800, PaymentType: "Check", Line: [{ Amount: 5800, Description: "Electrical & mini-split HVAC", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J008" } } }] },
  { Id: "PUR024", DocNumber: "PO-224", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-03-14", TotalAmt: 5700, PaymentType: "Check", Line: [{ Amount: 5700, Description: "Crew labor - garage conversion", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J008" } } }] },
  { Id: "PUR025", DocNumber: "PO-225", EntityRef: { name: "BuildRight Supply Co" }, TxnDate: "2024-04-03", TotalAmt: 22000, PaymentType: "Check", Line: [{ Amount: 22000, Description: "Framing, drywall, flooring materials", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J009" } } }] },
  { Id: "PUR026", DocNumber: "PO-226", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-04-08", TotalAmt: 18500, PaymentType: "Check", Line: [{ Amount: 18500, Description: "Crew - addition build", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J009" } } }] },
  { Id: "PUR027", DocNumber: "PO-227", EntityRef: { name: "City Plumbing Wholesale" }, TxnDate: "2024-04-10", TotalAmt: 9800, PaymentType: "Check", Line: [{ Amount: 9800, Description: "Plumbing - ensuite bathroom", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J009" } } }] },
  { Id: "PUR028", DocNumber: "PO-228", EntityRef: { name: "FastSpark Electric" }, TxnDate: "2024-04-12", TotalAmt: 6900, PaymentType: "Check", Line: [{ Amount: 6900, Description: "Electrical - master suite", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J009" } } }] },
  { Id: "PUR029", DocNumber: "PO-229", EntityRef: { name: "BuildRight Supply Co" }, TxnDate: "2024-03-18", TotalAmt: 12400, PaymentType: "CreditCard", Line: [{ Amount: 12400, Description: "Materials - full condo reno", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J010" } } }] },
  { Id: "PUR030", DocNumber: "PO-230", EntityRef: { name: "Direct Labor" }, TxnDate: "2024-03-22", TotalAmt: 11700, PaymentType: "Check", Line: [{ Amount: 11700, Description: "Crew labor - condo flip", AccountBasedExpenseLineDetail: { CustomerRef: { value: "J010" } } }] },
];

// ─── UNTAGGED TRANSACTIONS (no job assigned in QB) ────────────────────────────
// These mirror what real messy QuickBooks data looks like —
// expenses where the contractor forgot to link them to a job.

const INITIAL_UNTAGGED = [
  { id: "UNT001", docNumber: "PO-301", vendor: "BuildRight Supply Co", date: "2024-01-18", amount: 3200, description: "Lumber - 2x4 framing stock", paymentType: "CreditCard", suggestedJob: "J001", suggestionReason: "Last 3 BuildRight purchases were tagged to Kitchen Remodel" },
  { id: "UNT002", docNumber: "PO-302", vendor: "Direct Labor", date: "2024-02-06", amount: 2800, description: "Crew overtime - weekend work", paymentType: "Check", suggestedJob: "J003", suggestionReason: "Only active job during this period was Elmwood Deck Build" },
  { id: "UNT003", docNumber: "PO-303", vendor: "FastSpark Electric", date: "2024-02-19", amount: 1650, description: "Panel upgrade materials", paymentType: "Check", suggestedJob: null, suggestionReason: null },
  { id: "UNT004", docNumber: "PO-304", vendor: "City Plumbing Wholesale", date: "2024-03-02", amount: 4100, description: "PVC pipe & fittings - bulk order", paymentType: "CreditCard", suggestedJob: "J006", suggestionReason: "City Plumbing purchases in March were tagged to Maplewood Full Reno" },
  { id: "UNT005", docNumber: "PO-305", vendor: "Pacific Lumber Yard", date: "2024-03-09", amount: 1875, description: "Treated lumber & hardware", paymentType: "Check", suggestedJob: null, suggestionReason: null },
  { id: "UNT006", docNumber: "PO-306", vendor: "Direct Labor", date: "2024-03-17", amount: 3400, description: "Subcontractor - drywall finish", paymentType: "Check", suggestedJob: "J006", suggestionReason: "Only active job during this period was Maplewood Full Reno" },
  { id: "UNT007", docNumber: "PO-307", vendor: "Western Roofing Supply", date: "2024-03-28", amount: 2200, description: "Flashing & sealant materials", paymentType: "CreditCard", suggestedJob: null, suggestionReason: null },
  { id: "UNT008", docNumber: "PO-308", vendor: "BuildRight Supply Co", date: "2024-04-05", amount: 5800, description: "Flooring materials - engineered hardwood", paymentType: "Check", suggestedJob: "J009", suggestionReason: "Last 2 BuildRight purchases in April were tagged to Lakeview Master Suite" },
  { id: "UNT009", docNumber: "PO-309", vendor: "StructurePro LLC", date: "2024-04-09", amount: 6500, description: "Steel beam & hardware", paymentType: "Check", suggestedJob: null, suggestionReason: null },
  { id: "UNT010", docNumber: "PO-310", vendor: "Direct Labor", date: "2024-04-14", amount: 2100, description: "Crew - cleanup & punch list", paymentType: "Check", suggestedJob: "J009", suggestionReason: "Only active job during this period was Lakeview Master Suite" },
  { id: "UNT011", docNumber: "PO-311", vendor: "Tile & Stone Direct", date: "2024-01-25", amount: 980, description: "Grout & adhesive - misc", paymentType: "CreditCard", suggestedJob: "J002", suggestionReason: "Tile & Stone purchases in January were tagged to Bathroom Addition" },
  { id: "UNT012", docNumber: "PO-312", vendor: "FastSpark Electric", date: "2024-04-16", amount: 1440, description: "Wire & conduit - bulk", paymentType: "Check", suggestedJob: null, suggestionReason: null },
];

// ─── JOB META ─────────────────────────────────────────────────────────────────

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

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const $ = n => `$${Math.abs(n).toLocaleString()}`;
const $k = n => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return abs >= 1000 ? `${sign}$${(abs/1000).toFixed(1)}k` : `${sign}$${abs}`;
};

// Earth-tone palette — warm, professional, non-tech
const ACCENT = "#7A6B4E";   // warm walnut brown (primary action)
const ACCENT2 = "#5C7A5A";  // sage green (profit / positive)
const RED    = "#8C4040";   // muted terracotta red
const AMBER  = "#8C6B30";   // burnished amber
const BG     = "#F5F0E8";   // warm parchment
const BG2    = "#EDE8DC";   // slightly deeper parchment
const CARD   = "#FDFAF5";   // off-white card
const BORDER = "#DDD5C4";   // warm taupe border
const DIM    = "#A89880";   // muted warm grey
const MID    = "#6B5E4E";   // medium walnut
const DARK   = "#2C2416";   // deep walnut text

// ─── BUILD JOB SUMMARIES (reactive — takes extraCosts from tagged inbox items) ─

function buildJobSummaries(extraCostsByJob = {}) {
  const jobs = QB_CUSTOMERS.filter(c => c.Job);
  return jobs.map(job => {
    const invoices = QB_INVOICES.filter(i => i.CustomerRef.value === job.Id);
    const purchases = QB_PURCHASES.filter(p =>
      p.Line.some(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.Id)
    );
    const revenue = invoices.reduce((s, i) => s + i.TotalAmt, 0);
    const baseCosts = purchases.reduce((s, p) =>
      s + p.Line.filter(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.Id)
               .reduce((ls, l) => ls + l.Amount, 0), 0);
    const inboxCosts = extraCostsByJob[job.Id] || 0;
    const costs = baseCosts + inboxCosts;
    const client = QB_CUSTOMERS.find(c => c.Id === job.ParentRef?.value);
    const allDates = invoices.map(i => i.TxnDate).sort();
    const costByVendor = {};
    purchases.forEach(p => {
      p.Line.filter(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.Id).forEach(l => {
        costByVendor[p.EntityRef.name] = (costByVendor[p.EntityRef.name] || 0) + l.Amount;
      });
    });
    return {
      id: job.Id, name: job.DisplayName, clientName: client?.DisplayName || "",
      ...JOB_META[job.Id], revenue, costs,
      profit: revenue - costs,
      marginPct: revenue > 0 ? (((revenue - costs) / revenue) * 100).toFixed(1) : "0.0",
      invoices, purchases, firstDate: allDates[0] || "",
      lastDate: allDates[allDates.length - 1] || "",
      costByVendor, outstanding: invoices.reduce((s, i) => s + i.Balance, 0),
    };
  });
}

const MONTHLY_TREND = [
  { month: "Sep '23", date: "2023-09-01", revenue: 38000, costs: 29000 },
  { month: "Oct '23", date: "2023-10-01", revenue: 52000, costs: 44000 },
  { month: "Nov '23", date: "2023-11-01", revenue: 61000, costs: 48000 },
  { month: "Dec '23", date: "2023-12-01", revenue: 29000, costs: 22000 },
  { month: "Jan '24", date: "2024-01-01", revenue: 70500, costs: 51000 },
  { month: "Feb '24", date: "2024-02-01", revenue: 120100, costs: 110400 },
  { month: "Mar '24", date: "2024-03-01", revenue: 98800, costs: 57200 },
  { month: "Apr '24", date: "2024-04-01", revenue: 55000, costs: 57200 },
].map(d => ({ ...d, profit: d.revenue - d.costs }));

// Date range options — "All" is handled separately as a standalone button
const DATE_RANGES = [
  { key: "30d",  label: "30 days",   months: 1  },
  { key: "90d",  label: "90 days",   months: 3  },
  { key: "6m",   label: "6 months",  months: 6  },
  { key: "12m",  label: "12 months", months: 12 },
  { key: "ytd",  label: "YTD",       months: null }, // special case
];

// Reference "today" as end of our mock data period
const MOCK_TODAY = new Date("2024-04-30");

function getDateCutoff(rangeKey) {
  if (!rangeKey || rangeKey === "all") return null;
  if (rangeKey === "ytd") return new Date("2024-01-01");
  const range = DATE_RANGES.find(r => r.key === rangeKey);
  if (!range) return null;
  const cutoff = new Date(MOCK_TODAY);
  cutoff.setMonth(cutoff.getMonth() - range.months);
  return cutoff;
}

function filterJobsByDate(jobs, rangeKey) {
  const cutoff = getDateCutoff(rangeKey);
  if (!cutoff) return jobs;
  return jobs.map(job => {
    const filteredInvoices = job.invoices.filter(inv => new Date(inv.TxnDate) >= cutoff);
    const filteredPurchases = job.purchases.filter(p => new Date(p.TxnDate) >= cutoff);
    const revenue = filteredInvoices.reduce((s,i) => s + i.TotalAmt, 0);
    const costs   = filteredPurchases.reduce((s,p) =>
      s + p.Line.filter(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.id)
               .reduce((ls,l) => ls + l.Amount, 0), 0);
    const costByVendor = {};
    filteredPurchases.forEach(p => {
      p.Line.filter(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.id).forEach(l => {
        costByVendor[p.EntityRef.name] = (costByVendor[p.EntityRef.name] || 0) + l.Amount;
      });
    });
    return {
      ...job,
      invoices: filteredInvoices,
      purchases: filteredPurchases,
      revenue, costs,
      profit: revenue - costs,
      marginPct: revenue > 0 ? (((revenue - costs) / revenue) * 100).toFixed(1) : "0.0",
      outstanding: filteredInvoices.reduce((s,i) => s + i.Balance, 0),
      costByVendor,
    };
  }).filter(job => job.revenue > 0 || job.costs > 0);
}

function filterTrendByDate(trend, rangeKey) {
  const cutoff = getDateCutoff(rangeKey);
  if (!cutoff) return trend;
  return trend.filter(d => new Date(d.date) >= cutoff);
}

const JOB_OPTIONS = QB_CUSTOMERS.filter(c => c.Job).map(j => ({
  value: j.Id,
  label: j.DisplayName,
  client: QB_CUSTOMERS.find(c => c.Id === j.ParentRef?.value)?.DisplayName || "",
}));

// ─── STYLES ──────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:${BG}; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:${BG2}; }
  ::-webkit-scrollbar-thumb { background:${BORDER}; border-radius:3px; }
  .nav-tab { cursor:pointer; padding:14px 22px; font-size:13px; font-weight:400; font-family:'DM Sans',sans-serif; letter-spacing:0.01em; border-bottom:2px solid transparent; color:${DIM}; transition:all 0.2s; white-space:nowrap; position:relative; }
  .nav-tab:hover { color:${MID}; }
  .nav-tab.active { color:${DARK}; border-bottom-color:${ACCENT}; font-weight:500; }
  .badge { display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:9px;font-size:9px;font-weight:600;background:${AMBER};color:#FDF8F0;margin-left:7px;line-height:1;font-family:'DM Sans',sans-serif; }
  .badge.done { background:rgba(92,122,90,0.15);color:${ACCENT2}; }
  .kpi { background:${CARD}; border:1px solid ${BORDER}; border-radius:6px; padding:22px 26px; box-shadow:0 1px 3px rgba(44,36,22,0.06); }
  .kpi.hi { border-color:rgba(92,122,90,0.35); background:linear-gradient(135deg,${CARD},#F0F5EF); }
  .chip { display:inline-flex;align-items:center;padding:3px 10px;border-radius:3px;font-size:11px;font-weight:500;font-family:'DM Sans',sans-serif;letter-spacing:0.02em; }
  .chip.g { background:rgba(92,122,90,0.1);color:${ACCENT2}; }
  .chip.r { background:rgba(140,64,64,0.09);color:${RED}; }
  .chip.a { background:rgba(140,107,48,0.1);color:${AMBER}; }
  .trow { display:grid;border-bottom:1px solid ${BORDER};cursor:pointer;transition:background 0.12s; }
  .trow:hover { background:${BG2}; }
  .tcell { padding:14px 18px;font-size:13px;display:flex;align-items:center;font-family:'DM Sans',sans-serif; }
  .thead { display:grid;background:${BG2};border-bottom:1px solid ${BORDER}; }
  .th { padding:10px 18px;font-size:9px;letter-spacing:0.12em;color:${DIM};text-transform:uppercase;font-family:'DM Sans',sans-serif;font-weight:500; }
  .btn { cursor:pointer;padding:7px 16px;border-radius:4px;font-size:11px;font-weight:500;letter-spacing:0.04em;transition:all 0.15s;border:1px solid ${BORDER};color:${MID};background:${CARD};font-family:'DM Sans',sans-serif; }
  .btn:hover { border-color:${ACCENT};color:${ACCENT}; }
  .btn.act { border-color:${ACCENT};color:${CARD};background:${ACCENT}; }
  .btn.red { border-color:rgba(140,64,64,0.3);color:${RED};background:transparent; }
  .btn.red:hover { border-color:${RED};background:rgba(140,64,64,0.06); }
  .card { background:${CARD};border:1px solid ${BORDER};border-radius:6px;box-shadow:0 1px 4px rgba(44,36,22,0.05); }
  .mono { font-family:'DM Mono',monospace; }
  .chat-bubble-user { background:${BG2};border:1px solid ${BORDER};border-radius:12px 12px 3px 12px;padding:12px 16px;font-size:13px;color:${DARK};max-width:80%;align-self:flex-end;font-family:'DM Sans',sans-serif; }
  .chat-bubble-ai { background:${CARD};border:1px solid ${BORDER};border-radius:12px 12px 12px 3px;padding:14px 18px;font-size:13px;color:${MID};max-width:88%;align-self:flex-start;line-height:1.7;font-family:'DM Sans',sans-serif; }
  .chat-input { background:${CARD};border:1px solid ${BORDER};border-radius:5px;padding:12px 16px;color:${DARK};font-size:13px;width:100%;font-family:'DM Sans',sans-serif;outline:none;transition:border 0.15s; }
  .chat-input:focus { border-color:${ACCENT}; }
  .raw-table { width:100%;border-collapse:collapse; }
  .raw-table th { padding:10px 16px;font-size:9px;letter-spacing:0.12em;color:${DIM};text-transform:uppercase;background:${BG2};border-bottom:1px solid ${BORDER};text-align:left;white-space:nowrap;font-family:'DM Sans',sans-serif;font-weight:500; }
  .raw-table td { padding:11px 16px;font-size:12px;color:${MID};border-bottom:1px solid ${BORDER};white-space:nowrap;font-family:'DM Sans',sans-serif; }
  .raw-table tr:hover td { background:${BG2}; }
  .raw-table td.mono { color:${ACCENT};font-size:11px; }
  .tag { display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:500;background:${BG2};color:${DIM};border:1px solid ${BORDER};font-family:'DM Sans',sans-serif; }
  .thinking { display:flex;gap:5px;align-items:center;padding:4px 0; }
  .thinking span { width:6px;height:6px;border-radius:50%;background:${ACCENT};animation:bounce 1.2s infinite;opacity:0.6; }
  .thinking span:nth-child(2) { animation-delay:0.2s; }
  .thinking span:nth-child(3) { animation-delay:0.4s; }
  .inbox-row { background:${CARD};border:1px solid ${BORDER};border-radius:6px;padding:20px 22px;transition:all 0.15s;box-shadow:0 1px 3px rgba(44,36,22,0.04); }
  .inbox-row:hover { border-color:${DIM}; box-shadow:0 2px 8px rgba(44,36,22,0.08); }
  .inbox-row.tagged { border-color:rgba(92,122,90,0.4);background:rgba(92,122,90,0.03); }
  .job-select { background:${CARD};border:1px solid ${BORDER};border-radius:4px;padding:9px 12px;color:${DARK};font-size:12px;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer;transition:border 0.15s;width:100%; }
  .job-select:focus { border-color:${ACCENT}; }
  .suggestion-pill { display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11px;background:rgba(140,107,48,0.08);color:${AMBER};border:1px solid rgba(140,107,48,0.2);cursor:pointer;transition:all 0.15s;font-family:'DM Sans',sans-serif; }
  .suggestion-pill:hover { background:rgba(140,107,48,0.14); }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:0.3} 30%{transform:translateY(-5px);opacity:0.8} }
  @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .slide-in { animation:slideIn 0.2s ease; }
`;

// ─── CHART TOOLTIP ────────────────────────────────────────────────────────────

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:5,padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:11,boxShadow:"0 4px 12px rgba(44,36,22,0.12)" }}>
      <div style={{ color:DIM,marginBottom:6,fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase" }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color,marginBottom:3 }}>{p.name}: {$(p.value)}</div>)}
    </div>
  );
};

// ─── TAB: DASHBOARD ───────────────────────────────────────────────────────────

function Dashboard({ onJobClick, jobSummaries }) {
  const [sort, setSort]       = useState("profit");
  const [dateRange, setDateRange] = useState("all"); // "all" | "30d" | "90d" | "6m" | "12m" | "ytd"

  // Apply date filter to both jobs and trend
  const filteredJobs  = dateRange === "all" ? jobSummaries : filterJobsByDate(jobSummaries, dateRange);
  const filteredTrend = dateRange === "all" ? MONTHLY_TREND : filterTrendByDate(MONTHLY_TREND, dateRange);

  const sorted      = [...filteredJobs].sort((a,b) => {
    if (sort==="profit") return b.profit - a.profit;
    if (sort==="margin") return parseFloat(b.marginPct) - parseFloat(a.marginPct);
    return b.revenue - a.revenue;
  });
  const totalRev    = filteredJobs.reduce((s,j) => s + j.revenue, 0);
  const totalCost   = filteredJobs.reduce((s,j) => s + j.costs, 0);
  const totalProfit = totalRev - totalCost;
  const winners     = filteredJobs.filter(j => j.profit > 0).length;
  const losers      = filteredJobs.filter(j => j.profit <= 0).length;
  const outstanding = filteredJobs.reduce((s,j) => s + j.outstanding, 0);
  const barData     = sorted.map(j => ({ name: j.name.length>16?j.name.slice(0,16)+"…":j.name, fullName:j.name, profit:j.profit }));

  // Label shown under the page title
  const rangeLabel = dateRange === "all"
    ? "All jobs · Sep 2023 – Apr 2024"
    : `${DATE_RANGES.find(r=>r.key===dateRange)?.label} · ${filteredJobs.length} job${filteredJobs.length!==1?"s":""}`;

  return (
    <div style={{ padding:"32px 36px", background:BG, minHeight:"100vh" }}>

      {/* Page title + date slicer */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:DARK,letterSpacing:"-0.01em" }}>Job Profitability Overview</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginTop:4 }}>{rangeLabel}</p>
        </div>

        {/* Date slicer */}
        <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:4 }}>
          {/* Segmented toggle for time windows */}
          <div style={{ display:"flex",border:`1px solid ${BORDER}`,borderRadius:5,overflow:"hidden",background:CARD }}>
            {DATE_RANGES.map((r,i) => (
              <button
                key={r.key}
                onClick={()=>setDateRange(r.key)}
                style={{
                  cursor:"pointer",
                  padding:"7px 13px",
                  fontSize:11,
                  fontWeight:500,
                  fontFamily:"'DM Sans',sans-serif",
                  letterSpacing:"0.03em",
                  border:"none",
                  borderRight: i < DATE_RANGES.length-1 ? `1px solid ${BORDER}` : "none",
                  background: dateRange===r.key ? ACCENT : CARD,
                  color: dateRange===r.key ? CARD : MID,
                  transition:"all 0.15s",
                }}
              >{r.label}</button>
            ))}
          </div>

          {/* Separate "All" button */}
          <button
            onClick={()=>setDateRange("all")}
            style={{
              cursor:"pointer",
              padding:"7px 14px",
              fontSize:11,
              fontWeight:500,
              fontFamily:"'DM Sans',sans-serif",
              letterSpacing:"0.03em",
              border:`1px solid ${BORDER}`,
              borderRadius:5,
              background: dateRange==="all" ? DARK : CARD,
              color: dateRange==="all" ? CARD : MID,
              transition:"all 0.15s",
            }}
          >All</button>
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28 }}>
        {[
          { label:"Total Revenue",    val:$(totalRev),    sub:"all jobs billed",                         hi:false },
          { label:"Total Profit",     val:$(totalProfit), sub:totalRev>0?`${((totalProfit/totalRev)*100).toFixed(1)}% overall margin`:"no revenue", hi:true },
          { label:"Jobs Profitable",  val:`${winners} of ${filteredJobs.length}`, sub:"in the green",    hi:false },
          { label:"Outstanding A/R",  val:$(outstanding), sub:`${losers} job${losers!==1?"s":""} losing money`, hi:false },
        ].map((k,i) => (
          <div key={i} className={`kpi${k.hi?" hi":""}`}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:12,fontWeight:500 }}>{k.label}</div>
            <div style={{ fontFamily:"'Lora',serif",fontSize:28,fontWeight:500,color:k.hi?ACCENT2:DARK,letterSpacing:"-0.01em" }}>{k.val}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM,marginTop:6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:28 }}>
        <div className="card" style={{ padding:"22px 26px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:5,fontWeight:500 }}>Profit by Job</div>
              <div style={{ fontFamily:"'Lora',serif",fontSize:14,color:MID,fontStyle:"italic" }}>Which jobs made money?</div>
            </div>
            <div style={{ display:"flex",gap:6 }}>
              {[["profit","$ Profit"],["margin","% Margin"],["revenue","Revenue"]].map(([k,l]) => (
                <button key={k} className={`btn${sort===k?" act":""}`} onClick={()=>setSort(k)}>{l}</button>
              ))}
            </div>
          </div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top:4,right:4,left:12,bottom:0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize:9,fill:DIM,fontFamily:"DM Mono" }} angle={-40} textAnchor="end" interval={0} height={80}/>
                <YAxis tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} tickFormatter={$k} axisLine={false} tickLine={false} width={52}/>
                <Tooltip content={({ active,payload }) => {
                  if (!active||!payload?.length) return null;
                  const d = payload[0].payload;
                  return <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:5,padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:11,boxShadow:"0 4px 12px rgba(44,36,22,0.12)" }}>
                    <div style={{ color:DIM,marginBottom:4,fontFamily:"'DM Sans',sans-serif",fontSize:10 }}>{d.fullName}</div>
                    <div style={{ color:d.profit>=0?ACCENT2:RED,fontSize:14,fontWeight:600 }}>{d.profit>=0?"+":"-"}{$(d.profit)}</div>
                  </div>;
                }}/>
                <ReferenceLine y={0} stroke={BORDER}/>
                <Bar dataKey="profit" radius={[3,3,0,0]}>
                  {barData.map((e,i) => <Cell key={i} fill={e.profit>=0?ACCENT2:RED} opacity={0.85}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:280,display:"flex",alignItems:"center",justifyContent:"center",color:DIM,fontSize:13,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic" }}>No jobs in this period</div>
          )}
        </div>

        <div className="card" style={{ padding:"22px 26px" }}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:5,fontWeight:500 }}>Monthly Trend</div>
            <div style={{ fontFamily:"'Lora',serif",fontSize:14,color:MID,fontStyle:"italic" }}>How is profitability tracking?</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={filteredTrend} margin={{ top:4,right:16,left:12,bottom:0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false}/>
              <XAxis dataKey="month" tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} axisLine={false} tickLine={false} height={40}/>
              <YAxis tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} tickFormatter={$k} axisLine={false} tickLine={false} width={52}/>
              <Tooltip content={ChartTip}/>
              <Line type="monotone" dataKey="revenue" stroke={DIM} strokeWidth={1.5} dot={false} name="Revenue"/>
              <Line type="monotone" dataKey="costs" stroke={RED} strokeWidth={1.5} dot={false} name="Costs" strokeDasharray="4 2"/>
              <Line type="monotone" dataKey="profit" stroke={ACCENT2} strokeWidth={2.5} dot={{ r:3,fill:ACCENT2 }} name="Profit"/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display:"flex",gap:20,marginTop:12,justifyContent:"flex-end" }}>
            {[["Revenue",DIM,false],["Costs",RED,true],["Profit",ACCENT2,false]].map(([l,c,d]) => (
              <div key={l} style={{ display:"flex",alignItems:"center",gap:6,fontSize:10,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>
                <div style={{ width:16,height:2,background:d?"transparent":c,borderRadius:2,borderBottom:d?`2px dashed ${c}`:"none" }}/>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ padding:"18px 20px",borderBottom:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:BG }}>
          <div style={{ fontFamily:"'Lora',serif",fontSize:14,color:MID,fontStyle:"italic" }}>
            {filteredJobs.length > 0 ? `${filteredJobs.length} job${filteredJobs.length!==1?"s":""} — click any row to see the full breakdown` : "No jobs in this period"}
          </div>
          <div style={{ display:"flex",gap:16,alignItems:"center",fontSize:10,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ display:"flex",alignItems:"center",gap:5 }}><span style={{ width:8,height:8,borderRadius:"50%",background:ACCENT2,display:"inline-block" }}/> Profitable</span>
            <span style={{ display:"flex",alignItems:"center",gap:5 }}><span style={{ width:8,height:8,borderRadius:"50%",background:RED,display:"inline-block" }}/> Losing Money</span>
          </div>
        </div>
        <div className="thead" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 90px" }}>
          {["Job Name","Client","Revenue","Costs","Profit / Loss","Status"].map(h => <div key={h} className="th">{h}</div>)}
        </div>
        {sorted.length > 0 ? sorted.map(j => {
          const win = j.profit > 0;
          return (
            <div key={j.id} className="trow" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 90px",borderLeft:`3px solid ${win?ACCENT2:RED}`,opacity: win?1:0.92 }} onClick={()=>onJobClick(j)}>
              <div className="tcell" style={{ flexDirection:"column",alignItems:"flex-start",gap:3 }}>
                <span style={{ color:DARK,fontWeight:500,fontFamily:"'DM Sans',sans-serif" }}>{j.name}</span>
                <span style={{ fontSize:10,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>{j.type}</span>
              </div>
              <div className="tcell" style={{ color:MID,fontFamily:"'DM Sans',sans-serif" }}>{j.clientName}</div>
              <div className="tcell mono" style={{ color:MID,fontSize:12 }}>{$(j.revenue)}</div>
              <div className="tcell mono" style={{ color:MID,fontSize:12 }}>{$(j.costs)}</div>
              <div className="tcell"><span className={`chip ${win?"g":"r"}`}>{win?"+":"-"}{$(j.profit)} ({j.marginPct}%)</span></div>
              <div className="tcell" style={{ fontSize:11,color:j.status==="Complete"?DIM:AMBER,letterSpacing:"0.03em",fontFamily:"'DM Sans',sans-serif" }}>
                {j.status==="Complete"?"Complete":"● Active"}
              </div>
            </div>
          );
        }) : (
          <div style={{ padding:"40px 20px",textAlign:"center",color:DIM,fontSize:13,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic" }}>
            No jobs had activity in this period
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB: EXPENSE INBOX ───────────────────────────────────────────────────────

function ExpenseInbox({ untagged, onTag, onDismiss, tagged }) {
  const [selections, setSelections] = useState({});
  const [filter, setFilter] = useState("all");
  const [showSyncGuide, setShowSyncGuide] = useState(false);

  const totalUntagged = untagged.reduce((s,u) => s + u.amount, 0);
  const totalTagged   = tagged.reduce((s,t) => s + t.amount, 0);
  const needsQBSync   = tagged.length;

  function handleApplySuggestion(item) {
    setSelections(prev => ({ ...prev, [item.id]: item.suggestedJob }));
  }

  function handleConfirm(item) {
    const jobId = selections[item.id];
    if (!jobId) return;
    const job = JOB_OPTIONS.find(j => j.value === jobId);
    onTag(item, jobId, job?.label || "");
  }

  const visibleUntagged = filter === "suggested"
    ? untagged.filter(u => u.suggestedJob)
    : untagged;

  const SYNC_STEPS = [
    {
      num: "1",
      title: "Open QuickBooks Online",
      body: "Log in at quickbooks.intuit.com. Make sure you're in the correct company file — the same one connected to ProfitIQ.",
    },
    {
      num: "2",
      title: "Go to Expenses",
      body: "In the left sidebar, click Expenses → Expenses. This shows all recorded expenses and bills.",
    },
    {
      num: "3",
      title: "Find the transaction",
      body: "Use the date and vendor name from ProfitIQ to locate the expense in the list. You can use the search bar or filter by date range to narrow it down quickly.",
    },
    {
      num: "4",
      title: "Open and edit it",
      body: "Click the expense to open it. Look for the Customer/Project field — this is the field that links an expense to a job. It may be blank or set to the wrong job.",
    },
    {
      num: "5",
      title: "Assign it to the correct job",
      body: "Click the Customer/Project field and select the job from the dropdown. Match it to what you tagged in ProfitIQ. Make sure 'Billable' is unchecked unless you plan to pass the cost to the client.",
    },
    {
      num: "6",
      title: "Save",
      body: "Click Save and Close. QuickBooks will now show this expense linked to that job. On the next nightly sync, ProfitIQ will pick up the clean tag directly from QuickBooks.",
    },
  ];

  return (
    <div style={{ padding:"32px 36px",background:BG,minHeight:"100vh" }}>

      {/* QB Sync Guide Modal */}
      {showSyncGuide && (
        <div style={{ position:"fixed",inset:0,background:"rgba(44,36,22,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }} onClick={()=>setShowSyncGuide(false)}>
          <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:8,width:"100%",maxWidth:580,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(44,36,22,0.2)" }} onClick={e=>e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ padding:"24px 28px",borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"flex-start",justifyContent:"space-between" }}>
              <div>
                <h2 style={{ fontFamily:"'Lora',serif",fontSize:18,fontWeight:500,color:DARK,letterSpacing:"-0.01em",marginBottom:4 }}>QuickBooks Sync Guide</h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM }}>How to update tags in QuickBooks so your accountant sees clean books.</p>
              </div>
              <button onClick={()=>setShowSyncGuide(false)} style={{ background:"none",border:"none",cursor:"pointer",color:DIM,fontSize:20,lineHeight:1,padding:"2px 6px",fontFamily:"inherit" }}>×</button>
            </div>

            {/* Why it matters callout */}
            <div style={{ margin:"20px 28px 0",padding:"14px 18px",borderRadius:5,background:"rgba(140,107,48,0.07)",border:`1px solid rgba(140,107,48,0.2)` }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:AMBER,fontWeight:500,marginBottom:4 }}>Why bother updating QuickBooks?</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID,lineHeight:1.6 }}>Tags you apply in ProfitIQ update your dashboard instantly — but they live only here. Your accountant, tax preparer, and QuickBooks reports won't see them unless you update QB directly. It takes about 2 minutes per expense.</div>
            </div>

            {/* Steps */}
            <div style={{ padding:"20px 28px",display:"flex",flexDirection:"column",gap:16 }}>
              {SYNC_STEPS.map((step,i) => (
                <div key={i} style={{ display:"flex",gap:16,alignItems:"flex-start" }}>
                  <div style={{ width:28,height:28,borderRadius:"50%",background:"rgba(92,122,90,0.12)",border:`1px solid rgba(92,122,90,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'DM Mono',monospace",fontSize:11,color:ACCENT2,fontWeight:500,marginTop:1 }}>{step.num}</div>
                  <div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:DARK,marginBottom:4 }}>{step.title}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID,lineHeight:1.65 }}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pro tip */}
            <div style={{ margin:"0 28px 20px",padding:"14px 18px",borderRadius:5,background:BG2,border:`1px solid ${BORDER}` }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:ACCENT,fontWeight:500,marginBottom:4 }}>Pro tip</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID,lineHeight:1.6 }}>Batch your QB updates once a week rather than one at a time. Set aside 15 minutes every Monday to clear the previous week's untagged expenses in both ProfitIQ and QuickBooks at the same time.</div>
            </div>

            {/* Footer */}
            <div style={{ padding:"16px 28px",borderTop:`1px solid ${BORDER}`,display:"flex",justifyContent:"flex-end" }}>
              <button className="btn act" onClick={()=>setShowSyncGuide(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:DARK,letterSpacing:"-0.01em" }}>Expense Inbox</h1>
        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginTop:4 }}>Expenses without a job assigned in QuickBooks. Tag them to keep profit numbers accurate.</p>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28 }}>
        {[
          { label:"Untagged Expenses", val:untagged.length, sub:$(totalUntagged)+" unallocated", color:untagged.length>0?AMBER:ACCENT2 },
          { label:"Tagged This Session", val:tagged.length, sub:$(totalTagged)+" now allocated", color:ACCENT2 },
          { label:"Data Quality Score", val:untagged.length===0?"100%":`${Math.round((30/(30+untagged.length))*100)}%`, sub:"of expenses linked to jobs", color:untagged.length===0?ACCENT2:AMBER },
          { label:"Needs QB Sync", val:needsQBSync, sub:"tags not yet in QuickBooks", color:needsQBSync>0?MID:DIM },
        ].map((k,i) => (
          <div key={i} className="kpi">
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:12,fontWeight:500 }}>{k.label}</div>
            <div style={{ fontFamily:"'Lora',serif",fontSize:28,fontWeight:500,color:k.color }}>{k.val}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM,marginTop:6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* QB Sync nudge */}
      {tagged.length > 0 && (
        <div style={{ marginBottom:24,padding:"16px 22px",borderRadius:5,border:`1px solid rgba(140,107,48,0.25)`,background:"rgba(140,107,48,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ fontSize:13,color:AMBER,fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ fontWeight:500 }}>{tagged.length} expense{tagged.length!==1?"s":""} tagged in ProfitIQ</span>
            <span style={{ color:MID,marginLeft:8 }}>— these tags live here for now. Consider updating them in QuickBooks so your accountant sees clean books.</span>
          </div>
          <button className="btn" style={{ borderColor:"rgba(140,107,48,0.3)",color:AMBER,whiteSpace:"nowrap",marginLeft:16 }} onClick={()=>setShowSyncGuide(true)}>
            View QB Sync Guide →
          </button>
        </div>
      )}

      {/* Untagged section */}
      {untagged.length > 0 ? (
        <div style={{ marginBottom:36 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",fontWeight:500 }}>Needs Your Attention — {untagged.length} items</div>
            <div style={{ display:"flex",gap:8 }}>
              {[["all","All"],["suggested","Has Suggestion"]].map(([k,l]) => (
                <button key={k} className={`btn${filter===k?" act":""}`} onClick={()=>setFilter(k)}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {visibleUntagged.map(item => (
              <div key={item.id} className="inbox-row slide-in">
                <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:20,alignItems:"start" }}>
                  <div>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap" }}>
                      <span style={{ fontWeight:500,color:DARK,fontSize:13,fontFamily:"'DM Sans',sans-serif" }}>{item.vendor}</span>
                      <span className="mono" style={{ fontSize:10,color:DIM }}>{item.docNumber}</span>
                      <span className="mono" style={{ fontSize:10,color:DIM }}>{item.date}</span>
                      <span className="tag">{item.paymentType}</span>
                    </div>
                    <div style={{ fontSize:12,color:MID,marginBottom:12,fontFamily:"'DM Sans',sans-serif" }}>{item.description}</div>
                    {item.suggestedJob && (
                      <div className="suggestion-pill" onClick={() => handleApplySuggestion(item)} title="Click to apply this suggestion">
                        <span>→</span>
                        <span>{item.suggestionReason} — click to apply</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10,minWidth:280 }}>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:500,color:RED }}>–{$(item.amount)}</div>
                    <div style={{ display:"flex",gap:8,width:"100%" }}>
                      <select className="job-select" value={selections[item.id] || ""} onChange={e => setSelections(prev => ({ ...prev, [item.id]: e.target.value }))}>
                        <option value="">Assign to a job...</option>
                        {JOB_OPTIONS.map(j => (
                          <option key={j.value} value={j.value}>{j.label} ({j.client})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display:"flex",gap:8 }}>
                      <button className="btn red" onClick={() => onDismiss(item.id)}>Dismiss</button>
                      <button className={`btn${selections[item.id]?" act":""}`} onClick={() => handleConfirm(item)} disabled={!selections[item.id]} style={{ opacity:selections[item.id]?1:0.45 }}>Confirm →</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign:"center",padding:"60px 40px",background:CARD,borderRadius:6,border:`1px solid rgba(92,122,90,0.25)`,marginBottom:36,boxShadow:"0 1px 4px rgba(44,36,22,0.05)" }}>
          <div style={{ fontFamily:"'Lora',serif",fontSize:20,color:ACCENT2,marginBottom:8 }}>All expenses accounted for</div>
          <div style={{ fontSize:13,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>Your profit numbers are fully accurate.</div>
        </div>
      )}

      {/* Tagged section */}
      {tagged.length > 0 && (
        <div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:14,fontWeight:500 }}>Tagged This Session — {tagged.length} expense{tagged.length!==1?"s":""}, {$(totalTagged)} allocated</div>
          <div className="card" style={{ overflow:"hidden" }}>
            <table className="raw-table">
              <thead><tr>{["Date","Doc #","Vendor","Description","Amount","Tagged To","Source"].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {tagged.map((t,i) => (
                  <tr key={i}>
                    <td className="mono">{t.date}</td>
                    <td className="mono">{t.docNumber}</td>
                    <td style={{ color:DARK,fontWeight:500 }}>{t.vendor}</td>
                    <td style={{ color:MID,maxWidth:220 }}>{t.description}</td>
                    <td className="mono" style={{ color:RED }}>–{$(t.amount)}</td>
                    <td><span className="chip g">{t.taggedJobName}</span></td>
                    <td><span style={{ fontSize:10,color:ACCENT,fontFamily:"'DM Sans',sans-serif" }}>ProfitIQ</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:10,fontSize:11,color:DIM,textAlign:"right",fontFamily:"'DM Sans',sans-serif",fontStyle:"italic" }}>
            Dashboard and Job Detail update automatically as you tag expenses.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB: JOB DETAIL ─────────────────────────────────────────────────────────

function JobDetail({ job, onBack }) {
  if (!job) return (
    <div style={{ padding:80,textAlign:"center",color:DIM,background:BG,minHeight:"100vh" }}>
      <div style={{ fontFamily:"'Lora',serif",fontSize:18,color:MID,fontStyle:"italic",marginBottom:8 }}>No job selected</div>
      <div style={{ fontSize:13,fontFamily:"'DM Sans',sans-serif",color:DIM }}>Select a job from the Dashboard tab to see its full breakdown</div>
    </div>
  );
  const win = job.profit > 0;
  const vendorData = Object.entries(job.costByVendor).map(([name,value]) => ({ name,value })).sort((a,b) => b.value-a.value);
  const COLORS = [ACCENT2,ACCENT,"#8C7055","#5C8C7A","#8C6B55","#7A8C5A"];
  const invoiceLines = job.invoices.flatMap(inv => inv.Line.map(l => ({ doc:inv.DocNumber,date:inv.TxnDate,desc:l.Description,amount:l.Amount,type:"Revenue" })));
  const costLines = job.purchases.flatMap(p =>
    p.Line.filter(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.id)
          .map(l => ({ doc:p.DocNumber,date:p.TxnDate,desc:l.Description,amount:l.Amount,vendor:p.EntityRef.name,type:"Cost" }))
  );
  const allLines = [...invoiceLines,...costLines].sort((a,b) => a.date.localeCompare(b.date));

  return (
    <div style={{ padding:"32px 36px",background:BG,minHeight:"100vh" }}>
      <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:28 }}>
        <button className="btn" onClick={onBack}>← All Jobs</button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:DARK,letterSpacing:"-0.01em" }}>{job.name}</h1>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginTop:3 }}>{job.clientName} · {job.type} · {job.status}</div>
        </div>
        <span className={`chip ${win?"g":"r"}`} style={{ fontSize:13,padding:"7px 18px" }}>
          {win?"+":"–"}{$(job.profit)} &nbsp; {job.marginPct}% margin
        </span>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:24 }}>
        {[
          { label:"Revenue",     val:$(job.revenue) },
          { label:"Total Costs", val:$(job.costs) },
          { label:"Gross Profit",val:(win?"+":" –")+$(job.profit) },
          { label:"Margin",      val:job.marginPct+"%" },
          { label:"Outstanding", val:$(job.outstanding) },
        ].map((k,i) => (
          <div key={i} className="kpi">
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:10,fontWeight:500 }}>{k.label}</div>
            <div style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:i===2?(win?ACCENT2:RED):i===4&&job.outstanding>0?AMBER:DARK }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:24 }}>
        <div className="card" style={{ padding:"22px 26px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:5,fontWeight:500 }}>Cost Breakdown by Vendor</div>
          <div style={{ fontFamily:"'Lora',serif",fontSize:14,color:MID,marginBottom:18,fontStyle:"italic" }}>Where did the money go?</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={vendorData} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={2}>
                {vendorData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} opacity={0.85}/>)}
              </Pie>
              <Legend formatter={v => <span style={{ fontSize:11,color:MID,fontFamily:"'DM Sans',sans-serif" }}>{v}</span>}/>
              <Tooltip formatter={v => [$(v),"Cost"]} contentStyle={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:5,fontFamily:"'DM Mono',monospace",fontSize:11 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding:"22px 26px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:5,fontWeight:500 }}>Revenue vs Costs</div>
          <div style={{ fontFamily:"'Lora',serif",fontSize:14,color:MID,marginBottom:18,fontStyle:"italic" }}>Side by side comparison</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name:"This Job",revenue:job.revenue,costs:job.costs,profit:job.profit }]} margin={{ top:4,right:4,left:0,bottom:0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize:11,fill:DIM,fontFamily:"DM Sans" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} tickFormatter={$k} axisLine={false} tickLine={false}/>
              <Tooltip content={ChartTip}/>
              <Bar dataKey="revenue" name="Revenue" fill={DIM} radius={[4,4,0,0]} opacity={0.6}/>
              <Bar dataKey="costs"   name="Costs"   fill={RED} radius={[4,4,0,0]} opacity={0.7}/>
              <Bar dataKey="profit"  name="Profit"  fill={win?ACCENT2:RED} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ padding:"16px 22px",borderBottom:`1px solid ${BORDER}`,background:BG }}>
          <div style={{ fontFamily:"'Lora',serif",fontSize:14,color:MID,fontStyle:"italic" }}>Transaction Log — all invoices & expenses for this job</div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table className="raw-table">
            <thead><tr>{["Date","Doc #","Type","Vendor / Description","Amount"].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {allLines.map((l,i) => (
                <tr key={i}>
                  <td className="mono">{l.date}</td>
                  <td className="mono">{l.doc}</td>
                  <td><span style={{ display:"inline-block",padding:"2px 9px",borderRadius:3,fontSize:10,fontWeight:500,fontFamily:"'DM Sans',sans-serif",background:l.type==="Revenue"?"rgba(92,122,90,0.1)":"rgba(140,64,64,0.08)",color:l.type==="Revenue"?ACCENT2:RED }}>{l.type}</span></td>
                  <td style={{ color:MID,maxWidth:320 }}>{l.vendor?<span style={{ color:DIM,marginRight:8,fontFamily:"'DM Mono',monospace",fontSize:11 }}>[{l.vendor}]</span>:null}{l.desc}</td>
                  <td className="mono" style={{ color:l.type==="Revenue"?ACCENT2:RED }}>{l.type==="Revenue"?"+":"–"}{$(l.amount)}</td>
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

function AIChat({ jobSummaries }) {
  const SYSTEM_PROMPT = `You are a sharp, no-nonsense financial analyst for a small contracting business. You have access to all job data below. Answer questions about profitability, trends, and business performance concisely and in plain English — like a smart bookkeeper talking to a busy contractor. Be direct. Use dollar figures and percentages. Flag problems clearly. Keep responses under 200 words unless a detailed breakdown is asked for.

JOB SUMMARY DATA:
${JSON.stringify(jobSummaries.map(j=>({ id:j.id,name:j.name,client:j.clientName,type:j.type,status:j.status,revenue:j.revenue,costs:j.costs,profit:j.profit,marginPct:j.marginPct+"%" })),null,2)}

MONTHLY TREND DATA:
${JSON.stringify(MONTHLY_TREND,null,2)}`;

  const [messages, setMessages] = useState([
    { role:"assistant", content:"I've got your full job data loaded. Ask me anything — which jobs are hurting your margin, why a month looked rough, which job type is most profitable, or what to watch. What would you like to know?" }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages,loading]);

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
    const newMessages = [...messages, { role:"user",content:msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:SYSTEM_PROMPT, messages:newMessages.map(m=>({ role:m.role,content:m.content })) })
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("") || "Sorry, couldn't get a response.";
      setMessages([...newMessages, { role:"assistant",content:reply }]);
    } catch(e) {
      setMessages([...newMessages, { role:"assistant",content:"Error connecting to Claude API. Make sure you're running this with API access." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 56px)",padding:"0 36px 28px",background:BG }}>
      <div style={{ paddingTop:28,paddingBottom:18,borderBottom:`1px solid ${BORDER}`,marginBottom:22 }}>
        <h1 style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:DARK,letterSpacing:"-0.01em",marginBottom:4 }}>AI Business Analyst</h1>
        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM }}>Ask anything about your jobs, margins, or trends — in plain English.</p>
      </div>
      {messages.length <= 1 && (
        <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:22 }}>
          {SUGGESTIONS.map((s,i) => (
            <button key={i} onClick={()=>send(s)} style={{ cursor:"pointer",padding:"9px 16px",borderRadius:4,fontSize:12,border:`1px solid ${BORDER}`,color:MID,background:CARD,fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",boxShadow:"0 1px 2px rgba(44,36,22,0.05)" }}
              onMouseOver={e=>{e.currentTarget.style.borderColor=ACCENT;e.currentTarget.style.color=ACCENT;}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color=MID;}}
            >{s}</button>
          ))}
        </div>
      )}
      <div style={{ flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:14,paddingRight:6 }}>
        {messages.map((m,i) => (
          <div key={i} className={m.role==="user"?"chat-bubble-user":"chat-bubble-ai"} style={{ whiteSpace:"pre-wrap" }}>{m.content}</div>
        ))}
        {loading && <div className="chat-bubble-ai"><div className="thinking"><span/><span/><span/></div></div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{ display:"flex",gap:10,marginTop:18 }}>
        <input className="chat-input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask about your jobs, margins, costs..."/>
        <button className="btn act" onClick={()=>send()} style={{ whiteSpace:"nowrap",padding:"11px 22px" }}>Send</button>
      </div>
    </div>
  );
}

// ─── TAB: RAW DATA ────────────────────────────────────────────────────────────

function RawData() {
  const [view, setView] = useState("customers");
  const VIEWS = [
    { key:"customers", label:"Customers / Jobs" },
    { key:"invoices",  label:"Invoices" },
    { key:"purchases", label:"Purchases & Bills" },
  ];
  return (
    <div style={{ padding:"32px 36px",background:BG,minHeight:"100vh" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:DARK,letterSpacing:"-0.01em",marginBottom:4 }}>QuickBooks Raw Data</h1>
        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginBottom:18 }}>This mirrors exactly what the QB API returns. In production, this syncs nightly into Supabase.</p>
        <div style={{ display:"flex",gap:8 }}>
          {VIEWS.map(v => (
            <button key={v.key} className={`btn${view===v.key?" act":""}`} onClick={()=>setView(v.key)}>
              {v.label} <span style={{ opacity:0.55,fontSize:10,marginLeft:4 }}>({v.key==="customers"?QB_CUSTOMERS.length:v.key==="invoices"?QB_INVOICES.length:QB_PURCHASES.length})</span>
            </button>
          ))}
        </div>
      </div>
      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          {view==="customers" && (
            <table className="raw-table">
              <thead><tr>{["Id","DisplayName","FullyQualifiedName","Job","ParentRef.value","Active","Balance"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {QB_CUSTOMERS.map(c => (
                  <tr key={c.Id}>
                    <td className="mono">{c.Id}</td>
                    <td style={{ color:DARK,fontWeight:500 }}>{c.DisplayName}</td>
                    <td style={{ color:MID }}>{c.FullyQualifiedName}</td>
                    <td><span style={{ display:"inline-block",padding:"2px 8px",borderRadius:3,fontSize:10,fontWeight:500,fontFamily:"'DM Sans',sans-serif",background:c.Job?"rgba(92,122,90,0.1)":"rgba(168,152,128,0.12)",color:c.Job?ACCENT2:DIM }}>{c.Job?"true":"false"}</span></td>
                    <td className="mono">{c.ParentRef?.value||<span style={{ color:DIM }}>—</span>}</td>
                    <td><span style={{ color:c.Active?ACCENT2:DIM,fontFamily:"'DM Sans',sans-serif",fontSize:12 }}>{c.Active?"true":"false"}</span></td>
                    <td className="mono" style={{ color:c.Balance>0?AMBER:DIM }}>${c.Balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {view==="invoices" && (
            <table className="raw-table">
              <thead><tr>{["Id","DocNumber","CustomerRef.value","TxnDate","DueDate","TotalAmt","Balance","Lines"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {QB_INVOICES.map(inv => (
                  <tr key={inv.Id}>
                    <td className="mono">{inv.Id}</td>
                    <td className="mono">{inv.DocNumber}</td>
                    <td className="mono" style={{ color:ACCENT2 }}>{inv.CustomerRef.value}</td>
                    <td className="mono">{inv.TxnDate}</td>
                    <td className="mono">{inv.DueDate}</td>
                    <td className="mono" style={{ color:ACCENT2 }}>${inv.TotalAmt.toLocaleString()}</td>
                    <td className="mono" style={{ color:inv.Balance>0?AMBER:DIM }}>${inv.Balance.toLocaleString()}</td>
                    <td><div style={{ display:"flex",flexDirection:"column",gap:3 }}>{inv.Line.map((l,i)=><div key={i} style={{ fontSize:10,color:MID,fontFamily:"'DM Sans',sans-serif" }}>{l.Description}: <span style={{ color:ACCENT }}>${l.Amount.toLocaleString()}</span></div>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {view==="purchases" && (
            <table className="raw-table">
              <thead><tr>{["Id","DocNumber","Vendor","TxnDate","PaymentType","TotalAmt","Job (from Line)","Description"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {QB_PURCHASES.map(p => (
                  <tr key={p.Id}>
                    <td className="mono">{p.Id}</td>
                    <td className="mono">{p.DocNumber}</td>
                    <td style={{ color:DARK,fontWeight:500 }}>{p.EntityRef.name}</td>
                    <td className="mono">{p.TxnDate}</td>
                    <td><span className="tag">{p.PaymentType}</span></td>
                    <td className="mono" style={{ color:RED }}>${p.TotalAmt.toLocaleString()}</td>
                    <td className="mono" style={{ color:AMBER }}>{p.Line[0]?.AccountBasedExpenseLineDetail?.CustomerRef?.value}</td>
                    <td style={{ color:MID,maxWidth:240 }}>{p.Line[0]?.Description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div style={{ marginTop:20,padding:"16px 20px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontSize:12,color:DIM,lineHeight:1.7,fontFamily:"'DM Sans',sans-serif" }}>
        <span style={{ color:ACCENT,fontWeight:500 }}>Note: </span>
        This is mock data structured to mirror real QuickBooks API responses. The key field is <span style={{ color:ACCENT,fontFamily:"'DM Mono',monospace",fontSize:11 }}>AccountBasedExpenseLineDetail.CustomerRef.value</span> inside each Purchase Line — this is how QB links a cost to a specific job. Expenses without this field appear in the Expense Inbox as untagged.
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab]           = useState("dashboard");
  const [selectedJob, setSelectedJob] = useState(null);
  const [untagged, setUntagged] = useState(INITIAL_UNTAGGED);
  const [tagged, setTagged]     = useState([]);

  // Extra costs per job accumulated from inbox tagging
  const extraCostsByJob = tagged.reduce((acc, t) => {
    acc[t.taggedJobId] = (acc[t.taggedJobId] || 0) + t.amount;
    return acc;
  }, {});

  const jobSummaries = buildJobSummaries(extraCostsByJob);

  function handleJobClick(job) {
    setSelectedJob(job);
    setTab("detail");
  }

  function handleTag(item, jobId, jobName) {
    setUntagged(prev => prev.filter(u => u.id !== item.id));
    setTagged(prev => [...prev, { ...item, taggedJobId: jobId, taggedJobName: jobName }]);
    // Update selected job if it's open
    if (selectedJob && selectedJob.id === jobId) {
      const updated = jobSummaries.find(j => j.id === jobId);
      if (updated) setSelectedJob(updated);
    }
  }

  function handleDismiss(id) {
    setUntagged(prev => prev.filter(u => u.id !== id));
  }

  const inboxCount = untagged.length;

  const TABS = [
    { key:"dashboard", label:"Dashboard" },
    { key:"inbox",     label:"Expense Inbox" },
    { key:"detail",    label:"Job Detail" },
    { key:"chat",      label:"AI Analyst" },
    { key:"raw",       label:"Raw Data" },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",background:BG,minHeight:"100vh",color:DARK }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${BORDER}`,background:CARD,position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(44,36,22,0.06)" }}>
        <div style={{ padding:"0 36px",display:"flex",alignItems:"center",gap:0 }}>
          <div style={{ marginRight:36,paddingTop:14,paddingBottom:14,borderRight:`1px solid ${BORDER}`,paddingRight:36 }}>
            <div style={{ fontFamily:"'Lora',serif",fontSize:18,fontWeight:500,color:DARK,letterSpacing:"-0.01em" }}>Profit<span style={{ color:ACCENT2 }}>IQ</span></div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",color:DIM,textTransform:"uppercase",marginTop:1 }}>Contractor Intelligence</div>
          </div>
          {TABS.map(t => (
            <div key={t.key} className={`nav-tab${tab===t.key?" active":""}`} onClick={()=>setTab(t.key)}>
              {t.label}
              {t.key==="inbox" && inboxCount > 0 && <span className="badge">{inboxCount}</span>}
              {t.key==="inbox" && inboxCount === 0 && tagged.length > 0 && <span className="badge done">✓</span>}
              {t.key==="detail" && selectedJob && <span style={{ marginLeft:6,fontSize:10,color:DIM }}>· {selectedJob.name.split(" ")[0]}</span>}
              {t.key==="chat" && <span style={{ marginLeft:6,fontSize:9,padding:"2px 7px",borderRadius:3,background:"rgba(92,122,90,0.12)",color:ACCENT2,fontWeight:500 }}>AI</span>}
            </div>
          ))}
          <div style={{ marginLeft:"auto",fontSize:10,color:DIM,display:"flex",alignItems:"center",gap:6,fontFamily:"'DM Sans',sans-serif" }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:ACCENT2,opacity:0.7 }}/>
            Demo data · QuickBooks format
          </div>
        </div>
      </div>

      {/* Content */}
      {tab==="dashboard" && <Dashboard onJobClick={handleJobClick} jobSummaries={jobSummaries}/>}
      {tab==="inbox"     && <ExpenseInbox untagged={untagged} tagged={tagged} onTag={handleTag} onDismiss={handleDismiss}/>}
      {tab==="detail"    && <JobDetail job={selectedJob} onBack={()=>setTab("dashboard")}/>}
      {tab==="chat"      && <AIChat jobSummaries={jobSummaries}/>}
      {tab==="raw"       && <RawData/>}
    </div>
  );
}
