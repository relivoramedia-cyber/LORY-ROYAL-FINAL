const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
class UserAuth {
  static async register(name, email, phone, password) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const doc = await admin.firestore().collection('users').add({ name, email, phone, password: hashedPassword, auth_provider: 'email', subscription_tier: 'FREE', status: 'active', created_at: admin.firestore.FieldValue.serverTimestamp() });
    return { success: true, user_id: doc.id };
  }
  static async login(email, password, deviceInfo) {
    const users = await admin.firestore().collection('users').where('email', '==', email).get();
    if (users.empty) return { success: false, error: 'بيانات خطأ' };
    const user = users.docs[0];
    const match = await bcrypt.compare(password, user.data().password);
    if (!match) return { success: false, error: 'بيانات خطأ' };
    const token = crypto.randomBytes(32).toString('hex');
    await admin.firestore().collection('sessions').doc(token).set({ user_id: user.id, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), active: true });
    return { success: true, session_token: token };
  }
}
module.exports = { UserAuth };