// api/qb-callback.js
// Exchanges the OAuth authorization code for tokens, encrypts them,
// and stores them in Supabase.

import { createClient } from '@supabase/supabase-js';
import { encrypt } from './_encrypt.js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { code, state, realmId, error } = req.query;

  if (error) return res.redirect('https://app.canopybi.com?qb_error=access_denied');
  if (!code || !realmId) return res.redirect('https://app.canopybi.com?qb_error=missing_params');

  try {
    // Exchange authorization code for tokens
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
        grant_type:   'authorization_code',
        code,
        redirect_uri: process.env.QB_REDIRECT_URI,
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error('Token exchange failed — no access token returned');
      return res.redirect('https://app.canopybi.com?qb_error=token_exchange_failed');
    }

    const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Encrypt sensitive values before storing
    const encryptedAccessToken  = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);
    const encryptedRealmId      = encrypt(realmId);

    const { error: dbError } = await supabase
      .from('contractors')
      .update({
        qb_access_token:  encryptedAccessToken,
        qb_refresh_token: encryptedRefreshToken,
        qb_realm_id:      encryptedRealmId,
        qb_token_expiry:  expiry,
      })
      .eq('id', state);

    if (dbError) {
      console.error('Supabase update failed');
      return res.redirect('https://app.canopybi.com?qb_error=db_save_failed');
    }

    res.redirect('https://app.canopybi.com?qb_connected=true');

  } catch (err) {
    console.error('QB callback error:', err.message);
    res.redirect('https://app.canopybi.com?qb_error=server_error');
  }
}
