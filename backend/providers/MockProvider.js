/**
 * Mock Provider for local/sandbox testing.
 * Simulates a wholesale telecom integration.
 */
class MockProvider {
  constructor() {
    this.name = 'MockProvider';
  }

  /**
   * Simulates delivery of data or airtime
   * @param {Object} order The order record from DB
   * @param {Object} bundle The bundle detail (if order type is data)
   * @returns {Promise<Object>} Object containing success status and provider reference
   */
  async deliver(order, bundle) {
    console.log(`[MockProvider] Initiating delivery for Order ID: ${order.id}`);
    console.log(`[MockProvider] Type: ${order.order_type.toUpperCase()}, Number: ${order.phone_number}, Amount: GHS ${order.amount_ghs}`);
    
    if (order.order_type === 'data') {
      console.log(`[MockProvider] Bundle: ${bundle.label} (${bundle.size_mb} MB)`);
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Support intentional failure for testing via specific numbers
    if (order.phone_number.endsWith('999')) {
      console.log(`[MockProvider] Intentional failure triggered via phone number suffix.`);
      return {
        success: false,
        error: 'Simulated provider error: Recipient network unreachable or invalid account.',
        wholesale_reference: null
      };
    }

    const mockRef = 'MOCK-' + Math.random().toString(36).substring(2, 12).toUpperCase();
    console.log(`[MockProvider] Delivery successful. Wholesale Ref: ${mockRef}`);

    return {
      success: true,
      wholesale_reference: mockRef
    };
  }
}

module.exports = new MockProvider();
