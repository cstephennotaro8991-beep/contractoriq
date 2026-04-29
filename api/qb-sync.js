// api/qb-sync.js
// Fetches data from QuickBooks API and writes it to Supabase.
// Decrypts stored OAuth tokens before use.

import { createClient } from '@supabase/supabase-js';
import { decrypt, encrypt } from './_encrypt.js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── QB API helper ─────────────────────────────────────────────────────────────

const QB_PAGE_SIZE = 1000;
const MAX_RETRIES  = 3;
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

async function qbFetchPage(realmId, accessToken, entity, conditions, startPosition) {
  const baseUrl = process.env.QB_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';

  const whereClause = conditions ? ` WHERE ${conditions}` : '';
  const query = `SELECT * FROM ${entity}${whereClause} STARTPOSITION ${startPosition} MAXRESULTS ${QB_PAGE_SIZE}`;
  const url = `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, { // eslint-disable-line no-await-in-loop
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      }
    });

    const tid = res.headers.get('intuit_tid');

    if (res.ok) {
      const data = await res.json(); // eslint-disable-line no-await-in-loop
      return data.QueryResponse;
    }

    const text = await res.text(); // eslint-disable-line no-await-in-loop

    // Auth errors won't resolve on retry — fail immediately
    if (res.status === 401 || res.status === 403) {
      throw new Error(`QB API error ${res.status} (tid: ${tid}): ${text.slice(0, 200)}`);
    }

    // Retry on transient errors with exponential backoff
    if (RETRY_STATUSES.has(res.status) && attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 500;
      console.warn(`QB API ${res.status} on attempt ${attempt} (tid: ${tid}) — retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay)); // eslint-disable-line no-await-in-loop
      continue;
    }

    throw new Error(`QB API error ${res.status} (tid: ${tid}): ${text.slice(0, 200)}`);
  }
}

// Fetches all pages for a given entity, handling QB's 1,000-record limit
async function qbQuery(realmId, accessToken, entity, conditions = '') {
  const allRecords = [];
  let startPosition = 1;

  while (true) { // eslint-disable-line no-constant-condition
    const page = await qbFetchPage(realmId, accessToken, entity, conditions, startPosition); // eslint-disable-line no-await-in-loop
    const records = page?.[entity] || [];
    allRecords.push(...records);

    // If fewer than a full page returned, we've reached the end
    if (records.length < QB_PAGE_SIZE) break;

    startPosition += QB_PAGE_SIZE;
    console.log(`${entity}: fetched ${allRecords.length} records so far, fetching next page...`);
  }

  return { [entity]: allRecords };
}

// ── Token refresh helper ──────────────────────────────────────────────────────

