/** Render a list of label:value custom fields. Returns null if empty. */
export function createCustomFields(
  fields: { label: string; value: string }[] | undefined,
): HTMLElement | null {
  if (!fields || fields.length === 0) return null;

  const el = document.createElement('dl');
  el.className = 'ci-video-hotspot-custom-fields';

  for (const field of fields) {
    const dt = document.createElement('dt');
    dt.className = 'ci-video-hotspot-custom-field-label';
    dt.textContent = field.label;

    const dd = document.createElement('dd');
    dd.className = 'ci-video-hotspot-custom-field-value';
    dd.textContent = field.value;

    el.appendChild(dt);
    el.appendChild(dd);
  }

  return el;
}
