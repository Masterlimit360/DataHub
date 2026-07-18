const mockProvider = require('./MockProvider');
// Import real providers here once implemented (e.g. const huskelProvider = require('./HuskelProvider'))

/**
 * Provider Adapter pattern that decouples the rest of the application
 * from any single telecom wholesale API aggregator.
 */
class ProviderAdapter {
  constructor() {
    // Determine provider based on environment config
    // Default to 'mock' if not specified
    this.activeProviderName = process.env.WHOLESALE_PROVIDER || 'mock';
  }

  getProvider() {
    switch (this.activeProviderName.toLowerCase()) {
      case 'mock':
      default:
        return mockProvider;
    }
  }

  /**
   * Universal delivery wrapper
   * @param {Object} order
   * @param {Object} bundle
   */
  async deliver(order, bundle) {
    const provider = this.getProvider();
    console.log(`[ProviderAdapter] Using provider: ${provider.name}`);
    try {
      return await provider.deliver(order, bundle);
    } catch (error) {
      console.error(`[ProviderAdapter] Delivery error:`, error);
      return {
        success: false,
        error: error.message || 'Unknown provider delivery error',
        wholesale_reference: null
      };
    }
  }
}

module.exports = new ProviderAdapter();
