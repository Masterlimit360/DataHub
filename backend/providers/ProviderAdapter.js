const mockProvider = require('./MockProvider');
const giantSmsProvider = require('./GiantSmsUssdProvider');

/**
 * Provider Adapter — decouples order delivery from any single wholesaler API.
 */
class ProviderAdapter {
  constructor() {
    this.activeProviderName = process.env.WHOLESALE_PROVIDER || 'mock';
  }

  getProvider() {
    switch (this.activeProviderName.toLowerCase()) {
      case 'giantsms':
      case 'giantsms-ussd':
        return giantSmsProvider;
      case 'mock':
      default:
        return mockProvider;
    }
  }

  async deliver(order, bundle) {
    const provider = this.getProvider();
    console.log(`[ProviderAdapter] Using provider: ${provider.name}`);
    try {
      return await provider.deliver(order, bundle);
    } catch (error) {
      console.error('[ProviderAdapter] Delivery error:', error);
      return {
        success: false,
        error: error.message || 'Unknown provider delivery error',
        wholesale_reference: null,
      };
    }
  }
}

module.exports = new ProviderAdapter();
