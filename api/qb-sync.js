// api/qb-sync.js
// Fetches data from QuickBooks API and writes it to Supabase
// Can be triggered manually (GET /api/qb-sync?userId=xxx) or automatically after OAuth connect

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── QB API helper ─────────────────────────────────────────────────────────────

async function qbQuery(realmId, accessToken, entity, conditions = '') {
  const query = conditions
    ? `SELECT * FROM ${entity} WHERE ${conditions}`
    : `SELECT * FROM ${entity}`;

  const baseUrl = process.env.QB_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';

  const url = `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QB API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.QueryResponse;
}

// ── Token refresh helper ──────────────────────────────────────────────────────

async function refreshTokenIfNeeded(contractor) {
  const expiry = new Date(contractor.qb_token_expiry);
  const now    = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // If token is still valid for more than 5 minutes, use it as-is
  if (expiry > fiveMinutesFromNow) {
    return contractor.qb_access_token;
  }

  // Refresh the token
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
      refresh_token: contractor.qb_refresh_token,
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.access_token) {
    throw new Error('Token refresh failed: ' + JSON.stringify(tokens));
  }

  // Save new tokens to Supabase
  const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await supabase
    .from('contractors')
    .update({
      qb_access_token:  tokens.access_token,
      qb_refresh_token: tokens.refresh_token || contractor.qb_refresh_token,
      qb_token_expiry:  newExpiry,
    })
    .eq('id', contractor.id);

  return tokens.access_token;
}

// ── Job type guesser ──────────────────────────────────────────────────────────

function guessJobType(name) {
  const n = name.toLowerCase();
  if (n.includes('floor') || n.includes('hardwood') || n.includes('tile') ||
      n.includes('carpet') || n.includes('vinyl') || n.includes('laminate')) return 'Flooring';
  if (n.includes('kitchen') || n.includes('remodel') || n.includes('reno'))  return 'Remodel';
  if (n.includes('bath') || n.includes('addition'))   return 'Addition';
  if (n.includes('roof'))                             return 'Roofing';
  if (n.includes('deck') || n.includes('patio'))      return 'Exterior';
  if (n.includes('foundation') || n.includes('structural')) return 'Structural';
  if (n.includes('commercial') || n.includes('office')) return 'Commercial';
  if (n.includes('paint'))                            return 'Painting';
  return 'General Construction';
}

// ── Main sync handler ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // 1. Fetch contractor record from Supabase
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('*')
      .eq('id', userId)
      .single();

    if (contractorError || !contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    if (!contractor.qb_realm_id || !contractor.qb_access_token) {
      return res.status(400).json({ error: 'QuickBooks not connected for this contractor' });
    }

    // 2. Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(contractor);
    const realmId     = contractor.qb_realm_id;

    // 3. Fetch all data from QuickBooks
    console.log(`Syncing QB data for contractor ${userId}, realm ${realmId}`);

    const [customerResponse, invoiceResponse, purchaseResponse] = await Promise.all([
      qbQuery(realmId, accessToken, 'Customer'),
      qbQuery(realmId, accessToken, 'Invoice'),
      qbQuery(realmId, accessToken, 'Purchase'),
    ]);

    const customers  = customerResponse?.Customer  || [];
    const invoices   = invoiceResponse?.Invoice    || [];
    const purchases  = purchaseResponse?.Purchase  || [];

    console.log(`Fetched: ${customers.length} customers, ${invoices.length} invoices, ${purchases.length} purchases`);

    // 4. Build client ID map (parent customers)
    const clientMap  = {};  // QB customer Id → display name
    const jobMap     = {};  // QB job Id → job record
    const jobsToUpsert = [];

    customers.forEach(c => {
      if (!c.Job) {
        // Parent client
        clientMap[c.Id] = c.DisplayName || c.FullyQualifiedName;
      }
    });

    customers.forEach(c => {
      if (c.Job && c.ParentRef) {
        const clientName = clientMap[c.ParentRef.value] || '';
        const jobRecord = {
          id:             `${userId}_${c.Id}`,
          contractor_id:  userId,
          qb_job_id:      c.Id,
          name:           c.DisplayName || c.FullyQualifiedName,
          client_name:    clientName,
          job_type:       guessJobType(c.DisplayName || ''),
          status:         c.Active ? 'In Progress' : 'Complete',
        };
        jobsToUpsert.push(jobRecord);
        jobMap[c.Id] = jobRecord;
      }
    });

    // 5. Upsert jobs into Supabase
    if (jobsToUpsert.length > 0) {
      const { error: jobError } = await supabase
        .from('jobs')
        .upsert(jobsToUpsert, { onConflict: 'id' });
      if (jobError) console.error('Jobs upsert error:', jobError);
    }

    // 6. Build transactions from invoices
    const transactionsToUpsert = [];
    const unbilledJobIds = new Set(jobsToUpsert.map(j => j.qb_job_id));

    invoices.forEach(inv => {
      const qbJobId = inv.CustomerRef?.value;
      const job     = jobMap[qbJobId];
      if (!job) return;

      unbilledJobIds.delete(qbJobId); // has at least one invoice

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

    // 7. Build transactions from purchases
    const inboxToUpsert = [];
    let   purCounter    = 1;

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

      // If no lines were tagged to a job — goes to Expense Inbox
      if (!hasTaggedLine) {
        const totalAmt = p.TotalAmt || lines.reduce((s, l) => s + (l.Amount || 0), 0);
        if (totalAmt > 0) {
          inboxToUpsert.push({
            id:               `${userId}_inbox_${p.Id}`,
            contractor_id:    userId,
            doc_number:       p.DocNumber || p.Id,
            vendor:           p.EntityRef?.name || 'Unknown Vendor',
            txn_date:         p.TxnDate,
            amount:           totalAmt,
            description:      lines[0]?.Description || 'Untagged expense',
            payment_type:     p.PaymentType || 'Check',
            suggested_job_id: null,
            suggestion_reason:null,
            tagged_job_id:    null,
            status:           'pending',
          });
        }
      }
    });

    // 8. Upsert transactions
    if (transactionsToUpsert.length > 0) {
      const { error: txnError } = await supabase
        .from('transactions')
        .upsert(transactionsToUpsert, { onConflict: 'id' });
      if (txnError) console.error('Transactions upsert error:', txnError);
    }

    // 9. Upsert inbox items (only insert new ones — don't overwrite tagged ones)
    if (inboxToUpsert.length > 0) {
      const { error: inboxError } = await supabase
        .from('inbox_tags')
        .upsert(inboxToUpsert, { onConflict: 'id', ignoreDuplicates: true });
      if (inboxError) console.error('Inbox upsert error:', inboxError);
    }

    // 10. Update last synced timestamp on contractor
    await supabase
      .from('contractors')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', userId);

    const summary = {
      jobs:         jobsToUpsert.length,
      transactions: transactionsToUpsert.length,
      inbox:        inboxToUpsert.length,
    };

    console.log('Sync complete:', summary);
    res.status(200).json({ success: true, summary });

  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: err.message });
  }
}
