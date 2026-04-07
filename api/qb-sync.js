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
    const [customerResponse, invoiceResponse, purchaseResponse] = await Promise.all([
      qbQuery(realmId, accessToken, 'Customer'),
      qbQuery(realmId, accessToken, 'Invoice'),
      qbQuery(realmId, accessToken, 'Purchase'),
    ]);

    const customers  = customerResponse?.Customer  || [];
    const invoices   = invoiceResponse?.Invoice    || [];
    const purchases  = purchaseResponse?.Purchase  || [];

    console.log(`QB fetch complete: ${customers.length} customers, ${invoices.length} invoices, ${purchases.length} purchases`);

    // Build client map and jobs
    const clientMap    = {};
    const jobMap       = {};
    const jobsToUpsert = [];

    customers.forEach(c => {
      if (!c.Job) clientMap[c.Id] = c.DisplayName || c.FullyQualifiedName;
    });

    customers.forEach(c => {
      if (c.Job && c.ParentRef) {
        const clientName = clientMap[c.ParentRef.value] || '';
        const jobRecord  = {
          id:            `${userId}_${c.Id}`,
          contractor_id: userId,
          qb_job_id:     c.Id,
          name:          c.DisplayName || c.FullyQualifiedName,
          client_name:   clientName,
          job_type:      guessJobType(c.DisplayName || ''),
          status:        c.Active ? 'In Progress' : 'Complete',
        };
        jobsToUpsert.push(jobRecord);
        jobMap[c.Id] = jobRecord;
      }
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

    // Build transactions from purchases
    const inboxToUpsert = [];

    purchases.forEach(p => {
      const lines = p.Line || [];
      let hasTaggedLine = false;

      lines.forEach(line => {
        const qbJobId = line.AccountBasedExpenseLineDetail?.CustomerRef?.value;
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
            vendor:            p.EntityRef?.name || 'Unknown Vendor',
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

    if (transactionsToUpsert.length > 0) {
      const { error: txnError } = await supabase
        .from('transactions')
        .upsert(transactionsToUpsert, { onConflict: 'id' });
      if (txnError) console.error('Transactions upsert error:', txnError.message);
    }

    if (inboxToUpsert.length > 0) {
      const { error: inboxError } = await supabase
        .from('inbox_tags')
        .upsert(inboxToUpsert, { onConflict: 'id', ignoreDuplicates: true });
      if (inboxError) console.error('Inbox upsert error:', inboxError.message);
    }

    await supabase
      .from('contractors')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', userId);

    const summary = {
      jobs:         jobsToUpsert.length,
      transactions: transactionsToUpsert.length,
      inbox:        inboxToUpsert.length,
    };

    console.log('Sync complete:', JSON.stringify(summary));
    res.status(200).json({ success: true, summary });

  } catch (err) {
    console.error('Sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
