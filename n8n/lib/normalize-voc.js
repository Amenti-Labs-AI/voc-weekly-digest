/**
 * VOC normalize + corroboration (source of truth — keep in sync with n8n Code node).
 * @param {object} profile - client-profile.json
 * @param {object} inputs - { amazon, dtc, marketplace, erp }
 * @returns {{ themes: object[], actionable: boolean, actNow: object[], watchList: object[] }}
 */
function normalizeVoc(profile, inputs) {
  const thresholds = profile.thresholds || { minCorroborationScore: 2, minMentionsForActNow: 5 };
  const returnReasonMap = profile.returnReasonMap || {};
  const themeMap = {};

  const bump = (theme, source, sku, extra = {}) => {
    if (!themeMap[theme]) {
      themeMap[theme] = { theme, sources: new Set(), skus: new Set(), mentions: 0, snippets: [], erpWeight: 0, trends: [] };
    }
    const t = themeMap[theme];
    t.sources.add(source);
    if (sku) t.skus.add(sku);
    t.mentions += extra.mentions || 1;
    if (extra.snippet) t.snippets.push(extra.snippet);
    if (extra.trend) t.trends.push(extra.trend);
    if (extra.erpWeight) t.erpWeight += extra.erpWeight;
  };

  const amazon = inputs.amazon?.body ?? inputs.amazon ?? {};
  for (const topic of amazon.topics || []) {
    bump(topic.label, 'amazon_feedback', null, {
      mentions: topic.mentions || 1,
      snippet: topic.sampleSnippet,
      trend: amazon.trend?.[topic.label],
    });
  }

  const dtc = inputs.dtc?.body ?? inputs.dtc ?? {};
  for (const r of dtc.reviews || []) {
    const theme = r.themeHint || (r.rating <= 2 ? 'not_as_described' : 'easy_to_use');
    bump(theme, 'dtc', r.sku, { snippet: r.body || r.title });
  }

  const mkt = inputs.marketplace?.body ?? inputs.marketplace ?? {};
  for (const r of mkt.reviews || []) {
    const theme = r.themeHint || (r.rating <= 2 ? 'packaging_damaged' : 'easy_to_use');
    bump(theme, 'marketplace', null, { snippet: r.text || r.title });
  }

  const erp = inputs.erp?.body ?? inputs.erp ?? {};
  for (const row of erp.summary || []) {
    for (const reason of row.topReasons || []) {
      const themes = returnReasonMap[reason.code] || ['not_as_described'];
      for (const theme of themes) {
        bump(theme, 'erp_returns', row.sku, { mentions: reason.count, erpWeight: 2 });
      }
    }
  }

  const themes = Object.values(themeMap).map((t) => {
    const sourceCount = t.sources.size;
    const score = sourceCount + t.erpWeight;
    return {
      theme: t.theme,
      corroborationScore: score,
      sources: [...t.sources],
      skus: [...t.skus],
      mentions: t.mentions,
      snippets: t.snippets.slice(0, 2),
      trends: t.trends,
    };
  });

  themes.sort((a, b) => b.corroborationScore - a.corroborationScore || b.mentions - a.mentions);

  const actNow = themes.filter(
    (t) =>
      t.corroborationScore >= thresholds.minCorroborationScore &&
      t.mentions >= thresholds.minMentionsForActNow
  );
  const watchList = themes.filter(
    (t) =>
      !actNow.includes(t) &&
      t.corroborationScore >= 1 &&
      t.corroborationScore < thresholds.minCorroborationScore
  );

  const actionable = actNow.length > 0;

  return { themes, actionable, actNow, watchList, thresholds };
}

function buildDigest(profile, normalized) {
  const lines = [];
  const date = new Date().toISOString().slice(0, 10);
  lines.push(`# VOC Weekly Digest — ${profile.clientName || 'Client'}`);
  lines.push(`**Week of ${date}**`);
  lines.push('');

  if (!normalized.actionable) {
    lines.push('**All clear.** No corroborated themes met threshold this week.');
    return lines.join('\n');
  }

  lines.push('## Act now');
  for (const t of normalized.actNow.slice(0, 3)) {
    lines.push(
      `- **${t.theme}** (score ${t.corroborationScore}, ${t.mentions} mentions) — sources: ${t.sources.join(', ')} — SKUs: ${t.skus.join(', ') || 'n/a'}`
    );
    if (t.snippets[0]) lines.push(`  - _"${t.snippets[0]}"_`);
  }

  if (normalized.watchList.length) {
    lines.push('');
    lines.push('## Watch list');
    for (const t of normalized.watchList.slice(0, 3)) {
      lines.push(`- ${t.theme} (score ${t.corroborationScore}) — ${t.sources.join(', ')}`);
    }
  }

  lines.push('');
  lines.push('## Recommended owners');
  lines.push('- packaging_damaged / leak_or_spill → Packaging + 3PL');
  lines.push('- pump_failure / defective → QA / CAPA');
  lines.push('- scent_too_strong / not_as_described → Product + CX');

  return lines.join('\n');
}

module.exports = { normalizeVoc, buildDigest };
