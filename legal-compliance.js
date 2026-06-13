class LegalCompliance {
  static async prePublishGate(content, type, userId) {
    return { allowed: true };
  }
}
module.exports = { LegalCompliance };