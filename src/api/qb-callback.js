import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { code, state, realmId, error } = req.query;

  if (error) return res.redirect('https://app.canopybi.com?qb_error=access_denied');
  if (!code || !realmId) return res.redirect('https://app.canopybi.com?qb_error=missing_params');

  try {
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
      console.error('Token exchange failed:', tokens);
      return res.redirect('https://app.canopybi.com?qb_error=token_exchange_failed');
    }

    const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: dbError } = await supabase
      .from('contractors')
      .update({
        qb_access_token:  tokens.access_token,
        qb_refresh_token: tokens.refresh_token,
        qb_realm_id:      realmId,
        qb_token_expiry:  expiry,
      })
      .eq('id', state);

    if (dbError) {
      console.error('Supabase update failed:', dbError);
      return res.redirect('https://app.canopybi.com?qb_error=db_save_failed');
    }

    res.redirect('https://app.canopybi.com?qb_connected=true');

  } catch (err) {
    console.error('QB callback error:', err);
    res.redirect('https://app.canopybi.com?qb_error=server_error');
  }
}
