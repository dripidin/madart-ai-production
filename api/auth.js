const {
  COOKIE_NAME,
  verifyPassword,
  isAuthenticated,
  handlePreflight,
  getRequestBody,
} = require('./_lib/auth');

module.exports = async (req, res) => {
  if (handlePreflight(req, res, 'GET,POST,DELETE,OPTIONS')) return;

  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: isAuthenticated(req) });
  }

  if (req.method === 'POST') {
    const body = getRequestBody(req);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!verifyPassword(password)) {
      return res.status(401).json({ ok: false, error: 'Invalid password' });
    }
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=1; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}`
    );
    return res.status(200).json({ ok: true, authenticated: true });
  }

  if (req.method === 'DELETE') {
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
    );
    return res.status(200).json({ ok: true, authenticated: false });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
