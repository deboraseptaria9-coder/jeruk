const crypto = require('crypto');

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) {
  throw new Error('JWT_SECRET wajib diisi dengan nilai acak minimal 32 karakter. Salin .env.example ke .env.');
}
if (!process.env.LOGIN_USERNAME || !process.env.LOGIN_PASSWORD) {
  throw new Error('LOGIN_USERNAME dan LOGIN_PASSWORD wajib diatur di file .env.');
}

const b64url = (value) => Buffer.from(value).toString('base64url');
const sign = (input) => crypto.createHmac('sha256', secret).update(input).digest('base64url');

function createToken(username) {
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ sub: username, iat: now, exp: now + 8 * 60 * 60 }));
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned)}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(unsigned));
  const actual = Buffer.from(parts[2]);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (header.alg !== 'HS256' || typeof payload.sub !== 'string' || payload.exp <= Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

function login(req, res) {
  const { username, password } = req.body || {};
  const expectedUser = Buffer.from(process.env.LOGIN_USERNAME);
  const actualUser = Buffer.from(typeof username === 'string' ? username : '');
  const expectedPassword = Buffer.from(process.env.LOGIN_PASSWORD);
  const actualPassword = Buffer.from(typeof password === 'string' ? password : '');
  const userMatches = expectedUser.length === actualUser.length && crypto.timingSafeEqual(expectedUser, actualUser);
  const passwordMatches = expectedPassword.length === actualPassword.length && crypto.timingSafeEqual(expectedPassword, actualPassword);
  if (!userMatches || !passwordMatches) {
    return res.status(401).json({ success: false, message: 'Username atau password salah.' });
  }
  return res.json({ success: true, message: 'Login berhasil.', data: { token: createToken(username), username } });
}

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const payload = match ? verifyToken(match[1]) : null;
  if (!payload) return res.status(401).json({ success: false, message: 'Sesi berakhir atau token tidak valid. Silakan login kembali.' });
  req.user = { username: payload.sub };
  return next();
}

module.exports = { login, requireAuth };
