class SubscriptionTiers {
  static TIERS = {
    FREE: { name: 'مجاني' },
    STARTER: { name: 'مبتدئ', min_price: 99 },
    PRO: { name: 'محترف', min_price: 299 }
  };
  static async setCustomPrice(userId, tierName, customPrice) {
    return { success: true, message: 'تم الترقية' };
  }
}
module.exports = { SubscriptionTiers };