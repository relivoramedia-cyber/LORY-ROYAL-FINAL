require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');
const { OAuth2Client } = require('google-auth-library');
const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com', 'https://*.vercel-insights.com', 'https://*.vercel-scripts.com'], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], imgSrc: ["'self'", 'data:', 'https:'], connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.vercel-insights.com'] } } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
admin.initializeApp();
const db = admin.firestore();
app.post('/api/auth/google', async (req, res) => {
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    const users = await db.collection('users').where('email', '==', p.email).get();
    let userId;
    if (users.empty) {
      const doc = await db.collection('users').add({ name: p.name, email: p.email, google_id: p.sub, picture: p.picture, auth_provider: 'google', subscription_tier: 'FREE', status: 'active', created_at: admin.firestore.FieldValue.serverTimestamp() });
      userId = doc.id;
    } else {
      userId = users.docs[0].id;
      await users.docs[0].ref.update({ google_id: p.sub, picture: p.picture, last_login: admin.firestore.FieldValue.serverTimestamp() });
    }
    const token = require('crypto').randomBytes(32).toString('hex');
    await db.collection('sessions').doc(token).set({ user_id: userId, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), active: true });
    res.json({ success: true, session_token: token });
  } catch (err) {
    res.status(401).json({ error: 'فشل تسجيل جوجل' });
  }
});
app.get('/api/user/stats', async (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.cookies?.session;
  if (!token) return res.status(401).json({ error: 'سجل دخول' });
  const session = await db.collection('sessions').doc(token).get();
  if (!session.exists) return res.status(401).json({ error: 'جلسة منتهية' });
  const user = await db.collection('users').doc(session.data().user_id).get();
  const posts = await db.collection('posts').where('user_id', '==', session.data().user_id).get();
  res.json({ posts: posts.size, tier: user.data().subscription_tier, ai_requests_left: 50 });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ المكنة شغالة على ${PORT} - كل الصفحات مليانة`));
