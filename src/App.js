import { useState, useRef, useEffect, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie, Legend } from "recharts";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

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

// Use actual current date for date range calculations
const MOCK_TODAY = new Date();

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
  .kpi-tooltip { position:relative; }
  .kpi-tooltip .tooltip-text { visibility:hidden;opacity:0;position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:${DARK};color:#FDF8F0;font-size:10px;font-family:'DM Sans',sans-serif;padding:8px 12px;border-radius:4px;width:220px;line-height:1.5;text-align:center;z-index:200;transition:opacity 0.15s;pointer-events:none; }
  .kpi-tooltip:hover .tooltip-text { visibility:visible;opacity:1; }
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

function Dashboard({ onJobClick, jobSummaries, untagged, overhead, qbConnected, userId, clientType }) {
  const [sort, setSort]             = useState("profit");
  const [sortDir, setSortDir]       = useState("desc");
  const [dateRange, setDateRange]   = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [trendView, setTrendView]   = useState("cumulative");
  const [expenseView, setExpenseView] = useState("job");

  // Build monthly trend dynamically from live job summaries
  const dynamicTrend = useMemo(() => {
    const monthMap = {};
    jobSummaries.forEach(j => {
      j.invoices.forEach(inv => {
        if (!inv.TxnDate) return;
        const d     = new Date(inv.TxnDate);
        const key   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const month = d.toLocaleDateString('en-US', { month:'short' });
        const year  = String(d.getFullYear()).slice(-2);
        const label = `${month} '${year}`;
        if (!monthMap[key]) monthMap[key] = { month: label, date: key+'-01', revenue:0, costs:0 };
        monthMap[key].revenue += inv.TotalAmt || 0;
      });
      j.purchases.forEach(p => {
        if (!p.TxnDate) return;
        const d   = new Date(p.TxnDate);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const month = d.toLocaleDateString('en-US', { month:'short' });
        const year  = String(d.getFullYear()).slice(-2);
        const label = `${month} '${year}`;
        if (!monthMap[key]) monthMap[key] = { month: label, date: key+'-01', revenue:0, costs:0 };
        monthMap[key].costs += p.TotalAmt || 0;
      });
    });
    return Object.values(monthMap)
      .sort((a,b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, profit: d.revenue - d.costs }));
  }, [jobSummaries]);

  const TREND = dynamicTrend.length > 0 ? dynamicTrend : MONTHLY_TREND;

  // Apply date filter
  const filteredJobs  = dateRange === "all" ? jobSummaries : filterJobsByDate(jobSummaries, dateRange);
  const filteredTrend = dateRange === "all" ? TREND : filterTrendByDate(TREND, dateRange);

  // Cumulative profit data — running total across months
  const cumulativeData = useMemo(() => {
    let running = 0;
    return filteredTrend.map(d => {
      running += d.profit;
      return { ...d, cumulativeProfit: running };
    });
  }, [filteredTrend]);

  // Linear regression trend line for "By Month" profit bars
  const trendLineData = useMemo(() => {
    const n = filteredTrend.length;
    if (n < 2) return [];
    const xs = filteredTrend.map((_, i) => i);
    const ys = filteredTrend.map(d => d.profit);
    const sumX  = xs.reduce((s,x) => s+x, 0);
    const sumY  = ys.reduce((s,y) => s+y, 0);
    const sumXY = xs.reduce((s,x,i) => s + x*ys[i], 0);
    const sumX2 = xs.reduce((s,x) => s + x*x, 0);
    const slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
    const intercept = (sumY - slope*sumX) / n;
    return filteredTrend.map((d, i) => ({ ...d, trend: Math.round(slope*i + intercept) }));
  }, [filteredTrend]);

  // Job type filter
  const allTypes = ["all", ...Array.from(new Set(jobSummaries.map(j => j.type).filter(Boolean))).sort()];
  const typeFilteredJobs = typeFilter === "all" ? filteredJobs : filteredJobs.filter(j => j.type === typeFilter);

  function handleColSort(col) {
    if (sort === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSort(col); setSortDir("desc"); }
  }

  function SortIcon({ col }) {
    if (sort !== col) return <span style={{ opacity:0.25, marginLeft:4 }}>↕</span>;
    return <span style={{ marginLeft:4, color:ACCENT }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const sorted = [...typeFilteredJobs].sort((a,b) => {
    let diff = 0;
    if (sort==="profit")       diff = b.profit - a.profit;
    else if (sort==="margin")  diff = parseFloat(b.marginPct) - parseFloat(a.marginPct);
    else if (sort==="revenue") diff = b.revenue - a.revenue;
    else if (sort==="costs")   diff = b.costs - a.costs;
    else if (sort==="name")    diff = a.name.localeCompare(b.name);
    else if (sort==="client")  diff = a.clientName.localeCompare(b.clientName);
    else if (sort==="status")  diff = a.status.localeCompare(b.status);
    return sortDir === "asc" ? -diff : diff;
  });

  const totalRev    = typeFilteredJobs.reduce((s,j) => s + j.revenue, 0);
  const totalCost   = typeFilteredJobs.reduce((s,j) => s + j.costs, 0);
  const totalProfit = totalRev - totalCost;
  const winners     = typeFilteredJobs.filter(j => j.profit > 0).length;
  const barData     = sorted.map(j => ({ name: j.name, fullName:j.name, profit:j.profit }));

  // Data Quality Score — tagged + overhead both count as accounted for
  const totalTaggedExpenses   = jobSummaries.reduce((s,j) => s + j.purchases.length, 0);
  const totalOverheadExpenses = (overhead || []).length;
  const totalUntaggedExpenses = untagged.length;
  const totalExpenses  = totalTaggedExpenses + totalOverheadExpenses + totalUntaggedExpenses;
  const accountedFor   = totalTaggedExpenses + totalOverheadExpenses;
  const dataQuality    = totalExpenses > 0 ? Math.round((accountedFor / totalExpenses) * 100) : 100;
  const dqColor        = dataQuality >= 80 ? ACCENT2 : dataQuality >= 50 ? AMBER : RED;
  const dqLabel        = dataQuality >= 80 ? "Good" : dataQuality >= 50 ? "Fair" : "Poor";

  // Overhead total — filtered to selected date range
  const overheadInRange = (overhead || []).filter(o => {
    if (dateRange === "all") return true;
    const cutoff = getDateCutoff(dateRange);
    return cutoff ? new Date(o.date) >= cutoff : true;
  });
  const totalOverhead = overheadInRange.reduce((s, o) => s + (o.amount || 0), 0);

  // Mid-job margin alerts
  const atRiskJobs = typeFilteredJobs.filter(j =>
    j.status === "In Progress" && j.revenue > 0 && (j.costs / j.revenue) > 0.85
  );

  // Unbilled work alert
  const unbilledJobs = jobSummaries.filter(j => j.costs > 0 && j.revenue === 0);

  // Date range label — dynamically built from actual data dates
  const allDates = jobSummaries.flatMap(j => j.invoices.map(i => i.TxnDate)).filter(Boolean).sort();
  const firstDate = allDates[0] ? new Date(allDates[0]).toLocaleDateString('en-US', { month:'short', year:'numeric' }) : '';
  const lastDate  = allDates[allDates.length-1] ? new Date(allDates[allDates.length-1]).toLocaleDateString('en-US', { month:'short', year:'numeric' }) : '';
  const allTimeLabel = firstDate && lastDate && firstDate !== lastDate
    ? `All jobs · ${firstDate} – ${lastDate}`
    : firstDate ? `All jobs · ${firstDate}` : "All jobs";

  const rangeLabel = dateRange === "all"
    ? allTimeLabel
    : `${DATE_RANGES.find(r=>r.key===dateRange)?.label} · ${typeFilteredJobs.length} job${typeFilteredJobs.length!==1?"s":""}`;

  return (
    <div style={{ padding:"32px 36px", background:BG, minHeight:"100vh" }}>

      {/* Page title + date slicer */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:DARK,letterSpacing:"-0.01em" }}>Job Profitability Overview</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginTop:4 }}>{rangeLabel}</p>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:4 }}>
          <div style={{ display:"flex",border:`1px solid ${BORDER}`,borderRadius:5,overflow:"hidden",background:CARD }}>
            {DATE_RANGES.map((r,i) => (
              <button key={r.key} onClick={()=>setDateRange(r.key)} style={{ cursor:"pointer",padding:"7px 13px",fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.03em",border:"none",borderRight:i<DATE_RANGES.length-1?`1px solid ${BORDER}`:"none",background:dateRange===r.key?ACCENT:CARD,color:dateRange===r.key?CARD:MID,transition:"all 0.15s" }}>{r.label}</button>
            ))}
          </div>
          <button onClick={()=>setDateRange("all")} style={{ cursor:"pointer",padding:"7px 14px",fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.03em",border:`1px solid ${BORDER}`,borderRadius:5,background:dateRange==="all"?DARK:CARD,color:dateRange==="all"?CARD:MID,transition:"all 0.15s" }}>All</button>
        </div>
      </div>

      {/* Connect QuickBooks banner — shown for QB clients who haven't connected yet */}
      {clientType === "quickbooks" && !qbConnected && (
        <div style={{ marginBottom:24, padding:"16px 22px", borderRadius:6, border:`1px solid rgba(140,107,48,0.3)`, background:"rgba(140,107,48,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color:AMBER, marginBottom:3 }}>Connect your QuickBooks account</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:MID }}>You're currently viewing demo data. Connect QuickBooks to see your real job profitability numbers.</div>
          </div>
          <a
            href={`/api/qb-connect?userId=${userId}`}
            style={{ cursor:"pointer", padding:"9px 20px", borderRadius:4, fontSize:12, fontWeight:500, border:`1px solid ${AMBER}`, color:CARD, background:AMBER, fontFamily:"'DM Sans',sans-serif", textDecoration:"none", whiteSpace:"nowrap", marginLeft:24, transition:"all 0.15s" }}
          >
            Connect QuickBooks →
          </a>
        </div>
      )}

      {/* Unbilled Work Alert */}
      {unbilledJobs.length > 0 && (
        <div style={{ marginBottom:20,padding:"13px 20px",borderRadius:5,border:`1px solid rgba(140,64,64,0.25)`,background:"rgba(140,64,64,0.04)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ fontSize:13,color:RED,fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ fontWeight:500 }}>⚠ {unbilledJobs.length} job{unbilledJobs.length!==1?"s":""} with expenses recorded but no invoice sent</span>
            <span style={{ color:MID,marginLeft:8 }}>— {$(unbilledJobs.reduce((s,j)=>s+j.costs,0))} potentially unbilled</span>
          </div>
          <div style={{ fontSize:11,color:RED,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",marginLeft:16,fontWeight:500 }}>
            {unbilledJobs.map(j=>j.name).join(", ")}
          </div>
        </div>
      )}

      {/* Mid-Job Margin Alert */}
      {atRiskJobs.length > 0 && (
        <div style={{ marginBottom:20,padding:"13px 20px",borderRadius:5,border:`1px solid rgba(140,107,48,0.25)`,background:"rgba(140,107,48,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ fontSize:13,color:AMBER,fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ fontWeight:500 }}>● {atRiskJobs.length} active job{atRiskJobs.length!==1?"s":""} trending toward a loss</span>
            <span style={{ color:MID,marginLeft:8 }}>— costs are running above 85% of revenue billed so far</span>
          </div>
          <div style={{ fontSize:11,color:AMBER,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",marginLeft:16,fontWeight:500 }}>
            {atRiskJobs.map(j=>`${j.name} (${j.marginPct}%)`).join("  ·  ")}
          </div>
        </div>
      )}

      {/* KPI strip — 5 cards, Total Expenses is toggleable */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:28 }}>

        {/* Static KPIs */}
        {[
          { label:"Total Revenue",      val:$(totalRev),      sub:"all jobs billed",                                                     hi:false, color:DARK },
          { label:"Total Profit",       val:$(totalProfit),   sub:totalRev>0?`${((totalProfit/totalRev)*100).toFixed(1)}% gross margin`:"no revenue", hi:true, color:ACCENT2 },
          { label:"Jobs Profitable",    val:`${winners} of ${typeFilteredJobs.length}`, sub:"in the green",                               hi:false, color:DARK },
        ].map((k,i) => (
          <div key={i} className={`kpi${k.hi?" hi":""}`}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:10,fontWeight:500 }}>{k.label}</div>
            <div style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:k.color,letterSpacing:"-0.01em" }}>{k.val}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM,marginTop:6 }}>{k.sub}</div>
          </div>
        ))}

        {/* Total Expenses — toggleable between Job Costs and Fixed */}
        <div className="kpi" style={{ position:"relative" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",fontWeight:500 }}>Total Expenses</div>
            <div style={{ display:"flex",border:`1px solid ${BORDER}`,borderRadius:3,overflow:"hidden" }}>
              {[["job","Jobs"],["fixed","Fixed"]].map(([k,l],i) => (
                <button key={k} onClick={e=>{e.stopPropagation();setExpenseView(k);}} style={{ cursor:"pointer",padding:"2px 7px",fontSize:9,fontWeight:500,fontFamily:"'DM Sans',sans-serif",border:"none",borderRight:i===0?`1px solid ${BORDER}`:"none",background:expenseView===k?ACCENT:CARD,color:expenseView===k?CARD:DIM,transition:"all 0.15s" }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:expenseView==="fixed"?AMBER:MID,letterSpacing:"-0.01em" }}>
            {expenseView==="job" ? $(totalCost) : $(totalOverhead)}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM,marginTop:6 }}>
            {expenseView==="job"
              ? `${typeFilteredJobs.reduce((s,j)=>s+j.purchases.length,0)} job-tagged expenses`
              : `${overheadInRange.length} fixed cost expense${overheadInRange.length!==1?"s":""}`}
          </div>
        </div>

        {/* Data Quality Score */}
        <div className="kpi kpi-tooltip">
          <span className="tooltip-text">
            Includes job-tagged and fixed cost expenses. Tag remaining expenses in the Expense Inbox to improve. Data sourced from QuickBooks.
          </span>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:10,fontWeight:500 }}>Data Quality Score</div>
          <div style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:dqColor,letterSpacing:"-0.01em" }}>{dataQuality}%</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM,marginTop:6 }}>{dqLabel} · {accountedFor}/{totalExpenses} accounted for</div>
        </div>

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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top:4,right:4,left:12,bottom:60 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false}/>
                <XAxis dataKey="name" interval={0} height={80} tick={({ x, y, payload }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={4} textAnchor="end" fill={DIM} fontSize={9} fontFamily="DM Mono" transform="rotate(-45)">
                      {payload.value.length > 18 ? payload.value.slice(0, 18) + "…" : payload.value}
                    </text>
                  </g>
                )}/>
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
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:5,fontWeight:500 }}>Profitability Trend</div>
              <div style={{ fontFamily:"'Lora',serif",fontSize:14,color:MID,fontStyle:"italic" }}>
                {trendView === "cumulative" ? "Running total profit over time" : "Monthly revenue, costs & profit"}
              </div>
            </div>
            {/* View toggle */}
            <div style={{ display:"flex", border:`1px solid ${BORDER}`, borderRadius:5, overflow:"hidden", background:CARD }}>
              {[["monthly","By Month"],["cumulative","Cumulative"]].map(([k,l],i) => (
                <button key={k} onClick={()=>setTrendView(k)} style={{ cursor:"pointer", padding:"6px 12px", fontSize:10, fontWeight:500, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.03em", border:"none", borderRight:i===0?`1px solid ${BORDER}`:"none", background:trendView===k?ACCENT:CARD, color:trendView===k?CARD:MID, transition:"all 0.15s" }}>{l}</button>
              ))}
            </div>
          </div>

          {trendView === "monthly" ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={filteredTrend} margin={{ top:4,right:16,left:12,bottom:0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} axisLine={false} tickLine={false} height={40}/>
                  <YAxis tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} tickFormatter={$k} axisLine={false} tickLine={false} width={52}/>
                  <Tooltip content={ChartTip}/>
                  <ReferenceLine y={0} stroke={BORDER}/>
                  <Line type="monotone" dataKey="revenue" stroke={DIM} strokeWidth={1.5} dot={false} name="Revenue"/>
                  <Line type="monotone" dataKey="costs" stroke={RED} strokeWidth={1.5} dot={false} name="Costs" strokeDasharray="4 2"/>
                  <Line type="monotone" dataKey="profit" stroke={ACCENT2} strokeWidth={2.5} dot={{ r:3,fill:ACCENT2 }} name="Profit"/>
                  {/* Linear regression trend line on profit */}
                  {trendLineData.length > 1 && (
                    <Line type="linear" data={trendLineData} dataKey="trend" stroke={ACCENT} strokeWidth={1} dot={false} strokeDasharray="6 3" name="Trend" legendType="none"/>
                  )}
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:"flex",gap:20,marginTop:12,justifyContent:"flex-end",flexWrap:"wrap" }}>
                {[["Revenue",DIM,false],["Costs",RED,true],["Profit",ACCENT2,false],["Trend",ACCENT,true]].map(([l,c,d]) => (
                  <div key={l} style={{ display:"flex",alignItems:"center",gap:6,fontSize:10,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>
                    <div style={{ width:16,height:2,background:d?"transparent":c,borderRadius:2,borderBottom:d?`2px dashed ${c}`:"none" }}/>
                    {l}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={cumulativeData} margin={{ top:4,right:16,left:12,bottom:0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} axisLine={false} tickLine={false} height={40}/>
                  <YAxis tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} tickFormatter={$k} axisLine={false} tickLine={false} width={52}/>
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active||!payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:5,padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:11,boxShadow:"0 4px 12px rgba(44,36,22,0.12)" }}>
                        <div style={{ color:DIM,marginBottom:6,fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase" }}>{label}</div>
                        <div style={{ color:ACCENT2,marginBottom:3 }}>Cumulative profit: {$k(d?.cumulativeProfit||0)}</div>
                        <div style={{ color:DIM,fontSize:10 }}>This month: {d?.profit>=0?"+":""}{$k(d?.profit||0)}</div>
                      </div>
                    );
                  }}/>
                  <ReferenceLine y={0} stroke={BORDER}/>
                  <Line type="monotone" dataKey="cumulativeProfit" stroke={ACCENT2} strokeWidth={2.5} dot={{ r:3, fill:ACCENT2 }} name="Cumulative Profit"/>
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:"flex",gap:20,marginTop:12,justifyContent:"space-between",alignItems:"center" }}>
                <div style={{ fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic" }}>
                  {cumulativeData.length > 0 && (() => {
                    const last = cumulativeData[cumulativeData.length-1];
                    const first = cumulativeData[0];
                    const isUp = last.cumulativeProfit > first.cumulativeProfit;
                    return <span style={{ color: isUp ? ACCENT2 : RED }}>
                      {isUp ? "↑" : "↓"} {isUp ? "Trending up" : "Trending down"} — {$(Math.abs(last.cumulativeProfit - first.cumulativeProfit))} {isUp ? "gained" : "lost"} over this period
                    </span>;
                  })()}
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:10,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>
                  <div style={{ width:16,height:2,background:ACCENT2,borderRadius:2 }}/>
                  Cumulative profit
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Job table with Job Type filter */}
      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ padding:"18px 20px",borderBottom:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:BG,flexWrap:"wrap",gap:12 }}>
          <div style={{ fontFamily:"'Lora',serif",fontSize:14,color:MID,fontStyle:"italic" }}>
            {typeFilteredJobs.length > 0 ? `${typeFilteredJobs.length} job${typeFilteredJobs.length!==1?"s":""} — click any row to see the full breakdown` : "No jobs in this period"}
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            {/* Job type filter pills */}
            <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
              {allTypes.map(t => (
                <button key={t} onClick={()=>setTypeFilter(t)} style={{ cursor:"pointer",padding:"4px 11px",borderRadius:20,fontSize:10,fontWeight:500,fontFamily:"'DM Sans',sans-serif",border:`1px solid ${typeFilter===t?ACCENT:BORDER}`,background:typeFilter===t?ACCENT:CARD,color:typeFilter===t?CARD:MID,transition:"all 0.15s",letterSpacing:"0.02em" }}>
                  {t === "all" ? "All Types" : t}
                </button>
              ))}
            </div>
            <div style={{ display:"flex",gap:16,alignItems:"center",fontSize:10,color:DIM,fontFamily:"'DM Sans',sans-serif",paddingLeft:8,borderLeft:`1px solid ${BORDER}` }}>
              <span style={{ display:"flex",alignItems:"center",gap:5 }}><span style={{ width:8,height:8,borderRadius:"50%",background:ACCENT2,display:"inline-block" }}/> Profitable</span>
              <span style={{ display:"flex",alignItems:"center",gap:5 }}><span style={{ width:8,height:8,borderRadius:"50%",background:RED,display:"inline-block" }}/> Losing</span>
            </div>
          </div>
        </div>
        <div className="thead" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 90px" }}>
          {[["name","Job Name"],["client","Client"],["revenue","Revenue"],["costs","Costs"],["profit","Profit / Loss"],["status","Status"]].map(([col,label]) => (
            <div key={col} className="th" onClick={() => handleColSort(col)} style={{ cursor:"pointer", userSelect:"none", display:"flex", alignItems:"center" }}>
              {label}<SortIcon col={col}/>
            </div>
          ))}
        </div>
        {sorted.length > 0 ? sorted.map(j => {
          const win = j.profit > 0;
          const atRisk = j.status === "In Progress" && j.revenue > 0 && (j.costs / j.revenue) > 0.85;
          // Untagged flags — strong if inbox item suggests this job, soft if any untagged exist
          const hasSuggestedUntagged = untagged.some(u => u.suggestedJob === j.id);
          const hasAnyUntagged       = untagged.length > 0;
          return (
            <div key={j.id} className="trow" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 90px",borderLeft:`3px solid ${win?ACCENT2:RED}`,opacity:win?1:0.92 }} onClick={()=>onJobClick(j)}>
              <div className="tcell" style={{ flexDirection:"column",alignItems:"flex-start",gap:3 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ color:DARK,fontWeight:500,fontFamily:"'DM Sans',sans-serif" }}>{j.name}</span>
                  {atRisk && <span style={{ fontSize:9,padding:"2px 7px",borderRadius:3,background:"rgba(140,107,48,0.1)",color:AMBER,fontWeight:500,fontFamily:"'DM Sans',sans-serif" }}>⚠ at risk</span>}
                </div>
                <span style={{ fontSize:10,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>{j.type}</span>
              </div>
              <div className="tcell" style={{ color:MID,fontFamily:"'DM Sans',sans-serif" }}>{j.clientName}</div>
              <div className="tcell mono" style={{ color:MID,fontSize:12 }}>{$(j.revenue)}</div>
              <div className="tcell mono" style={{ color:MID,fontSize:12 }}>{$(j.costs)}</div>
              <div className="tcell" style={{ flexDirection:"column",alignItems:"flex-start",gap:4 }}>
                <span className={`chip ${win?"g":"r"}`}>{win?"+":"-"}{$(j.profit)} ({j.marginPct}%)</span>
                {hasSuggestedUntagged && (
                  <span style={{ fontSize:9,color:AMBER,fontFamily:"'DM Sans',sans-serif",fontWeight:500 }} title="Untagged expenses in the inbox may belong to this job — profit may be lower than shown">⚠ est. — untagged expenses likely</span>
                )}
                {!hasSuggestedUntagged && hasAnyUntagged && (
                  <span style={{ fontSize:9,color:DIM,fontFamily:"'DM Sans',sans-serif" }} title="Untagged expenses exist — profit figures may be incomplete">~ est.</span>
                )}
              </div>
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

// ─── DISMISSED SECTION (used inside ExpenseInbox) ────────────────────────────

function DismissedSection({ dismissed, onRestore }) {
  const [expanded, setExpanded] = useState(false);
  const total = (dismissed||[]).reduce((s,d) => s + d.amount, 0);

  return (
    <div style={{ marginTop:36 }}>
      <div
        style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom: expanded ? 14 : 0, cursor:"pointer", userSelect:"none" }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",fontWeight:500 }}>
          Dismissed — {(dismissed||[]).length} expense{(dismissed||[]).length!==1?"s":""} · {$(total)}
        </div>
        <div style={{ fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6 }}>
          {expanded ? "Hide ▲" : "Show ▼"}
        </div>
      </div>
      {expanded && (
        <div className="card" style={{ overflow:"hidden" }}>
          <table className="raw-table" style={{ width:"100%" }}>
            <thead><tr>{["Date","Doc #","Vendor","Description","Amount",""].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {(dismissed||[]).map((d,i) => (
                <tr key={i}>
                  <td className="mono">{d.date}</td>
                  <td className="mono">{d.docNumber}</td>
                  <td style={{ color:DARK,fontWeight:500 }}>{d.vendor}</td>
                  <td style={{ color:MID,maxWidth:240 }}>{d.description}</td>
                  <td className="mono" style={{ color:DIM }}>–{$(d.amount)}</td>
                  <td>
                    <button
                      className="btn"
                      style={{ fontSize:10,padding:"3px 10px" }}
                      onClick={() => onRestore(d.id)}
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:"10px 20px",fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic",borderTop:`1px solid ${BORDER}` }}>
            Dismissed expenses are excluded from job costs and the Data Quality Score. Click Restore to move an expense back to the inbox.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB: EXPENSE INBOX ───────────────────────────────────────────────────────

function ExpenseInbox({ untagged, onTag, onDismiss, onMarkOverhead, onRestore, tagged, jobSummaries, overhead, dismissed }) {
  const [selections, setSelections] = useState({});
  const [filter, setFilter] = useState("all");
  const [showSyncGuide, setShowSyncGuide] = useState(false);

  // Build job options from live data — fall back to mock if empty
  const liveJobOptions = (jobSummaries || []).map(j => ({
    value: j.id,
    label: j.name,
    client: j.clientName || "",
  }));
  const jobOptions = liveJobOptions.length > 0 ? liveJobOptions : JOB_OPTIONS;

  const totalUntagged = untagged.reduce((s,u) => s + u.amount, 0);
  const totalTagged   = tagged.reduce((s,t) => s + t.amount, 0);
  const needsQBSync   = tagged.length;

  function handleApplySuggestion(item) {
    setSelections(prev => ({ ...prev, [item.id]: item.suggestedJob }));
  }

  function handleConfirm(item) {
    const jobId = selections[item.id];
    if (!jobId) return;
    const job = jobOptions.find(j => j.value === jobId);
    onTag(item, jobId, job?.label || "");
  }

  const visibleUntagged = filter === "suggested"
    ? untagged.filter(u => u.suggestedJob)
    : untagged;

  const SYNC_STEPS = [
    {
      num: "1",
      title: "Open QuickBooks Online",
      body: "Log in at quickbooks.intuit.com. Make sure you're in the correct company file — the same one connected to Canopy.",
    },
    {
      num: "2",
      title: "Go to Expenses",
      body: "In the left sidebar, click Expenses → Expenses. This shows all recorded expenses and bills.",
    },
    {
      num: "3",
      title: "Find the transaction",
      body: "Use the date and vendor name from Canopy to locate the expense in the list. You can use the search bar or filter by date range to narrow it down quickly.",
    },
    {
      num: "4",
      title: "Open and edit it",
      body: "Click the expense to open it. Look for the Customer/Project field — this is the field that links an expense to a job. It may be blank or set to the wrong job.",
    },
    {
      num: "5",
      title: "Assign it to the correct job",
      body: "Click the Customer/Project field and select the job from the dropdown. Match it to what you tagged in Canopy. Make sure 'Billable' is unchecked unless you plan to pass the cost to the client.",
    },
    {
      num: "6",
      title: "Save",
      body: "Click Save and Close. QuickBooks will now show this expense linked to that job. On the next nightly sync, Canopy will pick up the clean tag directly from QuickBooks.",
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
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID,lineHeight:1.6 }}>Tags you apply in Canopy update your dashboard instantly — but they live only here. Your accountant, tax preparer, and QuickBooks reports won't see them unless you update QB directly. It takes about 2 minutes per expense.</div>
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
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID,lineHeight:1.6 }}>Batch your QB updates once a week rather than one at a time. Set aside 15 minutes every Monday to clear the previous week's untagged expenses in both Canopy and QuickBooks at the same time.</div>
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
        {(() => {
          const taggedCount   = (jobSummaries||[]).reduce((s,j) => s + j.purchases.length, 0);
          const overheadCount = (overhead||[]).length;
          const untaggedCount = untagged.length;
          const total         = taggedCount + overheadCount + untaggedCount;
          const accountedFor  = taggedCount + overheadCount;
          const dqPct         = total > 0 ? Math.round((accountedFor / total) * 100) : 100;
          const dqColor       = dqPct >= 80 ? ACCENT2 : dqPct >= 50 ? AMBER : RED;
          return [
            { label:"Untagged Expenses",   val:untagged.length,  sub:$(totalUntagged)+" unallocated",           color:untagged.length>0?AMBER:ACCENT2 },
            { label:"Fixed Costs Tagged",  val:overheadCount,    sub:$(((overhead||[]).reduce((s,o)=>s+o.amount,0)))+" overhead total", color:overheadCount>0?ACCENT2:DIM },
            { label:"Data Quality Score",  val:`${dqPct}%`,      sub:`${accountedFor}/${total} expenses accounted for`, color:dqColor },
            { label:"Needs QB Sync",       val:needsQBSync,      sub:"tags not yet in QuickBooks",              color:needsQBSync>0?MID:DIM },
          ];
        })().map((k,i) => (
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
            <span style={{ fontWeight:500 }}>{tagged.length} expense{tagged.length!==1?"s":""} tagged in Canopy</span>
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
                        {jobOptions.map(j => (
                          <option key={j.value} value={j.value}>{j.label} ({j.client})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display:"flex",gap:8 }}>
                      <button className="btn red" onClick={() => onDismiss(item.id)}>Dismiss</button>
                      <button className="btn" onClick={() => onMarkOverhead(item)} style={{ borderColor:"rgba(140,107,48,0.3)", color:AMBER }} title="Mark as a fixed/overhead business expense not tied to any job">Fixed Cost</button>
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
                    <td><span style={{ fontSize:10,color:ACCENT,fontFamily:"'DM Sans',sans-serif" }}>Canopy</span></td>
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

      {/* Fixed Costs section */}
      {(overhead||[]).length > 0 && (
        <div style={{ marginTop:36 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",fontWeight:500 }}>
              Fixed Costs / Overhead — {(overhead||[]).length} expense{(overhead||[]).length!==1?"s":""}, {$(((overhead||[]).reduce((s,o)=>s+o.amount,0)))} total
            </div>
            <div style={{ fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic" }}>Not attributed to any job</div>
          </div>
          <div className="card" style={{ overflow:"hidden" }}>
            <table className="raw-table" style={{ width:"100%" }}>
              <thead><tr>{["Date","Doc #","Vendor","Description","Amount"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {(overhead||[]).map((o,i) => (
                  <tr key={i}>
                    <td className="mono">{o.date}</td>
                    <td className="mono">{o.docNumber}</td>
                    <td style={{ color:DARK,fontWeight:500 }}>{o.vendor}</td>
                    <td style={{ color:MID,maxWidth:260 }}>{o.description}</td>
                    <td className="mono" style={{ color:AMBER }}>–{$(o.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:10,fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic",textAlign:"right" }}>
            These expenses are included in your Data Quality Score but not allocated to individual jobs.
          </div>
        </div>
      )}

      {/* Dismissed Expenses — collapsible */}
      {(dismissed||[]).length > 0 && (
        <DismissedSection dismissed={dismissed} onRestore={onRestore} />
      )}
    </div>
  );
}

// ─── TAB: JOB DETAIL ─────────────────────────────────────────────────────────

function JobDetail({ job, onBack, untagged }) {
  if (!job) return (
    <div style={{ padding:80,textAlign:"center",color:DIM,background:BG,minHeight:"100vh" }}>
      <div style={{ fontFamily:"'Lora',serif",fontSize:18,color:MID,fontStyle:"italic",marginBottom:8 }}>No job selected</div>
      <div style={{ fontSize:13,fontFamily:"'DM Sans',sans-serif",color:DIM }}>Select a job from the Dashboard tab to see its full breakdown</div>
    </div>
  );
  const win = job.profit > 0;
  const hasSuggestedUntagged = (untagged||[]).some(u => u.suggestedJob === job.id);
  const hasAnyUntagged       = (untagged||[]).length > 0;
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
      <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom: hasSuggestedUntagged || hasAnyUntagged ? 12 : 28 }}>
        <button className="btn" onClick={onBack}>← All Jobs</button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:DARK,letterSpacing:"-0.01em" }}>{job.name}</h1>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginTop:3 }}>{job.clientName} · {job.type} · {job.status}</div>
        </div>
        <span className={`chip ${win?"g":"r"}`} style={{ fontSize:13,padding:"7px 18px" }}>
          {win?"+":"–"}{$(job.profit)} &nbsp; {job.marginPct}% margin
        </span>
      </div>

      {/* Untagged expense warning banner */}
      {hasSuggestedUntagged && (
        <div style={{ marginBottom:20,padding:"11px 18px",borderRadius:5,border:`1px solid rgba(140,107,48,0.3)`,background:"rgba(140,107,48,0.05)",fontSize:12,color:AMBER,fontFamily:"'DM Sans',sans-serif" }}>
          <span style={{ fontWeight:500 }}>⚠ Estimated figures</span>
          <span style={{ color:MID,marginLeft:8 }}>— untagged expenses in the inbox are likely associated with this job. Profit may be lower than shown. Tag them in the Expense Inbox for accurate numbers.</span>
        </div>
      )}
      {!hasSuggestedUntagged && hasAnyUntagged && (
        <div style={{ marginBottom:20,padding:"11px 18px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontSize:12,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>
          <span style={{ fontWeight:500,color:MID }}>~ Estimated figures</span>
          <span style={{ marginLeft:8 }}>— untagged expenses exist in the inbox. Some may belong to this job. Tag them for more accurate numbers.</span>
        </div>
      )}

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

function AIChat({ jobSummaries, trendData }) {
  // Build dynamic trend from job summaries if not passed in
  const trend = trendData || (() => {
    const monthMap = {};
    jobSummaries.forEach(j => {
      j.invoices.forEach(inv => {
        if (!inv.TxnDate) return;
        const d = new Date(inv.TxnDate);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (!monthMap[key]) monthMap[key] = { month: key, revenue:0, costs:0 };
        monthMap[key].revenue += inv.TotalAmt || 0;
      });
      j.purchases.forEach(p => {
        if (!p.TxnDate) return;
        const d = new Date(p.TxnDate);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (!monthMap[key]) monthMap[key] = { month: key, revenue:0, costs:0 };
        monthMap[key].costs += p.TotalAmt || 0;
      });
    });
    return Object.values(monthMap).sort((a,b) => a.month.localeCompare(b.month))
      .map(d => ({ ...d, profit: d.revenue - d.costs }));
  })();

  const SYSTEM_PROMPT = `You are a sharp, no-nonsense financial analyst for a small contracting business. You have access to all job data below. Answer questions about profitability, trends, and business performance concisely and in plain English — like a smart bookkeeper talking to a busy contractor. Be direct. Use dollar figures and percentages. Flag problems clearly. Keep responses under 200 words unless a detailed breakdown is asked for.

JOB SUMMARY DATA:
${JSON.stringify(jobSummaries.map(j=>({ id:j.id,name:j.name,client:j.clientName,type:j.type,status:j.status,revenue:j.revenue,costs:j.costs,profit:j.profit,marginPct:j.marginPct+"%" })),null,2)}

MONTHLY TREND DATA:
${JSON.stringify(trend,null,2)}`;

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

function RawData({ jobSummaries, dataSource }) {
  const [view, setView] = useState("jobs");

  // Build flat lists from live jobSummaries
  const liveJobs = jobSummaries.map(j => ({
    id: j.id, name: j.name, clientName: j.clientName,
    type: j.type, status: j.status,
  }));

  const liveInvoices = jobSummaries.flatMap(j =>
    j.invoices.map(inv => ({
      id: inv.Id, docNumber: inv.DocNumber, jobName: j.name,
      txnDate: inv.TxnDate, totalAmt: inv.TotalAmt, balance: inv.Balance,
      description: inv.Line?.[0]?.Description || '—',
    }))
  );

  const liveExpenses = jobSummaries.flatMap(j =>
    j.purchases.map(p => ({
      id: p.Id, docNumber: p.DocNumber, vendor: p.EntityRef?.name || '—',
      jobName: j.name, txnDate: p.TxnDate, totalAmt: p.TotalAmt,
      description: p.Line?.[0]?.Description || '—',
    }))
  );

  const isLive = dataSource === 'live';

  const VIEWS = [
    { key:"jobs",     label:"Jobs",     count: liveJobs.length },
    { key:"invoices", label:"Invoices", count: liveInvoices.length },
    { key:"expenses", label:"Expenses", count: liveExpenses.length },
  ];

  return (
    <div style={{ padding:"32px 36px", background:BG, minHeight:"100vh" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:500, color:DARK, letterSpacing:"-0.01em", marginBottom:4 }}>
          Raw Data
        </h1>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:DIM, marginBottom:18 }}>
          {isLive
            ? "Live data synced from your QuickBooks account via Supabase."
            : "Demo data — connect QuickBooks to see your real transactions here."}
        </p>
        <div style={{ display:"flex", gap:8 }}>
          {VIEWS.map(v => (
            <button key={v.key} className={`btn${view===v.key?" act":""}`} onClick={()=>setView(v.key)}>
              {v.label} <span style={{ opacity:0.55, fontSize:10, marginLeft:4 }}>({v.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          {view==="jobs" && (
            <table className="raw-table">
              <thead><tr>{["ID","Job Name","Client","Type","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {liveJobs.map((j,i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontSize:10 }}>{j.id}</td>
                    <td style={{ color:DARK, fontWeight:500 }}>{j.name}</td>
                    <td style={{ color:MID }}>{j.clientName}</td>
                    <td><span className="tag">{j.type}</span></td>
                    <td><span style={{ color:j.status==="Complete"?DIM:AMBER, fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>{j.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {view==="invoices" && (
            <table className="raw-table">
              <thead><tr>{["Doc #","Job","Date","Amount","Balance","Description"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {liveInvoices.map((inv,i) => (
                  <tr key={i}>
                    <td className="mono">{inv.docNumber}</td>
                    <td style={{ color:DARK, fontWeight:500 }}>{inv.jobName}</td>
                    <td className="mono">{inv.txnDate}</td>
                    <td className="mono" style={{ color:ACCENT2 }}>${(inv.totalAmt||0).toLocaleString()}</td>
                    <td className="mono" style={{ color:inv.balance>0?AMBER:DIM }}>${(inv.balance||0).toLocaleString()}</td>
                    <td style={{ color:MID, maxWidth:240 }}>{inv.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {view==="expenses" && (
            <table className="raw-table">
              <thead><tr>{["Doc #","Vendor","Job","Date","Amount","Description"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {liveExpenses.map((p,i) => (
                  <tr key={i}>
                    <td className="mono">{p.docNumber}</td>
                    <td style={{ color:DARK, fontWeight:500 }}>{p.vendor}</td>
                    <td style={{ color:MID }}>{p.jobName}</td>
                    <td className="mono">{p.txnDate}</td>
                    <td className="mono" style={{ color:RED }}>${(p.totalAmt||0).toLocaleString()}</td>
                    <td style={{ color:MID, maxWidth:240 }}>{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div style={{ marginTop:20, padding:"16px 20px", borderRadius:5, border:`1px solid ${BORDER}`, background:CARD, fontSize:12, color:DIM, lineHeight:1.7, fontFamily:"'DM Sans',sans-serif" }}>
        <span style={{ color:ACCENT, fontWeight:500 }}>Source: </span>
        {isLive
          ? "Live data from your QuickBooks account, stored in Supabase. Expenses tagged to jobs appear here; untagged expenses appear in the Expense Inbox."
          : "Demo data shown as fallback. Connect QuickBooks and run a sync to see your real data here."}
      </div>
    </div>
  );
}

// ─── TAB: CLIENT SCORECARD ────────────────────────────────────────────────────

function ClientScorecard({ jobSummaries }) {
  const [sort, setSort] = useState("profit");

  // Aggregate jobs by client
  const clientMap = {};
  jobSummaries.forEach(j => {
    if (!clientMap[j.clientName]) {
      clientMap[j.clientName] = { name: j.clientName, jobs: 0, revenue: 0, costs: 0, profit: 0, outstanding: 0 };
    }
    clientMap[j.clientName].jobs++;
    clientMap[j.clientName].revenue    += j.revenue;
    clientMap[j.clientName].costs      += j.costs;
    clientMap[j.clientName].profit     += j.profit;
    clientMap[j.clientName].outstanding += j.outstanding;
  });

  const clients = Object.values(clientMap).map(c => ({
    ...c,
    avgMargin: c.revenue > 0 ? ((c.profit / c.revenue) * 100).toFixed(1) : "0.0",
    avgJobSize: c.jobs > 0 ? Math.round(c.revenue / c.jobs) : 0,
  })).sort((a, b) => {
    if (sort === "profit")   return b.profit - a.profit;
    if (sort === "revenue")  return b.revenue - a.revenue;
    if (sort === "margin")   return parseFloat(b.avgMargin) - parseFloat(a.avgMargin);
    if (sort === "jobs")     return b.jobs - a.jobs;
    return a.name.localeCompare(b.name);
  });

  const topClient = clients[0];

  return (
    <div style={{ padding:"32px 36px", background:BG, minHeight:"100vh" }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:DARK,letterSpacing:"-0.01em" }}>Client Profitability</h1>
        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginTop:4 }}>Which clients consistently bring your most profitable work?</p>
      </div>

      {/* Top client highlight */}
      {topClient && (
        <div style={{ marginBottom:24,padding:"20px 24px",borderRadius:6,border:`1px solid rgba(92,122,90,0.3)`,background:"rgba(92,122,90,0.04)",display:"flex",alignItems:"center",gap:32 }}>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:DIM,textTransform:"uppercase",marginBottom:6,fontWeight:500 }}>Top Client by Profit</div>
            <div style={{ fontFamily:"'Lora',serif",fontSize:20,fontWeight:500,color:DARK }}>{topClient.name}</div>
          </div>
          {[
            { label:"Total Profit",    val:$(topClient.profit) },
            { label:"Total Revenue",   val:$(topClient.revenue) },
            { label:"Avg Margin",      val:`${topClient.avgMargin}%` },
            { label:"Jobs",            val:topClient.jobs },
            { label:"Avg Job Size",    val:$(topClient.avgJobSize) },
          ].map((k,i) => (
            <div key={i}>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",color:DIM,textTransform:"uppercase",marginBottom:4,fontWeight:500 }}>{k.label}</div>
              <div style={{ fontFamily:"'Lora',serif",fontSize:18,fontWeight:500,color:ACCENT2 }}>{k.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sort controls */}
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
        <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM }}>Sort by:</span>
        {[["profit","Total Profit"],["revenue","Revenue"],["margin","Avg Margin"],["jobs","# Jobs"],["name","Name"]].map(([k,l]) => (
          <button key={k} className={`btn${sort===k?" act":""}`} onClick={()=>setSort(k)}>{l}</button>
        ))}
      </div>

      {/* Client table */}
      <div className="card" style={{ overflow:"hidden" }}>
        <div className="thead" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr" }}>
          {["Client","# Jobs","Total Revenue","Total Costs","Total Profit","Avg Margin"].map(h => (
            <div key={h} className="th">{h}</div>
          ))}
        </div>
        {clients.map((cl, i) => {
          const win = cl.profit > 0;
          return (
            <div key={i} className="trow" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",borderLeft:`3px solid ${win?ACCENT2:RED}` }}>
              <div className="tcell" style={{ color:DARK,fontWeight:500,fontFamily:"'DM Sans',sans-serif" }}>
                {cl.name}
                {cl.outstanding > 0 && <span style={{ marginLeft:8,fontSize:9,padding:"2px 7px",borderRadius:3,background:"rgba(140,107,48,0.1)",color:AMBER,fontWeight:500 }}>A/R {$(cl.outstanding)}</span>}
              </div>
              <div className="tcell mono" style={{ color:MID,fontSize:12 }}>{cl.jobs}</div>
              <div className="tcell mono" style={{ color:MID,fontSize:12 }}>{$(cl.revenue)}</div>
              <div className="tcell mono" style={{ color:MID,fontSize:12 }}>{$(cl.costs)}</div>
              <div className="tcell"><span className={`chip ${win?"g":"r"}`}>{win?"+":"-"}{$(cl.profit)}</span></div>
              <div className="tcell"><span className={`chip ${parseFloat(cl.avgMargin)>=20?"g":parseFloat(cl.avgMargin)>=0?"a":"r"}`}>{cl.avgMargin}%</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TAB: REPORTS ─────────────────────────────────────────────────────────────

// Excel export — uses SheetJS loaded from CDN via a dynamic import shim
function exportToExcel(data, title) {
  // Dynamically load XLSX from CDN if not already present
  if (!window.XLSX) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => doExcelExport(data, title);
    document.head.appendChild(script);
  } else {
    doExcelExport(data, title);
  }
}

function doExcelExport(data, title) {
  const XLSX = window.XLSX;
  // Build header row with readable column names
  const headers = Object.keys(data[0] || {}).map(k =>
    k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1')
  );
  // Build data rows — format numbers nicely
  const rows = data.map(row =>
    Object.entries(row).map(([k, v]) => {
      if (typeof v === 'number') {
        if (k === 'margin') return `${v}%`;
        if (k === 'jobs')   return v;
        return v; // keep raw numbers so Excel can format them
      }
      return v;
    })
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
  XLSX.writeFile(wb, `Canopy - ${title} - ${new Date().toLocaleDateString('en-US')}.xlsx`);
}

// PDF export — renders report content into a clean new window and prints it
function exportToPDF(title, insight, reportData, report) {
  const formatVal = (k, v) => {
    if (typeof v !== 'number') return v;
    if (k === 'margin') return `${v}%`;
    if (k === 'jobs')   return v;
    return `$${Math.abs(v).toLocaleString()}`;
  };

  const headers = Object.keys(reportData[0] || {});

  const tableRows = reportData.map(row =>
    `<tr>${headers.map(k => `<td>${formatVal(k, row[k])}</td>`).join('')}</tr>`
  ).join('');

  const tableHTML = `
    <table>
      <thead><tr>${headers.map(k => `<th>${k.charAt(0).toUpperCase() + k.slice(1)}</th>`).join('')}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Canopy — ${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: white; color: #2C2416; padding: 32px 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #DDD5C4; }
    .logo { font-size: 18px; font-weight: bold; color: #1A3C2E; }
    .logo span { font-size: 10px; display: block; color: #A89880; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; font-weight: normal; }
    .date { font-size: 11px; color: #A89880; text-align: right; }
    h1 { font-size: 20px; font-weight: bold; color: #2C2416; margin-bottom: 4px; }
    .desc { font-size: 12px; color: #6B5E4E; margin-bottom: 20px; }
    .insight { background: #F0F5EF; border: 1px solid rgba(92,122,90,0.3); border-left: 4px solid #2D6A4F; border-radius: 4px; padding: 14px 16px; margin-bottom: 24px; }
    .insight-label { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #2D6A4F; font-weight: bold; margin-bottom: 6px; }
    .insight-text { font-size: 12px; color: #6B5E4E; line-height: 1.7; }
    .section-label { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #A89880; font-weight: bold; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #F5F0E8; padding: 8px 12px; text-align: left; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: #A89880; border-bottom: 1px solid #DDD5C4; font-weight: 500; }
    td { padding: 10px 12px; border-bottom: 1px solid #EDE8DC; color: #6B5E4E; }
    tr:last-child td { border-bottom: none; }
    td:not(:first-child) { font-family: 'Courier New', monospace; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #DDD5C4; font-size: 10px; color: #A89880; display: flex; justify-content: space-between; }
    @media print { @page { margin: 1cm; size: A4 landscape; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Canopy <span>Business Intelligence</span></div>
    </div>
    <div class="date">
      ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </div>
  </div>

  <h1>${title}</h1>
  <div class="desc">${report.description}</div>

  <div class="insight">
    <div class="insight-label">Canopy Insight</div>
    <div class="insight-text">${insight}</div>
  </div>

  <div class="section-label">Data</div>
  ${tableHTML}

  <div class="footer">
    <span>Canopy Business Intelligence · app.canopybi.com</span>
    <span>Confidential — for internal use only</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow popups for app.canopybi.com to use PDF export.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

function ExportButtons({ data, title, insight, report, compact = false }) {
  const [exporting, setExporting] = useState(false);

  function handleExcel() {
    setExporting(true);
    setTimeout(() => {
      exportToExcel(data, title);
      setExporting(false);
    }, 100);
  }

  function handlePDF() {
    exportToPDF(title, insight, data, report);
  }

  if (compact) {
    return (
      <div style={{ display:"flex",gap:6 }}>
        <button className="btn" onClick={handlePDF} title="Export to PDF" style={{ fontSize:10,padding:"4px 10px" }}>PDF</button>
        <button className="btn" onClick={handleExcel} disabled={exporting} title="Export to Excel" style={{ fontSize:10,padding:"4px 10px" }}>{exporting?"…":"XLS"}</button>
      </div>
    );
  }

  return (
    <div style={{ display:"flex",gap:8 }}>
      <button className="btn no-print" onClick={handlePDF} style={{ fontSize:11,display:"flex",alignItems:"center",gap:5 }}>
        <span style={{ fontSize:13 }}>⬇</span> Export PDF
      </button>
      <button className="btn no-print" onClick={handleExcel} disabled={exporting} style={{ fontSize:11,display:"flex",alignItems:"center",gap:5 }}>
        <span style={{ fontSize:13 }}>⬇</span> {exporting ? "Preparing…" : "Export Excel"}
      </button>
    </div>
  );
}

function Reports({ jobSummaries }) {
  const [activeReport, setActiveReport] = useState(null);

  const totalRev    = jobSummaries.reduce((s,j) => s + j.revenue, 0);
  const totalCost   = jobSummaries.reduce((s,j) => s + j.costs, 0);
  const totalProfit = totalRev - totalCost;

  const REPORTS = [
    {
      id: "top-job-types",
      title: "Most Profitable Job Type",
      description: "Average margin by job category — see which type of work earns you the most.",
      icon: "▲",
      compute: () => {
        const byType = {};
        jobSummaries.forEach(j => {
          if (!byType[j.type]) byType[j.type] = { type:j.type, revenue:0, costs:0, jobs:0 };
          byType[j.type].revenue += j.revenue;
          byType[j.type].costs   += j.costs;
          byType[j.type].jobs++;
        });
        return Object.values(byType).map(t => ({
          name: t.type,
          margin: t.revenue > 0 ? parseFloat(((t.revenue-t.costs)/t.revenue*100).toFixed(1)) : 0,
          profit: t.revenue - t.costs,
          jobs: t.jobs,
        })).sort((a,b) => b.margin - a.margin);
      },
      chartType: "bar", dataKey: "margin", color: ACCENT2, yLabel: "% Margin",
      insight: (data) => {
        const best = data[0]; const worst = data[data.length-1];
        return `Your ${best?.name} jobs lead with ${best?.margin}% average margin — ${(best?.margin - worst?.margin).toFixed(1)} points ahead of ${worst?.name} work (${worst?.margin}%). Focus new business development on your highest-margin job types.`;
      }
    },
    {
      id: "worst-jobs",
      title: "Worst Performing Jobs",
      description: "Bottom 5 jobs by profit — understand where money is being lost.",
      icon: "▼",
      compute: () => [...jobSummaries].sort((a,b) => a.profit - b.profit).slice(0,5).map(j => ({ name:j.name, profit:j.profit, margin:parseFloat(j.marginPct) })),
      chartType: "bar", dataKey: "profit", color: RED, yLabel: "$ Profit",
      insight: (data) => {
        const worst = data[0];
        const totalLoss = data.filter(d=>d.profit<0).reduce((s,d)=>s+Math.abs(d.profit),0);
        return `${worst?.name} is your worst performing job at ${$(worst?.profit)} profit. Across your bottom 5 jobs, ${$(totalLoss)} in losses. Review pricing strategy and cost controls on these job types.`;
      }
    },
    {
      id: "monthly-trend",
      title: "Monthly Profit Trend",
      description: "Revenue, costs, and profit over time — see how your business is tracking.",
      icon: "📈",
      compute: () => {
        const monthMap = {};
        jobSummaries.forEach(j => {
          j.invoices.forEach(inv => {
            if (!inv.TxnDate) return;
            const d   = new Date(inv.TxnDate);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            const label = `${d.toLocaleDateString('en-US', { month:'short' })} '${String(d.getFullYear()).slice(-2)}`;
            if (!monthMap[key]) monthMap[key] = { month:label, date:key+'-01', revenue:0, costs:0 };
            monthMap[key].revenue += inv.TotalAmt || 0;
          });
          j.purchases.forEach(p => {
            if (!p.TxnDate) return;
            const d   = new Date(p.TxnDate);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            const label = `${d.toLocaleDateString('en-US', { month:'short' })} '${String(d.getFullYear()).slice(-2)}`;
            if (!monthMap[key]) monthMap[key] = { month:label, date:key+'-01', revenue:0, costs:0 };
            monthMap[key].costs += p.TotalAmt || 0;
          });
        });
        const trend = Object.values(monthMap).sort((a,b)=>a.date.localeCompare(b.date)).map(d=>({...d, profit:d.revenue-d.costs}));
        return trend.length > 0 ? trend : MONTHLY_TREND;
      },
      chartType: "line", dataKey: "profit", color: ACCENT2, yLabel: "$ Amount",
      insight: (data) => {
        const recent = data[data.length-1]; const prev = data[data.length-2];
        const change = recent && prev ? recent.profit - prev.profit : 0;
        return `Your most recent month shows ${$(recent?.profit)} profit — ${change >= 0 ? "up" : "down"} ${$(Math.abs(change))} from the prior month. ${change >= 0 ? "Positive momentum — keep monitoring costs as revenue grows." : "Review which jobs closed that month and whether cost overruns were the driver."}`;
      }
    },
    {
      id: "client-ranking",
      title: "Client Profitability Ranking",
      description: "Total profit generated per client — know your most valuable relationships.",
      icon: "★",
      compute: () => {
        const byClient = {};
        jobSummaries.forEach(j => {
          if (!byClient[j.clientName]) byClient[j.clientName] = { name:j.clientName, profit:0, revenue:0 };
          byClient[j.clientName].profit  += j.profit;
          byClient[j.clientName].revenue += j.revenue;
        });
        return Object.values(byClient).sort((a,b)=>b.profit-a.profit).map(c=>({ name:c.name, profit:c.profit, revenue:c.revenue }));
      },
      chartType: "bar", dataKey: "profit", color: ACCENT, yLabel: "$ Profit",
      insight: (data) => {
        const top = data[0];
        const pct = totalProfit > 0 ? ((top?.profit/totalProfit)*100).toFixed(0) : 0;
        return `${top?.name} is your most profitable client, generating ${$(top?.profit)} — ${pct}% of your total profit. Consider what makes this relationship work and replicate it with similar clients.`;
      }
    },
  ];

  const report     = activeReport ? REPORTS.find(r => r.id === activeReport) : null;
  const reportData = report ? report.compute() : [];

  // ── Individual report view ──
  if (report) {
    const insight = report.insight(reportData);
    return (
      <div style={{ padding:"32px 36px", background:BG, minHeight:"100vh" }}>

        {/* Header row */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28 }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <button className="btn no-print" onClick={()=>setActiveReport(null)}>← All Reports</button>
            <div>
              <h1 style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:DARK,letterSpacing:"-0.01em" }}>{report.title}</h1>
              <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginTop:4 }}>{report.description}</p>
            </div>
          </div>
          {/* Export buttons — full size on individual report page */}
          <ExportButtons data={reportData} title={report.title} insight={insight} report={report} />
        </div>

        {/* Print-only header (hidden on screen, shown when printing) */}
        <div className="print-only" style={{ display:"none",marginBottom:20 }}>
          <div style={{ fontFamily:"Arial,sans-serif",fontSize:10,color:"#888",marginBottom:4 }}>Canopy Business Intelligence · {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
          <div style={{ fontFamily:"Arial,sans-serif",fontSize:18,fontWeight:"bold",color:"#2C2416" }}>{report.title}</div>
          <div style={{ fontFamily:"Arial,sans-serif",fontSize:12,color:"#6B5E4E",marginTop:4 }}>{report.description}</div>
        </div>

        {/* Canopy Insight card */}
        <div style={{ marginBottom:24,padding:"16px 20px",borderRadius:6,border:`1px solid rgba(92,122,90,0.25)`,background:"rgba(92,122,90,0.04)" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.12em",color:ACCENT2,textTransform:"uppercase",marginBottom:8,fontWeight:500 }}>Canopy Insight</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:MID,lineHeight:1.7 }}>{insight}</div>
        </div>

        {/* Chart */}
        <div className="card" style={{ padding:"22px 26px",marginBottom:24 }}>
          <ResponsiveContainer width="100%" height={320}>
            {report.chartType === "bar" ? (
              <BarChart data={reportData} margin={{ top:4,right:4,left:16,bottom:60 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false}/>
                <XAxis dataKey="name" interval={0} height={80} tick={({ x, y, payload }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={4} textAnchor="end" fill={DIM} fontSize={9} fontFamily="DM Mono" transform="rotate(-45)">
                      {payload.value.length > 16 ? payload.value.slice(0,16)+"…" : payload.value}
                    </text>
                  </g>
                )}/>
                <YAxis tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} tickFormatter={$k} axisLine={false} tickLine={false} width={56}/>
                <Tooltip formatter={(v) => [report.dataKey==="margin"?`${v}%`:$(v), report.yLabel]} contentStyle={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:5,fontFamily:"'DM Mono',monospace",fontSize:11 }}/>
                <ReferenceLine y={0} stroke={BORDER}/>
                <Bar dataKey={report.dataKey} radius={[3,3,0,0]}>
                  {reportData.map((e,i) => <Cell key={i} fill={(e[report.dataKey]||0)>=0?report.color:RED} opacity={0.85}/>)}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={reportData} margin={{ top:4,right:16,left:16,bottom:0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false}/>
                <XAxis dataKey="month" tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} tickFormatter={$k} axisLine={false} tickLine={false} width={56}/>
                <Tooltip content={ChartTip}/>
                <Line type="monotone" dataKey="revenue" stroke={DIM} strokeWidth={1.5} dot={false} name="Revenue"/>
                <Line type="monotone" dataKey="costs" stroke={RED} strokeWidth={1.5} dot={false} name="Costs" strokeDasharray="4 2"/>
                <Line type="monotone" dataKey="profit" stroke={ACCENT2} strokeWidth={2.5} dot={{ r:3,fill:ACCENT2 }} name="Profit"/>
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Data table */}
        <div className="card" style={{ overflow:"hidden" }}>
          <div style={{ padding:"14px 20px",borderBottom:`1px solid ${BORDER}`,background:BG,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div style={{ fontFamily:"'Lora',serif",fontSize:13,color:MID,fontStyle:"italic" }}>Underlying data</div>
          </div>
          <table className="raw-table" style={{ width:"100%" }}>
            <thead>
              <tr>{Object.keys(reportData[0]||{}).map(k=>(
                <th key={k} style={{ textTransform:"capitalize" }}>
                  {k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())}
                </th>
              ))}</tr>
            </thead>
            <tbody>
              {reportData.map((row,i) => (
                <tr key={i}>
                  {Object.entries(row).map(([k,v],j) => (
                    <td key={j} className={typeof v==="number"&&k!=="jobs"?"mono":""}>
                      {typeof v==="number"&&k!=="jobs" ? (k==="margin"?`${v}%`:$(v)) : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Report library view ──
  return (
    <div style={{ padding:"32px 36px", background:BG, minHeight:"100vh" }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:"'Lora',serif",fontSize:22,fontWeight:500,color:DARK,letterSpacing:"-0.01em" }}>Report Library</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginTop:4 }}>Pre-built reports — open any report to view, export to PDF, or download as Excel.</p>
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        {REPORTS.map(r => {
          const data = r.compute();
          return (
            <div key={r.id} className="card" style={{ padding:"24px 28px",transition:"all 0.15s" }}
              onMouseOver={e=>e.currentTarget.style.borderColor=ACCENT}
              onMouseOut={e=>e.currentTarget.style.borderColor=BORDER}
            >
              <div style={{ display:"flex",alignItems:"flex-start",gap:14,marginBottom:16 }}>
                <div style={{ fontSize:22,lineHeight:1 }}>{r.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Lora',serif",fontSize:16,fontWeight:500,color:DARK,marginBottom:6 }}>{r.title}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID,lineHeight:1.6 }}>{r.description}</div>
                </div>
              </div>
              {/* Action row — open + export buttons */}
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:14,borderTop:`1px solid ${BORDER}` }}>
                <button className="btn act" onClick={()=>setActiveReport(r.id)} style={{ fontSize:11 }}>Open report →</button>
                {/* Compact export buttons on library card */}
                <ExportButtons data={data} title={r.title} insight={r.insight(data)} report={r} compact={true} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin() {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }
    // Fetch contractor profile to get client_type
    const { data: profile } = await supabase
      .from("contractors")
      .select("*")
      .eq("id", data.user.id)
      .single();
    onLogin(data.user, profile);
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{css}</style>

      {/* Logo */}
      <div style={{ marginBottom:40, textAlign:"center" }}>
        <div style={{ fontFamily:"'Lora',serif", fontSize:32, fontWeight:500, color:DARK, letterSpacing:"-0.02em" }}>Canopy</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:"0.14em", color:DIM, textTransform:"uppercase", marginTop:4 }}>Business Intelligence</div>
      </div>

      {/* Card */}
      <div style={{ width:"100%", maxWidth:400, background:CARD, border:`1px solid ${BORDER}`, borderRadius:8, padding:"36px 40px", boxShadow:"0 4px 24px rgba(44,36,22,0.08)" }}>
        <h2 style={{ fontFamily:"'Lora',serif", fontSize:20, fontWeight:500, color:DARK, marginBottom:6, letterSpacing:"-0.01em" }}>Sign in to your account</h2>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:DIM, marginBottom:28 }}>Enter your credentials below to access your dashboard.</p>

        {/* Email */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500, color:MID, letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:6 }}>Email</label>
          <input
            type="email"
            className="chat-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="you@example.com"
            autoFocus
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom:24 }}>
          <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500, color:MID, letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:6 }}>Password</label>
          <input
            type="password"
            className="chat-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom:16, padding:"10px 14px", borderRadius:4, background:"rgba(140,64,64,0.07)", border:`1px solid rgba(140,64,64,0.2)`, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:RED }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          className="btn act"
          onClick={handleLogin}
          disabled={loading}
          style={{ width:"100%", padding:"12px", fontSize:13, opacity:loading ? 0.6 : 1, letterSpacing:"0.03em" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>

      {/* Footer */}
      <div style={{ marginTop:24, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:DIM, textAlign:"center" }}>
        Don't have an account? Contact your Canopy administrator.
      </div>
    </div>
  );
}

// ─── SUPABASE DATA HOOK ───────────────────────────────────────────────────────

function useContractorData(userId, mockJobSummaries, mockUntagged) {
  const [liveJobSummaries, setLiveJobSummaries] = useState(null);
  const [liveUntagged, setLiveUntagged]         = useState(null);
  const [liveOverhead, setLiveOverhead]         = useState([]);
  const [liveDismissed, setLiveDismissed]       = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [dataSource, setDataSource]             = useState('mock');

  async function loadLiveData() {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs').select('*').eq('contractor_id', userId);

      if (jobsError || !jobs || jobs.length === 0) {
        setLoading(false);
        return;
      }

      const { data: transactions } = await supabase
        .from('transactions').select('*').eq('contractor_id', userId);

      const { data: inboxItems } = await supabase
        .from('inbox_tags')
        .select('*')
        .eq('contractor_id', userId)
        .eq('status', 'pending');

      // Fetch overhead (fixed cost) items
      const { data: overheadItems } = await supabase
        .from('inbox_tags')
        .select('*')
        .eq('contractor_id', userId)
        .eq('status', 'overhead');

      // Fetch dismissed items
      const { data: dismissedItems } = await supabase
        .from('inbox_tags')
        .select('*')
        .eq('contractor_id', userId)
        .eq('status', 'dismissed');

      const liveSummaries = jobs.map(job => {
        const jobTxns   = (transactions || []).filter(t => t.job_id === job.id);
        const invoices  = jobTxns.filter(t => t.type === 'revenue');
        const expenses  = jobTxns.filter(t => t.type === 'expense');
        const revenue   = invoices.reduce((s, t) => s + (t.amount || 0), 0);
        const costs     = expenses.reduce((s, t) => s + (t.amount || 0), 0);
        const profit    = revenue - costs;
        const marginPct = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';
        const costByVendor = {};
        expenses.forEach(t => {
          if (t.vendor) costByVendor[t.vendor] = (costByVendor[t.vendor] || 0) + t.amount;
        });
        const invoiceObjs = invoices.map(t => ({
          Id: t.id, DocNumber: t.doc_number, TxnDate: t.txn_date,
          TotalAmt: t.amount, Balance: 0,
          Line: [{ Description: t.description, Amount: t.amount }],
          CustomerRef: { value: job.qb_job_id || job.id }
        }));
        const purchaseObjs = expenses.map(t => ({
          Id: t.id, DocNumber: t.doc_number, TxnDate: t.txn_date,
          TotalAmt: t.amount, EntityRef: { name: t.vendor || 'Unknown' },
          Line: [{ Amount: t.amount, Description: t.description,
            AccountBasedExpenseLineDetail: { CustomerRef: { value: job.qb_job_id || job.id } } }]
        }));
        return {
          id: job.id, name: job.name, clientName: job.client_name || '',
          type: job.job_type || 'General Construction', status: job.status || 'Complete',
          revenue, costs, profit, marginPct, outstanding: 0,
          invoices: invoiceObjs, purchases: purchaseObjs, costByVendor,
          firstDate: invoices[0]?.txn_date || '', lastDate: invoices[invoices.length-1]?.txn_date || '',
        };
      }).filter(j => j.revenue > 0 || j.costs > 0);

      const parsedUntagged = (inboxItems || []).map(item => ({
        id: item.id, docNumber: item.doc_number, vendor: item.vendor,
        date: item.txn_date, amount: item.amount, description: item.description,
        paymentType: item.payment_type || 'Check',
        suggestedJob: item.suggested_job_id, suggestionReason: item.suggestion_reason,
      }));

      const parsedOverhead = (overheadItems || []).map(item => ({
        id: item.id, docNumber: item.doc_number, vendor: item.vendor,
        date: item.txn_date, amount: item.amount, description: item.description,
        paymentType: item.payment_type || 'Check',
      }));

      const parsedDismissed = (dismissedItems || []).map(item => ({
        id: item.id, docNumber: item.doc_number, vendor: item.vendor,
        date: item.txn_date, amount: item.amount, description: item.description,
        paymentType: item.payment_type || 'Check',
      }));

      if (liveSummaries.length > 0) {
        setLiveJobSummaries(liveSummaries);
        setLiveUntagged(parsedUntagged);
        setLiveOverhead(parsedOverhead);
        setLiveDismissed(parsedDismissed);
        setDataSource('live');
      }
    } catch (err) {
      console.error('Error loading live data:', err);
    }
    setLoading(false);
  }

  useEffect(() => { loadLiveData(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    jobSummaries: liveJobSummaries || mockJobSummaries,
    untagged:     liveUntagged     || mockUntagged,
    overhead:     liveOverhead,
    dismissed:    liveDismissed,
    loading,
    dataSource,
    refresh: loadLiveData,
  };
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession]           = useState(null);
  const [profile, setProfile]           = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [tab, setTab]                   = useState("dashboard");
  const [selectedJob, setSelectedJob]   = useState(null);
  const [tagged, setTagged]             = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [qbConnected, setQbConnected]   = useState(false);
  const [qbError, setQbError]           = useState(null);
  const [syncing, setSyncing]           = useState(false);

  // ── Live data hook — loads from Supabase, falls back to mock
  const mockJobSummaries = buildJobSummaries({});
  const {
    jobSummaries: baseJobSummaries,
    untagged: baseUntagged,
    overhead,
    dismissed,
    dataSource,
    refresh: refreshData,
  } = useContractorData(session?.user?.id, mockJobSummaries, INITIAL_UNTAGGED);

  // Apply tagged expense costs on top of live/mock data
  const extraCostsByJob = tagged.reduce((acc, t) => {
    acc[t.taggedJobId] = (acc[t.taggedJobId] || 0) + t.amount;
    return acc;
  }, {});

  // Merge extra tagged costs into job summaries
  const jobSummaries = baseJobSummaries.map(j => {
    const extra = extraCostsByJob[j.id] || 0;
    if (!extra) return j;
    const costs  = j.costs + extra;
    const profit = j.revenue - costs;
    return { ...j, costs, profit, marginPct: j.revenue > 0 ? ((profit/j.revenue)*100).toFixed(1) : '0.0' };
  });

  // Untagged — filter out items already tagged this session
  const taggedIds = new Set(tagged.map(t => t.id));
  const untagged  = baseUntagged.filter(u => !taggedIds.has(u.id));

  // ── Trigger a QB sync after successful OAuth connect
  async function triggerSync(userId) {
    setSyncing(true);
    try {
      const res = await fetch(`/api/qb-sync?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        console.log('QB sync complete:', data.summary);
        await refreshData();
      } else {
        console.error('QB sync failed:', data.error);
      }
    } catch (err) {
      console.error('QB sync error:', err);
    }
    setSyncing(false);
  }

  // ── On mount: check session + handle QB OAuth redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('qb_connected') === 'true') {
      setQbConnected(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('qb_error')) {
      setQbError(params.get('qb_error'));
      window.history.replaceState({}, '', window.location.pathname);
    }

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        const { data: p } = await supabase.from("contractors").select("*").eq("id", s.user.id).single();
        setProfile(p);
        if (p?.qb_realm_id) setQbConnected(true);
        // If just came back from QB connect, trigger a sync
        const params2 = new URLSearchParams(window.location.search);
        if (params2.get('qb_connected') === 'true') {
          triggerSync(s.user.id);
        }
        const dismissed = localStorage.getItem(`canopy_disclaimer_${s.user.id}`);
        if (!dismissed) setShowDisclaimer(true);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) { setProfile(null); setTab("dashboard"); setShowDisclaimer(false); setQbConnected(false); }
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogin(user, contractorProfile) {
    setSession({ user });
    setProfile(contractorProfile);
    if (contractorProfile?.qb_realm_id) setQbConnected(true);
    const dismissed = localStorage.getItem(`canopy_disclaimer_${user.id}`);
    if (!dismissed) setShowDisclaimer(true);
  }

  function dismissDisclaimer() {
    if (session?.user?.id) localStorage.setItem(`canopy_disclaimer_${session.user.id}`, 'true');
    setShowDisclaimer(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null); setProfile(null); setTab("dashboard");
    setShowDisclaimer(false); setQbConnected(false); setQbError(null);
  }

  // ── Show nothing while checking session on first load
  if (authLoading) {
    return (
      <div style={{ minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{css}</style>
        <div style={{ fontFamily:"'Lora',serif", fontSize:16, color:DIM, fontStyle:"italic" }}>Loading...</div>
      </div>
    );
  }

  if (!session) return <Login onLogin={handleLogin} />;

  const clientType     = profile?.client_type || "quickbooks";
  const contractorName = profile?.name || session?.user?.email || "Your Account";

  function handleJobClick(job) {
    setSelectedJob(job);
    setTab("detail");
  }

  async function handleTag(item, jobId, jobName) {
    // Optimistically update local state immediately so UI feels instant
    setTagged(prev => [...prev, { ...item, taggedJobId: jobId, taggedJobName: jobName }]);
    if (selectedJob && selectedJob.id === jobId) {
      const updated = jobSummaries.find(j => j.id === jobId);
      if (updated) setSelectedJob(updated);
    }

    // Write tag to Supabase — update inbox_tags row status and linked job
    try {
      await supabase
        .from('inbox_tags')
        .update({ status: 'tagged', tagged_job_id: jobId })
        .eq('id', item.id);

      // Also add as a transaction so it shows in job costs
      await supabase
        .from('transactions')
        .upsert({
          id:            `${session.user.id}_inbox_${item.id}`,
          contractor_id: session.user.id,
          job_id:        jobId,
          type:          'expense',
          doc_number:    item.docNumber,
          txn_date:      item.date,
          amount:        item.amount,
          description:   item.description,
          vendor:        item.vendor,
        }, { onConflict: 'id' });

      // Refresh live data so Data Quality Score and job costs update
      await refreshData();
    } catch (err) {
      console.error('Error saving tag to Supabase:', err);
    }
  }

  async function handleMarkOverhead(item) {
    // Optimistically remove from untagged
    setTagged(prev => prev.filter(u => u.id !== item.id));

    try {
      await supabase
        .from('inbox_tags')
        .update({ status: 'overhead' })
        .eq('id', item.id);

      await refreshData();
    } catch (err) {
      console.error('Error marking as overhead:', err);
    }
  }

  async function handleDismiss(id) {
    setTagged(prev => prev.filter(u => u.id !== id));
    try {
      await supabase
        .from('inbox_tags')
        .update({ status: 'dismissed' })
        .eq('id', id);
      await refreshData();
    } catch (err) {
      console.error('Error saving dismissal to Supabase:', err);
    }
  }

  async function handleRestore(id) {
    try {
      await supabase
        .from('inbox_tags')
        .update({ status: 'pending' })
        .eq('id', id);
      await refreshData();
    } catch (err) {
      console.error('Error restoring expense:', err);
    }
  }

  const inboxCount = untagged.length;

  const TABS = [
    { key:"dashboard", label:"Dashboard" },
    ...(clientType === "quickbooks" ? [{ key:"inbox", label:"Expense Inbox" }] : []),
    { key:"detail",    label:"Job Detail" },
    { key:"clients",   label:"Clients" },
    { key:"reports",   label:"Reports" },
    { key:"chat",      label:"AI Analyst" },
    ...(clientType === "quickbooks" ? [{ key:"raw", label:"Raw Data" }] : []),
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:BG, minHeight:"100vh", color:DARK, display:"flex", flexDirection:"column" }}>
      <style>{css}</style>

      {/* ── First-login disclaimer modal ── */}
      {showDisclaimer && (
        <div style={{ position:"fixed", inset:0, background:"rgba(44,36,22,0.5)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:8, width:"100%", maxWidth:520, boxShadow:"0 20px 60px rgba(44,36,22,0.2)", padding:"32px 36px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:20 }}>
              <div style={{ width:36, height:36, borderRadius:6, background:"rgba(140,107,48,0.1)", border:`1px solid rgba(140,107,48,0.25)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>ℹ</div>
              <div>
                <h2 style={{ fontFamily:"'Lora',serif", fontSize:18, fontWeight:500, color:DARK, marginBottom:4 }}>A note about your data</h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:DIM }}>Please read before using your dashboard</p>
              </div>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:MID, lineHeight:1.75, marginBottom:24 }}>
              <p style={{ marginBottom:12 }}>The figures shown in Canopy are derived directly from your <strong style={{ color:DARK }}>QuickBooks Online account</strong>. Canopy does not modify, verify, or audit your QuickBooks data — any inaccuracies or incomplete records in QuickBooks will be reflected here.</p>
              <p style={{ marginBottom:12 }}>Common sources of inaccurate data include <strong style={{ color:DARK }}>untagged expenses</strong> (visible in the Expense Inbox), missing invoices, or duplicate entries. Your Data Quality Score on the dashboard indicates how complete your records are.</p>
              <p>Canopy is provided for <strong style={{ color:DARK }}>informational purposes only</strong> and does not constitute financial, tax, or accounting advice. Always consult your accountant or bookkeeper before making significant business decisions.</p>
            </div>
            <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:11, color:DIM, fontFamily:"'DM Sans',sans-serif" }}>This notice will not appear again after dismissal.</div>
              <button className="btn act" onClick={dismissDisclaimer} style={{ padding:"9px 24px", fontSize:12 }}>I understand — continue</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ borderBottom:`1px solid ${BORDER}`, background:CARD, position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 4px rgba(44,36,22,0.06)" }}>
        <div style={{ padding:"0 36px", display:"flex", alignItems:"center", gap:0 }}>
          <div style={{ marginRight:36, paddingTop:14, paddingBottom:14, borderRight:`1px solid ${BORDER}`, paddingRight:36 }}>
            <div style={{ fontFamily:"'Lora',serif", fontSize:18, fontWeight:500, color:DARK, letterSpacing:"-0.01em" }}>Canopy</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"0.1em", color:DIM, textTransform:"uppercase", marginTop:1 }}>Business Intelligence</div>
          </div>
          {TABS.map(t => (
            <div key={t.key} className={`nav-tab${tab===t.key?" active":""}`} onClick={()=>setTab(t.key)}>
              {t.label}
              {t.key==="inbox" && inboxCount > 0 && <span className="badge">{inboxCount}</span>}
              {t.key==="inbox" && inboxCount === 0 && tagged.length > 0 && <span className="badge done">✓</span>}
              {t.key==="detail" && selectedJob && <span style={{ marginLeft:6, fontSize:10, color:DIM }}>· {selectedJob.name.split(" ")[0]}</span>}
              {t.key==="chat" && <span style={{ marginLeft:6, fontSize:9, padding:"2px 7px", borderRadius:3, background:"rgba(92,122,90,0.12)", color:ACCENT2, fontWeight:500 }}>AI</span>}
            </div>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:16 }}>
            {/* QB connection status indicator */}
            {clientType === "quickbooks" && (
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, fontFamily:"'DM Sans',sans-serif" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background: qbConnected ? ACCENT2 : AMBER }}/>
                <span style={{ color: qbConnected ? ACCENT2 : AMBER }}>
                  {syncing ? "Syncing data…" : qbConnected ? "QuickBooks connected" : "QuickBooks not connected"}
                </span>
                {qbConnected && !syncing && dataSource === 'live' && (
                  <span style={{ color:DIM, fontSize:9 }}>· live data</span>
                )}
                {qbConnected && !syncing && dataSource === 'mock' && (
                  <span style={{ color:DIM, fontSize:9 }}>· demo data</span>
                )}
              </div>
            )}
            <div style={{ fontSize:11, color:DIM, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6, paddingLeft:16, borderLeft:`1px solid ${BORDER}` }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:ACCENT2, opacity:0.7 }}/>
              {contractorName}
            </div>
            <button className="btn" onClick={handleSignOut} style={{ fontSize:11, padding:"5px 12px", color:DIM }}>Sign Out</button>
          </div>
        </div>
      </div>

      {/* ── QB error banner ── */}
      {qbError && (
        <div style={{ background:"rgba(140,64,64,0.06)", borderBottom:`1px solid rgba(140,64,64,0.2)`, padding:"11px 36px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:13, color:RED, fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ fontWeight:500 }}>QuickBooks connection failed</span>
            <span style={{ color:MID, marginLeft:8 }}>— {qbError.replace(/_/g,' ')}. Please try connecting again.</span>
          </div>
          <button onClick={()=>setQbError(null)} style={{ background:"none", border:"none", cursor:"pointer", color:DIM, fontSize:16, padding:"0 4px" }}>×</button>
        </div>
      )}

      {/* ── QB success / syncing banner ── */}
      {qbConnected && dataSource === 'mock' && (
        <div style={{ background:"rgba(92,122,90,0.06)", borderBottom:`1px solid rgba(92,122,90,0.25)`, padding:"11px 36px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:ACCENT2 }}/>
            <div style={{ fontSize:13, color:ACCENT2, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
              {syncing ? "Syncing your QuickBooks data — this takes about 30 seconds…" : "QuickBooks connected — click to load your real data"}
            </div>
          </div>
          {!syncing && (
            <button className="btn act" style={{ fontSize:11 }} onClick={() => triggerSync(session.user.id)}>
              Sync Now →
            </button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex:1 }}>
        {tab==="dashboard" && <Dashboard onJobClick={handleJobClick} jobSummaries={jobSummaries} untagged={untagged} overhead={overhead} qbConnected={qbConnected} userId={session?.user?.id} clientType={clientType}/>}
        {tab==="inbox"     && <ExpenseInbox untagged={untagged} tagged={tagged} onTag={handleTag} onDismiss={handleDismiss} onMarkOverhead={handleMarkOverhead} onRestore={handleRestore} overhead={overhead} dismissed={dismissed} jobSummaries={jobSummaries}/>}
        {tab==="detail"    && <JobDetail job={selectedJob} onBack={()=>setTab("dashboard")} untagged={untagged}/>}
        {tab==="clients"   && <ClientScorecard jobSummaries={jobSummaries}/>}
        {tab==="reports"   && <Reports jobSummaries={jobSummaries}/>}
        {tab==="chat"      && <AIChat jobSummaries={jobSummaries}/>}
        {tab==="raw"       && <RawData jobSummaries={jobSummaries} dataSource={dataSource}/>}
      </div>

      {/* ── Persistent footer disclaimer ── */}
      <div style={{ background:BG2, borderTop:`1px solid ${BORDER}`, padding:"10px 36px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, lineHeight:1.6 }}>
          <span style={{ fontWeight:500, color:MID }}>Data disclaimer: </span>
          All figures are sourced directly from QuickBooks Online. Canopy does not verify or audit source data — accuracy depends on the completeness of your QuickBooks records.
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, whiteSpace:"nowrap" }}>
          Not financial advice · <span style={{ color:ACCENT, cursor:"pointer", textDecoration:"underline" }} onClick={() => setShowDisclaimer(true)}>View full notice</span>
        </div>
      </div>

    </div>
  );
}