async function refreshTokenIfNeeded(contractor) {
  const expiry = new Date(contractor.qb_token_expiry);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  // Decrypt the stored access token
  const currentAccessToken = decrypt(contractor.qb_access_token);

  if (expiry > fiveMinutesFromNow) {
    return currentAccessToken;
  }

  // Token is expiring — refresh it
  const credentials = Buffer.from(
    `${process.env.REACT_APP_QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
  ).toString('base64');

  const tokenRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'Accept':        'application/json',
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: decrypt(contractor.qb_refresh_token),
    }),
  });

  const tokens = await tokenRes.json();

  if (tokens.error === 'invalid_grant') {
    // Refresh token is expired or revoked — wipe QB connection so user must reconnect
    await supabase
      .from('contractors')
      .update({
        qb_access_token:  null,
        qb_refresh_token: null,
        qb_token_expiry:  null,
        qb_realm_id:      null,
      })
      .eq('id', contractor.id);
    throw new Error('QB_DISCONNECTED');
  }

  if (!tokens.access_token) {
    throw new Error('Token refresh failed');
  }

  const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Re-encrypt and save new tokens
  await supabase
    .from('contractors')
    .update({
      qb_access_token:  encrypt(tokens.access_token),
      qb_refresh_token: encrypt(tokens.refresh_token || decrypt(contractor.qb_refresh_token)),
      qb_token_expiry:  newExpiry,
    })
    .eq('id', contractor.id);

  return tokens.access_token;
}

// ── Job type guesser ──────────────────────────────────────────────────────────

function guessJobType(name) {
  const n = name.toLowerCase();
  // Flooring
  if (n.includes('floor') || n.includes('hardwood') || n.includes('tile') ||
      n.includes('carpet') || n.includes('vinyl') || n.includes('laminate') ||
      n.includes('epoxy') || n.includes('subfloor')) return 'Flooring';
  // Remodel / Renovation
  if (n.includes('kitchen') || n.includes('remodel') || n.includes('reno') ||
      n.includes('renovation') || n.includes('retrofit')) return 'Remodel';
  // Additions / Framing
  if (n.includes('bath') || n.includes('addition') || n.includes('framing') ||
      n.includes('frame')) return 'Addition';
  // Roofing
  if (n.includes('roof') || n.includes('shingle') || n.includes('gutter')) return 'Roofing';
  // Exterior / Decks
  if (n.includes('deck') || n.includes('patio') || n.includes('fence') ||
      n.includes('siding') || n.includes('exterior')) return 'Exterior';
  // Structural / Foundation
  if (n.includes('foundation') || n.includes('structural') || n.includes('concrete') ||
      n.includes('masonry') || n.includes('basement')) return 'Structural';
  // Commercial
  if (n.includes('commercial') || n.includes('office') || n.includes('retail') ||
      n.includes('warehouse') || n.includes('tenant')) return 'Commercial';
  // Painting
  if (n.includes('paint') || n.includes('stain') || n.includes('drywall') ||
      n.includes('plaster')) return 'Painting';
  // HVAC / Mechanical
  if (n.includes('hvac') || n.includes('heat') || n.includes('cool') ||
      n.includes('duct') || n.includes('ventil')) return 'HVAC';
  // Electrical
  if (n.includes('electric') || n.includes('wiring') || n.includes('panel') ||
      n.includes('lighting')) return 'Electrical';
  // Plumbing
  if (n.includes('plumb') || n.includes('pipe') || n.includes('drain') ||
      n.includes('water') || n.includes('sewer')) return 'Plumbing';
  // Landscaping
  if (n.includes('landscape') || n.includes('lawn') || n.includes('garden') ||
      n.includes('irrigation') || n.includes('tree')) return 'Landscaping';
  // Cleaning
  if (n.includes('clean') || n.includes('janitorial') || n.includes('maid')) return 'Cleaning';
  // IT / Tech
  if (n.includes('software') || n.includes('it ') || n.includes('tech') ||
      n.includes('network') || n.includes('server')) return 'IT Services';
  // Consulting / Professional Services
  if (n.includes('consult') || n.includes('advisory') || n.includes('audit') ||
      n.includes('assess') || n.includes('review')) return 'Consulting';
  return 'General';
}

// ── Matching engine ──────────────────────────────────────────────────────────
// Scores each inbox item against vendor history and active jobs to determine
// confidence tier: auto (>=0.80), suggested (0.40–0.79), needs_attention (<0.40).
// Also applies vendor rules (overhead/dismiss) before scoring.

async function matchExpenses(inboxItems, userId, jobMap, transactionsToUpsert) {
  if (inboxItems.length === 0) return { matched: [], autoMatchedTxns: [] };

  // 1. Fetch vendor rules (overhead, dismiss, job_cost) — one query
  const { data: vendorRulesData } = await supabase
    .from('vendor_rules')
    .select('vendor_name, rule_type')
    .eq('contractor_id', userId);

  const ruleMap = {};
  (vendorRulesData || []).forEach(r => { ruleMap[r.vendor_name] = r.rule_type; });

  // 2. Fetch ALL existing tagged transactions for this contractor — vendor history
  //    Single bulk query, then group by vendor → job_id counts
  const { data: taggedTxns } = await supabase
    .from('transactions')
    .select('vendor, job_id')
    .eq('contractor_id', userId)
    .eq('type', 'expense')
    .not('vendor', 'is', null);

  const vendorHistory = {}; // vendor → { jobId: count, ... }
  (taggedTxns || []).forEach(t => {
    if (!vendorHistory[t.vendor]) vendorHistory[t.vendor] = {};
    vendorHistory[t.vendor][t.job_id] = (vendorHistory[t.vendor][t.job_id] || 0) + 1;
  });

  // Also count any QB-tagged transactions from this sync (transactionsToUpsert)
  // so first-sync data gets vendor history signal too
  transactionsToUpsert.forEach(t => {
    if (!t.vendor || t.type !== 'expense') return;
    if (!vendorHistory[t.vendor]) vendorHistory[t.vendor] = {};
    vendorHistory[t.vendor][t.job_id] = (vendorHistory[t.vendor][t.job_id] || 0) + 1;
  });

  // 3. Count active jobs (status = 'In Progress') for date overlap signal
  const activeJobIds = Object.values(jobMap).filter(j => j.status === 'In Progress').map(j => j.id);
  const onlyOneActiveJob = activeJobIds.length === 1 ? activeJobIds[0] : null;

  // 4. Fetch already-existing inbox items so we don't re-score items the user already handled
  const { data: existingInbox } = await supabase
    .from('inbox_tags')
    .select('id, status')
    .eq('contractor_id', userId)
    .in('id', inboxItems.map(i => i.id));

  const existingStatusMap = {};
  (existingInbox || []).forEach(r => { existingStatusMap[r.id] = r.status; });

  // 5. Score each item
  const matched = [];
  const autoMatchedTxns = [];

  for (const item of inboxItems) {
    // Skip items the user has already acted on (tagged, overhead, dismissed, etc.)
    const existingStatus = existingStatusMap[item.id];
    if (existingStatus && existingStatus !== 'pending' && existingStatus !== 'suggested' && existingStatus !== 'auto_matched') {
      continue; // user already handled this — don't overwrite
    }

    const vendor = item.vendor;
    const rule   = ruleMap[vendor];

    // Apply vendor rules first — overhead and dismiss skip scoring entirely
    if (rule === 'overhead') {
      matched.push({ ...item, status: 'overhead', confidence: null, match_tier: null, match_reason: `Vendor rule: ${vendor} is a fixed cost`, matched_by: 'rule' });
      continue;
    }
    if (rule === 'dismiss') {
      matched.push({ ...item, status: 'dismissed', confidence: null, match_tier: null, match_reason: `Vendor rule: ${vendor} is dismissed`, matched_by: 'rule' });
      continue;
    }

    // Score: vendor history
    let confidence = 0;
    let bestJobId  = null;
    let reason     = '';

    const history = vendorHistory[vendor];
    if (history) {
      const total   = Object.values(history).reduce((s, c) => s + c, 0);
      const entries = Object.entries(history).sort((a, b) => b[1] - a[1]);
      const [topJobId, topCount] = entries[0];
      const topPct = total > 0 ? topCount / total : 0;

      if (topPct >= 0.80 && total >= 2) {
        // Strong vendor history: 80%+ of expenses went to one job, with at least 2 data points
        confidence = 0.70 + (topPct * 0.20); // 0.86–0.90
        bestJobId  = topJobId;
        reason     = `${topCount} of ${total} ${vendor} expenses → this job`;
      } else if (topPct >= 0.60 && total >= 2) {
        // Moderate vendor history
        confidence = 0.40 + (topPct * 0.25); // 0.55–0.65
        bestJobId  = topJobId;
        reason     = `${topCount} of ${total} ${vendor} expenses → this job`;
      } else if (total >= 1) {
        // Weak / split history
        confidence = 0.15 + (topPct * 0.15); // 0.15–0.30
        bestJobId  = topJobId;
        reason     = `${vendor} has expenses across ${entries.length} jobs`;
      }
    }

    // Boost: job_cost vendor rule means user confirmed this vendor is job-related
    if (rule === 'job_cost' && confidence > 0) {
      confidence = Math.min(confidence + 0.10, 0.99);
      reason += ' · vendor marked as job cost';
    }

    // Boost: only one active job — mild signal
    if (onlyOneActiveJob && (!bestJobId || bestJobId === onlyOneActiveJob)) {
      confidence = Math.min(confidence + 0.15, 0.99);
      bestJobId  = bestJobId || onlyOneActiveJob;
      if (!reason) reason = 'Only active job at time of sync';
      else reason += ' · only active job';
    }

    // Determine tier
    let tier, status;
    if (confidence >= 0.80 && bestJobId) {
      tier   = 'auto';
      status = 'auto_matched';
    } else if (confidence >= 0.40 && bestJobId) {
      tier   = 'suggested';
      status = 'suggested';
    } else {
      tier   = 'needs_attention';
      status = 'pending';
    }

    matched.push({
      ...item,
      status,
      suggested_job_id:  bestJobId,
      suggestion_reason: reason || null,
      tagged_job_id:     status === 'auto_matched' ? bestJobId : null,
      confidence:        confidence > 0 ? parseFloat(confidence.toFixed(2)) : null,
      match_tier:        tier,
      match_reason:      reason || null,
      matched_by:        confidence > 0 ? 'rule' : null,
    });

    // Auto-matched items also get a transaction row so they show in job costs.
    // ID uses same pattern as handleTag in App.js: `{userId}_inbox_{item.id}`
    if (status === 'auto_matched' && bestJobId) {
      autoMatchedTxns.push({
        id:            `${userId}_automatch_${item.id}`,
        contractor_id: userId,
        job_id:        bestJobId,
        type:          'expense',
        doc_number:    item.doc_number,
        txn_date:      item.txn_date,
        amount:        item.amount,
        description:   item.description,
        vendor:        item.vendor,
      });
    }
  }

  return { matched, autoMatchedTxns };
}

// ── Main sync handler ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Fetch contractor record
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('*')
      .eq('id', userId)
      .single();

    if (contractorError || !contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    if (!contractor.qb_realm_id || !contractor.qb_access_token) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    // Decrypt realmId and refresh/get access token
    const realmId     = decrypt(contractor.qb_realm_id);
    const accessToken = await refreshTokenIfNeeded(contractor);

    console.log(`Syncing QB data for contractor — realm decrypted successfully`);

    // Fetch from QuickBooks
    const [customerResponse, invoiceResponse, salesReceiptResponse, creditMemoResponse, purchaseResponse, billResponse] = await Promise.all([
      qbQuery(realmId, accessToken, 'Customer'),
      qbQuery(realmId, accessToken, 'Invoice'),
      qbQuery(realmId, accessToken, 'SalesReceipt'),
      qbQuery(realmId, accessToken, 'CreditMemo'),
      qbQuery(realmId, accessToken, 'Purchase'),
      qbQuery(realmId, accessToken, 'Bill'),
    ]);

    const customers     = customerResponse?.Customer        || [];
    const invoices      = invoiceResponse?.Invoice          || [];
    const salesReceipts = salesReceiptResponse?.SalesReceipt || [];
    const creditMemos   = creditMemoResponse?.CreditMemo    || [];
    const purchases     = purchaseResponse?.Purchase        || [];
    const bills         = billResponse?.Bill                || [];

    // Fetch tracked vendor rules from Supabase.
    // If the user has set up tracked vendors, only expenses from those vendors are processed.
    // If no tracked vendors exist yet (first sync / setup not done), everything is processed
    // so the VendorSetup modal has data to work with.
    const { data: trackedRules } = await supabase
      .from('vendor_rules')
      .select('vendor_name')
      .eq('contractor_id', userId)
      .eq('rule_type', 'tracked');

    const trackedVendors = trackedRules && trackedRules.length > 0
      ? new Set(trackedRules.map(r => r.vendor_name))
      : null; // null = no filter active (first run)

    console.log(`QB fetch complete: ${customers.length} customers, ${invoices.length} invoices, ${salesReceipts.length} sales receipts, ${creditMemos.length} credit memos, ${purchases.length} purchases, ${bills.length} bills${trackedVendors ? ` · vendor filter active (${trackedVendors.size} tracked)` : ' · no vendor filter (first sync)'}`);

    // Build client map and jobs
    // Supports two QB patterns:
    //   1. Parent/child: parent = client, sub-customers = jobs (contractors)
    //   2. Flat: each top-level customer IS the job (service businesses)
    const clientMap    = {};
    const jobMap       = {};
    const jobsToUpsert = [];

    // First pass: identify which customers are parents (have children)
    const parentIds = new Set();
    customers.forEach(c => {
      if (c.ParentRef) parentIds.add(c.ParentRef.value);
    });

    // Second pass: build client map
    customers.forEach(c => {
      if (!c.ParentRef) clientMap[c.Id] = c.DisplayName || c.FullyQualifiedName;
    });

    // Fetch existing jobs so we don't overwrite user-set job types on re-sync
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('id, job_type')
      .eq('contractor_id', userId);

    const existingJobTypes = {};
    (existingJobs || []).forEach(j => { existingJobTypes[j.id] = j.job_type; });

    // Third pass: build jobs
    customers.forEach(c => {
      if (c.ParentRef) {
        // Sub-customer → job under a parent client (contractor pattern)
        const clientName = clientMap[c.ParentRef.value] || '';
        const jobId      = `${userId}_${c.Id}`;
        const jobRecord  = {
          id:            jobId,
          contractor_id: userId,
          qb_job_id:     c.Id,
          name:          c.DisplayName || c.FullyQualifiedName,
          client_name:   clientName,
          job_type:      existingJobTypes[jobId] || guessJobType(c.DisplayName || ''),
          status:        c.Active ? 'In Progress' : 'Complete',
        };
        jobsToUpsert.push(jobRecord);
        jobMap[c.Id] = jobRecord;
      } else if (!parentIds.has(c.Id)) {
        // Top-level customer with no children → customer IS the job (service biz pattern)
        const displayName = c.DisplayName || c.FullyQualifiedName;
        const jobId       = `${userId}_${c.Id}`;
        const jobRecord  = {
          id:            jobId,
          contractor_id: userId,
          qb_job_id:     c.Id,
          name:          displayName,
          client_name:   displayName,
          job_type:      existingJobTypes[jobId] || guessJobType(displayName || ''),
          status:        c.Active ? 'In Progress' : 'Complete',
        };
        jobsToUpsert.push(jobRecord);
        jobMap[c.Id] = jobRecord;
      }
      // else: parent with children — stays in clientMap only, children are the jobs
    });

    if (jobsToUpsert.length > 0) {
      const { error: jobError } = await supabase
        .from('jobs')
        .upsert(jobsToUpsert, { onConflict: 'id' });
      if (jobError) console.error('Jobs upsert error:', jobError.message);
    }

    // Build transactions from invoices
    const transactionsToUpsert = [];
    let purCounter = 1;

    invoices.forEach(inv => {
      const qbJobId = inv.CustomerRef?.value;
      const job     = jobMap[qbJobId];
      if (!job) return;

      transactionsToUpsert.push({
        id:            `${userId}_${inv.Id}`,
        contractor_id: userId,
        job_id:        job.id,
        type:          'revenue',
        doc_number:    inv.DocNumber || inv.Id,
        txn_date:      inv.TxnDate,
        amount:        inv.TotalAmt || 0,
        description:   inv.Line?.[0]?.Description || 'Invoice',
        vendor:        null,
      });
    });

    // Build transactions from sales receipts (cash/card sales without a formal invoice)
    salesReceipts.forEach(sr => {
      const qbJobId = sr.CustomerRef?.value;
      const job     = jobMap[qbJobId];
      if (!job) return;

      transactionsToUpsert.push({
        id:            `${userId}_sr_${sr.Id}`,
        contractor_id: userId,
        job_id:        job.id,
        type:          'revenue',
        doc_number:    sr.DocNumber || sr.Id,
        txn_date:      sr.TxnDate,
        amount:        sr.TotalAmt || 0,
        description:   sr.Line?.[0]?.Description || 'Sales Receipt',
        vendor:        null,
      });
    });

    // Build transactions from credit memos (refunds/credits that reduce revenue)
    creditMemos.forEach(cm => {
      const qbJobId = cm.CustomerRef?.value;
      const job     = jobMap[qbJobId];
      if (!job) return;

      transactionsToUpsert.push({
        id:            `${userId}_cm_${cm.Id}`,
        contractor_id: userId,
        job_id:        job.id,
        type:          'revenue',
        doc_number:    cm.DocNumber || cm.Id,
        txn_date:      cm.TxnDate,
        amount:        -(cm.TotalAmt || 0),  // Negative — reduces job revenue
        description:   cm.Line?.[0]?.Description || 'Credit Memo',
        vendor:        null,
      });
    });

    // Build transactions from purchases
    const inboxToUpsert = [];

    purchases.forEach(p => {
      const vendorName = p.EntityRef?.name || 'Unknown Vendor';

      // If tracked vendors are configured, skip anything not on the list
      if (trackedVendors && !trackedVendors.has(vendorName)) return;

      const lines = p.Line || [];
      if (lines.length === 0) return;
      let hasTaggedLine = false;

      // Header-level CustomerRef fallback (used when all lines belong to one job)
      const headerJobId = p.CustomerRef?.value;

      lines.forEach(line => {
        // QB uses AccountBasedExpenseLineDetail for account-coded expenses,
        // ItemBasedExpenseLineDetail for item/service-coded expenses.
        // Fall back to the purchase header CustomerRef if neither line detail has one.
        const qbJobId = line.AccountBasedExpenseLineDetail?.CustomerRef?.value
                     || line.ItemBasedExpenseLineDetail?.CustomerRef?.value
                     || headerJobId;
        const amount  = line.Amount || 0;
        if (amount <= 0) return;

        if (qbJobId && jobMap[qbJobId]) {
          hasTaggedLine = true;
          transactionsToUpsert.push({
            id:            `${userId}_${p.Id}_${line.Id || purCounter++}`,
            contractor_id: userId,
            job_id:        jobMap[qbJobId].id,
            type:          'expense',
            doc_number:    p.DocNumber || p.Id,
            txn_date:      p.TxnDate,
            amount:        amount,
            description:   line.Description || 'Expense',
            vendor:        p.EntityRef?.name || 'Unknown Vendor',
          });
        }
      });

      if (!hasTaggedLine) {
        const totalAmt = p.TotalAmt || lines.reduce((s,l) => s + (l.Amount||0), 0);
        if (totalAmt > 0) {
          inboxToUpsert.push({
            id:                `${userId}_inbox_${p.Id}`,
            contractor_id:     userId,
            doc_number:        p.DocNumber || p.Id,
            vendor:            vendorName,
            txn_date:          p.TxnDate,
            amount:            totalAmt,
            description:       lines[0]?.Description || 'Untagged expense',
            payment_type:      p.PaymentType || 'Check',
            suggested_job_id:  null,
            suggestion_reason: null,
            tagged_job_id:     null,
            status:            'pending',
          });
        }
      }
    });

    // Build transactions from bills (vendor invoices entered with payment terms)
    let billCounter = 1;

    bills.forEach(b => {
      const billVendorName = b.VendorRef?.name || 'Unknown Vendor';

      // If tracked vendors are configured, skip anything not on the list
      if (trackedVendors && !trackedVendors.has(billVendorName)) return;

      const lines = b.Line || [];
      if (lines.length === 0) return;
      let hasTaggedLine = false;

      lines.forEach(line => {
        const qbJobId = line.AccountBasedExpenseLineDetail?.CustomerRef?.value
                     || line.ItemBasedExpenseLineDetail?.CustomerRef?.value;
        const amount  = line.Amount || 0;
        if (amount <= 0) return;

        if (qbJobId && jobMap[qbJobId]) {
          hasTaggedLine = true;
          transactionsToUpsert.push({
            id:            `${userId}_bill_${b.Id}_${line.Id || billCounter++}`,
            contractor_id: userId,
            job_id:        jobMap[qbJobId].id,
            type:          'expense',
            doc_number:    b.DocNumber || b.Id,
            txn_date:      b.TxnDate,
            amount:        amount,
            description:   line.Description || 'Bill expense',
            vendor:        billVendorName,
          });
        }
      });

      if (!hasTaggedLine) {
        const totalAmt = b.TotalAmt || lines.reduce((s,l) => s + (l.Amount||0), 0);
        if (totalAmt > 0) {
          inboxToUpsert.push({
            id:                `${userId}_inbox_bill_${b.Id}`,
            contractor_id:     userId,
            doc_number:        b.DocNumber || b.Id,
            vendor:            billVendorName,
            txn_date:          b.TxnDate,
            amount:            totalAmt,
            description:       lines[0]?.Description || 'Untagged bill',
            payment_type:      'Bill',
            suggested_job_id:  null,
            suggestion_reason: null,
            tagged_job_id:     null,
            status:            'pending',
          });
        }
      }
    });

    if (transactionsToUpsert.length > 0) {
      const { error: txnError } = await supabase
        .from('transactions')
        .upsert(transactionsToUpsert, { onConflict: 'id' });
      if (txnError) console.error('Transactions upsert error:', txnError.message);
    }

    // ── Run matching engine on untagged inbox items ──────────────────────────
    // Scores each item by vendor history + active jobs + vendor rules,
    // assigns confidence tiers, and creates transaction rows for auto-matches.
    let matchSummary = { auto: 0, suggested: 0, needs_attention: 0, rule_applied: 0 };

    if (inboxToUpsert.length > 0) {
      const { matched, autoMatchedTxns } = await matchExpenses(
        inboxToUpsert, userId, jobMap, transactionsToUpsert
      );

      // Count tiers for summary
      matched.forEach(item => {
        if (item.status === 'auto_matched')  matchSummary.auto++;
        else if (item.status === 'suggested') matchSummary.suggested++;
        else if (item.status === 'pending')   matchSummary.needs_attention++;
        else matchSummary.rule_applied++; // overhead or dismissed by vendor rule
      });

      // Write scored inbox items — use ignoreDuplicates so we don't overwrite
      // items the user has already acted on from a previous sync
      if (matched.length > 0) {
        const { error: inboxError } = await supabase
          .from('inbox_tags')
          .upsert(matched, { onConflict: 'id', ignoreDuplicates: true });
        if (inboxError) console.error('Inbox upsert error:', inboxError.message);
      }

      // Write transaction rows for auto-matched items so they show in job costs
      if (autoMatchedTxns.length > 0) {
        const { error: autoTxnError } = await supabase
          .from('transactions')
          .upsert(autoMatchedTxns, { onConflict: 'id' });
        if (autoTxnError) console.error('Auto-match transactions upsert error:', autoTxnError.message);
      }

      console.log(`Matching complete: ${matchSummary.auto} auto, ${matchSummary.suggested} suggested, ${matchSummary.needs_attention} needs attention, ${matchSummary.rule_applied} rule-applied`);
    }

    await supabase
      .from('contractors')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', userId);

    const summary = {
      jobs:           jobsToUpsert.length,
      transactions:   transactionsToUpsert.length,
      invoices:       invoices.length,
      salesReceipts:  salesReceipts.length,
      creditMemos:    creditMemos.length,
      inbox:          inboxToUpsert.length,
      bills:          bills.length,
      matching:       matchSummary,
    };

    console.log('Sync complete:', JSON.stringify(summary));
    res.status(200).json({ success: true, summary });

  } catch (err) {
    console.error('Sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
