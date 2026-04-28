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

// ─── MOCK LABOR ENTRIES ──────────────────────────────────────────────────────
// Manual labor cost entries per job — mirrors what contractors will enter.

const MOCK_LABOR_ENTRIES = [
  { id: "LAB001", jobId: "J001", description: "Demo & framing crew", workerName: "Marcus T.", hours: 40, hourlyRate: 55, amount: 2200, workDate: "2024-01-08", source: "manual" },
  { id: "LAB002", jobId: "J001", description: "Finish carpentry", workerName: "Dave R.", hours: 24, hourlyRate: 65, amount: 1560, workDate: "2024-01-15", source: "manual" },
  { id: "LAB003", jobId: "J002", description: "Bathroom framing & tile", workerName: "Marcus T.", hours: 32, hourlyRate: 55, amount: 1760, workDate: "2024-01-22", source: "manual" },
  { id: "LAB004", jobId: "J003", description: "Deck build crew", workerName: "Chris W.", hours: 28, hourlyRate: 50, amount: 1400, workDate: "2024-02-04", source: "manual" },
  { id: "LAB005", jobId: "J004", description: "Commercial demo crew", workerName: "Team Alpha", hours: 80, hourlyRate: 60, amount: 4800, workDate: "2024-02-05", source: "manual" },
  { id: "LAB006", jobId: "J004", description: "Partition & paint crew", workerName: "Team Beta", hours: 60, hourlyRate: 55, amount: 3300, workDate: "2024-02-12", source: "manual" },
  { id: "LAB007", jobId: "J005", description: "Roofing install crew", workerName: "Luis M.", hours: 20, hourlyRate: 60, amount: 1200, workDate: "2024-02-20", source: "manual" },
  { id: "LAB008", jobId: "J006", description: "Full reno crew - phase 1", workerName: "Team Alpha", hours: 120, hourlyRate: 58, amount: 6960, workDate: "2024-03-10", source: "manual" },
  { id: "LAB009", jobId: "J006", description: "Full reno crew - phase 2", workerName: "Team Alpha", hours: 100, hourlyRate: 58, amount: 5800, workDate: "2024-04-01", source: "manual" },
  { id: "LAB010", jobId: "J007", description: "Foundation excavation", workerName: "Chris W.", hours: 16, hourlyRate: 55, amount: 880, workDate: "2024-03-06", source: "manual" },
  { id: "LAB011", jobId: "J008", description: "Garage conversion crew", workerName: "Dave R.", hours: 36, hourlyRate: 60, amount: 2160, workDate: "2024-03-14", source: "manual" },
  { id: "LAB012", jobId: "J009", description: "Addition framing crew", workerName: "Marcus T.", hours: 56, hourlyRate: 58, amount: 3248, workDate: "2024-04-05", source: "manual" },
  { id: "LAB013", jobId: "J009", description: "Plumbing rough-in labor", workerName: "Sub: ProPlumb", hours: 24, hourlyRate: 75, amount: 1800, workDate: "2024-04-10", source: "manual" },
  { id: "LAB014", jobId: "J010", description: "Condo flip crew", workerName: "Team Beta", hours: 48, hourlyRate: 55, amount: 2640, workDate: "2024-03-22", source: "manual" },
];

// ─── MOCK MANUAL EXPENSES ────────────────────────────────────────────────────
// Manual expense entries — cash purchases, petty cash, off-QB expenses.

const MOCK_MANUAL_EXPENSES = [
  { id: "EXP001", jobId: "J001", description: "Cash lumber pickup", vendor: "Home Depot", amount: 420, category: "materials", expenseDate: "2024-01-10", source: "manual" },
  { id: "EXP002", jobId: "J002", description: "Tile adhesive & grout", vendor: "Tile & Stone Direct", amount: 185, category: "materials", expenseDate: "2024-01-24", source: "manual" },
  { id: "EXP003", jobId: "J004", description: "Dumpster rental", vendor: "WastePro", amount: 650, category: "equipment", expenseDate: "2024-02-08", source: "manual" },
  { id: "EXP004", jobId: "J006", description: "Plumbing fixtures cash buy", vendor: "Ferguson Supply", amount: 1120, category: "materials", expenseDate: "2024-03-12", source: "manual" },
  { id: "EXP005", jobId: "J009", description: "Building permits", vendor: "City of Lakeville", amount: 780, category: "permits", expenseDate: "2024-04-02", source: "manual" },
  { id: "EXP006", jobId: null, description: "Office supplies", vendor: "Staples", amount: 95, category: "other", expenseDate: "2024-03-18", source: "manual" },
];

// ─── MOCK MANUAL REVENUE ─────────────────────────────────────────────────────
// Manual revenue entries — cash payments, Zelle, checks not recorded in QB.

const MOCK_MANUAL_REVENUE = [
  { id: "REV001", jobId: "J003", description: "Final payment - cash", amount: 4500, paymentMethod: "cash", revenueDate: "2024-02-28", source: "manual" },
  { id: "REV002", jobId: "J007", description: "Deposit - Zelle", amount: 3000, paymentMethod: "zelle", revenueDate: "2024-03-08", source: "manual" },
  { id: "REV003", jobId: "J010", description: "Progress payment - check", amount: 8500, paymentMethod: "check", revenueDate: "2024-03-25", source: "manual" },
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
  return abs >= 1000 ? `${sign}$${(abs/1000).toFixed(1)}k` : `${sign}$${Math.round(abs)}`;
};

// Earth-tone palette — warm, professional, non-tech
const ACCENT = "#B8622A";   // terracotta / burnt sienna (primary action, highlights)
const ACCENT2 = "#2D5E30";  // deep forest green (profit / positive) — darkened for readability
const RED    = "#9C3535";   // red-clay (losses / at-risk)
const AMBER  = "#C49020";   // rich mustard amber (warnings / secondary)
const BG     = "#EEEAE0";   // warm linen (light, readable contrast with cards)
const BG2    = "#E4DED2";   // slightly deeper taupe (hover/alternate rows)
const CARD   = "#FEFDFB";   // near-white cream (pops cleanly against BG)
const BORDER = "#D4CCBC";   // soft taupe border
const DIM    = "#9C8A74";   // lighter warm grey (widens label/value contrast)
const MID    = "#6B5E4E";   // medium walnut
const DARK   = "#2C2416";   // deep walnut text
const SIDEBAR_BG   = "#1E1810";  // deep espresso sidebar
const SIDEBAR_TEXT = "#C8B89E";  // warm parchment sidebar text
const SIDEBAR_DIM  = "#6B5E4E";  // muted sidebar labels

// Bump this string whenever Privacy Policy or EULA changes materially.
// Existing users with a different version will be shown the consent gate again.
const CONSENT_VERSION = "2026-03";

// ─── BUILD JOB SUMMARIES (reactive — takes extraCosts from tagged inbox items) ─

