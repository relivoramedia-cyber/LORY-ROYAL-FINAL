const admin = require('firebase-admin');
const crypto = require('crypto');
class OwnerAuth {
  static OWNER_CONFIG = { phone: '+201234567890', password: '03011983', encryption_key: process.env.OWNER_ENCRYPTION_KEY };
  static async sendWhatsAppOTP(phone) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await admin.firestore().collection('owner_otps').doc(phone).set({ otp: otp, expires_at: new Date(Date.now() + 5 * 60 * 1000), used: false });
    return { success: true };
  }
  static async verifyOTP(phone, otp) {
    const doc = await admin.firestore().collection('owner_otps').doc(phone).get();
    if (!doc.exists || new Date() > doc.data().expires_at.toDate() || doc.data().used) return { success: false };
    if (otp !== doc.data().otp) return { success: false };
    await doc.ref.update({ used: true });
    const token = crypto.randomBytes(32).toString('hex');
    await admin.firestore().collection('owner_sessions').doc(token).set({ phone, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), active: true });
    return { success: true, session_token: token };
  }
}
module.exports = { OwnerAuth };