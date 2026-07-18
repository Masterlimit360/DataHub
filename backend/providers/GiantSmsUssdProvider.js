const axios = require('axios');
const { normalizePhoneNumber } = require('../services/sms');

/**
 * GiantSMS USSD wholesale provider — delivers data bundles and airtime
 * via the GiantSMS USSD reseller API.
 *
 * Docs: https://site5.link/giantsms-ussd-api
 * Configure credentials and endpoints in backend/.env
 */
class GiantSmsUssdProvider {
  constructor() {
    this.name = 'GiantSmsUssdProvider';
    this.baseUrl = (process.env.GIANTSMS_USSD_API_BASE_URL || 'https://api.giantsms.com/api/v1').replace(/\/$/, '');
    this.username = process.env.GIANTSMS_USERNAME;
    this.password = process.env.GIANTSMS_PASSWORD;
    this.token = process.env.GIANTSMS_TOKEN;
    this.dataEndpoint = process.env.GIANTSMS_DATA_ENDPOINT || 'ussd/data';
    this.airtimeEndpoint = process.env.GIANTSMS_AIRTIME_ENDPOINT || 'ussd/airtime';
    this.timeout = parseInt(process.env.GIANTSMS_API_TIMEOUT || '30000', 10);
  }

  isConfigured() {
    return Boolean(this.username && this.password) || Boolean(this.token);
  }

  getAuthConfig() {
    if (this.token) {
      return {
        headers: {
          Authorization: `Basic ${this.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };
    }

    return {
      auth: { username: this.username, password: this.password },
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    };
  }

  mapNetwork(networkId) {
    const networks = {
      mtn: 'MTN',
      telecel: 'TELECEL',
      airteltigo: 'AIRTELTIGO',
    };
    return networks[networkId] || String(networkId).toUpperCase();
  }

  resolveBundleCode(bundle) {
    if (process.env.GIANTSMS_BUNDLE_MAP) {
      try {
        const map = JSON.parse(process.env.GIANTSMS_BUNDLE_MAP);
        const key = `${bundle.network_id}:${bundle.size_mb}`;
        if (map[key]) return map[key];
      } catch (error) {
        console.warn('[GiantSmsUssdProvider] Invalid GIANTSMS_BUNDLE_MAP JSON:', error.message);
      }
    }
    return bundle.label;
  }

  parseResponse(data, reference) {
    const success =
      data?.status === 'success' ||
      data?.status === true ||
      data?.success === true ||
      data?.code === 1000 ||
      data?.code === '1000' ||
      String(data?.response || '').toLowerCase() === 'success';

    const wholesaleRef =
      data?.reference ||
      data?.transaction_id ||
      data?.transactionId ||
      data?.id ||
      data?.data?.reference ||
      reference;

    return {
      success,
      wholesale_reference: success ? String(wholesaleRef) : null,
      error: success ? null : (data?.message || data?.error || data?.response || 'GiantSMS delivery failed'),
      raw: data,
    };
  }

  async postPurchase(endpoint, payload, reference) {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    console.log(`[GiantSmsUssdProvider] POST ${url}`);

    const response = await axios.post(url, payload, {
      ...this.getAuthConfig(),
      timeout: this.timeout,
    });

    return this.parseResponse(response.data, reference);
  }

  async purchaseData(order, bundle) {
    const phone = normalizePhoneNumber(order.phone_number);
    const reference = order.payment_reference || order.id;
    const payload = {
      username: this.username,
      password: this.password,
      phone,
      recipient: phone,
      network: this.mapNetwork(order.network_id),
      bundle: this.resolveBundleCode(bundle),
      product: this.resolveBundleCode(bundle),
      size_mb: bundle.size_mb,
      reference,
      order_reference: reference,
    };

    return this.postPurchase(this.dataEndpoint, payload, reference);
  }

  async purchaseAirtime(order) {
    const phone = normalizePhoneNumber(order.phone_number);
    const reference = order.payment_reference || order.id;
    const payload = {
      username: this.username,
      password: this.password,
      phone,
      recipient: phone,
      network: this.mapNetwork(order.network_id),
      amount: parseFloat(order.amount_ghs),
      reference,
      order_reference: reference,
    };

    return this.postPurchase(this.airtimeEndpoint, payload, reference);
  }

  async deliver(order, bundle) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'GiantSMS credentials missing. Set GIANTSMS_USERNAME + GIANTSMS_PASSWORD or GIANTSMS_TOKEN in .env',
        wholesale_reference: null,
      };
    }

    console.log(`[GiantSmsUssdProvider] Delivering ${order.order_type} order ${order.id} to ${order.phone_number}`);

    try {
      if (order.order_type === 'data') {
        if (!bundle) {
          return { success: false, error: 'Bundle details required for data delivery', wholesale_reference: null };
        }
        return await this.purchaseData(order, bundle);
      }

      return await this.purchaseAirtime(order);
    } catch (error) {
      const detail = error.response?.data || error.message;
      console.error('[GiantSmsUssdProvider] Delivery error:', detail);
      return {
        success: false,
        error: typeof detail === 'object' ? JSON.stringify(detail) : String(detail),
        wholesale_reference: null,
      };
    }
  }
}

module.exports = new GiantSmsUssdProvider();
