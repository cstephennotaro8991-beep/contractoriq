// api/qb-disconnect.js
// Called by Intuit when a user disconnects Canopy from within QuickBooks,
// or directly from the app UI.
// Decrypts tokens before revoking with Intuit, then clears credentials from Supabase.

import { createClient } from '@supabase/supabase-js';
import { decrypt } from './_encrypt.js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const userId  = req.query.userId;
  const realmId = req.query.realmId || req.body?.realmId;

  if (!userId && !realmId) {
    return res.status(400).json({ error: 'userId or realmId is required' });
  }

  try {
    // Find contractor by userId or encrypted realmId
    let contractor = null;

    if (userId) {
      const { data } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', userId)
        .single();
      contractor = data;
    } else {
      // Intuit sends plain realmId — need to find by decrypting stored values
      const { data: all } = await supabase
        .from('contractors')
        .select('*')
        .not('qb_realm_id', 'is', null);

      contractor = (all || []).find(c => {
        try { return decrypt(c.qb_realm_id) === realmId; }
        catch { return false; }
      }) || null;
    }

    if (!contractor) {
      console.warn('Disconnect: contractor not found');
      return res.status(200).json({ success: true, note: 'contractor not found' });
    }

    // Revoke token with Intuit (best effort)
    if (contractor.qb_access_token) {
      try {
        const accessToken = decrypt(contractor.qb_access_token);
        const credentials = Buffer.from(
          `${process.env.REACT_APP_QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
        ).toString('base64');

        await fetch('https://developer.api.intuit.com/v2/oauth2/tokens/revoke', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type':  'application/json',
            'Accept':        'application/json',
          },
          body: JSON.stringify({ token: accessToken }),
        });
      } catch (revokeErr) {
        console.warn('Token revocation failed (non-fatal):', revokeErr.message);
      }
    }

    // Clear all QB credentials from Supabase
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
      console.error('Failed to clear QB credentials:', updateError.message);
      return res.status(500).json({ error: 'Failed to clear credentials' });
    }

    console.log('QB disconnected successfully for contractor');

    if (req.query.redirect === 'true') {
      return res.redirect('https://app.canopybi.com?qb_disconnected=true');
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Disconnect error:', err.message);
    return res.status(200).json({ success: false, error: err.message });
  }
}
