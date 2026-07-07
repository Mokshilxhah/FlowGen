/**
 * Build company email: first.last@domain.flowgen.app
 */
export function generateCompanyEmail(first, last, domain) {
  const f = slug(first);
  const l = slug(last);
  const d = slug(domain);
  return `${f}.${l}@${d}.flowgen.app`;
}

function slug(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24) || 'user';
}