function buildJobSummaries(extraCostsByJob = {}, laborEntries = [], manualExpenses = [], manualRevenue = []) {
  const jobs = QB_CUSTOMERS.filter(c => c.Job);
  return jobs.map(job => {
    const invoices = QB_INVOICES.filter(i => i.CustomerRef.value === job.Id);
    const purchases = QB_PURCHASES.filter(p =>
      p.Line.some(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.Id)
    );
    const qbRevenue = invoices.reduce((s, i) => s + i.TotalAmt, 0);
    const jobManualRevenue = manualRevenue.filter(r => r.jobId === job.Id);
    const manualRevTotal = jobManualRevenue.reduce((s, r) => s + (r.amount || 0), 0);
    const revenue = qbRevenue + manualRevTotal;
    const baseMaterialCosts = purchases.reduce((s, p) =>
      s + p.Line.filter(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.Id)
               .reduce((ls, l) => ls + l.Amount, 0), 0);
    const inboxCosts = extraCostsByJob[job.Id] || 0;
    const jobManualExpenses = manualExpenses.filter(e => e.jobId === job.Id);
    const manualExpTotal = jobManualExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const materialCost = baseMaterialCosts + inboxCosts + manualExpTotal;
    const jobLabor = laborEntries.filter(l => l.jobId === job.Id);
    const laborCost = jobLabor.reduce((s, l) => s + (l.amount || 0), 0);
    const costs = materialCost + laborCost;
    const client = QB_CUSTOMERS.find(c => c.Id === job.ParentRef?.value);
    const allDates = invoices.map(i => i.TxnDate).sort();
    const costByVendor = {};
    purchases.forEach(p => {
      p.Line.filter(l => l.AccountBasedExpenseLineDetail?.CustomerRef?.value === job.Id).forEach(l => {
        costByVendor[p.EntityRef.name] = (costByVendor[p.EntityRef.name] || 0) + l.Amount;
      });
    });
    // Add manual expense vendors to costByVendor
    jobManualExpenses.forEach(e => {
      if (e.vendor) costByVendor[e.vendor] = (costByVendor[e.vendor] || 0) + e.amount;
    });
    return {
      id: job.Id, name: job.DisplayName, clientName: client?.DisplayName || "",
      ...JOB_META[job.Id], revenue, costs, materialCost, laborCost,
      profit: revenue - costs,
      marginPct: revenue > 0 ? (((revenue - costs) / revenue) * 100).toFixed(1) : "0.0",
      invoices, purchases, laborEntries: jobLabor,
      manualExpenses: jobManualExpenses, manualRevenue: jobManualRevenue,
      firstDate: allDates[0] || "",
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
  { key: "mtd",        label: "MTD"        },
  { key: "qtd",        label: "QTD"        },
  { key: "ytd",        label: "YTD"        },
  { key: "prior_year", label: "Prior Year" },
];

// Use actual current date for date range calculations
const MOCK_TODAY = new Date();

function getDateCutoff(rangeKey) {
  if (!rangeKey || rangeKey === "all" || rangeKey === "custom" || rangeKey === "prior_year") return null;
  const y = MOCK_TODAY.getFullYear();
  const m = MOCK_TODAY.getMonth(); // 0-indexed
  if (rangeKey === "mtd")  return new Date(y, m, 1);
  if (rangeKey === "qtd")  return new Date(y, Math.floor(m / 3) * 3, 1);
  if (rangeKey === "ytd")  return new Date(y, 0, 1);
  return null;
}

function filterJobsByDate(jobs, rangeKey, customStart, customEnd) {
  if (rangeKey === "prior_year") {
    const py = MOCK_TODAY.getFullYear() - 1;
    return filterJobsByDate(jobs, "custom", `${py}-01-01`, `${py}-12-31`);
  }
  if (rangeKey === "custom") {
    const start = customStart ? new Date(customStart) : null;
    const end   = customEnd   ? new Date(customEnd + "T23:59:59") : null;
    if (!start && !end) return jobs;
    return jobs.map(job => {
      const filteredInvoices  = job.invoices.filter(inv => {
        const d = new Date(inv.TxnDate);
        return (!start || d >= start) && (!end || d <= end);
      });
      const filteredPurchases = job.purchases.filter(p => {
        const d = new Date(p.TxnDate);
        return (!start || d >= start) && (!end || d <= end);
      });
      const revenue = filteredInvoices.reduce((s, inv) => s + (inv.TotalAmt || 0), 0);
      const costs   = filteredPurchases.reduce((s, p) => s + (p.TotalAmt || 0), 0);
      return { ...job, invoices: filteredInvoices, purchases: filteredPurchases, revenue, costs, profit: revenue - costs, marginPct: revenue > 0 ? (((revenue - costs) / revenue) * 100).toFixed(1) : "0.0", outstanding: filteredInvoices.reduce((s, inv) => s + (inv.Balance || 0), 0) };
    }).filter(job => job.revenue > 0 || job.costs > 0);
  }
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

function filterUntaggedByDate(items, rangeKey, customStart, customEnd) {
  if (rangeKey === "all") return items;
  if (rangeKey === "prior_year") {
    const py = MOCK_TODAY.getFullYear() - 1;
    return filterUntaggedByDate(items, "custom", `${py}-01-01`, `${py}-12-31`);
  }
  if (rangeKey === "custom") {
    const start = customStart ? new Date(customStart) : null;
    const end   = customEnd   ? new Date(customEnd + "T23:59:59") : null;
    if (!start && !end) return items;
    return items.filter(u => {
      const d = new Date(u.date);
      return (!start || d >= start) && (!end || d <= end);
    });
  }
  const cutoff = getDateCutoff(rangeKey);
  if (!cutoff) return items;
  return items.filter(u => new Date(u.date) >= cutoff);
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
  .badge.done { background:rgba(62,107,64,0.15);color:${ACCENT2}; }
  .kpi { background:${CARD}; border:1px solid ${BORDER}; border-radius:8px; padding:22px 26px; box-shadow:0 2px 10px rgba(44,36,22,0.09); transition:box-shadow 0.2s; }
  .kpi:hover { box-shadow:0 5px 20px rgba(44,36,22,0.15); }
  .kpi.hi { border-color:rgba(62,107,64,0.35); background:linear-gradient(135deg,${CARD},#EEF5EE); }
  .chip { display:inline-flex;align-items:center;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;letter-spacing:0.02em; }
  .chip.g { background:rgba(62,107,64,0.12);color:${ACCENT2}; }
  .chip.r { background:rgba(156,53,53,0.10);color:${RED}; }
  .chip.a { background:rgba(196,144,32,0.12);color:${AMBER}; }
  .trow { display:grid;border-bottom:1px solid ${BORDER};cursor:pointer;transition:background 0.12s; }
  .trow:hover { background:${BG2}; }
  .tcell { padding:16px 18px;font-size:13px;display:flex;align-items:center;font-family:'DM Sans',sans-serif; }
  .thead { display:grid;background:${BG2};border-bottom:2px solid ${BORDER}; }
  .th { padding:10px 18px;font-size:10px;letter-spacing:0.1em;color:${DIM};text-transform:uppercase;font-family:'DM Sans',sans-serif;font-weight:700; }
  .btn { cursor:pointer;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:500;letter-spacing:0.02em;transition:all 0.15s;border:1.5px solid ${BORDER};color:${MID};background:${CARD};font-family:'DM Sans',sans-serif; }
  .btn:hover { border-color:${ACCENT};color:${ACCENT};box-shadow:0 2px 8px rgba(44,36,22,0.10); }
  .btn:focus-visible { outline:2px solid ${ACCENT};outline-offset:2px; }
  .btn.act { border-color:${ACCENT2};color:#fff;background:${ACCENT2}; }
  .btn.act:hover { background:#2E5230;border-color:#2E5230;box-shadow:0 2px 10px rgba(62,107,64,0.35); }
  .btn.red { border-color:rgba(156,53,53,0.3);color:${RED};background:transparent; }
  .btn.red:hover { border-color:${RED};background:rgba(156,53,53,0.06); }
  .btn:disabled { opacity:0.45;cursor:not-allowed;pointer-events:none; }
  .card { background:${CARD};border:1px solid ${BORDER};border-radius:8px;box-shadow:0 2px 10px rgba(44,36,22,0.08); }
  .mono { font-family:'DM Mono',monospace; }
  .chat-bubble-user { background:${BG2};border:1px solid ${BORDER};border-radius:12px 12px 3px 12px;padding:12px 16px;font-size:13px;color:${DARK};max-width:80%;align-self:flex-end;font-family:'DM Sans',sans-serif; }
  .chat-bubble-ai { background:${CARD};border:1px solid ${BORDER};border-radius:12px 12px 12px 3px;padding:14px 18px;font-size:13px;color:${MID};max-width:88%;align-self:flex-start;line-height:1.7;font-family:'DM Sans',sans-serif; }
  .chat-input { background:${CARD};border:1px solid ${BORDER};border-radius:5px;padding:12px 16px;color:${DARK};font-size:13px;width:100%;font-family:'DM Sans',sans-serif;outline:none;transition:border 0.15s; }
  .chat-input:focus { border-color:${ACCENT}; }
  .raw-table { width:100%;border-collapse:collapse; }
  .raw-table th { padding:10px 16px;font-size:9px;letter-spacing:0.12em;color:${MID};text-transform:uppercase;background:${BG2};border-bottom:1px solid ${BORDER};text-align:left;white-space:nowrap;font-family:'DM Sans',sans-serif;font-weight:700; }
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
  .inbox-row.tagged { border-color:rgba(62,107,64,0.45);background:rgba(62,107,64,0.04); }
  .job-select { background:${CARD};border:1px solid ${BORDER};border-radius:4px;padding:9px 12px;color:${DARK};font-size:12px;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer;transition:border 0.15s;width:100%; }
  .job-select:focus { border-color:${ACCENT}; }
  .suggestion-pill { display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11px;background:rgba(196,144,32,0.09);color:${AMBER};border:1px solid rgba(196,144,32,0.25);cursor:pointer;transition:all 0.15s;font-family:'DM Sans',sans-serif; }
  .suggestion-pill:hover { background:rgba(196,144,32,0.16); }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:0.3} 30%{transform:translateY(-5px);opacity:0.8} }
  @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .slide-in { animation:slideIn 0.2s ease; }
  .spinner { width:14px;height:14px;border:2px solid rgba(62,107,64,0.22);border-top-color:${ACCENT2};border-radius:50%;animation:spin 0.75s linear infinite;display:inline-block;flex-shrink:0; }
  .trow:nth-child(even) { background:rgba(44,36,22,0.018); }
  .trow:nth-child(even):hover { background:${BG2}; }
  .kpi-tooltip { position:relative; }
  .kpi-tooltip .tooltip-text { visibility:hidden;opacity:0;position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:${DARK};color:#FDF8F0;font-size:10px;font-family:'DM Sans',sans-serif;padding:8px 12px;border-radius:4px;width:220px;line-height:1.5;text-align:center;z-index:200;transition:opacity 0.15s;pointer-events:none; }
  .kpi-tooltip:hover .tooltip-text { visibility:visible;opacity:1; }
  .tutorial-overlay { position:fixed;inset:0;background:rgba(44,36,22,0.55);z-index:600;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn 0.2s ease; }
  .tutorial-modal { background:${CARD};border:1px solid ${BORDER};border-radius:10px;width:100%;max-width:560px;box-shadow:0 24px 64px rgba(44,36,22,0.22);overflow:hidden; }
  .tutorial-progress { display:flex;gap:6px;padding:24px 32px 0; }
  .tutorial-progress-dot { height:3px;border-radius:2px;flex:1;transition:background 0.3s; }
  .tutorial-body { padding:32px; }
  .tutorial-icon { width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:20px; }
  .tutorial-footer { padding:20px 32px;border-top:1px solid ${BORDER};display:flex;justify-content:space-between;align-items:center;background:${BG}; }
  .help-btn { width:32px;height:32px;border-radius:50%;border:1px solid ${BORDER};background:${CARD};cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:${DIM};font-family:'DM Sans',sans-serif;transition:all 0.15s; }
  .help-btn:hover { border-color:${ACCENT};color:${ACCENT}; }
  .inbox-tab { cursor:pointer;padding:9px 18px;font-size:12px;font-weight:500;font-family:'DM Sans',sans-serif;border-radius:5px;border:1px solid transparent;transition:all 0.15s;color:${DIM}; }
  .inbox-tab:hover { color:${MID}; }
  .inbox-tab.active { background:${CARD};border-color:${BORDER};color:${DARK};box-shadow:0 1px 3px rgba(44,36,22,0.07); }
  .pls { transition:background 0.15s; }
  .pls:hover { background:${BG2}; }
  .si { display:flex;align-items:center;gap:10px;padding:11px 20px;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;border-left:2px solid transparent;transition:all 0.15s; }
  .si:hover { background:rgba(245,239,227,0.06); }
  .si.active { background:rgba(245,239,227,0.1);border-left-color:${ACCENT2}; }
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

// ─── TUTORIAL MODAL ──────────────────────────────────────────────────────────

const TUTORIAL_SLIDES = [
  {
    icon: "🌿",
    iconBg: "rgba(45,94,48,0.1)",
    iconBorder: "rgba(45,94,48,0.2)",
    title: "Welcome to Canopy",
    body: "Canopy gives you a clear picture of job-level profitability — which jobs made money, which didn't, and why. It works with your QuickBooks data and lets you add anything QB doesn't capture: cash expenses, manual revenue, labor costs, and more.",
    sub: "Here's a quick walkthrough of what you can do.",
  },
  {
    icon: "📊",
    iconBg: "rgba(45,94,48,0.1)",
    iconBorder: "rgba(45,94,48,0.2)",
    title: "Your Dashboard",
    body: "Three KPI cards show Profit, Revenue, and Expenses at a glance — toggle between Gross and Net profit to include fixed costs. Set a revenue goal and track your progress with the visual pace bar. The Active Jobs table below lets you sort by margin, costs, or profit and drill into any job.",
    sub: "Use the date range selector (MTD, QTD, YTD, or custom) to slice your data by any time period. Search jobs or clients instantly from the search bar.",
  },
  {
    icon: "📥",
    iconBg: "rgba(140,107,48,0.1)",
    iconBorder: "rgba(140,107,48,0.2)",
    title: "Expenses, Labor & Revenue",
    body: "The Expense Management tab shows QB expenses sorted into Auto-Matched, Needs Review, Fixed Costs, and All Tagged — plus you can add manual expenses right from here for cash purchases or off-QB costs. Inside any Job Detail, add labor entries (crew hours and rates), manual expenses, and manual revenue (cash, Zelle, checks) to build a complete cost picture.",
    sub: "Your Data Quality Score rises as you categorize expenses — the higher the score, the more accurate your numbers.",
  },
  {
    icon: "🔗",
    iconBg: "rgba(92,122,90,0.1)",
    iconBorder: "rgba(92,122,90,0.2)",
    title: "QuickBooks Connection",
    body: "Canopy syncs directly from your QuickBooks Online account via a secure OAuth connection. It pulls customers, jobs, invoices, sales receipts, purchases, and bills automatically. Click 'Connect QuickBooks' in the sidebar to get started.",
    sub: "Your data is read-only — Canopy never writes to QuickBooks. You can disconnect at any time from the sidebar settings.",
  },
  {
    icon: "📝",
    iconBg: "rgba(184,98,42,0.1)",
    iconBorder: "rgba(184,98,42,0.2)",
    title: "Quote Generator",
    body: "Build detailed job estimates with itemized cost lines, expected revenue, and margin projections. Save estimates as templates for recurring job types. When you're ready to share with a client, export a professional white-labeled PDF with your business name — not Canopy's.",
    sub: "Link an estimate to a real job later to see how your projections compared to actual results.",
  },
  {
    icon: "✨",
    iconBg: "rgba(92,122,90,0.1)",
    iconBorder: "rgba(92,122,90,0.2)",
    title: "Reports & AI Analyst",
    body: "The Reports tab has four pre-built reports — Most Profitable Job Type, Worst Performing Jobs, Monthly Profit Trend, and Client Profitability Ranking — each with a chart, data table, and a plain-English Canopy Insight. Export to PDF or Excel in one click.",
    sub: "The AI Analyst tab lets you ask questions in plain English — 'which job type is most profitable?', 'why was March rough?', 'who are my best clients?' — and get a data-driven answer powered by Claude.",
  },
];

function TutorialModal({ onClose, qbConnected }) {
  const [slide, setSlide] = useState(0);
  const current = TUTORIAL_SLIDES[slide];
  const isLast  = slide === TUTORIAL_SLIDES.length - 1;

  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <div className="tutorial-modal" onClick={e => e.stopPropagation()}>

        {/* Progress bar */}
        <div className="tutorial-progress">
          {TUTORIAL_SLIDES.map((_,i) => (
            <div key={i} className="tutorial-progress-dot" style={{ background: i <= slide ? ACCENT2 : BORDER }} onClick={() => setSlide(i)}/>
          ))}
        </div>

        {/* Body */}
        <div className="tutorial-body">
          <div className="tutorial-icon" style={{ background:current.iconBg, border:`1px solid ${current.iconBorder}` }}>
            {current.icon}
          </div>
          <h2 style={{ fontFamily:"'Lora',serif",fontSize:20,fontWeight:500,color:DARK,marginBottom:14,letterSpacing:"-0.01em" }}>
            {current.title}
          </h2>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:MID,lineHeight:1.75,marginBottom:12 }}>
            {current.body}
          </p>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,lineHeight:1.7,fontStyle:"italic" }}>
            {/* Override slide 3 sub if already connected */}
            {slide === 3 && qbConnected
              ? "✓ Your QuickBooks account is already connected. Data syncs automatically."
              : current.sub}
          </p>
        </div>

        {/* Footer */}
        <div className="tutorial-footer">
          <div style={{ fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>
            {slide + 1} of {TUTORIAL_SLIDES.length}
          </div>
          <div style={{ display:"flex",gap:8 }}>
            {slide > 0 && (
              <button className="btn" onClick={() => setSlide(s => s - 1)}>← Back</button>
            )}
            {!isLast ? (
              <button className="btn act" onClick={() => setSlide(s => s + 1)}>Next →</button>
            ) : (
              <button className="btn act" onClick={onClose} style={{ background:ACCENT2,borderColor:ACCENT2 }}>
                Get started →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPI DRILLDOWN MODAL ──────────────────────────────────────────────────────

function KpiModal({ type, expenseView, jobSummaries, allJobSummaries, overhead, untagged,
                    totalRev, totalCost, totalOverhead, totalProfit, accountedFor, totalExpenses,
                    onClose, onJobClick, onJumpToInbox }) {

  const isNet = expenseView === "fixed";

  // Shared modal shell
  function ModalShell({ title, subtitle, children }) {
    return (
      <div role="dialog" aria-modal="true" onKeyDown={e => e.key === 'Escape' && onClose()} style={{ position:"fixed",inset:0,background:"rgba(44,36,22,0.52)",zIndex:550,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}
        onClick={onClose}>
        <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:8,width:"100%",maxWidth:680,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 24px 72px rgba(44,36,22,0.22)" }}
          onClick={e=>e.stopPropagation()}>
          {/* Header */}
          <div style={{ padding:"22px 28px",borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"flex-start",justifyContent:"space-between",position:"sticky",top:0,background:CARD,zIndex:1 }}>
            <div>
              <div style={{ fontFamily:"'Lora',serif",fontSize:18,fontWeight:500,color:DARK,letterSpacing:"-0.01em" }}>{title}</div>
              {subtitle && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginTop:3 }}>{subtitle}</div>}
            </div>
            <button onClick={onClose} aria-label="Close" style={{ background:"none",border:"none",cursor:"pointer",color:DIM,fontSize:22,lineHeight:1,padding:"2px 6px" }}>×</button>
          </div>
          {/* Body */}
          <div style={{ padding:"24px 28px" }}>{children}</div>
        </div>
      </div>
    );
  }

  function SectionLabel({ text }) {
    return <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",color:DIM,textTransform:"uppercase",fontWeight:500,marginBottom:12 }}>{text}</div>;
  }

  function MiniTable({ headers, rows, onRowClick }) {
    return (
      <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"'DM Sans',sans-serif" }}>
        <thead>
          <tr style={{ borderBottom:`1px solid ${BORDER}` }}>
            {headers.map((h,i) => (
              <th key={i} style={{ padding:"6px 10px",textAlign:i>0?"right":"left",fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",color:DIM,fontWeight:500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i) => (
            <tr key={i} onClick={()=>onRowClick&&onRowClick(row._job)}
              style={{ borderBottom:`1px solid ${BORDER}`,cursor:onRowClick?"pointer":"default",transition:"background 0.1s" }}
              onMouseOver={e=>{ if(onRowClick) e.currentTarget.style.background=BG2; }}
              onMouseOut={e=>{ e.currentTarget.style.background="transparent"; }}>
              {row.cells.map((cell,j) => (
                <td key={j} style={{ padding:"9px 10px",textAlign:j>0?"right":"left",color:cell.color||MID,fontWeight:cell.bold?500:400,fontFamily:cell.mono?"'DM Mono',monospace":"'DM Sans',sans-serif",fontSize:cell.mono?11:12 }}>
                  {cell.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // ── REVENUE modal ──
  if (type === 'revenue') {
    const sorted = [...jobSummaries].sort((a,b) => b.revenue - a.revenue);
    const barData = sorted.slice(0,8).map(j => ({ name: j.name.length>14?j.name.slice(0,14)+'…':j.name, revenue: j.revenue }));
    const rows = sorted.map(j => ({
      _job: j,
      cells: [
        { value: j.name, bold:true, color:DARK },
        { value: j.clientName, color:DIM },
        { value: $(j.revenue), mono:true, color:ACCENT2 },
        { value: j.invoices.length + ' inv', color:DIM },
        { value: j.outstanding > 0 ? $(j.outstanding) : '—', mono:true, color:j.outstanding>0?AMBER:DIM },
      ]
    }));
    return (
      <ModalShell title="Total Revenue" subtitle={`${sorted.length} jobs · ${$(totalRev)} billed`}>
        <div style={{ marginBottom:24 }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top:4,right:4,left:8,bottom:40 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false}/>
              <XAxis dataKey="name" interval={0} tick={({ x, y, payload }) => (
                <g transform={`translate(${x},${y})`}>
                  <text x={0} y={0} dy={4} textAnchor="end" fill={DIM} fontSize={9} fontFamily="DM Mono" transform="rotate(-35)">{payload.value}</text>
                </g>
              )} height={60}/>
              <YAxis tick={{ fontSize:9,fill:DIM,fontFamily:"DM Mono" }} tickFormatter={$k} axisLine={false} tickLine={false} width={48}/>
              <Tooltip formatter={v=>[$(v),'Revenue']} contentStyle={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:5,fontFamily:"'DM Mono',monospace",fontSize:11 }}/>
              <Bar dataKey="revenue" fill={ACCENT2} radius={[3,3,0,0]} opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <SectionLabel text="All jobs by revenue"/>
        <MiniTable
          headers={["Job","Client","Revenue","Invoices","Outstanding"]}
          rows={rows}
          onRowClick={onJobClick}
        />
        <div style={{ marginTop:14,paddingTop:12,borderTop:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",fontSize:12,fontFamily:"'DM Sans',sans-serif",color:DIM }}>
          <span>Click any row to open Job Detail</span>
          <span style={{ fontWeight:500,color:DARK }}>{$(totalRev)} total</span>
        </div>
      </ModalShell>
    );
  }

  // ── EXPENSES modal ──
  if (type === 'expenses') {
    const sorted = [...jobSummaries].sort((a,b) => b.costs - a.costs);
    const barData = sorted.slice(0,8).map(j => ({ name: j.name.length>14?j.name.slice(0,14)+'…':j.name, costs: j.costs }));
    const jobRows = sorted.map(j => ({
      _job: j,
      cells: [
        { value: j.name, bold:true, color:DARK },
        { value: j.clientName, color:DIM },
        { value: $(j.costs), mono:true, color:RED },
        { value: j.purchases.length + ' exp', color:DIM },
        { value: totalRev > 0 ? ((j.costs/j.revenue*100).toFixed(0)+'%') : '—', color:DIM },
      ]
    }));
    const overheadRows = (overhead||[]).map(o => ({
      cells: [
        { value: o.vendor, bold:true, color:DARK },
        { value: o.description, color:DIM },
        { value: o.date, color:DIM },
        { value: $(o.amount), mono:true, color:AMBER },
      ]
    }));
    return (
      <ModalShell title={isNet ? "Total Job + Fixed Expenses" : "Total Job Expenses"}
        subtitle={isNet ? `${$(totalCost)} job costs + ${$(totalOverhead)} fixed costs` : `${$(totalCost)} across ${sorted.length} jobs`}>
        <div style={{ marginBottom:24 }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top:4,right:4,left:8,bottom:40 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false}/>
              <XAxis dataKey="name" interval={0} tick={({ x, y, payload }) => (
                <g transform={`translate(${x},${y})`}>
                  <text x={0} y={0} dy={4} textAnchor="end" fill={DIM} fontSize={9} fontFamily="DM Mono" transform="rotate(-35)">{payload.value}</text>
                </g>
              )} height={60}/>
              <YAxis tick={{ fontSize:9,fill:DIM,fontFamily:"DM Mono" }} tickFormatter={$k} axisLine={false} tickLine={false} width={48}/>
              <Tooltip formatter={v=>[$(v),'Job Costs']} contentStyle={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:5,fontFamily:"'DM Mono',monospace",fontSize:11 }}/>
              <Bar dataKey="costs" fill={RED} radius={[3,3,0,0]} opacity={0.75}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <SectionLabel text="Job costs by job"/>
        <MiniTable headers={["Job","Client","Costs","Expenses","Cost %"]} rows={jobRows} onRowClick={onJobClick}/>
        {isNet && overheadRows.length > 0 && (
          <div style={{ marginTop:24 }}>
            <SectionLabel text={`Fixed costs / overhead — ${$(totalOverhead)} total`}/>
            <MiniTable headers={["Vendor","Description","Date","Amount"]} rows={overheadRows}/>
          </div>
        )}
        <div style={{ marginTop:14,paddingTop:12,borderTop:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",fontSize:12,fontFamily:"'DM Sans',sans-serif",color:DIM }}>
          <span>Click any job row to open Job Detail</span>
          <span style={{ fontWeight:500,color:DARK }}>{$(isNet ? totalCost+totalOverhead : totalCost)} total</span>
        </div>
      </ModalShell>
    );
  }

  // ── PROFIT modal ──
  if (type === 'profit') {
    const netProfit  = totalProfit - totalOverhead;
    const dispProfit = isNet ? netProfit : totalProfit;
    const sorted     = [...jobSummaries].sort((a,b) => b.profit - a.profit);
    const waterfallRows = [
      { label:"Total Revenue",   value:totalRev,    color:ACCENT2,  indent:false },
      { label:"− Job Costs",     value:-totalCost,  color:RED,      indent:true  },
      { label:"= Gross Profit",  value:totalProfit, color:totalProfit>=0?ACCENT2:RED, indent:false, bold:true },
      ...(isNet ? [
        { label:"− Fixed Costs",   value:-totalOverhead, color:AMBER, indent:true },
        { label:"= Net Profit",    value:netProfit,  color:netProfit>=0?ACCENT2:RED, indent:false, bold:true },
      ] : []),
    ];
    const jobRows = sorted.map(j => ({
      _job: j,
      cells: [
        { value: j.name, bold:true, color:DARK },
        { value: j.clientName, color:DIM },
        { value: $(j.revenue), mono:true, color:MID },
        { value: $(j.costs), mono:true, color:MID },
        { value: (j.profit>=0?'+':'')+$(j.profit), mono:true, color:j.profit>=0?ACCENT2:RED, bold:true },
        { value: j.marginPct+'%', color:DIM },
      ]
    }));
    return (
      <ModalShell title={isNet ? "Total Net Profit" : "Total Gross Profit"}
        subtitle={`${totalRev>0?((dispProfit/totalRev)*100).toFixed(1):'0.0'}% ${isNet?'net':'gross'} margin`}>
        {/* Waterfall */}
        <div style={{ marginBottom:24,padding:"18px 20px",borderRadius:6,background:BG2,border:`1px solid ${BORDER}` }}>
          <SectionLabel text="How the number is calculated"/>
          {waterfallRows.map((row,i) => (
            <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<waterfallRows.length-1?`1px solid ${BORDER}`:"none" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:row.bold?DARK:DIM,fontWeight:row.bold?500:400,paddingLeft:row.indent?20:0 }}>{row.label}</span>
              <span style={{ fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:row.bold?600:400,color:row.color }}>
                {row.value >= 0 ? $(row.value) : `–${$(Math.abs(row.value))}`}
              </span>
            </div>
          ))}
        </div>
        <SectionLabel text="Profit by job — click to open"/>
        <MiniTable headers={["Job","Client","Revenue","Costs","Profit","Margin"]} rows={jobRows} onRowClick={onJobClick}/>
      </ModalShell>
    );
  }

  // ── JOBS PROFITABLE modal ──
  if (type === 'jobs') {
    const winners = jobSummaries.filter(j => j.profit > 0).sort((a,b) => b.profit - a.profit);
    const losers  = jobSummaries.filter(j => j.profit <= 0).sort((a,b) => a.profit - b.profit);
    function JobList({ jobs, color }) {
      return jobs.length > 0 ? (
        <MiniTable
          headers={["Job","Client","Revenue","Profit","Margin"]}
          rows={jobs.map(j => ({
            _job: j,
            cells: [
              { value: j.name, bold:true, color:DARK },
              { value: j.clientName, color:DIM },
              { value: $(j.revenue), mono:true, color:MID },
              { value: (j.profit>=0?'+':'')+$(j.profit), mono:true, color, bold:true },
              { value: j.marginPct+'%', color:DIM },
            ]
          }))}
          onRowClick={onJobClick}
        />
      ) : (
        <div style={{ padding:"16px 0",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,fontStyle:"italic" }}>None in this period</div>
      );
    }
    return (
      <ModalShell title="Jobs Profitable" subtitle={`${winners.length} profitable · ${losers.length} losing · click any row to open`}>
        <div style={{ marginBottom:24 }}>
          <SectionLabel text={`In the green — ${winners.length} job${winners.length!==1?'s':''} · ${$(winners.reduce((s,j)=>s+j.profit,0))} total profit`}/>
          <JobList jobs={winners} color={ACCENT2}/>
        </div>
        {losers.length > 0 && (
          <div>
            <SectionLabel text={`In the red — ${losers.length} job${losers.length!==1?'s':''} · ${$(losers.reduce((s,j)=>s+j.profit,0))} total loss`}/>
            <JobList jobs={losers} color={RED}/>
          </div>
        )}
      </ModalShell>
    );
  }

  // ── DATA QUALITY modal ──
  if (type === 'quality') {
    const taggedCount   = jobSummaries.reduce((s,j) => s + j.purchases.length, 0);
    const overheadCount = (overhead||[]).length;
    const untaggedCount = untagged.length;
    const total         = taggedCount + overheadCount + untaggedCount;
    const dqPct         = total > 0 ? Math.round((accountedFor / total) * 100) : 100;
    function ScoreBar({ label, count, color, pct }) {
      return (
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID }}>{label}</span>
            <span style={{ fontFamily:"'DM Mono',monospace",fontSize:12,color }}>{count} ({pct}%)</span>
          </div>
          <div style={{ height:6,borderRadius:3,background:BG2,overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${pct}%`,background:color,borderRadius:3,transition:"width 0.4s ease" }}/>
          </div>
        </div>
      );
    }
    return (
      <ModalShell title="Data Quality Score" subtitle={`${dqPct}% of expenses accounted for`}>
        {/* Score bars */}
        <div style={{ padding:"18px 20px",borderRadius:6,background:BG2,border:`1px solid ${BORDER}`,marginBottom:24 }}>
          <ScoreBar label="Job-tagged expenses" count={taggedCount} color={ACCENT2} pct={total>0?Math.round(taggedCount/total*100):0}/>
          <ScoreBar label="Fixed cost expenses" count={overheadCount} color={AMBER} pct={total>0?Math.round(overheadCount/total*100):0}/>
          <ScoreBar label="Untagged expenses" count={untaggedCount} color={RED} pct={total>0?Math.round(untaggedCount/total*100):0}/>
          <div style={{ borderTop:`1px solid ${BORDER}`,paddingTop:12,marginTop:4,display:"flex",justifyContent:"space-between" }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:DARK }}>Total accounted for</span>
            <span style={{ fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:dqPct>=80?ACCENT2:dqPct>=50?AMBER:RED }}>{accountedFor}/{total} ({dqPct}%)</span>
          </div>
        </div>
        {/* Untagged list */}
        {untagged.length > 0 ? (
          <>
            <SectionLabel text={`Untagged expenses dragging the score — ${untagged.length} remaining`}/>
            <MiniTable
              headers={["Vendor","Description","Date","Amount"]}
              rows={untagged.slice(0,10).map(u => ({
                cells: [
                  { value: u.vendor, bold:true, color:DARK },
                  { value: u.description, color:DIM },
                  { value: u.date, color:DIM },
                  { value: $(u.amount), mono:true, color:RED },
                ]
              }))}
            />
            {untagged.length > 10 && (
              <div style={{ marginTop:8,fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic" }}>
                + {untagged.length - 10} more untagged expenses
              </div>
            )}
            {onJumpToInbox && (
              <div style={{ marginTop:16 }}>
                <button className="btn act" onClick={() => { onClose(); onJumpToInbox(); }} style={{ fontSize:11, padding:"7px 18px" }}>
                  Go to Expense Management →
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign:"center",padding:"20px 0",fontFamily:"'Lora',serif",fontSize:16,color:ACCENT2,fontStyle:"italic" }}>
            All expenses accounted for — perfect score!
          </div>
        )}
      </ModalShell>
    );
  }

  return null;
}

// ─── TAB: DASHBOARD ───────────────────────────────────────────────────────────

// ─── REVENUE GOAL MODAL ──────────────────────────────────────────────────────

function RevenueGoalModal({ currentGoal, onSave, onClose }) {
  const [target, setTarget] = useState(currentGoal?.revenue_target || "");
  const [period, setPeriod] = useState(currentGoal?.period || "annual");
  const inputStyle = { padding:"10px 14px", borderRadius:5, border:`1px solid ${BORDER}`, background:CARD, fontFamily:"'DM Mono',monospace", fontSize:14, color:DARK, outline:"none", boxSizing:"border-box", width:"100%" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(44,36,22,0.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:CARD, borderRadius:10, padding:"32px 36px", maxWidth:380, width:"100%", boxShadow:"0 12px 40px rgba(44,36,22,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily:"'Lora',serif", fontSize:20, fontWeight:600, color:DARK, marginBottom:4 }}>Revenue Goal</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:DIM, marginBottom:22 }}>Set a target and track your progress on the dashboard.</div>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Revenue Target ($)</label>
          <input type="number" min="0" step="1000" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 500000" style={inputStyle} autoFocus />
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Period</label>
          <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, borderRadius:5, overflow:"hidden" }}>
            {[["annual","Annual"],["quarterly","Quarterly"],["monthly","Monthly"]].map(([k,l],i) => (
              <button key={k} onClick={() => setPeriod(k)} style={{ flex:1, cursor:"pointer", padding:"9px 0", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", border:"none", borderRight:i<2?`1px solid ${BORDER}`:"none", background:period===k?ACCENT:CARD, color:period===k?CARD:MID, transition:"all 0.15s" }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          {currentGoal && (
            <button className="btn" onClick={() => { onSave(null); onClose(); }} style={{ fontSize:11, color:RED, borderColor:RED }}>Remove Goal</button>
          )}
          <button className="btn" onClick={onClose} style={{ fontSize:11 }}>Cancel</button>
          <button className="btn act" onClick={() => {
            if (!target || parseFloat(target) <= 0) return;
            onSave({ revenue_target: parseFloat(target), period, set_at: new Date().toISOString() });
            onClose();
          }} disabled={!target || parseFloat(target) <= 0} style={{ fontSize:11, padding:"8px 20px", opacity: (!target || parseFloat(target) <= 0) ? 0.4 : 1 }}>Save Goal</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ onJobClick, onEstimate, onJumpToInbox, onClientClick, jobSummaries, untagged, overhead, dismissed, qbConnected, userId, clientType, dateRange, setDateRange, customStart, setCustomStart, customEnd, setCustomEnd, revenueGoal, onSetRevenueGoal }) {
  const [sort, setSort]             = useState("profit");
  const [sortDir, setSortDir]       = useState("desc");
  const [expenseView, setExpenseView] = useState("job");
  const [activeKpi, setActiveKpi]     = useState(null); // 'revenue' | 'expenses' | 'profit' | 'jobs' | 'quality'
  const [alertsOpen, setAlertsOpen]   = useState(false);
  const [jobTableRows, setJobTableRows] = useState(10); // rows shown in job table
  const [searchQ, setSearchQ]           = useState("");
  const [searchOpen, setSearchOpen]     = useState(false);
  const searchRef                       = useRef(null);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e) { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Apply date filter
  const filteredJobs     = dateRange === "all" ? jobSummaries : filterJobsByDate(jobSummaries, dateRange, customStart, customEnd);
  const filteredUntagged = filterUntaggedByDate(untagged, dateRange, customStart, customEnd);


  // Job type filter
  const typeFilteredJobs = filteredJobs;

  function handleColSort(col) {
    if (sort === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSort(col); setSortDir("desc"); }
  }

  const sorted = [...typeFilteredJobs].sort((a,b) => {
    let diff = 0;
    if (sort==="profit")        diff = b.profit - a.profit;
    else if (sort==="margin")   diff = parseFloat(b.marginPct) - parseFloat(a.marginPct);
    else if (sort==="revenue")  diff = b.revenue - a.revenue;
    else if (sort==="costs")    diff = b.costs - a.costs;
    else if (sort==="material") diff = (b.materialCost||0) - (a.materialCost||0);
    else if (sort==="labor")    diff = (b.laborCost||0) - (a.laborCost||0);
    else if (sort==="name")     diff = a.name.localeCompare(b.name);
    else if (sort==="client")   diff = a.clientName.localeCompare(b.clientName);
    else if (sort==="status")   diff = a.status.localeCompare(b.status);
    return sortDir === "asc" ? -diff : diff;
  });

  const totalRev      = typeFilteredJobs.reduce((s,j) => s + j.revenue, 0);
  const totalCost     = typeFilteredJobs.reduce((s,j) => s + j.costs, 0);
  const totalMaterial = typeFilteredJobs.reduce((s,j) => s + (j.materialCost || 0), 0);
  const totalLabor    = typeFilteredJobs.reduce((s,j) => s + (j.laborCost || 0), 0);
  const totalProfit   = totalRev - totalCost;

  // Data Quality Score — all four components filtered to the selected date range.
  // Dismissed items stay in the denominator so dismissing doesn't artificially inflate the score.
  const filteredOverhead      = filterUntaggedByDate(overhead || [], dateRange, customStart, customEnd);
  const filteredDismissed     = filterUntaggedByDate(dismissed || [], dateRange, customStart, customEnd);
  const totalTaggedExpenses   = filteredJobs.reduce((s,j) => s + j.purchases.length, 0);
  const totalOverheadExpenses = filteredOverhead.length;
  const totalUntaggedExpenses = filteredUntagged.length;
  const totalDismissedExpenses = filteredDismissed.length;
  const totalExpenses  = totalTaggedExpenses + totalOverheadExpenses + totalUntaggedExpenses + totalDismissedExpenses;
  const accountedFor   = totalTaggedExpenses + totalOverheadExpenses;
  const dataQuality    = totalExpenses > 0 ? Math.round((accountedFor / totalExpenses) * 100) : 100;
  const dqColor        = dataQuality >= 80 ? ACCENT2 : dataQuality >= 50 ? AMBER : RED;

  const totalOverhead = filteredOverhead.reduce((s, o) => s + (o.amount || 0), 0);

  // Hero display values — profit, margin, color (depends on expenseView + totalOverhead)
  const heroIsNet  = expenseView === "fixed";
  const heroProfit = heroIsNet ? totalProfit - totalOverhead : totalProfit;
  const heroMargin = totalRev > 0 ? ((heroProfit / totalRev) * 100).toFixed(1) : "0.0";
  const heroColor  = heroProfit >= 0 ? ACCENT2 : RED;

  // ── Prior-period comparison — used for % change in KPI cards ──
  // Computes the equivalent previous window for each range key, then sums job data.
  const priorPeriodComparison = useMemo(() => {
    if (dateRange === "all" || dateRange === "custom") return null;
    const y = MOCK_TODAY.getFullYear();
    const m = MOCK_TODAY.getMonth(); // 0-indexed
    const d = MOCK_TODAY.getDate();
    let priorStart, priorEnd;
    if (dateRange === "mtd") {
      const prevM = m === 0 ? 11 : m - 1;
      const prevY = m === 0 ? y - 1 : y;
      const maxDay = new Date(prevY, prevM + 1, 0).getDate();
      const lastDay = Math.min(d, maxDay);
      priorStart = `${prevY}-${String(prevM+1).padStart(2,'0')}-01`;
      priorEnd   = `${prevY}-${String(prevM+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
    } else if (dateRange === "qtd") {
      const curQ = Math.floor(m / 3);
      const prevQ = curQ === 0 ? 3 : curQ - 1;
      const prevQYear = curQ === 0 ? y - 1 : y;
      const prevQStartM = prevQ * 3;
      const msIntoCurQ = MOCK_TODAY - new Date(y, curQ * 3, 1);
      const priorEndDate = new Date(new Date(prevQYear, prevQStartM, 1).getTime() + msIntoCurQ);
      priorStart = `${prevQYear}-${String(prevQStartM+1).padStart(2,'0')}-01`;
      priorEnd   = priorEndDate.toISOString().split('T')[0];
    } else if (dateRange === "ytd") {
      priorStart = `${y-1}-01-01`;
      priorEnd   = `${y-1}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    } else if (dateRange === "prior_year") {
      priorStart = `${y-2}-01-01`;
      priorEnd   = `${y-2}-12-31`;
    }
    if (!priorStart || !priorEnd) return null;
    const pJobs  = filterJobsByDate(jobSummaries, "custom", priorStart, priorEnd);
    const pRev   = pJobs.reduce((s, j) => s + j.revenue, 0);
    const pCost  = pJobs.reduce((s, j) => s + j.costs, 0);
    const pProfit = pRev - pCost;
    const lbl = { mtd:"vs prior month", qtd:"vs prior quarter", ytd:"vs prior year", prior_year:"vs year before" }[dateRange] || "vs prior period";
    return { pRev, pCost, pProfit, lbl };
  }, [jobSummaries, dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const ppcRevPct    = priorPeriodComparison && priorPeriodComparison.pRev    !== 0 ? Math.round(((totalRev    - priorPeriodComparison.pRev)    / Math.abs(priorPeriodComparison.pRev))    * 100) : null;
  const ppcCostPct   = priorPeriodComparison && priorPeriodComparison.pCost   !== 0 ? Math.round(((totalCost   - priorPeriodComparison.pCost)   / Math.abs(priorPeriodComparison.pCost))   * 100) : null;
  const ppcProfitPct = priorPeriodComparison && priorPeriodComparison.pProfit !== 0 ? Math.round(((heroProfit  - priorPeriodComparison.pProfit) / Math.abs(priorPeriodComparison.pProfit)) * 100) : null;
  const ppcLbl = priorPeriodComparison?.lbl ?? "";

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

  const rangeLabel = dateRange === "custom"
    ? `${customStart || "…"} → ${customEnd || "…"} · ${typeFilteredJobs.length} job${typeFilteredJobs.length!==1?"s":""}`
    : dateRange === "all"
      ? allTimeLabel
      : `${DATE_RANGES.find(r=>r.key===dateRange)?.label ?? dateRange.toUpperCase()} · ${typeFilteredJobs.length} job${typeFilteredJobs.length!==1?"s":""}`;

  // ── Additional alert types ──
  const lossJobs      = typeFilteredJobs.filter(j => j.status !== "In Progress" && j.profit < 0);
  const lowMarginJobs = typeFilteredJobs.filter(j => j.status !== "In Progress" && j.profit >= 0 && parseFloat(j.marginPct) < 10 && j.revenue > 0);

  // ── Search — jobs and unique clients across all (unfiltered) summaries ──
  const uniqueClients = useMemo(() => {
    const seen = new Set();
    return jobSummaries.map(j => j.clientName).filter(n => n && !seen.has(n) && seen.add(n)).sort();
  }, [jobSummaries]);

  const searchResults = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return { jobs: [], clients: [] };
    return {
      jobs:    jobSummaries.filter(j => j.name.toLowerCase().includes(q)).slice(0, 6),
      clients: uniqueClients.filter(c => c.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [searchQ, jobSummaries, uniqueClients]);

  const hasSearchResults = searchResults.jobs.length > 0 || searchResults.clients.length > 0;

  return (
    <div style={{ padding:"32px 36px", background:BG, minHeight:"100vh" }}>

      {/* Page title + search + date slicer */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28,gap:20 }}>
        <div style={{ flexShrink:0 }}>
          <h1 style={{ fontFamily:"'Lora',serif",fontSize:24,fontWeight:600,color:DARK,letterSpacing:"-0.02em" }}>Job Profitability Overview</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginTop:4 }}>{rangeLabel}</p>
        </div>

        {/* ── Search bar ── */}
        <div ref={searchRef} style={{ position:"relative", flex:"0 0 260px" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:13, color:DIM, pointerEvents:"none" }}>⌕</span>
            <input
              type="text"
              placeholder="Search jobs or clients…"
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
              onFocus={e => { e.currentTarget.style.borderColor = ACCENT; setSearchOpen(true); }}
              onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
              style={{ width:"100%", boxSizing:"border-box", padding:"8px 12px 8px 32px", borderRadius:6, border:`1px solid ${BORDER}`, background:CARD, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:DARK, outline:"none", transition:"border 0.15s", boxShadow:"0 1px 3px rgba(44,36,22,0.06)" }}
            />
            {searchQ && (
              <button onClick={() => { setSearchQ(""); setSearchOpen(false); }}
                style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:14, color:DIM, lineHeight:1, padding:0 }}>×</button>
            )}
          </div>
          {searchOpen && searchQ.trim() && (
            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:CARD, border:`1px solid ${BORDER}`, borderRadius:7, boxShadow:"0 8px 24px rgba(44,36,22,0.14)", zIndex:200, overflow:"hidden" }}>
              {!hasSearchResults ? (
                <div style={{ padding:"14px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:DIM, fontStyle:"italic" }}>No results found</div>
              ) : (
                <>
                  {searchResults.jobs.length > 0 && (
                    <div>
                      <div style={{ padding:"8px 14px 4px", fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:DIM }}>Jobs</div>
                      {searchResults.jobs.map(j => (
                        <div key={j.id} onClick={() => { setSearchQ(""); setSearchOpen(false); onJobClick && onJobClick(j); }}
                          style={{ padding:"9px 14px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:`1px solid ${BORDER}`, transition:"background 0.1s" }}
                          onMouseOver={e => e.currentTarget.style.background = BG2}
                          onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                          <div>
                            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:DARK, fontWeight:500 }}>{j.name}</div>
                            {j.clientName && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, marginTop:1 }}>{j.clientName}</div>}
                          </div>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color: j.profit >= 0 ? ACCENT2 : RED, fontWeight:600 }}>
                            {j.profit >= 0 ? "+" : ""}{$(j.profit)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.clients.length > 0 && (
                    <div>
                      <div style={{ padding:"8px 14px 4px", fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:DIM, borderTop: searchResults.jobs.length > 0 ? `1px solid ${BORDER}` : "none" }}>Clients</div>
                      {searchResults.clients.map(c => (
                        <div key={c} onClick={() => { setSearchQ(""); setSearchOpen(false); onClientClick && onClientClick(); }}
                          style={{ padding:"9px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, borderTop:`1px solid ${BORDER}`, transition:"background 0.1s" }}
                          onMouseOver={e => e.currentTarget.style.background = BG2}
                          onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                          <span style={{ fontSize:14, color:DIM }}>◉</span>
                          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:DARK }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Date range controls ── */}
        <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:4,flexWrap:"wrap",flexShrink:0 }}>
          <div style={{ display:"flex",border:`1px solid ${BORDER}`,borderRadius:5,overflow:"hidden",background:CARD }}>
            {DATE_RANGES.map((r,i) => (
              <button key={r.key} onClick={()=>setDateRange(r.key)} style={{ cursor:"pointer",padding:"7px 13px",fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.03em",border:"none",borderRight:i<DATE_RANGES.length-1?`1px solid ${BORDER}`:"none",background:dateRange===r.key?ACCENT:CARD,color:dateRange===r.key?CARD:MID,transition:"all 0.15s" }}>{r.label}</button>
            ))}
          </div>
          <button onClick={()=>setDateRange("custom")} style={{ cursor:"pointer",padding:"7px 14px",fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.03em",border:`1px solid ${BORDER}`,borderRadius:5,background:dateRange==="custom"?ACCENT:CARD,color:dateRange==="custom"?CARD:MID,transition:"all 0.15s" }}>Custom</button>
          {dateRange === "custom" && (
            <div style={{ display:"flex",alignItems:"center",gap:6,marginLeft:4 }}>
              <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)}
                style={{ padding:"5px 10px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DARK,outline:"none",cursor:"pointer" }}
              />
              <span style={{ fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>→</span>
              <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)}
                style={{ padding:"5px 10px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DARK,outline:"none",cursor:"pointer" }}
              />
            </div>
          )}
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

      {/* ── Job Health Alerts card ── */}
      {(() => {
        const totalAlerts = unbilledJobs.length + atRiskJobs.length + lossJobs.length + lowMarginJobs.length;
        const accentColor = unbilledJobs.length > 0 ? "#C45C2A" : lossJobs.length > 0 ? RED : AMBER;
        const BURNT_ORANGE = "#C45C2A";
        const alertGroups = [
          { key:"unbilled",   label:"UNBILLED",   color:BURNT_ORANGE, bg:"rgba(196,92,42,0.07)",   border:"rgba(196,92,42,0.30)",  filled:true,  jobs:unbilledJobs,   headline: j => `${j.length} job${j.length!==1?"s":""} have costs but no invoice sent`,   sub: j => `${$(j.reduce((s,x)=>s+x.costs,0))} potentially unbilled`,   names: j => j.slice(0,4).map(x=>x.name).join(" · ") + (j.length>4?` +${j.length-4} more`:"") },
          { key:"atrisk",     label:"AT RISK",    color:AMBER,        bg:"rgba(196,144,32,0.07)",  border:"rgba(196,144,32,0.28)", filled:true,  jobs:atRiskJobs,     headline: j => `${j.length} active job${j.length!==1?"s":""} trending toward a loss`,    sub: () => "costs above 85% of revenue so far",                          names: j => j.slice(0,4).map(x=>`${x.name} (${x.marginPct}%)`).join(" · ") + (j.length>4?` +${j.length-4} more`:"") },
          { key:"loss",       label:"LOSS",       color:RED,          bg:"rgba(156,53,53,0.06)",   border:"rgba(156,53,53,0.25)",  filled:false, jobs:lossJobs,       headline: j => `${j.length} completed job${j.length!==1?"s":""} closed at a loss`,        sub: j => `${$(Math.abs(j.reduce((s,x)=>s+x.profit,0)))} total lost`,   names: j => j.slice(0,4).map(x=>`${x.name} (${x.marginPct}%)`).join(" · ") + (j.length>4?` +${j.length-4} more`:"") },
          { key:"lowmargin",  label:"LOW MARGIN", color:AMBER,        bg:"rgba(196,144,32,0.04)",  border:"rgba(196,144,32,0.18)", filled:false, jobs:lowMarginJobs,  headline: j => `${j.length} job${j.length!==1?"s":""} finished under 10% margin`,       sub: () => null,                                                         names: j => j.slice(0,4).map(x=>`${x.name} (${x.marginPct}%)`).join(" · ") + (j.length>4?` +${j.length-4} more`:"") },
        ].filter(g => g.jobs.length > 0);

        return (
          <div style={{ marginBottom:20, borderRadius:6, border:`1px solid ${BORDER}`, borderLeft: totalAlerts > 0 ? `4px solid ${accentColor}` : `4px solid ${ACCENT2}`, background:CARD, overflow:"hidden", boxShadow:"0 1px 4px rgba(44,36,22,0.04)" }}>
            {/* Collapsed header — always visible */}
            <div onClick={() => setAlertsOpen(o => !o)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", cursor:"pointer", userSelect:"none" }}>
              {/* Title */}
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color: totalAlerts > 0 ? MID : ACCENT2 }}>
                {totalAlerts > 0 ? `${totalAlerts} alert${totalAlerts!==1?"s":""}` : "No alerts"}
              </div>
              {/* Chips */}
              {totalAlerts > 0 && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {alertGroups.map(g => (
                    <span key={g.key} style={{ fontSize:10, fontWeight:600, fontFamily:"'DM Sans',sans-serif", padding:"2px 8px", borderRadius:4, color: g.filled ? CARD : g.color, background: g.filled ? g.color : `${g.color}12`, border:`1px solid ${g.color}40` }}>
                      {g.jobs.length} {g.label.toLowerCase()}
                    </span>
                  ))}
                </div>
              )}
              {totalAlerts === 0 && (
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:DIM }}>All jobs looking healthy</span>
              )}
              {/* Chevron */}
              <span style={{ marginLeft:"auto", fontSize:10, color:DIM }}>{alertsOpen ? "▲" : "▼"}</span>
            </div>

            {/* Expanded detail */}
            {alertsOpen && totalAlerts > 0 && (
              <div style={{ borderTop:`1px solid ${BORDER}` }}>
                {alertGroups.map((g, gi) => (
                  <div key={g.key} style={{ padding:"12px 18px", borderBottom: gi < alertGroups.length-1 ? `1px solid ${BORDER}` : "none", background: g.bg }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.05em", padding:"1px 7px", borderRadius:3, color: g.filled ? CARD : g.color, background: g.filled ? g.color : "transparent", border:`1px solid ${g.color}` }}>
                        {g.label}
                      </span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color: g.filled ? g.color : MID }}>{g.headline(g.jobs)}</span>
                      {g.sub(g.jobs) && <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:MID }}>· {g.sub(g.jobs)}</span>}
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:MID, paddingLeft:4 }}>{g.names(g.jobs)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* KPI Drilldown Modal */}
      {activeKpi && (
        <KpiModal
          type={activeKpi}
          expenseView={expenseView}
          jobSummaries={typeFilteredJobs}
          allJobSummaries={jobSummaries}
          overhead={overhead}
          untagged={filteredUntagged}
          totalRev={totalRev}
          totalCost={totalCost}
          totalOverhead={totalOverhead}
          totalProfit={totalProfit}
          accountedFor={accountedFor}
          totalExpenses={totalExpenses}
          onClose={() => setActiveKpi(null)}
          onJobClick={(job) => { setActiveKpi(null); onJobClick(job); }}
          onJumpToInbox={onJumpToInbox}
        />
      )}

      {/* ── KPI Hero Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:18, marginBottom:28 }}>

        {/* PROFIT */}
        <div className="pls card" onClick={()=>setActiveKpi('profit')}
          style={{ padding:"22px 28px", cursor:"pointer", borderTop:`4px solid ${heroColor}`, display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:130 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em", color:DIM, textTransform:"uppercase" }}>
              {heroIsNet ? "Net Profit" : "Gross Profit"}
            </div>
            <div style={{ display:"flex", border:`1px solid ${BORDER}`, borderRadius:3, overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
              {[["job","Gross"],["fixed","Net"]].map(([k,l],i) => (
                <button key={k} onClick={e=>{e.stopPropagation();setExpenseView(k);}}
                  style={{ cursor:"pointer", padding:"3px 10px", fontSize:10, fontWeight:600, fontFamily:"'DM Sans',sans-serif", border:"none", borderRight:i===0?`1px solid ${BORDER}`:"none", background:expenseView===k?ACCENT2:CARD, color:expenseView===k?CARD:DIM, transition:"all 0.15s" }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ fontFamily:"'Lora',serif", fontSize:46, fontWeight:700, color:heroColor, letterSpacing:"-0.03em", lineHeight:1.05, margin:"8px 0 6px" }}>{$(heroProfit)}</div>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            {ppcProfitPct != null && (
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500, color: ppcProfitPct >= 0 ? ACCENT2 : RED, display:"flex", alignItems:"center", gap:3 }}>
                <span style={{ fontSize:9 }}>{ppcProfitPct >= 0 ? "▲" : "▼"}</span> {Math.abs(ppcProfitPct)}%
                <span style={{ fontWeight:400, color:DIM, fontSize:10 }}>&nbsp;{ppcLbl}</span>
              </span>
            )}
            <div className="kpi-tooltip" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:DIM, display:"inline-flex" }}>
              {heroMargin}% {heroIsNet ? "net" : "gross"} margin
              <span className="tooltip-text" style={{ width:200 }}>
                {heroIsNet ? "Net margin" : "Gross margin"} = Profit ÷ Revenue. {heroIsNet ? "Accounts for fixed costs." : "Job costs only."}
              </span>
            </div>
          </div>
        </div>

        {/* REVENUE */}
        <div className="pls card" onClick={()=>setActiveKpi('revenue')}
          style={{ padding:"22px 24px", cursor:"pointer", borderTop:`4px solid ${ACCENT}`, display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:130 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em", color:DIM, textTransform:"uppercase" }}>Revenue</div>
          <div>
            <div style={{ fontFamily:"'Lora',serif", fontSize:38, fontWeight:700, color:DARK, margin:"8px 0 4px" }}>{$(totalRev)}</div>
            {ppcRevPct != null ? (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500, color: ppcRevPct >= 0 ? ACCENT2 : RED, display:"flex", alignItems:"center", gap:3, marginBottom:2 }}>
                <span style={{ fontSize:9 }}>{ppcRevPct >= 0 ? "▲" : "▼"}</span> {Math.abs(ppcRevPct)}%
                <span style={{ fontWeight:400, color:DIM, fontSize:10 }}>&nbsp;{ppcLbl}</span>
              </div>
            ) : null}
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM }}>{typeFilteredJobs.length} job{typeFilteredJobs.length!==1?"s":""} billed</div>
          </div>
        </div>

        {/* EXPENSES */}
        <div className="pls card" onClick={()=>setActiveKpi('expenses')}
          style={{ padding:"22px 24px", cursor:"pointer", borderTop:`4px solid ${AMBER}`, display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:130 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em", color:DIM, textTransform:"uppercase" }}>
              {heroIsNet ? "Total Expenses" : "Job Expenses"}
            </div>
            {/* DQ badge with tooltip */}
            {(() => {
              const untaggedActive = filteredUntagged.filter(u => u.status !== 'dismissed');
              const hasIssues = untaggedActive.length > 0;
              return (
                <div className="kpi-tooltip" onClick={e => { e.stopPropagation(); setActiveKpi('quality'); }}
                  style={{ border:`1.5px solid ${dqColor}`, borderRadius:5, background:`${dqColor}18`, padding:"4px 9px", cursor:"pointer", textAlign:"center", flexShrink:0, transition:"opacity 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.opacity="0.7"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:700, color:dqColor, letterSpacing:"0.04em" }}>
                    {hasIssues ? `${untaggedActive.length} untagged` : "All tagged"}
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:dqColor, marginTop:2 }}>
                    {dataQuality}% quality
                  </div>
                  <span className="tooltip-text" style={{ width:200 }}>
                    Data Quality Score: {dataQuality}% of expenses are tagged to a job or marked as overhead. Higher = more accurate profitability.
                  </span>
                </div>
              );
            })()}
          </div>
          <div>
            <div style={{ fontFamily:"'Lora',serif", fontSize:38, fontWeight:700, color:MID, margin:"8px 0 4px" }}>
              {heroIsNet ? $(totalCost + totalOverhead) : $(totalCost)}
            </div>
            {ppcCostPct != null ? (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500, color: ppcCostPct <= 0 ? ACCENT2 : RED, display:"flex", alignItems:"center", gap:3, marginBottom:2 }}>
                <span style={{ fontSize:9 }}>{ppcCostPct <= 0 ? "▼" : "▲"}</span> {Math.abs(ppcCostPct)}%
                <span style={{ fontWeight:400, color:DIM, fontSize:10 }}>&nbsp;{ppcLbl}</span>
              </div>
            ) : null}
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM }}>
              {heroIsNet
                ? `${$(totalCost)} job + ${$(totalOverhead)} fixed`
                : `${$(totalMaterial)} material · ${$(totalLabor)} labor`}
            </div>
          </div>
        </div>

      </div>

      {/* ── Revenue Goal Tracker ── */}
      {(() => {
        const goalAmt = revenueGoal?.revenue_target || 0;
        const goalPeriod = revenueGoal?.period || "annual";
        // For annual goal, use all jobs in current year; for monthly, use current month; for quarterly, use current quarter
        const goalJobs = goalAmt > 0 ? jobSummaries.filter(j => {
          if (!j.firstDate && !j.lastDate) return false;
          const jd = new Date(j.lastDate || j.firstDate);
          const y = MOCK_TODAY.getFullYear(); const m = MOCK_TODAY.getMonth();
          if (goalPeriod === "annual") return jd.getFullYear() === y;
          if (goalPeriod === "monthly") return jd.getFullYear() === y && jd.getMonth() === m;
          if (goalPeriod === "quarterly") { const q = Math.floor(m/3); return jd.getFullYear() === y && Math.floor(jd.getMonth()/3) === q; }
          return true;
        }) : [];
        const goalRevenue = goalJobs.reduce((s,j) => s + j.revenue, 0);
        const pct = goalAmt > 0 ? Math.min((goalRevenue / goalAmt) * 100, 100) : 0;
        // Pace: how far through the period are we?
        const now = MOCK_TODAY; const y = now.getFullYear(); const m = now.getMonth();
        let elapsed = 0;
        if (goalPeriod === "annual") elapsed = ((now - new Date(y,0,1)) / (new Date(y+1,0,1) - new Date(y,0,1))) * 100;
        else if (goalPeriod === "monthly") elapsed = (now.getDate() / new Date(y,m+1,0).getDate()) * 100;
        else if (goalPeriod === "quarterly") { const qs = new Date(y,Math.floor(m/3)*3,1); const qe = new Date(y,Math.floor(m/3)*3+3,1); elapsed = ((now - qs) / (qe - qs)) * 100; }
        const pace = elapsed > 0 ? pct >= elapsed ? "on-track" : pct >= elapsed * 0.7 ? "behind" : "off-track" : "on-track";
        const barColor = pace === "on-track" ? ACCENT2 : pace === "behind" ? AMBER : RED;
        const paceLabel = pace === "on-track" ? "On track" : pace === "behind" ? "Slightly behind" : "Behind pace";

        return goalAmt > 0 ? (
          <div className="card" style={{ padding:"16px 22px", marginBottom:20, display:"flex", alignItems:"center", gap:18 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:600, letterSpacing:"0.1em", color:DIM, textTransform:"uppercase" }}>
                  Revenue Goal · {goalPeriod}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500, color:barColor }}>{paceLabel}</span>
                  <button onClick={onSetRevenueGoal} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:ACCENT, fontFamily:"'DM Sans',sans-serif", fontWeight:500, padding:0, textDecoration:"underline" }}>Edit</button>
                </div>
              </div>
              <div style={{ position:"relative", height:10, borderRadius:5, background:BG2, overflow:"hidden" }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${pct}%`, borderRadius:5, background:barColor, transition:"width 0.4s ease" }} />
                {/* Pace marker */}
                <div style={{ position:"absolute", left:`${Math.min(elapsed,100)}%`, top:-2, bottom:-2, width:2, background:DARK, opacity:0.25, borderRadius:1 }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:600, color:DARK }}>{$(goalRevenue)}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:DIM }}>{$(goalAmt)} target</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={onSetRevenueGoal} className="btn" style={{ fontSize:11, padding:"6px 14px", borderColor:ACCENT, color:ACCENT }}>
              Set Revenue Goal
            </button>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:DIM }}>Track your progress toward a revenue target</span>
          </div>
        );
      })()}

      {/* ── Active Jobs table — full width ── */}
      <div className="card" style={{ padding:"22px 26px", marginBottom:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",color:DIM,textTransform:"uppercase",marginBottom:5,fontWeight:500 }}>Active Jobs</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM }}>{sorted.length} job{sorted.length!==1?"s":""} · click headers to sort</div>
          </div>
        </div>
        {sorted.length === 0 ? (
          <div style={{ padding:"36px 0",textAlign:"center" }}>
            <div style={{ fontFamily:"'Lora',serif",fontSize:14,color:MID,fontStyle:"italic",marginBottom:6 }}>No jobs in this period</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM }}>Try selecting a different date range above.</div>
          </div>
        ) : (
          <>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${BORDER}` }}>
                  {[
                    { col:"name",     label:"Job",       align:"left"  },
                    { col:"client",   label:"Client",    align:"left"  },
                    { col:"revenue",  label:"Revenue",   align:"right" },
                    { col:"material", label:"Mat'l",     align:"right", tip:"Material & vendor costs from QB purchases" },
                    { col:"labor",    label:"Labor",     align:"right", tip:"Manual labor entries logged in Job Detail" },
                    { col:"costs",    label:"Total",     align:"right" },
                    { col:"profit",   label:"Profit",    align:"right" },
                    { col:"margin",   label:"Margin",    align:"right", tip:"Gross margin = Profit ÷ Revenue. Includes both material and labor costs." },
                  ].map(({ col, label, align, tip }) => (
                    <th key={col} onClick={() => handleColSort(col)}
                      style={{ padding:"7px 10px", textAlign:align, fontSize:9, letterSpacing:"0.08em", textTransform:"uppercase", color: sort===col ? DARK : DIM, fontWeight:600, cursor:"pointer", userSelect:"none", whiteSpace:"nowrap", position:"relative" }}>
                      <span className={tip ? "kpi-tooltip" : undefined} style={{ display:"inline-flex", alignItems:"center", gap:3 }}>
                        {label}
                        {sort===col
                          ? <span style={{ marginLeft:4, color:ACCENT }}>{sortDir==="asc"?"↑":"↓"}</span>
                          : <span style={{ marginLeft:4, opacity:0.25 }}>↕</span>
                        }
                        {tip && <span className="tooltip-text" style={{ width:220, left:"auto", right:0, transform:"none", textTransform:"none", letterSpacing:"normal", fontWeight:400 }}>{tip}</span>}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const maxM = Math.max(...sorted.map(j => Math.max(0, parseFloat(j.marginPct))), 1);
                  return sorted.slice(0, jobTableRows).map((j, i) => {
                    const m = parseFloat(j.marginPct);
                    const profitColor = j.profit < 0 ? RED : m >= 20 ? ACCENT2 : m >= 10 ? AMBER : DIM;
                    const barW = j.profit < 0 ? 0 : Math.min(100, (m / maxM) * 100);
                    const barColor = m >= 20 ? ACCENT2 : m >= 10 ? AMBER : RED;
                    return (
                      <tr key={j.id || i}
                        onClick={() => onJobClick && onJobClick(j)}
                        style={{ borderBottom:`1px solid ${BORDER}`, cursor: onJobClick ? "pointer" : "default", transition:"background 0.1s" }}
                        onMouseOver={e => e.currentTarget.style.background = BG2}
                        onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding:"9px 10px", color:DARK, fontWeight:500, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={j.name}>{j.name}</td>
                        <td style={{ padding:"9px 10px", color:MID, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={j.clientName}>{j.clientName || "—"}</td>
                        <td style={{ padding:"9px 10px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontSize:11, color:MID }}>{$(j.revenue)}</td>
                        <td style={{ padding:"9px 10px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontSize:11, color:DIM }}>{$(j.materialCost || 0)}</td>
                        <td style={{ padding:"9px 10px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontSize:11, color:DIM }}>{$(j.laborCost || 0)}</td>
                        <td style={{ padding:"9px 10px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontSize:11, color:MID }}>{$(j.costs)}</td>
                        <td style={{ padding:"9px 10px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:700, color:profitColor }}>{j.profit >= 0 ? "+" : ""}{$(j.profit)}</td>
                        <td style={{ padding:"9px 10px", textAlign:"right" }}>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:600, color:barColor }}>{j.marginPct}%</span>
                            <div style={{ width:52, height:3, background:BORDER, borderRadius:2, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${barW}%`, background:barColor, borderRadius:2, transition:"width 0.3s" }}/>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
            {sorted.length > 10 && (
              <div style={{ marginTop:12, textAlign:"center" }}>
                {jobTableRows < sorted.length ? (
                  <button className="btn" onClick={() => setJobTableRows(sorted.length)} style={{ fontSize:11, color:ACCENT }}>
                    Show all {sorted.length} jobs ↓
                  </button>
                ) : (
                  <button className="btn" onClick={() => setJobTableRows(10)} style={{ fontSize:11, color:DIM }}>
                    Show less ↑
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}

// ─── VENDOR SETUP MODAL ──────────────────────────────────────────────────────
// Shown after first sync (or via sidebar) to let the user pick which vendors
// are job-related. Future syncs only process those vendors, eliminating bank noise.

function VendorSetup({ userId, vendorRules, onSave, onClose, isFirstRun }) {
  const [allVendors, setAllVendors]   = useState([]);
  const [selected, setSelected]       = useState(new Set());
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);

  // On mount: load all distinct vendors from synced data + pre-check already-tracked ones
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [{ data: txnRows }, { data: inboxRows }] = await Promise.all([
          supabase.from('transactions').select('vendor').eq('contractor_id', userId).not('vendor', 'is', null),
          supabase.from('inbox_tags').select('vendor').eq('contractor_id', userId).not('vendor', 'is', null),
        ]);
        const vendorSet = new Set([
          ...(txnRows  || []).map(r => r.vendor),
          ...(inboxRows || []).map(r => r.vendor),
        ].filter(v => v && v.trim() !== '' && v !== 'Unknown Vendor'));
        const sorted = [...vendorSet].sort((a, b) => a.localeCompare(b));
        setAllVendors(sorted);

        // Pre-check vendors already marked 'tracked' in vendor_rules
        const alreadyTracked = new Set(
          (vendorRules || [])
            .filter(r => r.rule_type === 'tracked')
            .map(r => r.vendor_name)
        );
        setSelected(alreadyTracked);
      } catch (e) { // eslint-disable-line no-unused-vars
        console.error('Error loading vendors for setup');
      }
      setLoading(false);
    }
    load();
  }, [userId, vendorRules]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = allVendors.filter(v => v.toLowerCase().includes(search.toLowerCase()));
  const allFilteredSelected = filtered.length > 0 && filtered.every(v => selected.has(v));

  function toggleVendor(v) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v); else next.add(v);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach(v => next.delete(v));
      else filtered.forEach(v => next.add(v));
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Remove old 'tracked' rules and write fresh set
      await supabase
        .from('vendor_rules')
        .delete()
        .eq('contractor_id', userId)
        .eq('rule_type', 'tracked');

      if (selected.size > 0) {
        await supabase
          .from('vendor_rules')
          .insert([...selected].map(v => ({
            contractor_id: userId,
            vendor_name:   v,
            rule_type:     'tracked',
          })));
      }
      onSave();
    } catch (err) {
      console.error('Error saving vendor setup:', err);
    }
    setSaving(false);
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(44,36,22,0.5)',zIndex:700,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
      <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:8,width:'100%',maxWidth:560,maxHeight:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(44,36,22,0.22)' }}>

        {/* Header */}
        <div style={{ padding:'24px 28px 18px',borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12 }}>
            <div>
              <h2 style={{ fontFamily:"'Lora',serif",fontSize:20,fontWeight:500,color:DARK,letterSpacing:'-0.01em',marginBottom:4 }}>
                {isFirstRun ? 'Set up your job vendors' : 'Manage job vendors'}
              </h2>
              <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,lineHeight:1.5 }}>
                Select the vendors whose expenses should flow into your dashboard. Only these vendors will be synced — bank transactions and overhead vendors stay out.
              </p>
            </div>
            {!isFirstRun && (
              <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:DIM,fontSize:20,lineHeight:1,padding:'2px 4px',flexShrink:0 }}>×</button>
            )}
          </div>
          {isFirstRun && (
            <div style={{ marginTop:14,padding:'11px 14px',borderRadius:5,background:'rgba(92,122,90,0.08)',border:`1px solid rgba(92,122,90,0.2)` }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:ACCENT2,fontWeight:500,marginBottom:2 }}>You can change this any time</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID }}>Access Vendor Setup from the sidebar under QuickBooks settings. Add or remove vendors whenever your business changes.</div>
            </div>
          )}
        </div>

        {/* Search + select-all */}
        <div style={{ padding:'14px 28px',borderBottom:`1px solid ${BORDER}`,display:'flex',alignItems:'center',gap:10 }}>
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex:1,padding:'7px 12px',borderRadius:5,border:`1px solid ${BORDER}`,background:BG,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DARK,outline:'none' }}
          />
          <button
            className="btn"
            onClick={toggleAllFiltered}
            style={{ whiteSpace:'nowrap',fontSize:11 }}
          >
            {allFilteredSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {/* Vendor list */}
        <div style={{ flex:1,overflowY:'auto',padding:'8px 0' }}>
          {loading ? (
            <div style={{ padding:'40px',textAlign:'center',fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM }}>Loading vendors...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'40px',textAlign:'center',fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM }}>
              {allVendors.length === 0 ? 'No vendors found — sync your QuickBooks data first.' : 'No vendors match your search.'}
            </div>
          ) : (
            filtered.map(v => {
              const isChecked = selected.has(v);
              return (
                <div
                  key={v}
                  onClick={() => toggleVendor(v)}
                  style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 28px',cursor:'pointer',background:isChecked?'rgba(92,122,90,0.06)':'transparent',borderBottom:`1px solid ${BORDER}`,transition:'background 0.1s' }}
                >
                  <div style={{ width:16,height:16,borderRadius:3,border:`1.5px solid ${isChecked?ACCENT2:BORDER}`,background:isChecked?ACCENT2:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s' }}>
                    {isChecked && <span style={{ color:CARD,fontSize:11,lineHeight:1,fontWeight:700 }}>✓</span>}
                  </div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:isChecked?DARK:MID,fontWeight:isChecked?500:400 }}>{v}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 28px',borderTop:`1px solid ${BORDER}`,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM }}>
            {selected.size} vendor{selected.size !== 1 ? 's' : ''} selected
          </div>
          <div style={{ display:'flex',gap:10 }}>
            {!isFirstRun && <button className="btn" onClick={onClose}>Cancel</button>}
            <button
              className="btn act"
              onClick={handleSave}
              disabled={saving || selected.size === 0}
              style={{ opacity:(saving || selected.size === 0) ? 0.5 : 1 }}
            >
              {saving ? 'Saving...' : isFirstRun ? 'Save & Resync →' : 'Save changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── TAB: SYNC REVIEW ─────────────────────────────────────────────────────────

// Expense categories — shared between InboxAddExpenseForm and ManualExpenseSection
const EXPENSE_CATEGORIES = [
  { value: "materials", label: "Materials" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "equipment", label: "Equipment" },
  { value: "permits", label: "Permits" },
  { value: "other", label: "Other" },
];

// ─── INBOX ADD EXPENSE FORM (inline in Expense Management) ──────────────────

function InboxAddExpenseForm({ jobOptions, onSubmit, onCancel }) {
  const [desc, setDesc]         = useState("");
  const [vendor, setVendor]     = useState("");
  const [amount, setAmount]     = useState("");
  const [category, setCategory] = useState("materials");
  const [expDate, setExpDate]   = useState(() => new Date().toISOString().split('T')[0]);
  const [jobId, setJobId]       = useState("");

  const inputStyle = { padding:"7px 10px", borderRadius:5, border:`1px solid ${BORDER}`, background:CARD, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:DARK, outline:"none", boxSizing:"border-box" };

  function handleSubmit() {
    if (!desc.trim() || !amount || parseFloat(amount) <= 0) return;
    onSubmit({
      jobId: jobId || null,
      description: desc.trim(),
      vendor: vendor.trim() || null,
      amount: parseFloat(amount),
      category,
      expenseDate: expDate || null,
      source: "manual",
    });
  }

  return (
    <div style={{ padding:"16px 18px", borderRadius:6, border:`1px solid ${BORDER}`, background:CARD }}>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, color:MID, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.06em" }}>Add manual expense</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
        <div>
          <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Description *</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Cash lumber pickup" style={{ ...inputStyle, width:"100%" }} />
        </div>
        <div>
          <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Vendor / Payee</label>
          <input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="e.g. Home Depot" style={{ ...inputStyle, width:"100%" }} />
        </div>
        <div>
          <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Amount *</label>
          <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="420.00" style={{ ...inputStyle, width:"100%" }} />
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
        <div>
          <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, width:"100%" }}>
            {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Date</label>
          <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} style={{ ...inputStyle, width:"100%" }} />
        </div>
        <div>
          <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Assign to Job (optional)</label>
          <select value={jobId} onChange={e => setJobId(e.target.value)} style={{ ...inputStyle, width:"100%" }}>
            <option value="">— Leave untagged —</option>
            {jobOptions.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn" onClick={onCancel} style={{ fontSize:11 }}>Cancel</button>
        <button className="btn act" onClick={handleSubmit} disabled={!desc.trim() || !amount || parseFloat(amount) <= 0} style={{ fontSize:11, padding:"6px 16px", opacity: (!desc.trim() || !amount || parseFloat(amount) <= 0) ? 0.4 : 1 }}>Save Expense</button>
      </div>
    </div>
  );
}

function SyncReview({ autoMatched, suggested, untagged, allTagged, overhead, dismissed, jobSummaries, vendorRules, onConfirmSuggestion, onTag, onMarkOverhead, onDismiss, onRestore, onRetag, onUndoAutoMatch, onSaveVendorRule, onAddExpense, dateRange, setDateRange, customStart, setCustomStart, customEnd, setCustomEnd }) {
  const [section, setSection]             = useState("review");
  const [selections, setSelections]       = useState({});    // itemId -> jobId
  const [expandAuto, setExpandAuto]       = useState(false);
  const [retagItem, setRetagItem]         = useState(null);  // item being re-tagged
  const [retagJobId, setRetagJobId]       = useState("");
  const [searchTagged, setSearchTagged]   = useState("");
  const [searchReview, setSearchReview]   = useState("");
  const [searchQb, setSearchQb]           = useState("");
  const [toast, setToast]                 = useState(null);   // { message, color }
  const [confirmUndo, setConfirmUndo]     = useState(null);   // item awaiting undo confirmation
  const [bulkJobId, setBulkJobId]         = useState("");     // vendor-level bulk assign job
  const [showAddExpense, setShowAddExpense] = useState(false); // inline add-expense form
  const toastTimer = useRef(null);

  function showToast(message, color) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, color: color || ACCENT2 });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  // Job options for dropdowns
  const liveJobOptions = (jobSummaries || []).map(j => ({
    value: j.id, label: j.name, client: j.clientName || "",
  }));
  const jobOptions = liveJobOptions.length > 0 ? liveJobOptions : JOB_OPTIONS;

  // Job lookup for displaying names
  const jobLookup = useMemo(() => {
    const m = {};
    jobOptions.forEach(j => { m[j.value] = j; });
    return m;
  }, [jobOptions]);

  // Filter items by date range
  const filteredAutoMatched = filterUntaggedByDate(autoMatched || [], dateRange, customStart, customEnd);
  const filteredOverhead    = filterUntaggedByDate(overhead || [], dateRange, customStart, customEnd);

  // Suggested + untagged: date filter first, then search filter
  const dateSuggested = filterUntaggedByDate(suggested || [], dateRange, customStart, customEnd);
  const dateUntagged  = filterUntaggedByDate(untagged || [], dateRange, customStart, customEnd);
  const filteredSuggested = searchReview
    ? dateSuggested.filter(i => { const q = searchReview.toLowerCase(); return (i.vendor||'').toLowerCase().includes(q) || (i.description||'').toLowerCase().includes(q); })
    : dateSuggested;
  const filteredUntagged = searchReview
    ? dateUntagged.filter(i => { const q = searchReview.toLowerCase(); return (i.vendor||'').toLowerCase().includes(q) || (i.description||'').toLowerCase().includes(q); })
    : dateUntagged;

  // Tagged: search filter
  const filteredTagged = (allTagged || []).filter(t => {
    if (!searchTagged) return true;
    const q = searchTagged.toLowerCase();
    return (t.vendor || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
  });

  // QB-direct expenses: tagged in QuickBooks before sync — not from inbox workflow
  const qbDirectAll = useMemo(() => {
    const result = [];
    (jobSummaries || []).forEach(job => {
      (job.purchases || []).forEach(p => {
        if (!String(p.Id).includes('_automatch_')) {
          result.push({ ...p, jobName: job.name, jobId: job.id });
        }
      });
    });
    return result.sort((a,b) => new Date(b.TxnDate) - new Date(a.TxnDate));
  }, [jobSummaries]); // eslint-disable-line react-hooks/exhaustive-deps

  const qbDirect = useMemo(() => {
    let items = qbDirectAll;
    if (dateRange !== "all") {
      if (dateRange === "custom") {
        const start = customStart ? new Date(customStart) : null;
        const end   = customEnd   ? new Date(customEnd + "T23:59:59") : null;
        if (start || end) items = items.filter(p => { const d = new Date(p.TxnDate); return (!start || d >= start) && (!end || d <= end); });
      } else {
        const cutoff = getDateCutoff(dateRange);
        if (cutoff) items = items.filter(p => new Date(p.TxnDate) >= cutoff);
      }
    }
    if (searchQb) {
      const q = searchQb.toLowerCase();
      items = items.filter(p =>
        (p.EntityRef?.name||'').toLowerCase().includes(q) ||
        (p.Line?.[0]?.Description||'').toLowerCase().includes(q) ||
        (p.jobName||'').toLowerCase().includes(q)
      );
    }
    return items;
  }, [qbDirectAll, dateRange, customStart, customEnd, searchQb]); // eslint-disable-line react-hooks/exhaustive-deps

  const qbDirectTotal = qbDirect.reduce((s,p) => s + (p.TotalAmt||0), 0);

  // Group auto-matched by vendor → job for the summary
  const autoGrouped = useMemo(() => {
    const groups = {};
    filteredAutoMatched.forEach(item => {
      const job = jobLookup[item.taggedJobId];
      const key = `${item.vendor}→${item.taggedJobId}`;
      if (!groups[key]) groups[key] = { vendor: item.vendor, jobName: job?.label || 'Unknown Job', jobId: item.taggedJobId, items: [], total: 0 };
      groups[key].items.push(item);
      groups[key].total += item.amount;
    });
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [filteredAutoMatched, jobLookup]);

  // Group needs-review items by vendor for bulk actions
  const reviewVendorGroups = useMemo(() => {
    const groups = {};
    [...filteredSuggested, ...filteredUntagged].forEach(item => {
      if (!groups[item.vendor]) groups[item.vendor] = { items: [], total: 0, hasSuggested: false };
      groups[item.vendor].items.push(item);
      groups[item.vendor].total += item.amount;
      if (item.suggestedJob) groups[item.vendor].hasSuggested = true;
    });
    return Object.entries(groups)
      .filter(([, g]) => g.items.length >= 2) // only group vendors with 2+ items
      .sort((a, b) => b[1].total - a[1].total);
  }, [filteredSuggested, filteredUntagged]);

  const needsReviewCount = dateSuggested.length + dateUntagged.length; // unfiltered by search for badge
  const autoTotal   = filteredAutoMatched.reduce((s, i) => s + i.amount, 0);
  const reviewTotal = [...filteredSuggested, ...filteredUntagged].reduce((s, i) => s + i.amount, 0);

  // ── Bulk actions ──

  function handleConfirmAllSuggestions() {
    const items = filteredSuggested.filter(i => i.suggestedJob);
    if (!items.length) return;
    items.forEach(item => {
      const job = jobLookup[item.suggestedJob];
      onConfirmSuggestion(item, item.suggestedJob, job?.label || '');
    });
    showToast(`${items.length} expenses confirmed ✓`, ACCENT2);
  }

  function handleBulkOverhead(items) {
    items.forEach(item => onMarkOverhead(item));
    showToast(`${items.length} marked as fixed costs`, AMBER);
  }

  function handleBulkDismiss(items) {
    items.forEach(item => onDismiss(item.id));
    showToast(`${items.length} dismissed`, DIM);
  }

  function handleBulkAssign(items, jobId) {
    const job = jobOptions.find(j => j.value === jobId);
    items.forEach(item => {
      if (item.suggestedJob) {
        onConfirmSuggestion(item, jobId, job?.label || '');
      } else {
        onTag(item, jobId, job?.label || '');
      }
    });
    setSearchReview("");
    showToast(`${items.length} tagged to ${job?.label || 'job'} ✓`, ACCENT2);
  }

  // Confirm a suggestion — accept the match
  function handleConfirmSuggestion(item) {
    const job = jobLookup[item.suggestedJob];
    onConfirmSuggestion(item, item.suggestedJob, job?.label || '');
    showToast(`Tagged to ${job?.label || 'job'} ✓`, ACCENT2);
  }

  // Assign a needs-attention item manually
  function handleAssign(item) {
    const jobId = selections[item.id];
    if (!jobId) return;
    const job = jobOptions.find(j => j.value === jobId);
    onTag(item, jobId, job?.label || '');
    setSelections(prev => { const n = { ...prev }; delete n[item.id]; return n; });
    showToast(`Tagged to ${job?.label || 'job'} ✓`, ACCENT2);
  }

  // Change a suggested item to a different job
  function handleChangeSuggestion(item) {
    const jobId = selections[item.id];
    if (!jobId) return;
    const job = jobOptions.find(j => j.value === jobId);
    onConfirmSuggestion(item, jobId, job?.label || '');
    setSelections(prev => { const n = { ...prev }; delete n[item.id]; return n; });
    showToast(`Tagged to ${job?.label || 'job'} ✓`, ACCENT2);
  }

  // Submit a re-tag
  function handleRetagSubmit() {
    if (!retagItem || !retagJobId) return;
    const job = jobOptions.find(j => j.value === retagJobId);
    onRetag(retagItem, retagJobId, job?.label || '');
    showToast(`Moved to ${job?.label || 'job'} ✓`, ACCENT2);
    setRetagItem(null);
    setRetagJobId("");
  }

  // Confirm-then-undo auto-match (two-step to prevent accidents)
  function handleUndoConfirmed() {
    if (!confirmUndo) return;
    onUndoAutoMatch(confirmUndo);
    showToast(`Removed auto-match — moved to Needs Review`, AMBER);
    setConfirmUndo(null);
  }

  // Section tab data
  const sections = [
    { key: "auto",     label: "Auto-Matched",  count: filteredAutoMatched.length, color: ACCENT2 },
    { key: "review",   label: "Needs Review",   count: needsReviewCount,           color: needsReviewCount > 0 ? AMBER : ACCENT2 },
    { key: "fixed",    label: "Fixed Costs",    count: filteredOverhead.length,    color: ACCENT2 },
    { key: "tagged",   label: "All Tagged",      count: filteredTagged.length,      color: ACCENT2 },
    { key: "qbtagged", label: "Tagged in QB",   count: qbDirect.length,            color: ACCENT2 },
  ];

  return (
    <div style={{ padding:"32px 36px",background:BG,minHeight:"100vh",position:"relative" }}>

      {/* Toast notification */}
      {toast && (
        <div style={{ position:"fixed",top:24,right:24,zIndex:800,padding:"12px 20px",borderRadius:6,background:CARD,border:`1px solid ${toast.color}44`,boxShadow:"0 8px 24px rgba(44,36,22,0.15)",display:"flex",alignItems:"center",gap:8,animation:"fadeIn 0.2s ease" }}>
          <div style={{ width:8,height:8,borderRadius:"50%",background:toast.color,flexShrink:0 }}/>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DARK,fontWeight:500 }}>{toast.message}</span>
        </div>
      )}

      {/* Undo auto-match confirmation dialog */}
      {confirmUndo && (
        <div style={{ position:"fixed",inset:0,background:"rgba(44,36,22,0.4)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
          <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:8,padding:"28px 32px",maxWidth:440,boxShadow:"0 20px 60px rgba(44,36,22,0.2)" }}>
            <h3 style={{ fontFamily:"'Lora',serif",fontSize:17,fontWeight:500,color:DARK,marginBottom:8 }}>Undo auto-match?</h3>
            <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:MID,lineHeight:1.6,marginBottom:6 }}>
              This will remove <strong style={{ color:DARK }}>{confirmUndo.vendor}</strong> · {$(confirmUndo.amount)} from its matched job and move it to Needs Review for manual assignment.
            </p>
            <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginBottom:20 }}>The expense will be removed from job costs until you re-assign it.</p>
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <button className="btn" onClick={()=>setConfirmUndo(null)}>Cancel</button>
              <button className="btn" onClick={handleUndoConfirmed} style={{ borderColor:"rgba(140,107,48,0.3)",color:AMBER }}>Yes, undo match</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:20, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div>
            <h1 style={{ fontFamily:"'Lora',serif",fontSize:24,fontWeight:600,color:DARK,letterSpacing:"-0.02em" }}>Expense Management</h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginTop:4 }}>Review how Canopy matched your expenses to jobs. Confirm, correct, or assign what needs attention.</p>
          </div>
        </div>
        {/* Date range toggle */}
        <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
          <div style={{ display:"flex",border:`1px solid ${BORDER}`,borderRadius:5,overflow:"hidden" }}>
            {DATE_RANGES.map((r,i) => (
              <button key={r.key} onClick={()=>setDateRange(r.key)} style={{ cursor:"pointer",padding:"7px 13px",fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.03em",border:"none",borderRight:i<DATE_RANGES.length-1?`1px solid ${BORDER}`:"none",background:dateRange===r.key?ACCENT:CARD,color:dateRange===r.key?CARD:MID,transition:"all 0.15s" }}>{r.label}</button>
            ))}
          </div>
          <button onClick={()=>setDateRange("custom")} style={{ cursor:"pointer",padding:"7px 14px",fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.03em",border:`1px solid ${BORDER}`,borderRadius:5,background:dateRange==="custom"?ACCENT:CARD,color:dateRange==="custom"?CARD:MID,transition:"all 0.15s" }}>Custom</button>
          {dateRange === "custom" && (
            <div style={{ display:"flex",alignItems:"center",gap:6,marginLeft:4 }}>
              <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{ padding:"5px 10px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DARK,outline:"none",cursor:"pointer" }} />
              <span style={{ fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>→</span>
              <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{ padding:"5px 10px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DARK,outline:"none",cursor:"pointer" }} />
            </div>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28 }}>
        {[
          { label:"Auto-Matched",     val:filteredAutoMatched.length, sub:$(autoTotal)+" matched automatically",               color:filteredAutoMatched.length>0?ACCENT2:DIM },
          { label:"Needs Review",      val:needsReviewCount,          sub:$(reviewTotal)+" awaiting your input",                color:needsReviewCount>0?AMBER:ACCENT2 },
          { label:"Fixed Costs",       val:filteredOverhead.length,    sub:$(filteredOverhead.reduce((s,o)=>s+o.amount,0))+" overhead", color:filteredOverhead.length>0?ACCENT2:DIM },
          { label:"All Tagged",        val:filteredTagged.length,      sub:"confirmed + auto-matched + manual",                 color:ACCENT2 },
        ].map((k,i) => (
          <div key={i} className="kpi" style={{ cursor:"pointer" }} onClick={()=>setSection(sections[i].key)}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",color:DIM,textTransform:"uppercase",marginBottom:12,fontWeight:500 }}>{k.label}</div>
            <div style={{ fontFamily:"'Lora',serif",fontSize:28,fontWeight:500,color:k.color }}>{k.val}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM,marginTop:6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Add Expense button + inline form */}
      <div style={{ marginBottom:20 }}>
        {!showAddExpense ? (
          <button className="btn act" onClick={() => setShowAddExpense(true)} style={{ fontSize:11, padding:"7px 16px" }}>+ Add Manual Expense</button>
        ) : (
          <InboxAddExpenseForm
            jobOptions={jobOptions}
            onSubmit={(entry) => {
              if (onAddExpense) onAddExpense(entry);
              setShowAddExpense(false);
              showToast(`Expense added: ${$(entry.amount)}`, ACCENT2);
            }}
            onCancel={() => setShowAddExpense(false)}
          />
        )}
      </div>

      {/* Section tabs */}
      <div style={{ display:"flex",alignItems:"center",gap:0,marginBottom:24,borderBottom:`1px solid ${BORDER}` }}>
        {sections.map(t => (
          <button key={t.key} onClick={()=>setSection(t.key)} style={{
            cursor:"pointer", padding:"10px 20px", fontSize:12, fontWeight:500,
            fontFamily:"'DM Sans',sans-serif", border:"none", borderBottom:`2px solid ${section===t.key?ACCENT:BORDER}`,
            background:"transparent", color:section===t.key?DARK:DIM,
            marginBottom:-1, transition:"all 0.15s",
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ marginLeft:7, padding:"1px 7px", borderRadius:10, fontSize:10, fontWeight:600,
                background: section===t.key ? `${t.color}22` : BG2,
                color: section===t.key ? t.color : DIM,
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── AUTO-MATCHED section ── */}
      {section === "auto" && (
        <div>
          {filteredAutoMatched.length === 0 ? (
            <div style={{ padding:40,textAlign:"center",color:DIM,fontFamily:"'DM Sans',sans-serif",fontSize:13 }}>No auto-matched expenses yet. Matching improves as you tag more expenses.</div>
          ) : (
            <div>
              {/* Collapsed summary */}
              <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:6,marginBottom:16 }}>
                <div onClick={()=>setExpandAuto(!expandAuto)} style={{ display:"flex",alignItems:"center",gap:12,padding:"16px 20px",cursor:"pointer" }}>
                  <div style={{ width:32,height:32,borderRadius:"50%",background:"rgba(92,122,90,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <span style={{ color:ACCENT2,fontSize:14 }}>✓</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:DARK }}>{filteredAutoMatched.length} expense{filteredAutoMatched.length!==1?"s":""} auto-matched</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginTop:2 }}>{$(autoTotal)} total · matched by vendor history</div>
                  </div>
                  <span style={{ fontSize:10,color:DIM }}>{expandAuto?"▲ Hide details":"▼ Show details"}</span>
                </div>

                {/* Summary rows by vendor→job */}
                {!expandAuto && autoGrouped.length > 0 && (
                  <div style={{ padding:"0 20px 14px" }}>
                    {autoGrouped.slice(0, 5).map((g, i) => (
                      <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"5px 0",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID }}>
                        <span style={{ fontWeight:500 }}>{g.vendor}</span>
                        <span style={{ color:DIM }}>→</span>
                        <span>{g.jobName}</span>
                        <span style={{ marginLeft:"auto",fontFamily:"'DM Mono',monospace",fontSize:11,color:RED }}>–{$(g.total)}</span>
                        <span style={{ fontSize:10,color:DIM }}>({g.items.length})</span>
                      </div>
                    ))}
                    {autoGrouped.length > 5 && (
                      <div style={{ fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif",marginTop:4,cursor:"pointer" }} onClick={()=>setExpandAuto(true)}>+ {autoGrouped.length - 5} more vendor{autoGrouped.length - 5 !== 1 ? "s" : ""}...</div>
                    )}
                  </div>
                )}

                {/* Expanded: individual items with undo */}
                {expandAuto && (
                  <div style={{ borderTop:`1px solid ${BORDER}` }}>
                    {filteredAutoMatched.map((item, idx) => {
                      const job = jobLookup[item.taggedJobId];
                      return (
                        <div key={item.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:idx<filteredAutoMatched.length-1?`1px solid ${BORDER}`:"none" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:DARK }}>{item.vendor}</span>
                              <span className="mono" style={{ fontSize:10,color:DIM }}>{item.date}</span>
                            </div>
                            <div style={{ fontSize:12,color:MID,fontFamily:"'DM Sans',sans-serif" }}>{item.description}</div>
                            <div style={{ fontSize:11,color:ACCENT2,fontFamily:"'DM Sans',sans-serif",marginTop:4 }}>→ {job?.label || 'Unknown'} · {Math.round((item.confidence || 0) * 100)}% confidence</div>
                            {item.matchReason && <div style={{ fontSize:10,color:DIM,fontFamily:"'DM Sans',sans-serif",marginTop:2 }}>{item.matchReason}</div>}
                          </div>
                          <div style={{ fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:500,color:RED,minWidth:80,textAlign:"right" }}>–{$(item.amount)}</div>
                          <button className="btn" onClick={()=>setConfirmUndo(item)} style={{ fontSize:11,whiteSpace:"nowrap" }}>Undo</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NEEDS REVIEW section (suggested + needs attention) ── */}
      {section === "review" && (
        <div>
          {needsReviewCount === 0 ? (
            <div style={{ padding:40,textAlign:"center",color:DIM,fontFamily:"'DM Sans',sans-serif",fontSize:13 }}>All caught up — nothing needs review right now.</div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>

              {/* Search bar */}
              <div style={{ marginBottom:8 }}>
                <input
                  type="text"
                  placeholder="Search vendor or description..."
                  value={searchReview}
                  onChange={e => setSearchReview(e.target.value)}
                  style={{ width:"100%",maxWidth:400,padding:"8px 14px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DARK,outline:"none" }}
                />
              </div>

              {/* Vendor summary chips — quick glance at which vendors have the most items */}
              {reviewVendorGroups.length > 0 && (
                <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:8 }}>
                  {reviewVendorGroups.slice(0, 6).map(([vendor, g]) => (
                    <button key={vendor} onClick={()=>setSearchReview(vendor)} style={{ cursor:"pointer",padding:"5px 12px",borderRadius:4,border:`1px solid ${BORDER}`,background:searchReview===vendor?ACCENT:CARD,color:searchReview===vendor?CARD:MID,fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:500,transition:"all 0.15s" }}>
                      {vendor} ({g.items.length}) · {$(g.total)}
                    </button>
                  ))}
                  {searchReview && (
                    <button onClick={()=>setSearchReview("")} style={{ cursor:"pointer",padding:"5px 12px",borderRadius:4,border:`1px solid ${BORDER}`,background:"transparent",color:DIM,fontFamily:"'DM Sans',sans-serif",fontSize:11 }}>Clear ×</button>
                  )}
                </div>
              )}

              {/* Vendor bulk action bar — visible when filtering by vendor */}
              {searchReview && (() => {
                const allVisible = [...filteredSuggested, ...filteredUntagged];
                return allVisible.length >= 2 ? (
                  <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:6,background:"rgba(92,122,90,0.06)",border:`1px solid rgba(92,122,90,0.15)`,marginBottom:10,flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:MID }}>{allVisible.length} items · {$(allVisible.reduce((s,i)=>s+i.amount,0))}</span>
                    <span style={{ color:BORDER }}>|</span>
                    <select className="job-select" value={bulkJobId} onChange={e=>setBulkJobId(e.target.value)} style={{ minWidth:180,fontSize:11 }}>
                      <option value="">Tag all to job...</option>
                      {jobOptions.map(j=><option key={j.value} value={j.value}>{j.label}{j.client?` (${j.client})`:""}</option>)}
                    </select>
                    <button className={`btn${bulkJobId?" act":""}`} disabled={!bulkJobId} onClick={()=>{handleBulkAssign(allVisible,bulkJobId);setBulkJobId("");}} style={{ fontSize:11,opacity:bulkJobId?1:0.45 }}>Tag All →</button>
                    <button className="btn" onClick={()=>handleBulkOverhead(allVisible)} style={{ fontSize:11,borderColor:"rgba(140,107,48,0.3)",color:AMBER }}>All Fixed Costs</button>
                    <button className="btn red" onClick={()=>handleBulkDismiss(allVisible)} style={{ fontSize:11 }}>Dismiss All</button>
                  </div>
                ) : null;
              })()}

              {/* Confirm all suggestions button */}
              {filteredSuggested.length >= 2 && (
                <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:6 }}>
                  <button className="btn act" onClick={handleConfirmAllSuggestions} style={{ fontSize:11,padding:"6px 14px" }}>Confirm All Suggestions ({filteredSuggested.length})</button>
                </div>
              )}

              {/* Suggested matches first */}
              {filteredSuggested.length > 0 && (
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:DIM,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12 }}>Suggested Matches · {filteredSuggested.length}</div>
                  {filteredSuggested.map(item => {
                    const job = jobLookup[item.suggestedJob];
                    const hasOverride = !!selections[item.id];
                    return (
                      <div key={item.id} style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:"16px 20px",marginBottom:8 }}>
                        <div style={{ display:"flex",alignItems:"flex-start",gap:16 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap" }}>
                              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:DARK }}>{item.vendor}</span>
                              <span className="mono" style={{ fontSize:10,color:DIM }}>{item.docNumber}</span>
                              <span className="mono" style={{ fontSize:10,color:DIM }}>{item.date}</span>
                              <span className="tag">{item.paymentType}</span>
                            </div>
                            <div style={{ fontSize:12,color:MID,fontFamily:"'DM Sans',sans-serif",marginBottom:8 }}>{item.description}</div>
                            <div style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:4,background:"rgba(92,122,90,0.06)",border:`1px solid rgba(92,122,90,0.15)` }}>
                              <span style={{ fontSize:12,color:ACCENT2,fontFamily:"'DM Sans',sans-serif" }}>Suggested: <strong>{job?.label || 'Unknown'}</strong></span>
                              <span style={{ fontSize:10,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>· {Math.round((item.confidence || 0) * 100)}% match</span>
                            </div>
                            {item.matchReason && <div style={{ fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif",marginTop:6 }}>{item.matchReason}</div>}
                          </div>
                          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,minWidth:260 }}>
                            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:500,color:RED }}>–{$(item.amount)}</div>
                            <select className="job-select" value={selections[item.id]||""} onChange={e=>setSelections(prev=>({...prev,[item.id]:e.target.value}))}>
                              <option value="">Change job...</option>
                              {jobOptions.map(j=><option key={j.value} value={j.value}>{j.label}{j.client?` (${j.client})`:""}</option>)}
                            </select>
                            <div style={{ display:"flex",gap:6 }}>
                              <button className="btn" onClick={()=>{onMarkOverhead(item);showToast(`${item.vendor} marked as fixed cost`,AMBER);}} style={{ borderColor:"rgba(140,107,48,0.3)",color:AMBER }}>Fixed Cost</button>
                              <button className="btn red" onClick={()=>{onDismiss(item.id);showToast(`${item.vendor} dismissed`,DIM);}}>Dismiss</button>
                              {hasOverride ? (
                                <button className="btn act" onClick={()=>handleChangeSuggestion(item)}>Assign →</button>
                              ) : (
                                <button className="btn act" onClick={()=>handleConfirmSuggestion(item)}>Confirm ✓</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Needs attention (no match) */}
              {filteredUntagged.length > 0 && (
                <div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:DIM,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12 }}>Needs Attention · {filteredUntagged.length}</div>
                  {filteredUntagged.map(item => (
                    <div key={item.id} style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:"16px 20px",marginBottom:8 }}>
                      <div style={{ display:"flex",alignItems:"flex-start",gap:16 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap" }}>
                            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:DARK }}>{item.vendor}</span>
                            <span className="mono" style={{ fontSize:10,color:DIM }}>{item.docNumber}</span>
                            <span className="mono" style={{ fontSize:10,color:DIM }}>{item.date}</span>
                            <span className="tag">{item.paymentType}</span>
                          </div>
                          <div style={{ fontSize:12,color:MID,fontFamily:"'DM Sans',sans-serif" }}>{item.description}</div>
                          <div style={{ fontSize:11,color:AMBER,fontFamily:"'DM Sans',sans-serif",marginTop:6 }}>No confident match found</div>
                        </div>
                        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,minWidth:260 }}>
                          <div style={{ fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:500,color:RED }}>–{$(item.amount)}</div>
                          <select className="job-select" value={selections[item.id]||""} onChange={e=>setSelections(prev=>({...prev,[item.id]:e.target.value}))}>
                            <option value="">Assign to job...</option>
                            {jobOptions.map(j=><option key={j.value} value={j.value}>{j.label}{j.client?` (${j.client})`:""}</option>)}
                          </select>
                          <div style={{ display:"flex",gap:6 }}>
                            <button className="btn red" onClick={()=>{onDismiss(item.id);showToast(`${item.vendor} dismissed`,DIM);}}>Dismiss</button>
                            <button className="btn" onClick={()=>{onMarkOverhead(item);showToast(`${item.vendor} marked as fixed cost`,AMBER);}} style={{ borderColor:"rgba(140,107,48,0.3)",color:AMBER }}>Fixed Cost</button>
                            <button className={`btn${selections[item.id]?" act":""}`} onClick={()=>handleAssign(item)} disabled={!selections[item.id]} style={{ opacity:selections[item.id]?1:0.45 }}>Assign →</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── FIXED COSTS section ── */}
      {section === "fixed" && (
        <div>
          {filteredOverhead.length === 0 ? (
            <div style={{ padding:40,textAlign:"center",color:DIM,fontFamily:"'DM Sans',sans-serif",fontSize:13 }}>No fixed cost expenses yet.</div>
          ) : (
            <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:6 }}>
              {filteredOverhead.map((item, idx) => (
                <div key={item.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderBottom:idx<filteredOverhead.length-1?`1px solid ${BORDER}`:"none" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:DARK }}>{item.vendor}</span>
                      <span className="mono" style={{ fontSize:10,color:DIM }}>{item.date}</span>
                    </div>
                    <div style={{ fontSize:12,color:MID,fontFamily:"'DM Sans',sans-serif" }}>{item.description}</div>
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:500,color:RED }}>–{$(item.amount)}</div>
                  <button className="btn" onClick={()=>onRestore(item.id)} style={{ fontSize:11 }}>Restore</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ALL TAGGED section (with re-tag) ── */}
      {section === "tagged" && (
        <div>
          {/* Search bar */}
          <div style={{ marginBottom:16 }}>
            <input
              type="text"
              placeholder="Search tagged expenses by vendor or description..."
              value={searchTagged}
              onChange={e => setSearchTagged(e.target.value)}
              style={{ width:"100%",maxWidth:400,padding:"8px 14px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DARK,outline:"none" }}
            />
          </div>

          {filteredTagged.length === 0 ? (
            <div style={{ padding:40,textAlign:"center",color:DIM,fontFamily:"'DM Sans',sans-serif",fontSize:13 }}>No tagged expenses yet.</div>
          ) : (
            <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:6 }}>
              {filteredTagged.map((item, idx) => {
                const job = jobLookup[item.taggedJobId];
                const isRetaging = retagItem?.id === item.id;
                return (
                  <div key={item.id} style={{ padding:"14px 20px",borderBottom:idx<filteredTagged.length-1?`1px solid ${BORDER}`:"none" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap" }}>
                          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:DARK }}>{item.vendor}</span>
                          <span className="mono" style={{ fontSize:10,color:DIM }}>{item.date}</span>
                          <span style={{ fontSize:10,padding:"2px 8px",borderRadius:3,background:`${ACCENT2}15`,color:ACCENT2,fontFamily:"'DM Sans',sans-serif",fontWeight:500 }}>→ {job?.label || item.taggedJobName || 'Unknown'}</span>
                          {item.matchedBy && (
                            <span style={{ fontSize:9,padding:"1px 6px",borderRadius:3,background:BG2,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>{item.matchedBy === 'rule' ? 'auto' : item.matchedBy}</span>
                          )}
                        </div>
                        <div style={{ fontSize:12,color:MID,fontFamily:"'DM Sans',sans-serif" }}>{item.description}</div>
                      </div>
                      <div style={{ fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:500,color:RED,minWidth:80,textAlign:"right" }}>–{$(item.amount)}</div>
                      {!isRetaging && (
                        <button className="btn" onClick={()=>{setRetagItem(item);setRetagJobId("");}} style={{ fontSize:11,whiteSpace:"nowrap" }}>Change job</button>
                      )}
                    </div>

                    {/* Inline re-tag */}
                    {isRetaging && (
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:10,padding:"10px 14px",borderRadius:5,background:BG2,border:`1px solid ${BORDER}` }}>
                        <span style={{ fontSize:12,color:MID,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap" }}>Move to:</span>
                        <select className="job-select" value={retagJobId} onChange={e=>setRetagJobId(e.target.value)} style={{ flex:1 }}>
                          <option value="">Select new job...</option>
                          {jobOptions.map(j=><option key={j.value} value={j.value}>{j.label}{j.client?` (${j.client})`:""}</option>)}
                        </select>
                        <button className="btn" onClick={()=>{setRetagItem(null);setRetagJobId("");}}>Cancel</button>
                        <button className={`btn${retagJobId?" act":""}`} onClick={handleRetagSubmit} disabled={!retagJobId} style={{ opacity:retagJobId?1:0.45 }}>Save →</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAGGED IN QB section ── */}
      {section === "qbtagged" && (
        <div>
          {/* Info callout */}
          <div style={{ marginBottom:16,padding:"12px 16px",borderRadius:6,background:"rgba(92,122,90,0.08)",border:`1px solid rgba(92,122,90,0.2)`,display:"flex",gap:10,alignItems:"flex-start" }}>
            <span style={{ fontFamily:"'DM Mono',monospace",fontSize:13,color:ACCENT2,flexShrink:0,fontWeight:600 }}>i</span>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID,lineHeight:1.6 }}>
              These expenses were tagged directly in QuickBooks before syncing. They flow automatically to job costs and don't require any action here — they're already included in your profitability numbers.
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom:16 }}>
            <input
              type="text"
              placeholder="Search by vendor, description, or job..."
              value={searchQb}
              onChange={e => setSearchQb(e.target.value)}
              style={{ width:"100%",maxWidth:400,padding:"8px 14px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DARK,outline:"none" }}
            />
          </div>

          {/* Summary bar */}
          {qbDirect.length > 0 && (
            <div style={{ marginBottom:14,display:"flex",alignItems:"center",gap:16,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM }}>
              <span><strong style={{ color:DARK }}>{qbDirect.length}</strong> expense{qbDirect.length!==1?"s":""}</span>
              <span style={{ fontFamily:"'DM Mono',monospace",color:RED,fontWeight:500 }}>–{$(qbDirectTotal)}</span>
              <span>already in job costs</span>
            </div>
          )}

          {qbDirect.length === 0 ? (
            <div style={{ padding:40,textAlign:"center",color:DIM,fontFamily:"'DM Sans',sans-serif",fontSize:13 }}>No QB-tagged expenses in this date range.</div>
          ) : (
            <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:6 }}>
              {/* Column headers */}
              <div style={{ display:"grid",gridTemplateColumns:"1.2fr 1.2fr 2fr 110px 110px",gap:8,padding:"8px 20px",borderBottom:`1px solid ${BORDER}`,fontFamily:"'DM Sans',sans-serif",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:DIM,fontWeight:500 }}>
                <span>Vendor</span><span>Job</span><span>Description</span><span>Date</span><span style={{ textAlign:"right" }}>Amount</span>
              </div>
              {qbDirect.map((p, idx) => (
                <div key={p.Id} style={{ display:"grid",gridTemplateColumns:"1.2fr 1.2fr 2fr 110px 110px",gap:8,padding:"10px 20px",borderBottom:idx<qbDirect.length-1?`1px solid ${BORDER}`:"none",alignItems:"center" }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.EntityRef?.name||'Unknown'}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:ACCENT2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.jobName}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:MID,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.Line?.[0]?.Description||'—'}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:11,color:DIM }}>{p.TxnDate}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:12,color:RED,fontWeight:500,textAlign:"right" }}>–{$(p.TotalAmt||0)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ─── TAB: EXPENSE INBOX (legacy — kept for reference) ────────────────────────

function ExpenseInbox({ untagged, onTag, onDismiss, onMarkOverhead, onRestore, onBulkTag, onBulkMarkOverhead, onBulkDismiss, onSaveVendorRule, vendorRules, tagged, jobSummaries, overhead, dismissed, dateRange, setDateRange, customStart, setCustomStart, customEnd, setCustomEnd }) { // eslint-disable-line no-unused-vars
  const [selections, setSelections]           = useState({});
  const [bulkJobSelections, setBulkJobSelections] = useState({}); // vendor -> jobId
  const [filter, setFilter]                   = useState("untagged");
  const [showSyncGuide, setShowSyncGuide]     = useState(false);
  const [groupByVendor, setGroupByVendor]     = useState(true);
  const [collapsedVendors, setCollapsedVendors] = useState(new Set());
  const [sortBy, setSortBy]                   = useState("date");
  const [searchQuery, setSearchQuery]         = useState("");
  const [typeFilter, setTypeFilter]           = useState("all");
  const [rulePrompt, setRulePrompt]           = useState(null); // { vendor, ruleType }

  // Build rule lookup: vendor name -> rule_type
  const ruleMap = useMemo(() => {
    const m = {};
    (vendorRules || []).forEach(r => { m[r.vendor_name] = r.rule_type; });
    return m;
  }, [vendorRules]);

  // Apply date + search + type filter, then sort
  const filteredUntagged = useMemo(() => {
    let items = filterUntaggedByDate(untagged, dateRange, customStart, customEnd);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(u => u.vendor.toLowerCase().includes(q) || u.description.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') {
      items = items.filter(u => u.paymentType === typeFilter);
    }
    if (sortBy === 'amount') {
      items = [...items].sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'vendor') {
      items = [...items].sort((a, b) => a.vendor.localeCompare(b.vendor));
    } else {
      items = [...items].sort((a, b) => b.date.localeCompare(a.date));
    }
    return items;
  }, [untagged, dateRange, customStart, customEnd, searchQuery, typeFilter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group by vendor, job_cost vendors float to top, then sort by total amount desc
  const vendorGroups = useMemo(() => {
    const groups = {};
    filteredUntagged.forEach(item => {
      if (!groups[item.vendor]) groups[item.vendor] = [];
      groups[item.vendor].push(item);
    });
    return Object.entries(groups).sort((a, b) => {
      const aRule = ruleMap[a[0]];
      const bRule = ruleMap[b[0]];
      if (aRule === 'job_cost' && bRule !== 'job_cost') return -1;
      if (aRule !== 'job_cost' && bRule === 'job_cost') return 1;
      const aAmt = a[1].reduce((s, i) => s + i.amount, 0);
      const bAmt = b[1].reduce((s, i) => s + i.amount, 0);
      return bAmt - aAmt;
    });
  }, [filteredUntagged, ruleMap]);

  // Build job options from live data — fall back to mock if empty
  const liveJobOptions = (jobSummaries || []).map(j => ({
    value: j.id,
    label: j.name,
    client: j.clientName || "",
  }));
  const jobOptions = liveJobOptions.length > 0 ? liveJobOptions : JOB_OPTIONS;

  const totalUntagged = filteredUntagged.reduce((s,u) => s + u.amount, 0);
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

  function toggleVendorCollapsed(vendor) {
    setCollapsedVendors(prev => {
      const next = new Set(prev);
      if (next.has(vendor)) next.delete(vendor);
      else next.add(vendor);
      return next;
    });
  }

  function handleBulkTagVendor(vendor, items) {
    const jobId = bulkJobSelections[vendor];
    if (!jobId) return;
    const job = jobOptions.find(j => j.value === jobId);
    onBulkTag(items, jobId, job?.label || "");
    setBulkJobSelections(prev => { const n = {...prev}; delete n[vendor]; return n; });
    // Only prompt rule for job_cost type (bulk job tag = user confirmed this is job-specific)
    setRulePrompt({ vendor, ruleType: 'job_cost' });
  }

  function handleBulkOverheadVendor(vendor, items) {
    onBulkMarkOverhead(items);
    setRulePrompt({ vendor, ruleType: 'overhead' });
  }

  function handleBulkDismissVendor(vendor, items) {
    onBulkDismiss(items.map(i => i.id));
    setRulePrompt({ vendor, ruleType: 'dismiss' });
  }

  function saveRuleAndClose(vendor, ruleType) {
    onSaveVendorRule(vendor, ruleType);
    setRulePrompt(null);
  }

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
            <div style={{ padding:"24px 28px",borderBottom:`1px solid ${BORDER}`,display:"flex",alignItems:"flex-start",justifyContent:"space-between" }}>
              <div>
                <h2 style={{ fontFamily:"'Lora',serif",fontSize:18,fontWeight:500,color:DARK,letterSpacing:"-0.01em",marginBottom:4 }}>QuickBooks Sync Guide</h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM }}>How to update tags in QuickBooks so your accountant sees clean books.</p>
              </div>
              <button onClick={()=>setShowSyncGuide(false)} style={{ background:"none",border:"none",cursor:"pointer",color:DIM,fontSize:20,lineHeight:1,padding:"2px 6px",fontFamily:"inherit" }}>×</button>
            </div>
            <div style={{ margin:"20px 28px 0",padding:"14px 18px",borderRadius:5,background:"rgba(140,107,48,0.07)",border:`1px solid rgba(140,107,48,0.2)` }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:AMBER,fontWeight:500,marginBottom:4 }}>Why bother updating QuickBooks?</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID,lineHeight:1.6 }}>Tags you apply in Canopy update your dashboard instantly — but they live only here. Your accountant, tax preparer, and QuickBooks reports won't see them unless you update QB directly. It takes about 2 minutes per expense.</div>
            </div>
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
            <div style={{ margin:"0 28px 20px",padding:"14px 18px",borderRadius:5,background:BG2,border:`1px solid ${BORDER}` }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:ACCENT,fontWeight:500,marginBottom:4 }}>Pro tip</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:MID,lineHeight:1.6 }}>Batch your QB updates once a week rather than one at a time. Set aside 15 minutes every Monday to clear the previous week's untagged expenses in both Canopy and QuickBooks at the same time.</div>
            </div>
            <div style={{ padding:"16px 28px",borderTop:`1px solid ${BORDER}`,display:"flex",justifyContent:"flex-end" }}>
              <button className="btn act" onClick={()=>setShowSyncGuide(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:20, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Lora',serif",fontSize:24,fontWeight:600,color:DARK,letterSpacing:"-0.02em" }}>Expense Inbox</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginTop:4 }}>Expenses without a job assigned in QuickBooks. Tag them to keep profit numbers accurate.</p>
        </div>
        {/* Date range toggle — same as dashboard, persists across tabs */}
        <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
          <div style={{ display:"flex",border:`1px solid ${BORDER}`,borderRadius:5,overflow:"hidden" }}>
            {DATE_RANGES.map((r,i) => (
              <button key={r.key} onClick={()=>setDateRange(r.key)} style={{ cursor:"pointer",padding:"7px 13px",fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.03em",border:"none",borderRight:i<DATE_RANGES.length-1?`1px solid ${BORDER}`:"none",background:dateRange===r.key?ACCENT:CARD,color:dateRange===r.key?CARD:MID,transition:"all 0.15s" }}>{r.label}</button>
            ))}
          </div>
          <button onClick={()=>setDateRange("custom")} style={{ cursor:"pointer",padding:"7px 14px",fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.03em",border:`1px solid ${BORDER}`,borderRadius:5,background:dateRange==="custom"?ACCENT:CARD,color:dateRange==="custom"?CARD:MID,transition:"all 0.15s" }}>Custom</button>
          {dateRange === "custom" && (
            <div style={{ display:"flex",alignItems:"center",gap:6,marginLeft:4 }}>
              <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)}
                style={{ padding:"5px 10px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DARK,outline:"none",cursor:"pointer" }}
              />
              <span style={{ fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>→</span>
              <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)}
                style={{ padding:"5px 10px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DARK,outline:"none",cursor:"pointer" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Layer 4: Search + Sort + Type filter + Group toggle */}
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:20,flexWrap:"wrap" }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search vendor or description..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex:"1 1 180px",minWidth:180,maxWidth:280,padding:"7px 12px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DARK,outline:"none" }}
        />
        {/* Type filter */}
        <div style={{ display:"flex",border:`1px solid ${BORDER}`,borderRadius:5,overflow:"hidden" }}>
          {[["all","All"],["Check","Check"],["CreditCard","Credit Card"],["Bill","Bill"]].map(([k,l],i,arr) => (
            <button key={k} onClick={()=>setTypeFilter(k)} style={{ cursor:"pointer",padding:"7px 12px",fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif",border:"none",borderRight:i<arr.length-1?`1px solid ${BORDER}`:"none",background:typeFilter===k?ACCENT:CARD,color:typeFilter===k?CARD:MID,transition:"all 0.15s",whiteSpace:"nowrap" }}>{l}</button>
          ))}
        </div>
        {/* Sort */}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:"7px 10px",borderRadius:5,border:`1px solid ${BORDER}`,background:CARD,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:MID,cursor:"pointer",outline:"none" }}>
          <option value="date">Sort: Newest first</option>
          <option value="amount">Sort: Largest first</option>
          <option value="vendor">Sort: Vendor A–Z</option>
        </select>
        {/* Group toggle */}
        <div style={{ display:"flex",border:`1px solid ${BORDER}`,borderRadius:5,overflow:"hidden",marginLeft:"auto" }}>
          <button onClick={()=>setGroupByVendor(true)} title="Group by vendor" style={{ cursor:"pointer",padding:"7px 13px",fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif",border:"none",borderRight:`1px solid ${BORDER}`,background:groupByVendor?ACCENT:CARD,color:groupByVendor?CARD:MID,transition:"all 0.15s" }}>⊞ Grouped</button>
          <button onClick={()=>setGroupByVendor(false)} title="Flat list" style={{ cursor:"pointer",padding:"7px 13px",fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif",border:"none",background:!groupByVendor?ACCENT:CARD,color:!groupByVendor?CARD:MID,transition:"all 0.15s" }}>≡ List</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28 }}>
        {(() => {
          const filteredJobs     = filterJobsByDate(jobSummaries || [], dateRange, customStart, customEnd);
          const filteredOverhead = filterUntaggedByDate(overhead || [], dateRange, customStart, customEnd);
          const taggedCount   = (dateRange === "all" ? (jobSummaries||[]) : filteredJobs).reduce((s,j) => s + j.purchases.length, 0);
          const overheadCount = filteredOverhead.length;
          const untaggedCount = filteredUntagged.length;
          const total         = taggedCount + overheadCount + untaggedCount;
          const accountedFor  = taggedCount + overheadCount;
          const dqPct         = total > 0 ? Math.round((accountedFor / total) * 100) : 100;
          const dqColor       = dqPct >= 80 ? ACCENT2 : dqPct >= 50 ? AMBER : RED;
          return [
            { label:"Untagged Expenses",   val:filteredUntagged.length,  sub:$(totalUntagged)+" unallocated",           color:filteredUntagged.length>0?AMBER:ACCENT2 },
            { label:"Fixed Costs Tagged",  val:overheadCount,    sub:$(((overhead||[]).reduce((s,o)=>s+o.amount,0)))+" overhead total", color:overheadCount>0?ACCENT2:DIM },
            { label:"Data Quality Score",  val:`${dqPct}%`,      sub:`${accountedFor}/${total} expenses accounted for`, color:dqColor },
            { label:"Needs QB Sync",       val:needsQBSync,      sub:"tags not yet in QuickBooks",              color:needsQBSync>0?MID:DIM },
          ];
        })().map((k,i) => (
          <div key={i} className="kpi">
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",color:DIM,textTransform:"uppercase",marginBottom:12,fontWeight:500 }}>{k.label}</div>
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
            <span style={{ color:MID,marginLeft:8 }}>— consider updating them in QuickBooks so your accountant sees clean books.</span>
          </div>
          <button className="btn" style={{ borderColor:"rgba(140,107,48,0.3)",color:AMBER,whiteSpace:"nowrap",marginLeft:16 }} onClick={()=>setShowSyncGuide(true)}>
            View QB Sync Guide →
          </button>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div style={{ display:"flex",alignItems:"center",gap:0,marginBottom:24,borderBottom:`1px solid ${BORDER}` }}>
        {[
          { key:"untagged", label:"Untagged",   count:filteredUntagged.length,    color:AMBER },
          { key:"fixed",    label:"Fixed Costs", count:(overhead||[]).length,       color:ACCENT2 },
          { key:"tagged",   label:"Tagged",      count:tagged.length,               color:ACCENT2 },
          { key:"dismissed",label:"Dismissed",   count:(dismissed||[]).length,      color:DIM },
        ].map(t => (
          <button key={t.key} onClick={()=>setFilter(t.key)} style={{
            cursor:"pointer", padding:"10px 20px", fontSize:12, fontWeight:500,
            fontFamily:"'DM Sans',sans-serif", border:"none", borderBottom:`2px solid ${filter===t.key?ACCENT:BORDER}`,
            background:"transparent", color:filter===t.key?DARK:DIM,
            marginBottom:-1, transition:"all 0.15s",
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ marginLeft:7, padding:"1px 7px", borderRadius:10, fontSize:10, fontWeight:600,
                background: filter===t.key ? (t.key==="untagged"?`rgba(140,107,48,0.12)`:`rgba(92,122,90,0.12)`) : BG2,
                color: filter===t.key ? t.color : DIM,
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}

      {/* UNTAGGED tab */}
      {filter === "untagged" && (
        filteredUntagged.length > 0 ? (
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginBottom:16 }}>
              {filteredUntagged.length} expense{filteredUntagged.length!==1?"s":""} need attention · {$(totalUntagged)} unallocated
              {groupByVendor && vendorGroups.length > 0 && ` · ${vendorGroups.length} vendor${vendorGroups.length!==1?"s":""}`}
            </div>

            {/* ── GROUPED VIEW (Layer 2) ── */}
            {groupByVendor ? (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {vendorGroups.map(([vendor, items]) => {
                  const isCollapsed    = collapsedVendors.has(vendor);
                  const groupTotal     = items.reduce((s,i) => s + i.amount, 0);
                  const rule           = ruleMap[vendor];
                  const hasBulkJob     = !!bulkJobSelections[vendor];
                  const ruleBadgeColor = rule === 'job_cost' ? ACCENT2 : rule === 'overhead' ? AMBER : rule === 'dismiss' ? DIM : null;
                  const ruleBadgeLabel = rule === 'job_cost' ? '⚙ Job Cost' : rule === 'overhead' ? '⚙ Auto: Fixed Cost' : rule === 'dismiss' ? '⚙ Auto: Dismiss' : null;
                  return (
                    <div key={vendor} style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:6,overflow:"hidden" }}>
                      {/* Group header */}
                      <div style={{ display:"flex",alignItems:"center",gap:10,padding:"13px 18px",cursor:"pointer",background:isCollapsed?CARD:BG2,borderBottom:isCollapsed?"none":`1px solid ${BORDER}` }}
                           onClick={()=>toggleVendorCollapsed(vendor)}>
                        <span style={{ fontWeight:600,color:DARK,fontSize:13,fontFamily:"'DM Sans',sans-serif",flex:1 }}>{vendor}</span>
                        {ruleBadgeLabel && (
                          <span style={{ fontSize:10,padding:"2px 8px",borderRadius:3,background:`${ruleBadgeColor}22`,color:ruleBadgeColor,fontFamily:"'DM Sans',sans-serif",fontWeight:500,border:`1px solid ${ruleBadgeColor}44` }}>{ruleBadgeLabel}</span>
                        )}
                        <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM }}>{items.length} item{items.length!==1?"s":""}</span>
                        <span style={{ fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:500,color:RED }}>–{$(groupTotal)}</span>
                        <span style={{ fontSize:10,color:DIM,marginLeft:4,width:14,textAlign:"center" }}>{isCollapsed?"▼":"▲"}</span>
                      </div>

                      {!isCollapsed && (
                        <div>
                          {/* Bulk actions bar */}
                          <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 18px",background:CARD,borderBottom:`1px solid ${BORDER}`,flexWrap:"wrap" }}>
                            <select className="job-select" style={{ flex:"1 1 180px",maxWidth:240 }}
                              value={bulkJobSelections[vendor] || ""}
                              onChange={e => setBulkJobSelections(prev => ({...prev,[vendor]:e.target.value}))}>
                              <option value="">Tag all to a job...</option>
                              {jobOptions.map(j => <option key={j.value} value={j.value}>{j.label}{j.client?` (${j.client})`:""}</option>)}
                            </select>
                            <button className={`btn${hasBulkJob?" act":""}`} onClick={()=>handleBulkTagVendor(vendor,items)} disabled={!hasBulkJob} style={{ opacity:hasBulkJob?1:0.4,whiteSpace:"nowrap" }}>Tag All →</button>
                            <button className="btn" onClick={()=>handleBulkOverheadVendor(vendor,items)} style={{ borderColor:"rgba(140,107,48,0.3)",color:AMBER,whiteSpace:"nowrap" }}>Fixed Cost All</button>
                            <button className="btn red" onClick={()=>handleBulkDismissVendor(vendor,items)} style={{ whiteSpace:"nowrap" }}>Dismiss All</button>
                            {!rule && (
                              <button className="btn" onClick={()=>setRulePrompt({vendor,ruleType:null})} style={{ marginLeft:"auto",fontSize:10,color:DIM,whiteSpace:"nowrap" }}>Set rule →</button>
                            )}
                          </div>

                          {/* Individual items */}
                          <div style={{ display:"flex",flexDirection:"column",gap:0 }}>
                            {items.map((item,idx) => (
                              <div key={item.id} style={{ padding:"14px 18px",borderBottom:idx<items.length-1?`1px solid ${BORDER}`:"none" }}>
                                <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:16,alignItems:"start" }}>
                                  <div>
                                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap" }}>
                                      <span className="mono" style={{ fontSize:10,color:DIM }}>{item.docNumber}</span>
                                      <span className="mono" style={{ fontSize:10,color:DIM }}>{item.date}</span>
                                      <span className="tag">{item.paymentType}</span>
                                    </div>
                                    <div style={{ fontSize:12,color:MID,fontFamily:"'DM Sans',sans-serif" }}>{item.description}</div>
                                    {item.suggestedJob && (
                                      <div className="suggestion-pill" style={{ marginTop:8 }} onClick={()=>handleApplySuggestion(item)} title="Click to apply">
                                        <span>→</span><span>{item.suggestionReason} — click to apply</span>
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,minWidth:260 }}>
                                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:500,color:RED }}>–{$(item.amount)}</div>
                                    <select className="job-select" value={selections[item.id]||""} onChange={e=>setSelections(prev=>({...prev,[item.id]:e.target.value}))}>
                                      <option value="">Assign to job...</option>
                                      {jobOptions.map(j=><option key={j.value} value={j.value}>{j.label}{j.client?` (${j.client})`:""}</option>)}
                                    </select>
                                    <div style={{ display:"flex",gap:6 }}>
                                      <button className="btn red" onClick={()=>onDismiss(item.id)}>Dismiss</button>
                                      <button className="btn" onClick={()=>onMarkOverhead(item)} style={{ borderColor:"rgba(140,107,48,0.3)",color:AMBER }}>Fixed Cost</button>
                                      <button className={`btn${selections[item.id]?" act":""}`} onClick={()=>handleConfirm(item)} disabled={!selections[item.id]} style={{ opacity:selections[item.id]?1:0.45 }}>Confirm →</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── FLAT LIST VIEW ── */
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                {filteredUntagged.map(item => (
                  <div key={item.id} className="inbox-row slide-in">
                    <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:20,alignItems:"start" }}>
                      <div>
                        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap" }}>
                          <span style={{ fontWeight:500,color:DARK,fontSize:13,fontFamily:"'DM Sans',sans-serif" }}>{item.vendor}</span>
                          {ruleMap[item.vendor] && <span style={{ fontSize:10,padding:"1px 7px",borderRadius:3,background:"rgba(92,122,90,0.1)",color:ACCENT2,fontFamily:"'DM Sans',sans-serif",border:"1px solid rgba(92,122,90,0.2)" }}>⚙ {ruleMap[item.vendor]==='job_cost'?'Job Cost':ruleMap[item.vendor]==='overhead'?'Auto: Fixed Cost':'Auto: Dismiss'}</span>}
                          <span className="mono" style={{ fontSize:10,color:DIM }}>{item.docNumber}</span>
                          <span className="mono" style={{ fontSize:10,color:DIM }}>{item.date}</span>
                          <span className="tag">{item.paymentType}</span>
                        </div>
                        <div style={{ fontSize:12,color:MID,marginBottom:12,fontFamily:"'DM Sans',sans-serif" }}>{item.description}</div>
                        {item.suggestedJob && (
                          <div className="suggestion-pill" onClick={()=>handleApplySuggestion(item)} title="Click to apply this suggestion">
                            <span>→</span><span>{item.suggestionReason} — click to apply</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10,minWidth:280 }}>
                        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:500,color:RED }}>–{$(item.amount)}</div>
                        <select className="job-select" value={selections[item.id]||""} onChange={e=>setSelections(prev=>({...prev,[item.id]:e.target.value}))}>
                          <option value="">Assign to a job...</option>
                          {jobOptions.map(j=><option key={j.value} value={j.value}>{j.label}{j.client?` (${j.client})`:""}</option>)}
                        </select>
                        <div style={{ display:"flex",gap:8 }}>
                          <button className="btn red" onClick={()=>onDismiss(item.id)}>Dismiss</button>
                          <button className="btn" onClick={()=>onMarkOverhead(item)} style={{ borderColor:"rgba(140,107,48,0.3)",color:AMBER }}>Fixed Cost</button>
                          <button className={`btn${selections[item.id]?" act":""}`} onClick={()=>handleConfirm(item)} disabled={!selections[item.id]} style={{ opacity:selections[item.id]?1:0.45 }}>Confirm →</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign:"center",padding:"60px 40px",background:CARD,borderRadius:6,border:`1px solid rgba(92,122,90,0.25)`,boxShadow:"0 1px 4px rgba(44,36,22,0.05)" }}>
            <div style={{ fontFamily:"'Lora',serif",fontSize:20,color:ACCENT2,marginBottom:8 }}>All expenses accounted for</div>
            <div style={{ fontSize:13,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>Your profit numbers are fully accurate.</div>
          </div>
        )
      )}

      {/* FIXED COSTS tab */}
      {filter === "fixed" && (
        (overhead||[]).length > 0 ? (
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginBottom:16 }}>
              {(overhead||[]).length} fixed cost expense{(overhead||[]).length!==1?"s":""} · {$(((overhead||[]).reduce((s,o)=>s+o.amount,0)))} total overhead
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
              Fixed costs are included in your Data Quality Score and Net Profit calculation, but not allocated to any specific job.
            </div>
          </div>
        ) : (
          <div style={{ textAlign:"center",padding:"60px 40px",background:CARD,borderRadius:6,border:`1px solid ${BORDER}` }}>
            <div style={{ fontFamily:"'Lora',serif",fontSize:18,color:MID,marginBottom:8,fontStyle:"italic" }}>No fixed costs tagged yet</div>
            <div style={{ fontSize:13,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>In the Untagged tab, use the "Fixed Cost" button to mark overhead expenses like rent, insurance, or software subscriptions.</div>
          </div>
        )
      )}

      {/* TAGGED tab */}
      {filter === "tagged" && (
        tagged.length > 0 ? (
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginBottom:16 }}>
              {tagged.length} expense{tagged.length!==1?"s":""} tagged this session · {$(totalTagged)} allocated
            </div>
            <div className="card" style={{ overflow:"hidden" }}>
              <table className="raw-table">
                <thead><tr>{["Date","Doc #","Vendor","Description","Amount","Tagged To"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {tagged.map((t,i) => (
                    <tr key={i}>
                      <td className="mono">{t.date}</td>
                      <td className="mono">{t.docNumber}</td>
                      <td style={{ color:DARK,fontWeight:500 }}>{t.vendor}</td>
                      <td style={{ color:MID,maxWidth:220 }}>{t.description}</td>
                      <td className="mono" style={{ color:RED }}>–{$(t.amount)}</td>
                      <td><span className="chip g">{t.taggedJobName}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop:10,fontSize:11,color:DIM,textAlign:"right",fontFamily:"'DM Sans',sans-serif",fontStyle:"italic" }}>
              Dashboard and Job Detail update automatically as you tag expenses.
            </div>
          </div>
        ) : (
          <div style={{ textAlign:"center",padding:"60px 40px",background:CARD,borderRadius:6,border:`1px solid ${BORDER}` }}>
            <div style={{ fontFamily:"'Lora',serif",fontSize:18,color:MID,marginBottom:8,fontStyle:"italic" }}>No expenses tagged this session</div>
            <div style={{ fontSize:13,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>Head to the Untagged tab to start assigning expenses to jobs.</div>
          </div>
        )
      )}

      {/* DISMISSED tab */}
      {filter === "dismissed" && (
        (dismissed||[]).length > 0 ? (
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginBottom:16 }}>
              {(dismissed||[]).length} dismissed expense{(dismissed||[]).length!==1?"s":""} · {$(((dismissed||[]).reduce((s,d)=>s+d.amount,0)))} total
            </div>
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
                      <td><button className="btn" style={{ fontSize:10,padding:"3px 10px" }} onClick={() => onRestore(d.id)}>Restore</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop:10,fontSize:11,color:DIM,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic",borderTop:"none" }}>
              Dismissed expenses are excluded from job costs and the Data Quality Score. Click Restore to return one to the Untagged tab.
            </div>
          </div>
        ) : (
          <div style={{ textAlign:"center",padding:"60px 40px",background:CARD,borderRadius:6,border:`1px solid ${BORDER}` }}>
            <div style={{ fontFamily:"'Lora',serif",fontSize:18,color:MID,marginBottom:8,fontStyle:"italic" }}>No dismissed expenses</div>
            <div style={{ fontSize:13,color:DIM,fontFamily:"'DM Sans',sans-serif" }}>Dismissed expenses will appear here so you can restore them if needed.</div>
          </div>
        )
      )}

      {/* Layer 3: Vendor rule prompt — appears after any bulk action */}
      {rulePrompt && (
        <div style={{ position:"fixed",inset:0,background:"rgba(44,36,22,0.35)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }} onClick={()=>setRulePrompt(null)}>
          <div style={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:8,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(44,36,22,0.18)",padding:"28px 32px" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontFamily:"'Lora',serif",fontSize:17,fontWeight:500,color:DARK,marginBottom:6,letterSpacing:"-0.01em" }}>Save a rule for {rulePrompt.vendor}?</h3>
            {rulePrompt.ruleType === 'job_cost' && (
              <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:MID,lineHeight:1.6,marginBottom:20 }}>Mark as a <strong style={{ color:DARK }}>Job Cost vendor</strong> — Canopy will always group these at the top of your inbox and flag them as job expenses, but won't auto-assign them (since each purchase may go to a different job).</p>
            )}
            {rulePrompt.ruleType === 'overhead' && (
              <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:MID,lineHeight:1.6,marginBottom:20 }}>Mark as a <strong style={{ color:DARK }}>Fixed Cost vendor</strong> — future expenses from <em>{rulePrompt.vendor}</em> will be automatically tagged as overhead on the next sync.</p>
            )}
            {rulePrompt.ruleType === 'dismiss' && (
              <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:MID,lineHeight:1.6,marginBottom:20 }}>Mark as a <strong style={{ color:DARK }}>Dismissed vendor</strong> — future expenses from <em>{rulePrompt.vendor}</em> will be automatically dismissed on the next sync.</p>
            )}
            {!rulePrompt.ruleType && (
              <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:20 }}>
                <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:MID,marginBottom:4 }}>Choose how Canopy should handle future expenses from this vendor:</p>
                {[
                  { type:'job_cost', label:'Job Cost vendor', desc:'Group at top of inbox, flag for manual job assignment. No auto-assign.' },
                  { type:'overhead', label:'Fixed Cost vendor', desc:'Auto-tag as overhead on every sync.' },
                  { type:'dismiss',  label:'Always dismiss',   desc:'Auto-dismiss silently on every sync.' },
                ].map(opt => (
                  <div key={opt.type} onClick={()=>setRulePrompt(prev=>({...prev,ruleType:opt.type}))} style={{ padding:"11px 14px",borderRadius:5,border:`1px solid ${BORDER}`,cursor:"pointer",background:BG2 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:DARK,marginBottom:2 }}>{opt.label}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <button className="btn" onClick={()=>setRulePrompt(null)}>Skip</button>
              {rulePrompt.ruleType && <button className="btn act" onClick={()=>saveRuleAndClose(rulePrompt.vendor,rulePrompt.ruleType)}>Save Rule</button>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── TAB: JOB DETAIL ─────────────────────────────────────────────────────────

// ─── (LaborSection, ManualExpenseSection, ManualRevenueSection removed) ──────
// Replaced by unified ManualEntriesSection below.

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "zelle", label: "Zelle / Venmo" },
  { value: "credit_card", label: "Credit Card" },
  { value: "other", label: "Other" },
];

// ─── UNIFIED MANUAL ENTRIES SECTION (Job Detail) ────────────────────────────
// Single component combining revenue, labor, and expense entries into one table
// with a unified "+ Add Manual Entry" form.

const ENTRY_TYPES = [
  { value: "revenue", label: "Revenue" },
  { value: "labor", label: "Labor" },
  { value: "expense", label: "Job Expense" },
];

function ManualEntriesSection({ job, onAddLabor, onDeleteLabor, onAddExpense, onDeleteExpense, onAddRevenue, onDeleteRevenue }) {
  const [adding, setAdding] = useState(false);
  const [entryType, setEntryType] = useState("expense");
  const [desc, setDesc]         = useState("");
  const [vendor, setVendor]     = useState("");
  const [amount, setAmount]     = useState("");
  const [category, setCategory] = useState("materials");
  const [method, setMethod]     = useState("check");
  const [hours, setHours]       = useState("");
  const [rate, setRate]         = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);

  const laborEntries = job.laborEntries || [];
  const manualExpenses = job.manualExpenses || [];
  const manualRevenue = job.manualRevenue || [];

  // Combined entries for the table
  const allEntries = [
    ...manualRevenue.map(r => ({ ...r, _type: "revenue", _date: r.revenueDate, _detail: (r.paymentMethod || "—").replace("_", " "), _color: ACCENT2 })),
    ...laborEntries.map(l => ({ ...l, _type: "labor", _date: l.workDate, _detail: l.workerName || "—", _color: MID })),
    ...manualExpenses.map(e => ({ ...e, _type: "expense", _date: e.expenseDate, _detail: e.vendor || "—", _color: DARK })),
  ].sort((a, b) => (b._date || "").localeCompare(a._date || ""));

  const totalRevenue  = manualRevenue.reduce((s, r) => s + (r.amount || 0), 0);
  const totalLabor    = laborEntries.reduce((s, l) => s + (l.amount || 0), 0);
  const totalExpenses = manualExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  const computedAmount = entryType === "labor" && hours && rate ? (parseFloat(hours) * parseFloat(rate)) : null;

  function resetForm() {
    setDesc(""); setVendor(""); setAmount(""); setCategory("materials"); setMethod("check"); setHours(""); setRate("");
  }

  function handleAdd() {
    if (!desc.trim()) return;
    const amt = entryType === "labor" ? (computedAmount || 0) : parseFloat(amount);
    if (!amt || amt <= 0) return;

    if (entryType === "revenue") {
      onAddRevenue({ jobId: job.id, description: desc.trim(), amount: amt, paymentMethod: method, revenueDate: entryDate || null, source: "manual" });
    } else if (entryType === "labor") {
      onAddLabor({ jobId: job.id, description: desc.trim(), workerName: vendor.trim() || null, hours: hours ? parseFloat(hours) : null, hourlyRate: rate ? parseFloat(rate) : null, amount: amt, workDate: entryDate || null, source: "manual" });
    } else {
      onAddExpense({ jobId: job.id, description: desc.trim(), vendor: vendor.trim() || null, amount: amt, category, expenseDate: entryDate || null, source: "manual" });
    }
    resetForm();
    setAdding(false);
  }

  function handleDelete(entry) {
    if (entry._type === "revenue") onDeleteRevenue(entry.id);
    else if (entry._type === "labor") onDeleteLabor(entry.id);
    else onDeleteExpense(entry.id);
  }

  const inputStyle = { padding:"7px 10px", borderRadius:5, border:`1px solid ${BORDER}`, background:CARD, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:DARK, outline:"none", boxSizing:"border-box" };

  const typeBadge = (type) => {
    const colors = { revenue: { bg: `${ACCENT2}14`, color: ACCENT2 }, labor: { bg: `${AMBER}14`, color: AMBER }, expense: { bg: `${RED}14`, color: RED } };
    const labels = { revenue: "Revenue", labor: "Labor", expense: "Expense" };
    const c = colors[type] || colors.expense;
    return <span style={{ fontSize:9, fontWeight:600, fontFamily:"'DM Sans',sans-serif", padding:"2px 7px", borderRadius:3, background:c.bg, color:c.color, textTransform:"uppercase", letterSpacing:"0.04em" }}>{labels[type]}</span>;
  };

  return (
    <div className="card" style={{ padding:"22px 26px", marginBottom:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:"0.1em", color:DIM, textTransform:"uppercase", fontWeight:500, marginBottom:6 }}>Manual Entries</div>
          <div style={{ display:"flex", gap:14, fontFamily:"'DM Mono',monospace", fontSize:11 }}>
            {totalRevenue > 0 && <span style={{ color:ACCENT2 }}>+{$(totalRevenue)} revenue</span>}
            {totalLabor > 0 && <span style={{ color:AMBER }}>{$(totalLabor)} labor</span>}
            {totalExpenses > 0 && <span style={{ color:MID }}>{$(totalExpenses)} expenses</span>}
            {totalRevenue === 0 && totalLabor === 0 && totalExpenses === 0 && <span style={{ color:DIM }}>No entries yet</span>}
          </div>
        </div>
        {!adding && (
          <button className="btn act" onClick={() => setAdding(true)} style={{ fontSize:11, padding:"6px 14px" }}>
            + Add Manual Entry
          </button>
        )}
      </div>

      {/* ── Inline add form ── */}
      {adding && (
        <div style={{ padding:"14px 16px", marginBottom:14, borderRadius:6, border:`1px solid ${BORDER}`, background:BG }}>
          {/* Type selector */}
          <div style={{ display:"flex", gap:0, border:`1px solid ${BORDER}`, borderRadius:5, overflow:"hidden", marginBottom:12 }}>
            {ENTRY_TYPES.map((t, i) => (
              <button key={t.value} onClick={() => { setEntryType(t.value); resetForm(); }}
                style={{ flex:1, cursor:"pointer", padding:"8px 0", fontSize:11, fontWeight:600, fontFamily:"'DM Sans',sans-serif", border:"none", borderRight:i<2?`1px solid ${BORDER}`:"none", background:entryType===t.value?ACCENT:CARD, color:entryType===t.value?CARD:MID, transition:"all 0.15s" }}>{t.label}</button>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Description *</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={entryType === "revenue" ? "e.g. Final payment" : entryType === "labor" ? "e.g. Framing crew" : "e.g. Cash lumber pickup"} style={{ ...inputStyle, width:"100%" }} />
            </div>
            <div>
              <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>
                {entryType === "labor" ? "Worker / Crew" : "Vendor / Payee"}
              </label>
              <input value={vendor} onChange={e => setVendor(e.target.value)} placeholder={entryType === "labor" ? "e.g. Marcus T." : "e.g. Home Depot"} style={{ ...inputStyle, width:"100%" }} />
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns: entryType === "labor" ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap:10, marginBottom:12 }}>
            {entryType === "labor" ? (
              <>
                <div>
                  <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Hours *</label>
                  <input type="number" min="0" step="0.5" value={hours} onChange={e => setHours(e.target.value)} placeholder="40" style={{ ...inputStyle, width:"100%" }} />
                </div>
                <div>
                  <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Hourly Rate *</label>
                  <input type="number" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="55.00" style={{ ...inputStyle, width:"100%" }} />
                </div>
                <div>
                  <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Total</label>
                  <div style={{ ...inputStyle, background:BG2, color:DARK, fontFamily:"'DM Mono',monospace", fontWeight:600, lineHeight:"1.4" }}>
                    {computedAmount > 0 ? $(computedAmount) : "—"}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Amount *</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="420.00" style={{ ...inputStyle, width:"100%" }} />
              </div>
            )}

            {entryType === "expense" && (
              <div>
                <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, width:"100%" }}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            )}

            {entryType === "revenue" && (
              <div>
                <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Payment Method</label>
                <select value={method} onChange={e => setMethod(e.target.value)} style={{ ...inputStyle, width:"100%" }}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, fontWeight:500, display:"block", marginBottom:4 }}>Date</label>
              <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} style={{ ...inputStyle, width:"100%" }} />
            </div>
          </div>

          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="btn" onClick={() => { setAdding(false); resetForm(); }} style={{ fontSize:11 }}>Cancel</button>
            <button className="btn act" onClick={handleAdd}
              disabled={!desc.trim() || (entryType === "labor" ? (!computedAmount || computedAmount <= 0) : (!amount || parseFloat(amount) <= 0))}
              style={{ fontSize:11, padding:"6px 16px", opacity: (!desc.trim() || (entryType === "labor" ? (!computedAmount || computedAmount <= 0) : (!amount || parseFloat(amount) <= 0))) ? 0.4 : 1 }}>
              Save Entry
            </button>
          </div>
        </div>
      )}

      {/* ── Combined entries table ── */}
      {allEntries.length === 0 && !adding ? (
        <div style={{ padding:"20px 0", textAlign:"center" }}>
          <div style={{ fontFamily:"'Lora',serif", fontSize:14, color:MID, fontStyle:"italic", marginBottom:6 }}>No manual entries for this job</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:DIM, marginBottom:14, lineHeight:1.6 }}>
            Add revenue, labor costs, or expenses that aren't captured in QuickBooks.
          </div>
          <button className="btn act" onClick={() => setAdding(true)} style={{ fontSize:11, padding:"7px 18px" }}>
            + Add First Entry
          </button>
        </div>
      ) : allEntries.length > 0 && (
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
          <thead>
            <tr style={{ borderBottom:`2px solid ${BORDER}` }}>
              {["Type", "Date", "Description", "Detail", "Amount", ""].map(h => (
                <th key={h} style={{ padding:"6px 10px", textAlign: h === "Amount" ? "right" : "left", fontSize:9, letterSpacing:"0.08em", textTransform:"uppercase", color:DIM, fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allEntries.map((e, i) => (
              <tr key={e.id || i} style={{ borderBottom:`1px solid ${BORDER}` }}>
                <td style={{ padding:"8px 10px" }}>{typeBadge(e._type)}</td>
                <td style={{ padding:"8px 10px", fontFamily:"'DM Mono',monospace", fontSize:11, color:DIM }}>{e._date || "—"}</td>
                <td style={{ padding:"8px 10px", color:DARK, fontWeight:500, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={e.description}>{e.description}</td>
                <td style={{ padding:"8px 10px", color:MID, fontSize:11 }}>{e._detail}</td>
                <td style={{ padding:"8px 10px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:600, color:e._color }}>
                  {e._type === "revenue" ? "+" : ""}{$(e.amount)}
                </td>
                <td style={{ padding:"8px 10px", textAlign:"right", width:30 }}>
                  <button onClick={() => handleDelete(e)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:DIM, padding:0, lineHeight:1 }} title="Remove entry"
                    onMouseOver={ev => ev.currentTarget.style.color = RED}
                    onMouseOut={ev => ev.currentTarget.style.color = DIM}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function JobDetail({ job, onBack, untagged, onJumpToInbox, onAddLabor, onDeleteLabor, onAddExpense, onDeleteExpense, onAddRevenue, onDeleteRevenue, jobSummaries, onJobClick }) {
  if (!job) return (
    <div style={{ padding:"48px 36px",background:BG,minHeight:"100vh" }}>
      <h1 style={{ fontFamily:"'Lora',serif",fontSize:24,fontWeight:600,color:DARK,letterSpacing:"-0.02em",marginBottom:4 }}>Job Detail</h1>
      <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginBottom:28 }}>Select a job to see its full profitability breakdown.</p>
      {jobSummaries && jobSummaries.length > 0 && (
        <div className="card" style={{ padding:"18px 22px", maxWidth:520 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",color:DIM,textTransform:"uppercase",fontWeight:500,marginBottom:12 }}>Your Jobs</div>
          {jobSummaries.slice(0,8).map(j => {
            const win = j.profit >= 0;
            return (
              <div key={j.id} onClick={() => onJobClick && onJobClick(j)}
                style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 8px",borderBottom:`1px solid ${BORDER}`,cursor:"pointer",transition:"background 0.1s" }}
                onMouseOver={e => e.currentTarget.style.background = BG2}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                <div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DARK,fontWeight:500 }}>{j.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM,marginTop:2 }}>{j.clientName || "—"} · {j.type}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:win?ACCENT2:RED }}>{win?"+":""}{$(j.profit)}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:DIM }}>{j.marginPct}%</div>
                </div>
              </div>
            );
          })}
          {jobSummaries.length > 8 && (
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM,padding:"10px 8px" }}>
              + {jobSummaries.length - 8} more — search from the Dashboard
            </div>
          )}
        </div>
      )}
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
          <h1 style={{ fontFamily:"'Lora',serif",fontSize:24,fontWeight:600,color:DARK,letterSpacing:"-0.02em" }}>{job.name}</h1>
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

      <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:14,marginBottom:24 }}>
        {[
          { label:"Revenue",       val:$(job.revenue),                                          color:DARK },
          { label:"Material Cost", val:$(job.materialCost || 0),                                color:MID,   sub: job.costs > 0 ? `${Math.round(((job.materialCost||0)/job.costs)*100)}% of costs` : null },
          { label:"Labor Cost",    val:$(job.laborCost || 0),                                   color:MID,   sub: job.costs > 0 ? `${Math.round(((job.laborCost||0)/job.costs)*100)}% of costs` : null },
          { label:"Total Costs",   val:$(job.costs),                                            color:MID },
          { label:"Gross Profit",  val:(win?"+":" –")+$(job.profit),                            color:win?ACCENT2:RED },
          { label:"Margin",        val:job.marginPct+"%",                                       color:DARK,  sub: job.outstanding > 0 ? `${$(job.outstanding)} outstanding` : null, subColor: job.outstanding > 0 ? AMBER : null },
        ].map((k,i) => (
          <div key={i} className="kpi">
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",color:DIM,textTransform:"uppercase",marginBottom:10,fontWeight:500 }}>{k.label}</div>
            <div style={{ fontFamily:"'Lora',serif",fontSize:26,fontWeight:600,color:k.color }}>{k.val}</div>
            {k.sub && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:k.subColor||DIM,marginTop:4 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:24 }}>
        <div className="card" style={{ padding:"22px 26px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",color:DIM,textTransform:"uppercase",marginBottom:5,fontWeight:500 }}>Cost Breakdown by Vendor</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginBottom:18 }}>Where did the money go?</div>
          {vendorData.length === 0 ? (
            <div style={{ padding:"32px 0",textAlign:"center" }}>
              <div style={{ fontSize:26,marginBottom:12,opacity:0.25 }}>✉</div>
              <div style={{ fontFamily:"'Lora',serif",fontSize:14,color:MID,fontStyle:"italic",marginBottom:6 }}>No expenses tagged to this job yet</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginBottom:16,lineHeight:1.6 }}>
                Tag expenses to this job in <strong style={{ color:MID }}>Expense Management</strong> to see a breakdown here.
              </div>
              {onJumpToInbox && (
                <button className="btn act" onClick={onJumpToInbox} style={{ fontSize:11,padding:"7px 18px" }}>
                  Go to Expense Management →
                </button>
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={vendorData} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={2}>
                  {vendorData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} opacity={0.85}/>)}
                </Pie>
                <Legend formatter={v => <span style={{ fontSize:11,color:MID,fontFamily:"'DM Sans',sans-serif" }}>{v}</span>}/>
                <Tooltip formatter={v => [$(v),"Cost"]} contentStyle={{ background:CARD,border:`1px solid ${BORDER}`,borderRadius:5,fontFamily:"'DM Mono',monospace",fontSize:11 }}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card" style={{ padding:"22px 26px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",color:DIM,textTransform:"uppercase",marginBottom:5,fontWeight:500 }}>Revenue vs Cost Breakdown</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM,marginBottom:18 }}>Material, labor & profit</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name:"This Job",revenue:job.revenue,material:job.materialCost||0,labor:job.laborCost||0,profit:job.profit }]} margin={{ top:4,right:4,left:0,bottom:0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize:11,fill:DIM,fontFamily:"DM Sans" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10,fill:DIM,fontFamily:"DM Mono" }} tickFormatter={$k} axisLine={false} tickLine={false}/>
              <Tooltip content={ChartTip}/>
              <Bar dataKey="revenue"  name="Revenue"  fill={DIM}           radius={[4,4,0,0]} opacity={0.6}/>
              <Bar dataKey="material" name="Material" fill={RED}           radius={[4,4,0,0]} opacity={0.7}/>
              <Bar dataKey="labor"    name="Labor"    fill={AMBER}         radius={[4,4,0,0]} opacity={0.7}/>
              <Bar dataKey="profit"   name="Profit"   fill={win?ACCENT2:RED} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Unified Manual Entries (Revenue / Labor / Expense) ── */}
      <ManualEntriesSection job={job} onAddLabor={onAddLabor} onDeleteLabor={onDeleteLabor} onAddExpense={onAddExpense} onDeleteExpense={onDeleteExpense} onAddRevenue={onAddRevenue} onDeleteRevenue={onDeleteRevenue} />

      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ padding:"16px 22px",borderBottom:`1px solid ${BORDER}`,background:BG }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:DIM }}>All invoices & expenses for this job</div>
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
                  <td style={{ color:MID,maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }} title={l.vendor?`[${l.vendor}] ${l.desc||""}`:l.desc||""}>{l.vendor?<span style={{ color:DIM,marginRight:8,fontFamily:"'DM Mono',monospace",fontSize:11 }}>[{l.vendor}]</span>:null}{l.desc}</td>
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

  const SYSTEM_PROMPT = `You are a sharp, no-nonsense financial analyst for a small business. You have access to all job data below. Answer questions about profitability, trends, and business performance concisely and in plain English — like a smart bookkeeper talking to a busy business owner. Be direct. Use dollar figures and percentages. Flag problems clearly. Keep responses under 200 words unless a detailed breakdown is asked for.

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
      const res = await fetch("/api/ai-chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ system:SYSTEM_PROMPT, max_tokens:1000, messages:newMessages.map(m=>({ role:m.role,content:m.content })) })
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
        <h1 style={{ fontFamily:"'Lora',serif",fontSize:24,fontWeight:600,color:DARK,letterSpacing:"-0.02em",marginBottom:4 }}>AI Business Analyst</h1>
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
        <h1 style={{ fontFamily:"'Lora',serif", fontSize:24, fontWeight:600, color:DARK, letterSpacing:"-0.02em", marginBottom:4 }}>
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
        <h1 style={{ fontFamily:"'Lora',serif",fontSize:24,fontWeight:600,color:DARK,letterSpacing:"-0.02em" }}>Client Profitability</h1>
        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginTop:4 }}>Which clients consistently bring your most profitable work?</p>
      </div>

      {/* Top client highlight */}
      {topClient && (
        <div style={{ marginBottom:24,padding:"20px 24px",borderRadius:6,border:`1px solid rgba(92,122,90,0.3)`,background:"rgba(92,122,90,0.04)",display:"flex",alignItems:"center",gap:32 }}>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,letterSpacing:"0.1em",color:DIM,textTransform:"uppercase",marginBottom:6,fontWeight:500 }}>Top Client by Profit</div>
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
  if (!data || data.length === 0) return;

  const keys    = Object.keys(data[0]);
  const headers = keys.map(k => k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1').trim());
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // ── Determine column types ──────────────────────────────────────────────────
  function colType(key) {
    if (key === 'margin') return 'pct';
    if (key === 'jobs' || key === 'count') return 'int';
    const sample = data.find(r => typeof r[key] === 'number');
    if (sample && typeof sample[key] === 'number') return 'usd';
    return 'text';
  }
  const types = keys.map(colType);

  // ── Build rows ──────────────────────────────────────────────────────────────
  // Title block: 4 rows before headers
  const TITLE_ROWS = 4;
  const HEADER_ROW = TITLE_ROWS;      // 0-indexed: row 4
  const DATA_START  = TITLE_ROWS + 1; // row 5

  // Data rows as raw values (numbers stay numbers for Excel formatting)
  const dataRows = data.map(row =>
    keys.map((k, i) => {
      const v = row[k];
      if (typeof v !== 'number') return v ?? '';
      if (types[i] === 'pct') return v / 100; // Excel stores pct as decimal
      return v;
    })
  );

  // Totals row
  const totalsRow = keys.map((k, i) => {
    if (types[i] === 'usd' || types[i] === 'int') {
      return data.reduce((s, r) => s + (typeof r[k] === 'number' ? r[k] : 0), 0);
    }
    if (i === 0) return 'TOTAL';
    return '';
  });

  // ── Create worksheet from AOA ───────────────────────────────────────────────
  const aoa = [
    ['Canopy Business Intelligence', ...Array(keys.length - 1).fill('')],
    [title, ...Array(keys.length - 1).fill('')],
    [`Generated: ${dateStr}`, ...Array(keys.length - 1).fill('')],
    Array(keys.length).fill(''),  // spacer
    headers,
    ...dataRows,
    totalsRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const totalDataRows = dataRows.length;
  const totalsRowIdx  = DATA_START + totalDataRows; // 0-indexed

  // ── Column widths ───────────────────────────────────────────────────────────
  ws['!cols'] = types.map((t, i) => {
    if (i === 0)       return { wch: 30 };
    if (t === 'usd')   return { wch: 16 };
    if (t === 'pct')   return { wch: 12 };
    if (t === 'int')   return { wch: 10 };
    return { wch: 22 };
  });

  // ── Merge title cells across all columns ───────────────────────────────────
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: keys.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: keys.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: keys.length - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: keys.length - 1 } },
  ];

  // ── Cell styles helper ─────────────────────────────────────────────────────
  function addr(r, c) {
    return XLSX.utils.encode_cell({ r, c });
  }

  function setStyle(cellAddr, style) {
    if (!ws[cellAddr]) ws[cellAddr] = { t: 'z', v: '' };
    ws[cellAddr].s = style;
  }

  // Colors
  const C_GREEN_DARK  = '1A3C2E';
  const C_GREEN_MID   = '2D6A4F';
  const C_GREEN_LIGHT = 'E8F0EC';
  const C_GRAY        = 'F2EFE9';
  const C_WHITE       = 'FFFFFF';
  const C_DARK        = '2C2416';
  const C_DIM         = 'A89880';

  // ── Title row styles ────────────────────────────────────────────────────────
  // Row 0 — "Canopy Business Intelligence"
  setStyle(addr(0, 0), {
    font: { bold: true, sz: 16, color: { rgb: C_GREEN_DARK }, name: 'Arial' },
    fill: { patternType: 'solid', fgColor: { rgb: C_WHITE } },
    alignment: { vertical: 'center' }
  });

  // Row 1 — report title
  setStyle(addr(1, 0), {
    font: { bold: true, sz: 13, color: { rgb: C_DARK }, name: 'Arial' },
    fill: { patternType: 'solid', fgColor: { rgb: C_WHITE } },
  });

  // Row 2 — date
  setStyle(addr(2, 0), {
    font: { italic: true, sz: 10, color: { rgb: C_DIM }, name: 'Arial' },
    fill: { patternType: 'solid', fgColor: { rgb: C_WHITE } },
  });

  // ── Header row styles (row 4) ───────────────────────────────────────────────
  keys.forEach((_, c) => {
    setStyle(addr(HEADER_ROW, c), {
      font: { bold: true, sz: 10, color: { rgb: C_WHITE }, name: 'Arial' },
      fill: { patternType: 'solid', fgColor: { rgb: C_GREEN_DARK } },
      alignment: { horizontal: c === 0 ? 'left' : 'right', vertical: 'center' },
      border: {
        bottom: { style: 'medium', color: { rgb: C_GREEN_MID } }
      }
    });
  });

  // ── Data row styles + number formats ───────────────────────────────────────
  dataRows.forEach((row, ri) => {
    const rowIdx = DATA_START + ri;
    const isAlt  = ri % 2 === 1;
    const bgColor = isAlt ? C_GRAY : C_WHITE;

    keys.forEach((k, c) => {
      const cellAddr = addr(rowIdx, c);
      if (!ws[cellAddr]) ws[cellAddr] = { t: 'z', v: '' };

      const baseStyle = {
        font: { sz: 10, color: { rgb: C_DARK }, name: 'Arial' },
        fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
        alignment: { horizontal: c === 0 ? 'left' : 'right', vertical: 'center' },
        border: {
          bottom: { style: 'thin', color: { rgb: 'DDD5C4' } }
        }
      };

      if (types[c] === 'usd') {
        ws[cellAddr].z = '$#,##0';
        ws[cellAddr].t = 'n';
      } else if (types[c] === 'pct') {
        ws[cellAddr].z = '0.0%';
        ws[cellAddr].t = 'n';
      } else if (types[c] === 'int') {
        ws[cellAddr].z = '#,##0';
        ws[cellAddr].t = 'n';
      }

      ws[cellAddr].s = baseStyle;
    });
  });

  // ── Totals row styles ───────────────────────────────────────────────────────
  keys.forEach((k, c) => {
    const cellAddr = addr(totalsRowIdx, c);
    if (!ws[cellAddr]) ws[cellAddr] = { t: 'z', v: '' };

    ws[cellAddr].s = {
      font: { bold: true, sz: 10, color: { rgb: C_GREEN_DARK }, name: 'Arial' },
      fill: { patternType: 'solid', fgColor: { rgb: C_GREEN_LIGHT } },
      alignment: { horizontal: c === 0 ? 'left' : 'right', vertical: 'center' },
      border: {
        top: { style: 'medium', color: { rgb: C_GREEN_MID } }
      }
    };

    if (types[c] === 'usd') {
      ws[cellAddr].z = '$#,##0';
      ws[cellAddr].t = 'n';
    } else if (types[c] === 'pct') {
      // Totals don't sum percentages — clear the value
      ws[cellAddr].v = '';
      ws[cellAddr].t = 'z';
    } else if (types[c] === 'int') {
      ws[cellAddr].z = '#,##0';
      ws[cellAddr].t = 'n';
    }
  });

  // ── Row heights ─────────────────────────────────────────────────────────────
  ws['!rows'] = [];
  ws['!rows'][0] = { hpt: 28 }; // title
  ws['!rows'][1] = { hpt: 22 }; // report name
  ws['!rows'][2] = { hpt: 16 }; // date
  ws['!rows'][3] = { hpt: 8  }; // spacer
  ws['!rows'][HEADER_ROW] = { hpt: 20 }; // headers

  // ── Write file ──────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
  XLSX.writeFile(wb, `Canopy - ${title} - ${dateStr}.xlsx`);
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
              <h1 style={{ fontFamily:"'Lora',serif",fontSize:24,fontWeight:600,color:DARK,letterSpacing:"-0.02em" }}>{report.title}</h1>
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
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Lora',serif",fontSize:24,fontWeight:600,color:DARK,letterSpacing:"-0.02em" }}>Report Library</h1>
        <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:DIM,marginTop:4 }}>Pre-built reports — open to view, export as PDF or Excel.</p>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:12,maxWidth:720 }}>
        {REPORTS.map(r => {
          const data = r.compute();
          const topItem = data[0];
          return (
            <div key={r.id} className="card" style={{ padding:"18px 24px",transition:"border-color 0.15s",cursor:"pointer",display:"flex",alignItems:"center",gap:20 }}
              onClick={()=>setActiveReport(r.id)}
              onMouseOver={e=>e.currentTarget.style.borderColor=ACCENT}
              onMouseOut={e=>e.currentTarget.style.borderColor=BORDER}
            >
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Lora',serif",fontSize:15,fontWeight:500,color:DARK,marginBottom:4 }}>{r.title}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:DIM,lineHeight:1.5 }}>{r.description}</div>
              </div>
              {topItem && (
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,color:ACCENT2 }}>{topItem.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:DIM,marginTop:2 }}>
                    {topItem.margin != null ? `${topItem.margin}% margin` : topItem.profit != null ? $(topItem.profit) : ""}
                  </div>
                </div>
              )}
              <div style={{ display:"flex",gap:6,flexShrink:0 }} onClick={e => e.stopPropagation()}>
                <ExportButtons data={data} title={r.title} insight={r.insight(data)} report={r} compact={true} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ONBOARDING GATE ──────────────────────────────────────────────────────────
// Shown once after consent when industry is null. Captures industry + revenue_range
// for longitudinal benchmarking. Both fields are optional — user can skip.
// On self-serve signup (future): move these fields into the signup/onboarding flow.

const INDUSTRY_OPTIONS = [
  // Professional Services
  "Consulting",
  "Legal Services",
  "Accounting & Bookkeeping",
  "Marketing & Advertising",
  "IT & Technology Services",
  // Trades & Construction
  "General Contracting",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Landscaping",
  "Painting",
  "Flooring",
  "Roofing",
  "Renovation / Remodeling",
  // Other SMB
  "Retail",
  "Restaurant / Food Service",
  "Healthcare & Wellness",
  "Real Estate",
  "Event Services",
  "Cleaning Services",
  "Transportation & Logistics",
  "Manufacturing",
  "Other",
];

const REVENUE_OPTIONS = [
  "Under $250k", "$250k – $500k", "$500k – $1M", "$1M – $5M", "Over $5M",
];

// ─── TAB: JOB ESTIMATOR ──────────────────────────────────────────────────────

const COST_CATEGORIES = ["Materials", "Labor", "Subcontractor", "Other"];

// Compute the effective amount for a cost line (flat or unit mode)
function getLineAmount(line) {
  if (line.mode === "unit") {
    return (parseFloat(line.quantity) || 0) * (parseFloat(line.unitCost) || 0);
  }
  return parseFloat(line.amount) || 0;
}

const BLANK_LINE = { description: "", category: "Materials", amount: "", mode: "flat", unitCost: "", quantity: "" };

function exportQuotePDF({ name, jobType, expectedRevenue, costLines, notes, contractorName, totalCosts, grossProfit, grossMargin }) {
  const rev = parseFloat(expectedRevenue) || 0;
  const lineRows = costLines.filter(l => getLineAmount(l) > 0).map(l => {
    const amt = getLineAmount(l);
    return `<tr>
      <td>${l.description || '—'}</td>
      <td>${l.category || '—'}</td>
      <td class="mono right">${l.hours || l.quantity || '—'}</td>
      <td class="mono right">$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Quote — ${name || 'Untitled'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: white; color: #2C2416; padding: 40px 48px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #DDD5C4; }
    .company { font-size: 20px; font-weight: 700; color: #1E1810; letter-spacing: -0.02em; }
    .company-sub { font-size: 11px; color: #9C8A74; margin-top: 4px; }
    .meta { text-align: right; font-size: 11px; color: #9C8A74; line-height: 1.8; }
    .title { font-size: 22px; font-weight: 700; color: #2C2416; margin-bottom: 6px; }
    .subtitle { font-size: 12px; color: #6B5E4E; margin-bottom: 28px; }
    .section-label { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #9C8A74; font-weight: 700; margin-bottom: 10px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 0; }
    th { background: #F5F0E8; padding: 8px 12px; text-align: left; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: #9C8A74; border-bottom: 1px solid #DDD5C4; font-weight: 600; }
    th.right { text-align: right; }
    td { padding: 10px 12px; border-bottom: 1px solid #EDE8DC; color: #4A3F32; }
    td.mono { font-family: 'Courier New', monospace; }
    td.right, th.right { text-align: right; }
    tr:last-child td { border-bottom: none; }
    .totals { margin-top: 2px; border-top: 2px solid #DDD5C4; padding: 16px 0; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 12px; font-size: 13px; }
    .total-row.highlight { font-weight: 700; font-size: 15px; color: #2C2416; margin-top: 8px; padding-top: 10px; border-top: 1px solid #DDD5C4; }
    .total-row .label { color: #6B5E4E; }
    .total-row .value { font-family: 'Courier New', monospace; color: #2C2416; }
    .notes { margin-top: 28px; padding: 16px 18px; background: #FAF8F4; border: 1px solid #EDE8DC; border-radius: 4px; }
    .notes-label { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #9C8A74; font-weight: 700; margin-bottom: 8px; }
    .notes-text { font-size: 12px; color: #6B5E4E; line-height: 1.7; white-space: pre-wrap; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #DDD5C4; font-size: 10px; color: #9C8A74; text-align: center; }
    @media print { @page { margin: 1.5cm; size: A4 portrait; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">${contractorName || 'Quote'}</div>
      <div class="company-sub">Project Estimate</div>
    </div>
    <div class="meta">
      ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}<br/>
      ${jobType ? `Type: ${jobType}` : ''}
    </div>
  </div>

  <div class="title">${name || 'Untitled Estimate'}</div>
  <div class="subtitle">Detailed cost breakdown and projected pricing</div>

  <div class="section-label">Line Items</div>
  <table>
    <thead><tr><th>Description</th><th>Category</th><th class="right">Qty / Hrs</th><th class="right">Amount</th></tr></thead>
    <tbody>${lineRows || '<tr><td colspan="4" style="text-align:center;color:#9C8A74;padding:20px;">No line items</td></tr>'}</tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span class="label">Total Estimated Costs</span><span class="value">$${totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
    ${rev > 0 ? `<div class="total-row"><span class="label">Quoted Price</span><span class="value">$${rev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>` : ''}
    ${rev > 0 ? `<div class="total-row highlight"><span class="label">Projected Gross Profit</span><span class="value">$${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${grossMargin}%)</span></div>` : ''}
  </div>

  ${notes ? `<div class="notes"><div class="notes-label">Notes</div><div class="notes-text">${notes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div></div>` : ''}

  <div class="footer">
    Prepared by ${contractorName || '—'} · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups for app.canopybi.com to use PDF export.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

function JobEstimator({ jobSummaries, userId, contractorName }) {
  // ── Saved estimates state
  const [estimates, setEstimates]         = useState([]);
  const [templates, setTemplates]         = useState([]);
  const [loadingEstimates, setLoadingEstimates] = useState(true);
  const [activeEstimateId, setActiveEstimateId] = useState(null);

  // ── Form state
  const [name, setName]                   = useState("");
  const [jobType, setJobType]             = useState("");
  const [expectedRevenue, setExpectedRevenue] = useState("");
  const [costLines, setCostLines]         = useState([{ ...BLANK_LINE }]);
  const [notes, setNotes]                 = useState("");
  const [saving, setSaving]               = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [dirty, setDirty]                 = useState(false);

  // ── AI state
  const [aiLoading, setAiLoading]         = useState(false);
  const [aiResponse, setAiResponse]       = useState("");

  // ── Modals
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // ── Linked job (for Actuals comparison)
  const [linkedJobId, setLinkedJobId] = useState("");

  // ── Derive job types from existing data
  const jobTypes = useMemo(() => {
    const types = [...new Set(jobSummaries.map(j => j.type).filter(Boolean))];
    return types.sort();
  }, [jobSummaries]);

  // ── Load saved estimates and templates on mount
  useEffect(() => {
    if (!userId) { setLoadingEstimates(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from("estimates")
          .select("*")
          .eq("contractor_id", userId)
          .order("updated_at", { ascending: false });
        if (data) {
          setEstimates(data.filter(e => !e.is_template));
          setTemplates(data.filter(e => e.is_template));
        }
      } catch (e) {
        console.error("Error loading estimates:", e.message);
      }
      setLoadingEstimates(false);
    })();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Calculations
  const totalCosts = costLines.reduce((s, l) => s + getLineAmount(l), 0);
  const rev = parseFloat(expectedRevenue) || 0;
  const grossProfit = rev - totalCosts;
  const grossMargin = rev > 0 ? ((grossProfit / rev) * 100).toFixed(1) : "0.0";

  // ── Historical benchmark for selected job type
  const benchmark = useMemo(() => {
    const pool = jobType
      ? jobSummaries.filter(j => j.type === jobType && j.revenue > 0)
      : jobSummaries.filter(j => j.revenue > 0);
    if (pool.length === 0) return null;
    const totalRev   = pool.reduce((s, j) => s + j.revenue, 0);
    const totalCost  = pool.reduce((s, j) => s + j.costs, 0);
    const avgMargin  = totalRev > 0 ? (((totalRev - totalCost) / totalRev) * 100).toFixed(1) : "0.0";
    const avgRevenue = Math.round(totalRev / pool.length);
    const avgCost    = Math.round(totalCost / pool.length);
    return { avgMargin, avgRevenue, avgCost, count: pool.length, label: jobType || "All Jobs" };
  }, [jobType, jobSummaries]);

  // ── Cost line helpers
  function addCostLine() {
    setCostLines([...costLines, { ...BLANK_LINE }]);
    setDirty(true);
  }
  function removeCostLine(idx) {
    if (costLines.length <= 1) return;
    setCostLines(costLines.filter((_, i) => i !== idx));
    setDirty(true);
  }
  function updateCostLine(idx, field, value) {
    setCostLines(costLines.map((l, i) => i === idx ? { ...l, [field]: value } : l));
    setDirty(true);
  }
  function toggleCostLineMode(idx) {
    const line = costLines[idx];
    if (line.mode === "unit") {
      // Switch to flat — carry over computed amount
      setCostLines(costLines.map((l, i) => i === idx
        ? { ...l, mode: "flat", amount: String(getLineAmount(l)) }
        : l));
    } else {
      // Switch to unit — clear qty/unitCost
      setCostLines(costLines.map((l, i) => i === idx
        ? { ...l, mode: "unit", unitCost: "", quantity: "" }
        : l));
    }
    setDirty(true);
  }

  // ── Clear form
  function clearForm() {
    setName(""); setJobType(""); setExpectedRevenue(""); setNotes("");
    setCostLines([{ ...BLANK_LINE }]);
    setActiveEstimateId(null); setLinkedJobId(""); setDirty(false); setAiResponse("");
  }

  // ── Load an estimate into the form
  function loadEstimate(est) {
    setName(est.name || "");
    setJobType(est.job_type || "");
    setExpectedRevenue(est.expected_revenue ? String(est.expected_revenue) : "");
    setNotes(est.notes || "");
    setLinkedJobId(est.linked_job_id || "");
    setCostLines(est.cost_lines && est.cost_lines.length > 0
      ? est.cost_lines.map(l => ({ description: l.description || "", category: l.category || "Materials", amount: l.amount ? String(l.amount) : "", mode: l.mode || "flat", unitCost: l.unitCost ? String(l.unitCost) : "", quantity: l.quantity ? String(l.quantity) : "" }))
      : [{ ...BLANK_LINE }]);
    setActiveEstimateId(est.id);
    setDirty(false);
    setAiResponse("");
  }

  // ── Load a template into the form (clears revenue + name for user to fill)
  function loadTemplate(tmpl) {
    setName("");
    setJobType(tmpl.job_type || "");
    setExpectedRevenue("");
    setNotes(tmpl.notes || "");
    setCostLines(tmpl.cost_lines && tmpl.cost_lines.length > 0
      ? tmpl.cost_lines.map(l => ({ description: l.description || "", category: l.category || "Materials", amount: l.amount ? String(l.amount) : "", mode: l.mode || "flat", unitCost: l.unitCost ? String(l.unitCost) : "", quantity: l.quantity ? String(l.quantity) : "" }))
      : [{ ...BLANK_LINE }]);
    setActiveEstimateId(null);
    setDirty(true);
    setAiResponse("");
    setShowTemplateModal(false);
  }

  // ── Save estimate (create or update)
  async function saveEstimate() {
    if (!userId || !name.trim()) return;
    setSaving(true);
    const payload = {
      contractor_id: userId,
      name: name.trim(),
      job_type: jobType || null,
      expected_revenue: parseFloat(expectedRevenue) || 0,
      cost_lines: costLines.map(l => ({ description: l.description, category: l.category, amount: getLineAmount(l), mode: l.mode || "flat", unitCost: l.unitCost || "", quantity: l.quantity || "" })),
      notes: notes || null,
      is_template: false,
      linked_job_id: linkedJobId || null,
      updated_at: new Date().toISOString(),
    };
    try {
      if (activeEstimateId) {
        // Update
        const { error } = await supabase.from("estimates").update(payload).eq("id", activeEstimateId);
        if (error) throw error;
        setEstimates(prev => prev.map(e => e.id === activeEstimateId ? { ...e, ...payload } : e));
      } else {
        // Create
        const { data, error } = await supabase.from("estimates").insert(payload).select().single();
        if (error) throw error;
        setEstimates(prev => [data, ...prev]);
        setActiveEstimateId(data.id);
      }
      setDirty(false);
    } catch (e) {
      console.error("Error saving estimate:", e.message);
    }
    setSaving(false);
  }

  // ── Delete estimate
  async function deleteEstimate(id) {
    try {
      await supabase.from("estimates").delete().eq("id", id);
      setEstimates(prev => prev.filter(e => e.id !== id));
      if (activeEstimateId === id) clearForm();
    } catch (e) {
      console.error("Error deleting estimate:", e.message);
    }
  }

  // ── Save current cost lines as a reusable template
  async function saveAsTemplate() {
    if (!userId || !name.trim()) return;
    setSavingTemplate(true);
    const payload = {
      contractor_id: userId,
      name: name.trim() + " (Template)",
      job_type: jobType || null,
      expected_revenue: 0,
      cost_lines: costLines.map(l => ({ description: l.description, category: l.category, amount: getLineAmount(l), mode: l.mode || "flat", unitCost: l.unitCost || "", quantity: l.quantity || "" })),
      notes: notes || null,
      is_template: true,
      updated_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase.from("estimates").insert(payload).select().single();
      if (error) throw error;
      setTemplates(prev => [data, ...prev]);
    } catch (e) {
      console.error("Error saving template:", e.message);
    }
    setSavingTemplate(false);
  }

  // ── Delete template
  async function deleteTemplate(id) {
    try {
      await supabase.from("estimates").delete().eq("id", id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error("Error deleting template:", e.message);
    }
  }

  // ── Duplicate estimate
  function duplicateEstimate(est) {
    setName(est.name + " (copy)");
    setJobType(est.job_type || "");
    setExpectedRevenue(est.expected_revenue ? String(est.expected_revenue) : "");
    setNotes(est.notes || "");
    setCostLines(est.cost_lines && est.cost_lines.length > 0
      ? est.cost_lines.map(l => ({ description: l.description || "", category: l.category || "Materials", amount: l.amount ? String(l.amount) : "", mode: l.mode || "flat", unitCost: l.unitCost ? String(l.unitCost) : "", quantity: l.quantity ? String(l.quantity) : "" }))
      : [{ ...BLANK_LINE }]);
    setActiveEstimateId(null);
    setDirty(true);
    setAiResponse("");
  }

  // ── AI: Get Canopy's Take
  async function getCanopyTake() {
    if (aiLoading || rev <= 0) return;
    setAiLoading(true); setAiResponse("");
    const costBreakdown = costLines.filter(l => getLineAmount(l) > 0).map(l => `${l.category}: ${l.description || "unnamed"} — $${getLineAmount(l).toLocaleString()}`).join("\n");
    const benchmarkInfo = benchmark
      ? `Historical benchmark for ${benchmark.label} (${benchmark.count} completed jobs): average margin ${benchmark.avgMargin}%, average revenue ${$(benchmark.avgRevenue)}, average cost ${$(benchmark.avgCost)}.`
      : "No historical data available for comparison.";
    const prompt = `You are a sharp financial advisor for a small business. The user is pricing out a potential job. Analyze this estimate and give them actionable advice in 3-4 sentences. Be direct and specific with numbers.

ESTIMATE:
Job Name: ${name || "Unnamed"}
Job Type: ${jobType || "Not specified"}
Expected Revenue: ${$(rev)}
Total Estimated Costs: ${$(totalCosts)}
Gross Profit: ${$(grossProfit)}
Gross Margin: ${grossMargin}%

COST BREAKDOWN:
${costBreakdown || "No cost lines entered."}

${benchmarkInfo}

Give a short, direct assessment: Is the margin healthy? How does it compare to their history? Any specific cost lines that look unusual? Should they raise the price? Keep it under 100 words.`;

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: "You are a concise financial analyst for a small business owner. Be direct and actionable.", max_tokens: 500, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      setAiResponse(data.content?.map(b => b.text || "").join("") || "Couldn't get a response.");
    } catch (e) {
      setAiResponse("Error connecting to AI. Please try again.");
    }
    setAiLoading(false);
  }

  // ── Margin color
  const marginNum = parseFloat(grossMargin);
  const marginColor = marginNum >= 30 ? ACCENT2 : marginNum >= 15 ? AMBER : RED;

  // ── Cost breakdown by category for mini chart
  const categoryTotals = useMemo(() => {
    const map = {};
    costLines.forEach(l => {
      const amt = getLineAmount(l);
      if (amt > 0) map[l.category] = (map[l.category] || 0) + amt;
    });
    return COST_CATEGORIES.map(c => ({ name: c, value: map[c] || 0 })).filter(c => c.value > 0);
  }, [costLines]);
  const catColors = { Materials: ACCENT, Labor: ACCENT2, Subcontractor: AMBER, Other: MID };

  // ── Linked job + actuals comparison ──
  const linkedJob = linkedJobId ? jobSummaries.find(j => j.id === linkedJobId) : null;

  const actualsComparison = useMemo(() => {
    if (!linkedJob) return null;
    // Aggregate actual costs by category using description heuristics
    const actualByCategory = { Materials: 0, Labor: 0, Subcontractor: 0, Other: 0 };
    linkedJob.purchases.forEach(p => {
      const desc = (p.Line?.[0]?.Description || "").toLowerCase();
      const vendor = (p.EntityRef?.name || "").toLowerCase();
      if (/labor|crew|worker|install|technician/.test(desc + vendor))       actualByCategory.Labor        += p.TotalAmt || 0;
      else if (/sub|contractor|outsource/.test(desc + vendor))              actualByCategory.Subcontractor += p.TotalAmt || 0;
      else if (/material|supply|supplies|lumber|pipe|wire|concrete|paint/.test(desc + vendor)) actualByCategory.Materials += p.TotalAmt || 0;
      else                                                                   actualByCategory.Other        += p.TotalAmt || 0;
    });
    // Map estimated cost lines to same categories
    const estimatedByCategory = { Materials: 0, Labor: 0, Subcontractor: 0, Other: 0 };
    costLines.forEach(l => {
      const amt = getLineAmount(l);
      if (amt > 0 && estimatedByCategory[l.category] !== undefined) estimatedByCategory[l.category] += amt;
    });
    return {
      categories: COST_CATEGORIES.map(cat => ({
        cat,
        estimated: estimatedByCategory[cat],
        actual: actualByCategory[cat],
        variance: actualByCategory[cat] - estimatedByCategory[cat],
      })).filter(r => r.estimated > 0 || r.actual > 0),
      totalEstimated: totalCosts,
      totalActual: linkedJob.costs,
      revenueEstimated: rev,
      revenueActual: linkedJob.revenue,
      marginEstimated: parseFloat(grossMargin),
      marginActual: linkedJob.revenue > 0 ? parseFloat(((linkedJob.profit / linkedJob.revenue) * 100).toFixed(1)) : 0,
    };
  }, [linkedJob, costLines, totalCosts, rev, grossMargin]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: "32px 36px", background: BG, minHeight: "100vh" }}>

      {/* ── New Estimate confirmation modal ── */}
      {showClearConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(44,36,22,0.45)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, width: "100%", maxWidth: 400, padding: "28px 32px", boxShadow: "0 20px 60px rgba(44,36,22,0.2)" }}>
            <h3 style={{ fontFamily: "'Lora',serif", fontSize: 17, fontWeight: 600, color: DARK, marginBottom: 10 }}>Start a new estimate?</h3>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: MID, lineHeight: 1.6, marginBottom: 22 }}>
              {activeEstimateId ? "Your current estimate has been saved. Starting a new one will clear the form." : "You have unsaved changes. Starting a new estimate will discard them."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setShowClearConfirm(false)} style={{ fontSize: 12 }}>Cancel</button>
              {!activeEstimateId && (
                <button className="btn act" onClick={async () => { setShowClearConfirm(false); await saveEstimate(); clearForm(); if (templates.length > 0) setShowTemplateModal(true); }} style={{ fontSize: 12 }} disabled={!name.trim()}>
                  Save & New
                </button>
              )}
              <button className="btn" onClick={() => { setShowClearConfirm(false); clearForm(); if (templates.length > 0) setShowTemplateModal(true); }}
                style={{ fontSize: 12, borderColor: RED, color: RED }}>
                {activeEstimateId ? "Start New" : "Discard & New"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Template picker modal ── */}
      {showTemplateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(44,36,22,0.45)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, width: "100%", maxWidth: 440, padding: "28px 32px", boxShadow: "0 20px 60px rgba(44,36,22,0.2)" }}>
            <h3 style={{ fontFamily: "'Lora',serif", fontSize: 17, fontWeight: 600, color: DARK, marginBottom: 8 }}>Start from a template?</h3>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: MID, lineHeight: 1.6, marginBottom: 18 }}>
              Pick a template to pre-fill your cost lines, or start from scratch.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, maxHeight: 260, overflowY: "auto" }}>
              {templates.map(t => (
                <button key={t.id} onClick={() => loadTemplate(t)}
                  style={{ textAlign: "left", padding: "12px 14px", borderRadius: 6, border: `1px solid ${BORDER}`, background: BG, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
                  onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: DARK }}>{t.name}</div>
                  {t.job_type && <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{t.job_type} · {(t.cost_lines || []).length} cost lines</div>}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setShowTemplateModal(false)} style={{ fontSize: 12 }}>Start from Scratch</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Lora',serif", fontSize: 24, fontWeight: 600, color: DARK, letterSpacing: "-0.02em", marginBottom: 4 }}>
            Quote Generator
          </h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: DIM }}>
            Price out a job, see your projected margin, and compare to your real history.
          </p>
        </div>
        <button className="btn act" onClick={() => {
          const hasData = name.trim() || expectedRevenue || costLines.some(l => l.description || l.amount || l.unitCost || l.quantity);
          if (hasData && dirty) {
            setShowClearConfirm(true);
          } else {
            clearForm();
            if (templates.length > 0) setShowTemplateModal(true);
          }
        }} style={{ fontSize: 12, padding: "9px 18px" }}>
          + New Estimate
        </button>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* ── Left: Templates + Saved estimates list ── */}
        <div style={{ width: 200, flexShrink: 0 }}>

          {/* Templates */}
          {templates.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Templates
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {templates.map(t => (
                  <div key={t.id}
                    onClick={() => loadTemplate(t)}
                    style={{ padding: "10px 14px", borderRadius: 6, cursor: "pointer", background: "transparent", border: `1px solid ${BORDER}`, transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = CARD; e.currentTarget.style.borderColor = ACCENT; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = BORDER; }}>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.name}
                    </div>
                    {t.job_type && <div style={{ fontSize: 10, color: DIM, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>{t.job_type}</div>}
                    <div style={{ marginTop: 6 }}>
                      <button onClick={e => { e.stopPropagation(); deleteTemplate(t.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: RED, fontFamily: "'DM Sans',sans-serif", padding: 0, textDecoration: "underline" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Saved Estimates
          </div>
          {loadingEstimates ? (
            <div style={{ fontSize: 12, color: DIM, fontFamily: "'DM Sans',sans-serif" }}>Loading...</div>
          ) : estimates.length === 0 ? (
            <div style={{ fontSize: 12, color: DIM, fontFamily: "'DM Sans',sans-serif", padding: "16px 0" }}>
              No saved estimates yet. Build one on the right and hit Save.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {estimates.map(est => {
                const estCosts = (est.cost_lines || []).reduce((s, l) => s + getLineAmount(l), 0);
                const estRev = parseFloat(est.expected_revenue) || 0;
                const estMargin = estRev > 0 ? (((estRev - estCosts) / estRev) * 100).toFixed(1) : "0.0";
                const isActive = activeEstimateId === est.id;
                return (
                  <div key={est.id}
                    onClick={() => loadEstimate(est)}
                    style={{
                      padding: "12px 14px", borderRadius: 6, cursor: "pointer",
                      background: isActive ? CARD : "transparent",
                      border: `1px solid ${isActive ? ACCENT : BORDER}`,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = `${CARD}`; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, color: DARK, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {est.name || "Untitled"}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: MID }}>{$(estRev)}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: parseFloat(estMargin) >= 30 ? ACCENT2 : parseFloat(estMargin) >= 15 ? AMBER : RED, fontWeight: 600 }}>
                        {estMargin}%
                      </span>
                    </div>
                    {est.job_type && <div style={{ fontSize: 10, color: DIM, fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>{est.job_type}</div>}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={e => { e.stopPropagation(); duplicateEstimate(est); }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: DIM, fontFamily: "'DM Sans',sans-serif", padding: 0, textDecoration: "underline" }}>
                        Duplicate
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteEstimate(est.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: RED, fontFamily: "'DM Sans',sans-serif", padding: 0, textDecoration: "underline" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Center: Estimate form ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ padding: "28px 32px" }}>
            {/* Job name + type row */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: DARK, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                  Job / Project Name
                </label>
                <input value={name} onChange={e => { setName(e.target.value); setDirty(true); }}
                  placeholder="e.g. Smith Kitchen Remodel"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 5, border: `1px solid ${BORDER}`, background: BG, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: DARK, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: DARK, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                  Job Type
                </label>
                <select value={jobType} onChange={e => { setJobType(e.target.value); setDirty(true); }}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 5, border: `1px solid ${BORDER}`, background: BG, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: DARK, outline: "none", boxSizing: "border-box" }}>
                  <option value="">Select type</option>
                  {jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Revenue */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: DARK, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                Expected Revenue
              </label>
              <div style={{ position: "relative", maxWidth: 260 }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "'DM Mono',monospace", fontSize: 14, color: DIM }}>$</span>
                <input type="number" value={expectedRevenue} onChange={e => { setExpectedRevenue(e.target.value); setDirty(true); }}
                  placeholder="0"
                  style={{ width: "100%", padding: "10px 14px 10px 28px", borderRadius: 5, border: `1px solid ${BORDER}`, background: BG, fontFamily: "'DM Mono',monospace", fontSize: 14, color: DARK, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Cost lines */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: DARK, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Estimated Costs
                </label>
                <button onClick={addCostLine}
                  style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 4, cursor: "pointer", padding: "5px 12px", fontSize: 11, color: ACCENT, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
                  + Add Line
                </button>
              </div>
              {/* Header row */}
              <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                <div style={{ flex: 2, fontSize: 10, color: DIM, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>Description</div>
                <div style={{ flex: 1, fontSize: 10, color: DIM, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>Category</div>
                <div style={{ width: 200, fontSize: 10, color: DIM, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>Amount</div>
                <div style={{ width: 30 }}/>
              </div>
              {costLines.map((line, idx) => (
                <div key={idx} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                  <input value={line.description} onChange={e => updateCostLine(idx, "description", e.target.value)}
                    placeholder="e.g. Oak hardwood materials"
                    style={{ flex: 2, padding: "9px 12px", borderRadius: 4, border: `1px solid ${BORDER}`, background: BG, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: DARK, outline: "none", boxSizing: "border-box" }}
                  />
                  <select value={line.category} onChange={e => updateCostLine(idx, "category", e.target.value)}
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 4, border: `1px solid ${BORDER}`, background: BG, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: DARK, outline: "none", boxSizing: "border-box" }}>
                    {COST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {/* Amount area — flat or unit mode */}
                  <div style={{ width: 200, display: "flex", alignItems: "center", gap: 4 }}>
                    {line.mode === "flat" ? (
                      <div style={{ position: "relative", flex: 1 }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontFamily: "'DM Mono',monospace", fontSize: 12, color: DIM }}>$</span>
                        <input type="number" value={line.amount} onChange={e => updateCostLine(idx, "amount", e.target.value)}
                          placeholder="0"
                          style={{ width: "100%", padding: "9px 12px 9px 22px", borderRadius: 4, border: `1px solid ${BORDER}`, background: BG, fontFamily: "'DM Mono',monospace", fontSize: 12, color: DARK, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }}>
                        <input type="number" value={line.quantity} onChange={e => updateCostLine(idx, "quantity", e.target.value)}
                          placeholder="Qty"
                          style={{ width: 48, padding: "9px 6px", borderRadius: 4, border: `1px solid ${BORDER}`, background: BG, fontFamily: "'DM Mono',monospace", fontSize: 12, color: DARK, outline: "none", boxSizing: "border-box", textAlign: "center" }}
                        />
                        <span style={{ fontSize: 11, color: DIM }}>×</span>
                        <div style={{ position: "relative", flex: 1 }}>
                          <span style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", fontFamily: "'DM Mono',monospace", fontSize: 11, color: DIM }}>$</span>
                          <input type="number" value={line.unitCost} onChange={e => updateCostLine(idx, "unitCost", e.target.value)}
                            placeholder="0"
                            style={{ width: "100%", padding: "9px 6px 9px 18px", borderRadius: 4, border: `1px solid ${BORDER}`, background: BG, fontFamily: "'DM Mono',monospace", fontSize: 12, color: DARK, outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                        <span style={{ fontSize: 10, color: DIM, whiteSpace: "nowrap" }}>= {$(getLineAmount(line))}</span>
                      </div>
                    )}
                    {/* Mode toggle */}
                    <button onClick={() => toggleCostLineMode(idx)}
                      title={line.mode === "flat" ? "Switch to unit × qty" : "Switch to flat amount"}
                      style={{ padding: "4px 7px", borderRadius: 4, border: `1px solid ${BORDER}`, background: line.mode === "unit" ? ACCENT : "none", cursor: "pointer", fontSize: 9, color: line.mode === "unit" ? "#fff" : DIM, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, flexShrink: 0, letterSpacing: "0.04em" }}>
                      {line.mode === "unit" ? "FLAT" : "UNIT"}
                    </button>
                  </div>
                  <button onClick={() => removeCostLine(idx)}
                    style={{ width: 30, height: 30, borderRadius: 4, border: `1px solid ${BORDER}`, background: "none", cursor: costLines.length > 1 ? "pointer" : "default", color: costLines.length > 1 ? RED : DIM, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", opacity: costLines.length > 1 ? 1 : 0.3, flexShrink: 0 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: DARK, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                Notes (optional)
              </label>
              <textarea value={notes} onChange={e => { setNotes(e.target.value); setDirty(true); }}
                placeholder="Any notes about this estimate..."
                rows={2}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 5, border: `1px solid ${BORDER}`, background: BG, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: DARK, outline: "none", boxSizing: "border-box", resize: "vertical" }}
              />
            </div>

            {/* Link to completed job — for Actuals comparison */}
            {jobSummaries.filter(j => j.status !== "In Progress").length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: DARK, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                  Link to Completed Job <span style={{ fontWeight: 400, color: DIM, textTransform: "none", letterSpacing: 0 }}>(optional — enables Estimate vs. Actuals)</span>
                </label>
                <select value={linkedJobId} onChange={e => { setLinkedJobId(e.target.value); setDirty(true); }}
                  style={{ width: "100%", maxWidth: 380, padding: "9px 14px", borderRadius: 5, border: `1px solid ${linkedJobId ? ACCENT : BORDER}`, background: BG, fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: DARK, outline: "none", boxSizing: "border-box" }}>
                  <option value="">No job linked</option>
                  {jobSummaries.filter(j => j.status !== "In Progress").map(j => (
                    <option key={j.id} value={j.id}>{j.name}{j.clientName ? ` (${j.clientName})` : ""}</option>
                  ))}
                </select>
                {linkedJob && (
                  <div style={{ marginTop: 8, fontSize: 11, color: ACCENT2, fontFamily: "'DM Sans',sans-serif" }}>
                    ✓ Linked to {linkedJob.name} — actual margin was {linkedJob.revenue > 0 ? ((linkedJob.profit / linkedJob.revenue) * 100).toFixed(1) : "0.0"}%
                  </div>
                )}
              </div>
            )}

            {/* Save buttons */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn act" onClick={saveEstimate} disabled={saving || !name.trim()}
                style={{ padding: "10px 24px", fontSize: 12, opacity: (!name.trim()) ? 0.4 : 1 }}>
                {saving ? "Saving..." : activeEstimateId ? "Update Estimate" : "Save Estimate"}
              </button>
              <button className="btn" onClick={saveAsTemplate} disabled={savingTemplate || !name.trim()}
                style={{ padding: "10px 18px", fontSize: 12, opacity: (!name.trim()) ? 0.4 : 1 }}>
                {savingTemplate ? "Saving..." : "Save as Template"}
              </button>
              <button className="btn" onClick={() => exportQuotePDF({ name, jobType, expectedRevenue, costLines, notes, contractorName, totalCosts, grossProfit, grossMargin })} disabled={!name.trim()}
                style={{ padding: "10px 18px", fontSize: 12, opacity: (!name.trim()) ? 0.4 : 1, borderColor: ACCENT, color: ACCENT }}>
                Export Quote PDF
              </button>
              {dirty && <span style={{ fontSize: 11, color: AMBER, fontFamily: "'DM Sans',sans-serif" }}>Unsaved changes</span>}
              {!dirty && activeEstimateId && <span style={{ fontSize: 11, color: ACCENT2, fontFamily: "'DM Sans',sans-serif" }}>Saved</span>}
            </div>
          </div>
        </div>

        {/* ── Right: Results panel ── */}
        <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Gross profit card */}
          <div className="card" style={{ padding: "24px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Projected Gross Profit
            </div>
            <div style={{ fontFamily: "'Lora',serif", fontSize: 26, fontWeight: 600, color: grossProfit >= 0 ? ACCENT2 : RED, letterSpacing: "-0.02em" }}>
              {grossProfit >= 0 ? "" : "-"}{$(Math.abs(grossProfit))}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 600, color: marginColor, marginTop: 4 }}>
              {grossMargin}% margin
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, padding: "12px 0 0", borderTop: `1px solid ${BORDER}` }}>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: ACCENT2, fontWeight: 600 }}>{$(rev)}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: DIM }}>Revenue</div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: RED, fontWeight: 600 }}>{$(totalCosts)}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: DIM }}>Total Costs</div>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          {categoryTotals.length > 0 && (
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                Cost Breakdown
              </div>
              {categoryTotals.map(cat => {
                const pct = totalCosts > 0 ? ((cat.value / totalCosts) * 100).toFixed(0) : 0;
                return (
                  <div key={cat.name} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: MID }}>{cat.name}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: DARK }}>{$(cat.value)} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: catColors[cat.name] || MID, borderRadius: 3, transition: "width 0.3s" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Benchmark comparison */}
          {benchmark && rev > 0 && (
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                vs. Your History ({benchmark.label})
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 600, color: marginColor }}>{grossMargin}%</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: DIM }}>This Estimate</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 600, color: MID }}>{benchmark.avgMargin}%</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: DIM }}>Avg ({benchmark.count} jobs)</div>
                </div>
              </div>
              {/* Visual bar comparison */}
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 40, marginTop: 8 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: marginColor, fontWeight: 600, marginBottom: 2 }}>{grossMargin}%</span>
                  <div style={{ width: "100%", background: marginColor, borderRadius: "3px 3px 0 0", height: `${Math.min(Math.max(marginNum / 50 * 32, 4), 32)}px`, transition: "height 0.3s" }}/>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: MID, fontWeight: 600, marginBottom: 2 }}>{benchmark.avgMargin}%</span>
                  <div style={{ width: "100%", background: `${MID}60`, borderRadius: "3px 3px 0 0", height: `${Math.min(Math.max(parseFloat(benchmark.avgMargin) / 50 * 32, 4), 32)}px`, transition: "height 0.3s" }}/>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <div style={{ flex: 1, textAlign: "center", fontSize: 9, color: DIM, fontFamily: "'DM Sans',sans-serif" }}>Estimate</div>
                <div style={{ flex: 1, textAlign: "center", fontSize: 9, color: DIM, fontFamily: "'DM Sans',sans-serif" }}>Average</div>
              </div>
              {parseFloat(grossMargin) < parseFloat(benchmark.avgMargin) && (
                <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 5, background: `${AMBER}12`, border: `1px solid ${AMBER}30`, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: AMBER, lineHeight: 1.5 }}>
                  Your margin on this job ({grossMargin}%) is below your {benchmark.label} average ({benchmark.avgMargin}%). Consider adjusting your price or reviewing costs.
                </div>
              )}
              {parseFloat(grossMargin) >= parseFloat(benchmark.avgMargin) && (
                <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 5, background: `${ACCENT2}12`, border: `1px solid ${ACCENT2}30`, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: ACCENT2, lineHeight: 1.5 }}>
                  Your margin on this job ({grossMargin}%) is above your {benchmark.label} average ({benchmark.avgMargin}%) — healthy pricing.
                </div>
              )}
            </div>
          )}

          {/* AI: Get Canopy's Take */}
          {rev > 0 && (
            <div className="card" style={{ padding: "20px 24px" }}>
              <button onClick={getCanopyTake} disabled={aiLoading}
                className="btn act" style={{ width: "100%", padding: "11px 18px", fontSize: 12, marginBottom: aiResponse ? 14 : 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {aiLoading ? "Analyzing..." : "Get Canopy's Take"}
                {!aiLoading && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "rgba(92,122,90,0.25)", color: ACCENT2, fontWeight: 500 }}>AI</span>}
              </button>
              {aiResponse && (
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: MID, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {aiResponse}
                </div>
              )}
            </div>
          )}

          {/* Estimate vs. Actuals comparison */}
          {actualsComparison && (
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                Estimate vs. Actuals
              </div>

              {/* Revenue + margin summary row */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Est. Margin", val: `${actualsComparison.marginEstimated}%`, color: actualsComparison.marginEstimated >= 30 ? ACCENT2 : actualsComparison.marginEstimated >= 15 ? AMBER : RED },
                  { label: "Actual Margin", val: `${actualsComparison.marginActual}%`, color: actualsComparison.marginActual >= 30 ? ACCENT2 : actualsComparison.marginActual >= 15 ? AMBER : RED },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ flex: 1, background: BG, borderRadius: 5, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 15, fontWeight: 600, color }}>{val}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: DIM, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Cost variance by category */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {actualsComparison.categories.map(({ cat, estimated, actual, variance }) => (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: MID }}>{cat}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: variance > 0 ? RED : ACCENT2, fontWeight: 600 }}>
                        {variance > 0 ? "+" : ""}{$(Math.round(variance))}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <div style={{ flex: 1, height: 5, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${estimated > 0 ? Math.min((estimated / Math.max(estimated, actual)) * 100, 100) : 0}%`, background: ACCENT, borderRadius: 2 }}/>
                      </div>
                      <div style={{ flex: 1, height: 5, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${actual > 0 ? Math.min((actual / Math.max(estimated, actual)) * 100, 100) : 0}%`, background: variance > 50 ? RED : ACCENT2, borderRadius: 2 }}/>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: DIM }}>Est {$(Math.round(estimated))}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: DIM }}>Act {$(Math.round(actual))}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total variance callout */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                {(() => {
                  const totalVariance = actualsComparison.totalActual - actualsComparison.totalEstimated;
                  const isOver = totalVariance > 0;
                  return (
                    <div style={{ padding: "10px 12px", borderRadius: 5, background: isOver ? `${RED}0D` : `${ACCENT2}0D`, border: `1px solid ${isOver ? RED : ACCENT2}30`, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: isOver ? RED : ACCENT2, lineHeight: 1.5 }}>
                      {isOver
                        ? `Over budget by ${$(Math.round(totalVariance))} (${((totalVariance / actualsComparison.totalEstimated) * 100).toFixed(0)}%). Review your ${[...actualsComparison.categories].sort((a,b)=>b.variance-a.variance)[0]?.cat} estimate next time.`
                        : `Under budget by ${$(Math.abs(Math.round(totalVariance)))} — good cost control on this job.`
                      }
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardingGate({ userId, onComplete }) {
  const [industry,     setIndustry]     = useState("");
  const [revenueRange, setRevenueRange] = useState("");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");

  async function handleSave(skip = false) {
    setSaving(true);
    setError("");
    const update = skip
      ? { industry: "skipped", revenue_range: "skipped" }
      : { industry: industry || "skipped", revenue_range: revenueRange || "skipped" };
    const { error: err } = await supabase
      .from("contractors")
      .update(update)
      .eq("id", userId);
    if (err) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
      return;
    }
    onComplete(update);
  }

  const selectStyle = {
    width:"100%", padding:"10px 12px", borderRadius:5, border:`1px solid ${BORDER}`,
    background:CARD, fontFamily:"'DM Sans',sans-serif", fontSize:13, color:DARK,
    cursor:"pointer", appearance:"none", backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23A89880' d='M1 1l5 5 5-5'/%3E%3C/svg%3E\")",
    backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center",
  };

  return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{css}</style>
      <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, padding:"44px 48px", maxWidth:520, width:"100%", boxShadow:"0 4px 24px rgba(44,36,22,0.13)" }}>
        <div style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, color:DARK, marginBottom:6, letterSpacing:"-0.01em" }}>Canopy</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, letterSpacing:"0.1em", color:DIM, textTransform:"uppercase", marginBottom:32 }}>Business Intelligence</div>

        <div style={{ fontFamily:"'Lora',serif", fontSize:18, color:DARK, marginBottom:8 }}>One quick question</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:MID, lineHeight:1.6, marginBottom:32 }}>
          Help us tailor Canopy to your business. This takes 15 seconds and helps us build better benchmarks for your industry. Both fields are optional.
        </div>

        {/* Industry */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, letterSpacing:"0.08em", color:DIM, textTransform:"uppercase", marginBottom:8 }}>
            What type of business do you run?
          </label>
          <select value={industry} onChange={e => setIndustry(e.target.value)} style={selectStyle}>
            <option value="">Select an industry…</option>
            {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Revenue range */}
        <div style={{ marginBottom:36 }}>
          <label style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, letterSpacing:"0.08em", color:DIM, textTransform:"uppercase", marginBottom:8 }}>
            Annual revenue (approximate)
          </label>
          <select value={revenueRange} onChange={e => setRevenueRange(e.target.value)} style={selectStyle}>
            <option value="">Select a range…</option>
            {REVENUE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {error && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:RED, marginBottom:16 }}>{error}</div>
        )}

        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          style={{
            width:"100%", padding:"13px 0", borderRadius:5, border:"none",
            background:DARK, color:CARD, fontFamily:"'DM Sans',sans-serif",
            fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"0.04em",
            marginBottom:12, transition:"opacity 0.15s",
          }}>
          {saving ? "Saving…" : "Continue to Canopy →"}
        </button>

        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          style={{
            width:"100%", padding:"10px 0", borderRadius:5, border:`1px solid ${BORDER}`,
            background:"transparent", color:DIM, fontFamily:"'DM Sans',sans-serif",
            fontSize:12, cursor:"pointer", letterSpacing:"0.03em",
          }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ─── CONSENT GATE ─────────────────────────────────────────────────────────────
// Shown after login whenever consent_accepted_at is null or on an old version.
// On self-serve signup (future): move checkboxes into signup form and retire this gate.

function ConsentGate({ userId, onConsent }) {
  const [required, setRequired] = useState(false);
  const [optIn,    setOptIn]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  async function handleAccept() {
    if (!required) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase
      .from("contractors")
      .update({
        consent_accepted_at:      new Date().toISOString(),
        consent_version:          CONSENT_VERSION,
        data_aggregation_consent: optIn,
      })
      .eq("id", userId);
    if (err) {
      setError("Something went wrong saving your response. Please try again.");
      setSaving(false);
      return;
    }
    onConsent({ consent_accepted_at: new Date().toISOString(), consent_version: CONSENT_VERSION, data_aggregation_consent: optIn });
  }

  return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{css}</style>
      <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, padding:"44px 48px", maxWidth:520, width:"100%", boxShadow:"0 4px 24px rgba(44,36,22,0.13)" }}>
        {/* Logo / wordmark */}
        <div style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, color:DARK, marginBottom:6, letterSpacing:"-0.01em" }}>Canopy</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, letterSpacing:"0.1em", color:DIM, textTransform:"uppercase", marginBottom:32 }}>Business Intelligence</div>

        <div style={{ fontFamily:"'Lora',serif", fontSize:18, color:DARK, marginBottom:10 }}>Before you continue</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:MID, lineHeight:1.6, marginBottom:32 }}>
          Please review and accept our terms to use Canopy. This only takes a moment.
        </div>

        {/* Required checkbox */}
        <label style={{ display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer", marginBottom:20 }}>
          <input
            type="checkbox"
            checked={required}
            onChange={e => setRequired(e.target.checked)}
            style={{ marginTop:3, accentColor:ACCENT2, width:15, height:15, flexShrink:0, cursor:"pointer" }}
          />
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:DARK, lineHeight:1.6 }}>
            I have read and agree to the{" "}
            <a href="https://canopybi.com/privacy" target="_blank" rel="noopener noreferrer"
              style={{ color:ACCENT2, textDecoration:"underline" }}>Privacy Policy</a>
            {" "}and{" "}
            <a href="https://canopybi.com/terms" target="_blank" rel="noopener noreferrer"
              style={{ color:ACCENT2, textDecoration:"underline" }}>Terms of Use</a>.
            {" "}<span style={{ color:RED, fontSize:11 }}>Required</span>
          </span>
        </label>

        {/* Optional checkbox */}
        <label style={{ display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer", marginBottom:36, padding:"14px 16px", background:BG, borderRadius:6, border:`1px solid ${BORDER}` }}>
          <input
            type="checkbox"
            checked={optIn}
            onChange={e => setOptIn(e.target.checked)}
            style={{ marginTop:3, accentColor:ACCENT2, width:15, height:15, flexShrink:0, cursor:"pointer" }}
          />
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:MID, lineHeight:1.6 }}>
            <strong style={{ color:DARK }}>Optional:</strong> I consent to Canopy using my anonymized performance data to improve the product experience. No personally identifiable information is ever shared.
          </span>
        </label>

        {error && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:RED, marginBottom:16 }}>{error}</div>
        )}

        <button
          onClick={handleAccept}
          disabled={!required || saving}
          style={{
            width:"100%", padding:"13px 0", borderRadius:5, border:"none",
            background: required ? DARK : BORDER,
            color: required ? CARD : DIM,
            fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600,
            cursor: required ? "pointer" : "not-allowed", letterSpacing:"0.04em",
            transition:"background 0.15s"
          }}>
          {saving ? "Saving…" : "Continue to Canopy →"}
        </button>

        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:DIM, marginTop:16, textAlign:"center", lineHeight:1.6 }}>
          You can review our policies at any time from the Help menu.
        </div>
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
  const [liveAutoMatched, setLiveAutoMatched]   = useState([]);
  const [liveSuggested, setLiveSuggested]       = useState([]);
  const [liveUntagged, setLiveUntagged]         = useState(null);
  const [liveTagged, setLiveTagged]             = useState([]);
  const [liveOverhead, setLiveOverhead]         = useState([]);
  const [liveDismissed, setLiveDismissed]       = useState([]);
  const [liveVendorRules, setLiveVendorRules]   = useState([]);
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

      // Fetch all inbox items in one query, split by status client-side
      const { data: allInboxItems } = await supabase
        .from('inbox_tags')
        .select('*')
        .eq('contractor_id', userId);

      const autoMatchedItems = [];
      const suggestedItems   = [];
      const pendingItems     = [];
      const taggedItems      = [];
      const overheadItems    = [];
      const dismissedItems   = [];

      (allInboxItems || []).forEach(item => {
        switch (item.status) {
          case 'auto_matched': autoMatchedItems.push(item); break;
          case 'suggested':    suggestedItems.push(item);   break;
          case 'pending':      pendingItems.push(item);     break;
          case 'tagged':       taggedItems.push(item);      break;
          case 'overhead':     overheadItems.push(item);    break;
          case 'dismissed':    dismissedItems.push(item);   break;
          default:             pendingItems.push(item);     break;
        }
      });

      // Fetch vendor rules (graceful — table may not exist yet)
      let vendorRulesData = [];
      try {
        const { data: vrData } = await supabase
          .from('vendor_rules')
          .select('*')
          .eq('contractor_id', userId);
        vendorRulesData = vrData || [];
      } catch (e) { // eslint-disable-line no-unused-vars
        // vendor_rules table not yet created — skip silently
      }

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
            AccountBasedExpenseLineDetail: { CustomerRef: { value: job.id } } }]
        }));
        return {
          id: job.id, name: job.name, clientName: job.client_name || '',
          type: job.job_type || 'General Construction', status: job.status || 'Complete',
          revenue, costs, materialCost: costs, laborCost: 0, profit, marginPct, outstanding: 0,
          invoices: invoiceObjs, purchases: purchaseObjs, laborEntries: [], manualExpenses: [], manualRevenue: [], costByVendor,
          firstDate: invoices[0]?.txn_date || '', lastDate: invoices[invoices.length-1]?.txn_date || '',
        };
      }).filter(j => j.revenue > 0 || j.costs > 0);

      // Parse inbox items into frontend shape
      function parseInboxItem(item) {
        return {
          id: item.id, docNumber: item.doc_number, vendor: item.vendor,
          date: item.txn_date, amount: item.amount, description: item.description,
          paymentType: item.payment_type || 'Check',
          suggestedJob: item.suggested_job_id, suggestionReason: item.suggestion_reason,
          taggedJobId: item.tagged_job_id || null,
          confidence: item.confidence || null, matchTier: item.match_tier || null,
          matchReason: item.match_reason || null, matchedBy: item.matched_by || null,
        };
      }

      if (liveSummaries.length > 0) {
        setLiveJobSummaries(liveSummaries);
        setLiveAutoMatched(autoMatchedItems.map(parseInboxItem));
        setLiveSuggested(suggestedItems.map(parseInboxItem));
        setLiveUntagged(pendingItems.map(parseInboxItem));
        setLiveTagged(taggedItems.map(parseInboxItem));
        setLiveOverhead(overheadItems.map(parseInboxItem));
        setLiveDismissed(dismissedItems.map(parseInboxItem));
        setLiveVendorRules(vendorRulesData);
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
    autoMatched:  liveAutoMatched,
    suggested:    liveSuggested,
    untagged:     liveUntagged     || mockUntagged,
    tagged:       liveTagged,
    overhead:     liveOverhead,
    dismissed:    liveDismissed,
    vendorRules:  liveVendorRules,
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
  const [laborEntries, setLaborEntries]       = useState(MOCK_LABOR_ENTRIES);
  const [manualExpenses, setManualExpenses]   = useState(MOCK_MANUAL_EXPENSES);
  const [manualRevenue, setManualRevenue]     = useState(MOCK_MANUAL_REVENUE);
  const [revenueGoal, setRevenueGoal]         = useState(null); // { revenue_target, period, set_at }
  const [showGoalModal, setShowGoalModal]     = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showTutorial, setShowTutorial]     = useState(false);
  const [dateRange, setDateRange]       = useState("ytd");
  const [customStart, setCustomStart]   = useState("");
  const [customEnd, setCustomEnd]       = useState("");
  const [qbConnected, setQbConnected]       = useState(false);
  const [qbError, setQbError]           = useState(null);
  const [syncing, setSyncing]           = useState(false);
  const [syncError, setSyncError]       = useState(null);
  const [syncNudge, setSyncNudge]       = useState(null);  // { auto, suggested, needs_attention }
  const [showVendorSetup, setShowVendorSetup] = useState(false);
  const [vendorSetupIsFirstRun, setVendorSetupIsFirstRun] = useState(false);
  const [appToast, setAppToast]          = useState(null); // { msg, color }
  const appToastTimer                    = useRef(null);

  // ── Live data hook — loads from Supabase, falls back to mock
  const mockJobSummaries = buildJobSummaries({}, laborEntries, manualExpenses, manualRevenue);
  const {
    jobSummaries,
    autoMatched,
    suggested,
    untagged: baseUntagged,
    tagged: dbTagged,
    overhead,
    dismissed,
    vendorRules,
    dataSource,
    refresh: refreshData,
  } = useContractorData(session?.user?.id, mockJobSummaries, INITIAL_UNTAGGED);

  // Untagged — filter out items tagged during this session (optimistic UI)
  const sessionTaggedIds = new Set(tagged.map(t => t.id));
  const untagged  = baseUntagged.filter(u => !sessionTaggedIds.has(u.id));

  // Combined tagged list: DB-persisted + session-tagged (for display in "All Tagged" tab)
  const allTagged = [...dbTagged, ...tagged.filter(t => !dbTagged.some(d => d.id === t.id))];

  // Keep selectedJob in sync when job summaries update (e.g. after adding labor)
  // Compare costs to avoid infinite loops from object identity changes.
  useEffect(() => {
    if (selectedJob) {
      const fresh = jobSummaries.find(j => j.id === selectedJob.id);
      if (fresh && (fresh.costs !== selectedJob.costs || fresh.revenue !== selectedJob.revenue || fresh.laborCost !== selectedJob.laborCost || fresh.materialCost !== selectedJob.materialCost)) {
        setSelectedJob(fresh);
      }
    }
  }, [jobSummaries]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Trigger a QB sync after successful OAuth connect
  async function triggerSync(userId) {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/qb-sync?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        console.log('QB sync complete:', data.summary);
        await refreshData();
        // Show post-sync nudge if matching engine did work
        const m = data.summary?.matching;
        if (m && (m.auto > 0 || m.suggested > 0 || m.needs_attention > 0)) {
          setSyncNudge(m);
        }
        // After sync, if no tracked vendors are set up yet, open vendor setup
        const hasTracked = (vendorRules || []).some(r => r.rule_type === 'tracked');
        if (!hasTracked) {
          setVendorSetupIsFirstRun(true);
          setShowVendorSetup(true);
        }
      } else {
        console.error('QB sync failed:', data.error);
        if (data.error === 'QB_DISCONNECTED') {
          setQbConnected(false);
          setQbError('QB_TOKEN_EXPIRED');
        } else {
          setSyncError(data.error || 'Sync failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('QB sync error:', err);
      setSyncError('Sync timed out or lost connection. Please try again.');
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
    if (params.get('qb_disconnected') === 'true') {
      setQbConnected(false);
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
        // Show tutorial on first login
        const tutorialSeen = localStorage.getItem(`canopy_tutorial_${s.user.id}`);
        if (!tutorialSeen) setShowTutorial(true);
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

  function dismissTutorial() {
    if (session?.user?.id) localStorage.setItem(`canopy_tutorial_${session.user.id}`, 'true');
    setShowTutorial(false);
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

  // Consent gate — shown if user has never consented, or consented to an older policy version
  const needsConsent = !profile?.consent_accepted_at || profile?.consent_version !== CONSENT_VERSION;
  if (needsConsent) {
    return (
      <ConsentGate
        userId={session.user.id}
        onConsent={(fields) => setProfile(p => ({ ...p, ...fields }))}
      />
    );
  }

  // Onboarding gate — shown once when industry is null (captures industry + revenue_range)
  const needsOnboarding = !profile?.industry;
  if (needsOnboarding) {
    return (
      <OnboardingGate
        userId={session.user.id}
        onComplete={(fields) => setProfile(p => ({ ...p, ...fields }))}
      />
    );
  }

  const clientType     = profile?.client_type || "quickbooks";
  const contractorName = profile?.name || session?.user?.email || "Your Account";

  function showAppToast(msg, color = ACCENT2) {
    clearTimeout(appToastTimer.current);
    setAppToast({ msg, color });
    appToastTimer.current = setTimeout(() => setAppToast(null), 3000);
  }

  function handleJobClick(job) {
    setSelectedJob(job);
    setTab("detail");
  }

  function handleAddLabor(entry) {
    const newEntry = { ...entry, id: `LAB-${Date.now()}` };
    setLaborEntries(prev => [...prev, newEntry]);
    showAppToast(`Labor entry added: ${$(entry.amount)}`, ACCENT2);
  }

  function handleDeleteLabor(entryId) {
    setLaborEntries(prev => prev.filter(l => l.id !== entryId));
    showAppToast("Labor entry removed", DIM);
  }

  function handleAddExpense(entry) {
    const newEntry = { ...entry, id: `EXP-${Date.now()}` };
    setManualExpenses(prev => [...prev, newEntry]);
    showAppToast(`Expense added: ${$(entry.amount)}`, ACCENT2);
  }

  function handleDeleteExpense(entryId) {
    setManualExpenses(prev => prev.filter(e => e.id !== entryId));
    showAppToast("Expense removed", DIM);
  }

  function handleAddRevenue(entry) {
    const newEntry = { ...entry, id: `REV-${Date.now()}` };
    setManualRevenue(prev => [...prev, newEntry]);
    showAppToast(`Revenue added: ${$(entry.amount)}`, ACCENT2);
  }

  function handleDeleteRevenue(entryId) {
    setManualRevenue(prev => prev.filter(r => r.id !== entryId));
    showAppToast("Revenue entry removed", DIM);
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
      showAppToast(`Tagged to ${jobName}`);
    } catch (err) {
      console.error('Error saving tag to Supabase:', err);
      // Roll back optimistic update so item reappears in inbox
      setTagged(prev => prev.filter(t => t.id !== item.id));
      showAppToast('Failed to save tag — please try again', RED);
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
      showAppToast('Marked as fixed cost overhead');
    } catch (err) {
      console.error('Error marking as overhead:', err);
      showAppToast('Failed to update — please try again', RED);
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
      showAppToast('Expense dismissed', AMBER);
    } catch (err) {
      console.error('Error saving dismissal to Supabase:', err);
      showAppToast('Failed to dismiss — please try again', RED);
    }
  }

  async function handleRestore(id) {
    try {
      await supabase
        .from('inbox_tags')
        .update({ status: 'pending' })
        .eq('id', id);
      await refreshData();
      showAppToast('Expense restored to inbox');
    } catch (err) {
      console.error('Error restoring expense:', err);
      showAppToast('Failed to restore — please try again', RED);
    }
  }

  // ── Sync Review handlers ──────────────────────────────────────────────────────

  async function handleConfirmSuggestion(item, jobId, jobName) {
    // Accept a suggested or auto-assigned match — works for both confirm and change-job
    setTagged(prev => [...prev, { ...item, taggedJobId: jobId, taggedJobName: jobName }]);
    try {
      await supabase
        .from('inbox_tags')
        .update({ status: 'tagged', tagged_job_id: jobId, matched_by: 'manual' })
        .eq('id', item.id);
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
      await refreshData();
      showAppToast(`Confirmed — tagged to ${jobName}`);
    } catch (err) {
      console.error('Error confirming suggestion:', err);
      // Roll back optimistic update so item reappears
      setTagged(prev => prev.filter(t => t.id !== item.id));
      showAppToast('Failed to confirm — please try again', RED);
    }
  }

  async function handleRetag(item, newJobId, newJobName) {
    // Change a tagged/auto-matched expense to a different job.
    // Insert new transaction FIRST, then clean up old rows — so if insert fails,
    // the old transaction stays intact and job costs are never orphaned.
    try {
      // 1. Insert new transaction for the correct job (upsert overwrites _inbox_ row if it exists)
      await supabase
        .from('transactions')
        .upsert({
          id:            `${session.user.id}_inbox_${item.id}`,
          contractor_id: session.user.id,
          job_id:        newJobId,
          type:          'expense',
          doc_number:    item.docNumber,
          txn_date:      item.date,
          amount:        item.amount,
          description:   item.description,
          vendor:        item.vendor,
        }, { onConflict: 'id' });

      // 2. Clean up any leftover auto-match transaction (different ID pattern)
      await supabase
        .from('transactions')
        .delete()
        .eq('id', `${session.user.id}_automatch_${item.id}`);

      // 3. Update inbox_tags
      await supabase
        .from('inbox_tags')
        .update({ status: 'tagged', tagged_job_id: newJobId, matched_by: 'manual' })
        .eq('id', item.id);

      await refreshData();
      showAppToast(`Retagged to ${newJobName}`);
    } catch (err) {
      console.error('Error re-tagging expense:', err);
      showAppToast('Failed to retag — please try again', RED);
    }
  }

  async function handleUndoAutoMatch(item) {
    // Move an auto-matched item back to pending (needs attention)
    try {
      await supabase
        .from('inbox_tags')
        .update({ status: 'pending', tagged_job_id: null, match_tier: 'needs_attention', matched_by: null })
        .eq('id', item.id);

      // Remove the auto-matched transaction row
      const autoTxnId = `${session.user.id}_automatch_${item.id}`;
      await supabase.from('transactions').delete().eq('id', autoTxnId);

      await refreshData();
      showAppToast('Auto-match undone — moved back to needs attention', AMBER);
    } catch (err) {
      console.error('Error undoing auto-match:', err);
      showAppToast('Failed to undo — please try again', RED);
    }
  }

  // ── Vendor rule management ────────────────────────────────────────────────────

  async function handleVendorSetupSave() {
    setShowVendorSetup(false);
    await refreshData();
    // On first run, trigger a clean resync so the vendor filter takes effect immediately
    if (vendorSetupIsFirstRun && session?.user?.id) {
      triggerSync(session.user.id);
    }
    setVendorSetupIsFirstRun(false);
  }

  async function handleSaveVendorRule(vendorName, ruleType) {
    if (!session?.user?.id || !vendorName || !ruleType) return;
    try {
      await supabase
        .from('vendor_rules')
        .upsert({
          contractor_id: session.user.id,
          vendor_name:   vendorName,
          rule_type:     ruleType,
        }, { onConflict: 'contractor_id,vendor_name' });
      await refreshData();
    } catch (err) {
      console.error('Error saving vendor rule:', err);
    }
  }

  const reviewCount = filterUntaggedByDate(suggested || [], dateRange, customStart, customEnd).length
                   + filterUntaggedByDate(untagged,        dateRange, customStart, customEnd).length;

  // SVG icon paths — lightweight inline icons (Lucide-inspired, 18×18 viewBox)
  const IC = (d, sz=18) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, opacity:0.7 }}>{d}</svg>;
  const ICONS = {
    dashboard: IC(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>),
    clients:   IC(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
    inbox:     IC(<><path d="M22 12h-6l-2 3H10l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>),
    detail:    IC(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>),
    estimator: IC(<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>),
    reports:   IC(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>),
    chat:      IC(<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>),
    raw:       IC(<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>),
    gear:      IC(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  };

  const TABS = [
    { key:"dashboard", label:"Dashboard",         icon:ICONS.dashboard },
    { key:"clients",   label:"Clients",           icon:ICONS.clients },
    ...(clientType === "quickbooks" ? [{ key:"inbox", label:"Expense Management", icon:ICONS.inbox }] : []),
    { key:"detail",    label:"Job Detail",        icon:ICONS.detail },
    { key:"estimator", label:"Quote Generator",   icon:ICONS.estimator },
    { key:"reports",   label:"Reports",           icon:ICONS.reports },
    { key:"chat",      label:"AI Analyst",        icon:ICONS.chat },
    ...(clientType === "quickbooks" ? [{ key:"raw", label:"Raw Data",             icon:ICONS.raw }] : []),
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:BG, minHeight:"100vh", color:DARK, display:"flex", flexDirection:"row" }}>
      <style>{css}</style>

      {/* ── Tutorial modal ── */}
      {showTutorial && <TutorialModal onClose={dismissTutorial} qbConnected={qbConnected}/>}

      {/* ── Vendor setup modal ── */}
      {showVendorSetup && (
        <VendorSetup
          userId={session.user.id}
          vendorRules={vendorRules}
          onSave={handleVendorSetupSave}
          onClose={() => setShowVendorSetup(false)}
          isFirstRun={vendorSetupIsFirstRun}
        />
      )}

      {/* ── First-login disclaimer modal ── */}
      {showDisclaimer && (
        <div role="dialog" aria-modal="true" aria-label="Data disclaimer" onKeyDown={e => e.key === 'Escape' && setShowDisclaimer(false)} style={{ position:"fixed", inset:0, background:"rgba(44,36,22,0.5)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
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

      {/* ── Sidebar ── */}
      <div style={{ width:220, flexShrink:0, background:SIDEBAR_BG, height:"100vh", position:"sticky", top:0, display:"flex", flexDirection:"column", overflowY:"auto", zIndex:100 }}>
        {/* Logo */}
        <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontFamily:"'Lora',serif", fontSize:18, fontWeight:500, color:"#F5EFE3", letterSpacing:"-0.01em" }}>Canopy</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"0.1em", color:SIDEBAR_DIM, textTransform:"uppercase", marginTop:2 }}>Business Intelligence</div>
        </div>
        {/* Nav items */}
        <nav style={{ flex:1, padding:"12px 0" }}>
          {TABS.map(t => (
            <div key={t.key} className={`si${tab===t.key?" active":""}`} onClick={()=>setTab(t.key)}
              style={{ color: tab===t.key ? "#F5EFE3" : SIDEBAR_TEXT }}>
              {t.icon}
              <span style={{ flex:1 }}>{t.label}</span>
              {t.key==="inbox" && reviewCount > 0 && <span className="badge">{reviewCount}</span>}
              {t.key==="inbox" && reviewCount === 0 && allTagged.length > 0 && <span className="badge done">✓</span>}
              {t.key==="detail" && selectedJob && <span style={{ fontSize:10, color:SIDEBAR_DIM }}>· {selectedJob.name.split(" ")[0]}</span>}
              {t.key==="chat" && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:3, background:"rgba(92,122,90,0.25)", color:ACCENT2, fontWeight:500 }}>AI</span>}
            </div>
          ))}
        </nav>
        {/* Getting Started checklist — shown until all 3 steps complete */}
        {clientType === "quickbooks" && (() => {
          const step1 = qbConnected;
          const step2 = allTagged.length > 0 || (autoMatched || []).length > 0;
          const step3 = jobSummaries.length > 0 && dataSource === 'live';
          const allDone = step1 && step2 && step3;
          if (allDone) return null;
          const steps = [
            { label: "Connect QuickBooks", done: step1 },
            { label: "Review your sync",   done: step2 },
            { label: "View profitability", done: step3 },
          ];
          return (
            <div style={{ margin:"0 12px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.09)", background:"rgba(255,255,255,0.04)", padding:"12px 14px" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(245,239,227,0.4)", marginBottom:10 }}>Getting Started</div>
              {steps.map((s, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:9, marginBottom:7 }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", border:`1.5px solid ${s.done ? ACCENT2 : "rgba(255,255,255,0.2)"}`, background: s.done ? `${ACCENT2}22` : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:9, color:ACCENT2 }}>
                    {s.done ? "✓" : ""}
                  </div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color: s.done ? "rgba(245,239,227,0.45)" : "rgba(245,239,227,0.75)", textDecoration: s.done ? "line-through" : "none" }}>{s.label}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* QB status */}
        {clientType === "quickbooks" && (
          <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                {syncing
                  ? <span className="spinner" style={{ width:10, height:10, borderWidth:1.5 }}/>
                  : <div style={{ width:6, height:6, borderRadius:"50%", background: qbConnected ? ACCENT2 : AMBER, flexShrink:0 }}/>
                }
                <span style={{ fontSize:11, fontFamily:"'DM Sans',sans-serif", color: qbConnected ? ACCENT2 : AMBER }}>
                  {syncing ? "Syncing…" : qbConnected ? "QuickBooks" : "Not connected"}
                </span>
              </div>
              {qbConnected && !syncing && (
                <span onClick={() => triggerSync(session?.user?.id)}
                  style={{ fontSize:10, color:SIDEBAR_DIM, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", textDecoration:"underline" }}>sync</span>
              )}
            </div>
            {qbConnected && !syncing && (
              <div style={{ fontSize:10, color:SIDEBAR_DIM, fontFamily:"'DM Sans',sans-serif", marginTop:5, paddingLeft:13, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ opacity:0.7 }}>{dataSource === 'live' ? "Live data" : "Demo data"}</span>
                <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:2, cursor:"pointer", opacity:0.6, transition:"opacity 0.15s" }}
                  onClick={() => { setVendorSetupIsFirstRun(false); setShowVendorSetup(true); }}
                  onMouseOver={e => e.currentTarget.style.opacity="1"}
                  onMouseOut={e => e.currentTarget.style.opacity="0.6"}>
                  {ICONS.gear}
                </span>
              </div>
            )}
            {qbConnected && !(vendorRules||[]).some(r=>r.rule_type==='tracked') && (
              <div style={{ fontSize:10, color:AMBER, fontFamily:"'DM Sans',sans-serif", marginTop:4, paddingLeft:13 }}>
                <span onClick={() => { setVendorSetupIsFirstRun(false); setShowVendorSetup(true); }}
                  style={{ cursor:"pointer", textDecoration:"underline" }}>Set up vendor tracking</span>
              </div>
            )}
          </div>
        )}
        {/* User + controls */}
        <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(245,239,227,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600, color:"#F5EFE3", flexShrink:0 }}>
            {(contractorName||"U")[0].toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontFamily:"'DM Sans',sans-serif", color:"#F5EFE3", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{contractorName}</div>
          </div>
          <button className="help-btn" onClick={()=>setShowTutorial(true)} title="Open tutorial" aria-label="Open tutorial" style={{ width:26, height:26, fontSize:11, flexShrink:0, background:"rgba(255,255,255,0.07)", borderColor:"rgba(255,255,255,0.12)", color:SIDEBAR_TEXT }}>?</button>
          <button onClick={handleSignOut} aria-label="Sign out" style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, color:SIDEBAR_DIM, fontFamily:"'DM Sans',sans-serif", padding:0, flexShrink:0 }}>Out</button>
        </div>
      </div>

      {/* ── Right content wrapper ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, position:"relative" }}>

      {/* ── App-level toast ── */}
      {appToast && (
        <div style={{ position:"fixed", bottom:32, left:"50%", transform:"translateX(-50%)", zIndex:900, background:DARK, color:"#F5EFE3", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, padding:"11px 22px", borderRadius:7, boxShadow:"0 6px 24px rgba(44,36,22,0.22)", border:`1.5px solid ${appToast.color}`, display:"flex", alignItems:"center", gap:10, animation:"slideIn 0.2s ease", pointerEvents:"none" }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:appToast.color, flexShrink:0 }}/>
          {appToast.msg}
        </div>
      )}

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
        <div style={{ background: syncError ? "rgba(180,60,60,0.06)" : "rgba(92,122,90,0.06)", borderBottom:`1px solid ${syncError ? "rgba(180,60,60,0.25)" : "rgba(92,122,90,0.25)"}`, padding:"11px 36px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {syncing
              ? <span className="spinner"/>
              : <div style={{ width:6, height:6, borderRadius:"50%", background: syncError ? RED : ACCENT2 }}/>
            }
            <div style={{ fontSize:13, color: syncError ? RED : ACCENT2, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
              {syncing
                ? "Syncing your QuickBooks data — this may take a minute for large accounts…"
                : syncError
                  ? syncError
                  : "QuickBooks connected — click to load your real data"}
            </div>
          </div>
          {!syncing && (
            <button className="btn act" style={{ fontSize:11 }} onClick={() => triggerSync(session.user.id)}>
              {syncError ? "Retry Sync →" : "Sync Now →"}
            </button>
          )}
        </div>
      )}

      {/* ── Post-sync nudge banner ── */}
      {syncNudge && (
        <div style={{ background:"rgba(92,122,90,0.06)",borderBottom:`1px solid rgba(92,122,90,0.25)`,padding:"11px 36px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ fontSize:13,color:ACCENT2,fontFamily:"'DM Sans',sans-serif",fontWeight:500 }}>
            Sync complete — {syncNudge.auto > 0 ? `${syncNudge.auto} auto-matched` : ""}{syncNudge.auto > 0 && (syncNudge.suggested > 0 || syncNudge.needs_attention > 0) ? ", " : ""}{syncNudge.suggested > 0 ? `${syncNudge.suggested} need confirmation` : ""}{syncNudge.suggested > 0 && syncNudge.needs_attention > 0 ? ", " : ""}{syncNudge.needs_attention > 0 ? `${syncNudge.needs_attention} need attention` : ""}
          </div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <button className="btn act" style={{ fontSize:11 }} onClick={()=>{setTab("inbox");setSyncNudge(null);}}>Review Now →</button>
            <button onClick={()=>setSyncNudge(null)} style={{ background:"none",border:"none",cursor:"pointer",color:DIM,fontSize:16,padding:"0 4px" }}>×</button>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex:1 }}>
        {tab==="dashboard" && <Dashboard onJobClick={handleJobClick} onEstimate={()=>setTab("estimator")} onJumpToInbox={()=>setTab("inbox")} onClientClick={()=>setTab("clients")} jobSummaries={jobSummaries} untagged={[...untagged, ...(suggested||[])]} overhead={overhead} dismissed={dismissed} qbConnected={qbConnected} userId={session?.user?.id} clientType={clientType} dateRange={dateRange} setDateRange={setDateRange} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} revenueGoal={revenueGoal} onSetRevenueGoal={()=>setShowGoalModal(true)}/>}
        {showGoalModal && <RevenueGoalModal currentGoal={revenueGoal} onSave={setRevenueGoal} onClose={()=>setShowGoalModal(false)}/>}
        {tab==="inbox"     && <SyncReview autoMatched={autoMatched} suggested={suggested} untagged={untagged} allTagged={allTagged} overhead={overhead} dismissed={dismissed} jobSummaries={jobSummaries} vendorRules={vendorRules} onConfirmSuggestion={handleConfirmSuggestion} onTag={handleTag} onMarkOverhead={handleMarkOverhead} onDismiss={handleDismiss} onRestore={handleRestore} onRetag={handleRetag} onUndoAutoMatch={handleUndoAutoMatch} onSaveVendorRule={handleSaveVendorRule} onAddExpense={handleAddExpense} dateRange={dateRange} setDateRange={setDateRange} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd}/>}
        {tab==="detail"    && <JobDetail job={selectedJob} onBack={()=>setTab("dashboard")} untagged={untagged} onJumpToInbox={clientType==="quickbooks"?()=>setTab("inbox"):null} onAddLabor={handleAddLabor} onDeleteLabor={handleDeleteLabor} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} onAddRevenue={handleAddRevenue} onDeleteRevenue={handleDeleteRevenue} jobSummaries={jobSummaries} onJobClick={handleJobClick}/>}
        {tab==="clients"   && <ClientScorecard jobSummaries={jobSummaries}/>}
        {tab==="estimator" && <JobEstimator jobSummaries={jobSummaries} userId={session?.user?.id} contractorName={contractorName}/>}
        {tab==="reports"   && <Reports jobSummaries={jobSummaries}/>}
        {tab==="chat"      && <AIChat jobSummaries={jobSummaries}/>}
        {tab==="raw"       && <RawData jobSummaries={jobSummaries} dataSource={dataSource}/>}
      </div>

      {/* ── Persistent footer disclaimer ── */}
      <div style={{ borderTop:`1px solid ${BORDER}`, padding:"14px 36px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8, background:CARD }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM, lineHeight:1.6, display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:4, height:4, borderRadius:"50%", background:BORDER, flexShrink:0 }}/>
          Figures sourced from QuickBooks Online. Not financial advice.
          <span style={{ color:ACCENT, cursor:"pointer" }} onClick={() => setShowDisclaimer(true)}>Full notice</span>
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:DIM }}>
          <a href="mailto:support@canopybi.com" style={{ color:DIM, textDecoration:"none" }}>support@canopybi.com</a>
        </div>
      </div>

      </div>{/* ── end right content wrapper ── */}
    </div>
  );
}
