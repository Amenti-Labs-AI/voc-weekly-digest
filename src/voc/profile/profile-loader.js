'use strict';

/**
 * @param {import('../config').HttpClient} http
 * @param {string} profileUrl
 */
async function loadProfile(http, profileUrl) {
  const profile = await http({ method: 'GET', url: profileUrl, json: true });
  if (!profile?.clientName || !profile?.thresholds) {
    throw new Error('Invalid client profile payload');
  }
  return profile;
}

module.exports = { loadProfile };
