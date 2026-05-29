'use strict';

/** @typedef {{ method?: string, url: string, json?: boolean }} HttpRequest */
/** @typedef {(opts: HttpRequest) => Promise<unknown>} HttpClient */

/**
 * @param {string} baseUrl
 * @returns {{ profileUrl: string, sources: Array<{ id: string, url: string }> }}
 */
function createWiremockConfig(baseUrl) {
  const base = baseUrl.replace(/\/$/, '');
  return {
    profileUrl: `${base}/mock/config/client-profile`,
    sources: [
      {
        id: 'amazon_customer_feedback',
        url: `${base}/mock/amazon/feedback/topics?asin=B000000001`,
      },
      {
        id: 'dtc_review_app',
        url: `${base}/mock/dtc/reviews?sku=SKU-1001&since=7d`,
      },
      {
        id: 'marketplace_reviews',
        url: `${base}/mock/marketplace/reviews?retailer=walmart&itemId=123456789`,
      },
      {
        id: 'erp_returns',
        url: `${base}/mock/erp/returns?period=current`,
      },
    ],
  };
}

module.exports = { createWiremockConfig };
