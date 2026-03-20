export default function handler(req, res) {
  const clientId    = process.env.REACT_APP_QB_CLIENT_ID;
  const redirectUri = process.env.QB_REDIRECT_URI;
  const scopes      = 'com.intuit.quickbooks.accounting';
  const state       = req.query.userId || 'unknown';

  const authUrl =
    `https://appcenter.intuit.com/connect/oauth2?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `state=${state}`;

  res.redirect(authUrl);
}
