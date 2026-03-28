// api/qb-connect.js
// Initiates the QuickBooks OAuth flow.
// Generates a cryptographically random CSRF state token, stores it in Supabase
// with a 10-minute expiry, and passes it to Intuit as the OAuth state parameter.

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const clientId    = process.env.REACT_APP_QB_CLIENT_ID;
  const redirectUri = process.env.QB_REDIRECT_URI;
  const scopes      = 'com.intuit.quickbooks.accounting';

  // Generate a cryptographically random CSRF state token
  const state     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  const { error } = await supabase
    .from('oauth_states')
    .insert({ state, user_id: userId, expires_at: expiresAt });

  if (error) {
    console.error('Failed to store OAuth state:', error.message);
    return res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }

  const authUrl =
    `https://appcenter.intuit.com/connect/oauth2?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `state=${state}`;

  res.redirect(authUrl);
}
