'use strict';

const OWNER_LINES = [
  '## Recommended owners',
  '- packaging_damaged / leak_or_spill → Packaging + 3PL',
  '- pump_failure / defective → QA / CAPA',
  '- scent_too_strong / not_as_described → Product + CX',
];

/** @param {object} profile @param {object} normalized */
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
  lines.push('_Themes below passed corroboration thresholds and company AI evaluation criteria._');
  lines.push('');
  for (const t of normalized.actNow.slice(0, 3)) {
    lines.push(
      `- **${t.theme}** (score ${t.corroborationScore}, ${t.mentions} mentions) — sources: ${t.sources.join(', ')} — SKUs: ${t.skus.join(', ') || 'n/a'}`
    );
    if (t.aiRationale) lines.push(`  - AI: ${t.aiRationale}`);
    if (t.snippets[0]) lines.push(`  - _"${t.snippets[0]}"_`);
  }

  if (normalized.watchList.length) {
    lines.push('');
    lines.push('## Watch list');
    for (const t of normalized.watchList.slice(0, 3)) {
      lines.push(`- ${t.theme} (score ${t.corroborationScore}) — ${t.sources.join(', ')}`);
      if (t.aiRationale) lines.push(`  - AI: ${t.aiRationale}`);
    }
  }

  lines.push('');
  lines.push(...OWNER_LINES);
  return lines.join('\n');
}

module.exports = { buildDigest };
