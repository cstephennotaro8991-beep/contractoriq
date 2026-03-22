// api/qb-disconnect.js
// Called by Intuit when a user disconnects Canopy from within QuickBooks.
// Also callable directly from the app to let a user disconnect from Canopy's UI.
//
// Intuit calls this endpoint with a POST containing the realmId (company ID).
// We look up the contractor by realmId, revoke the token with Intuit, and
// clear all QB credentials from Supabase.
//
// Disconnect URL to register with Intuit: https://app.canopybi.com/api/qb-disconnect

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Intuit sends a POST with realmId in the body.
  // Direct app calls can send either realmId or userId as a query param.
  const userId  = req.query.userId;
  const realmId = req.query.realmId || req.body?.realmId;

  if (!userId && !realmId) {
    return res.status(400).json({ error: 'userId or realmId is required' });
  }

  try {
    // 1. Find the contractor by userId or realmId
    let query = supabase.from('contractors').select('*');
    if (userId)  query = query.eq('id', userId);
    else         query = query.eq('qb_realm_id', realmId);

    const { data: contractor, error: lookupError } = await query.single();

    if (lookupError || !contractor) {
      // Intuit expects a 200 even if we can't find the user — log and return ok
      console.warn('Disconnect: contractor not found for', userId || realmId);
      return res.status(200).json({ success: true, note: 'contractor not found' });
    }

    // 2. Revoke the token with Intuit (best effort — don't fail if this errors)
    if (contractor.qb_access_token) {
      try {
        const credentials = Buffer.from(
          `${process.env.REACT_APP_QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
        ).toString('base64');

        await fetch('https://developer.api.intuit.com/v2/oauth2/tokens/revoke', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ token: contractor.qb_access_token }),
        });
      } catch (revokeErr) {
        // Non-fatal — we still want to clear the credentials from our side
        console.warn('Token revocation failed (non-fatal):', revokeErr.message);
      }
    }

    // 3. Clear all QB credentials from Supabase
    const { error: updateError } = await supabase
      .from('contractors')
      .update({
        qb_access_token:  null,
        qb_refresh_token: null,
        qb_realm_id:      null,
        qb_token_expiry:  null,
        last_synced_at:   null,
      })
      .eq('id', contractor.id);

    if (updateError) {
      console.error('Failed to clear QB credentials:', updateError);
      return res.status(500).json({ error: 'Failed to clear credentials' });
    }

    console.log(`QB disconnected for contractor ${contractor.id}`);

    // 4. Respond — Intuit expects 200, app calls can redirect
    if (req.query.redirect === 'true') {
      return res.redirect('https://app.canopybi.com?qb_disconnected=true');
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Disconnect error:', err);
    // Always return 200 to Intuit even on unexpected errors
    return res.status(200).json({ success: false, error: err.message });
  }
}
