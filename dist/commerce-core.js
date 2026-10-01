export const currency = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export const displayTime = value => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
export function scheduledTime(value, now = Date.now()) {
  const date = new Date(value + ':00+05:30');
  if (!value || !Number.isFinite(date.getTime()) || date.getTime() < now + 30 * 60000 || date.getTime() > now + 30 * 86400000) throw new Error('Choose a time at least 30 minutes ahead and within 30 days.');
  const hour = Number(value.slice(11, 13));
  if (hour >= 1 && hour < 12) throw new Error('Please choose a time during opening hours: noon to 1 am (India time).');
  return date.toISOString();
}
export function whatsappLink(number, receipt, details) {
  if (!/^[1-9]\d{7,14}$/.test(number)) return null;
  const lines = ['DXB Cafe — ' + (details.kind === 'reservation' ? 'Table request' : 'Food preorder'), 'Reference: ' + receipt.reference,
    'Name: ' + details.name, 'Phone: ' + details.phone, 'Arrival: ' + displayTime(receipt.scheduled_at) + ' IST',
    'Type: ' + details.kind, ...(details.guests ? ['Guests: ' + details.guests] : []),
    ...receipt.items.map(i => `${i.quantity} × ${i.name} — ${currency(i.price * i.quantity)}`),
    ...(details.kind !== 'reservation' ? ['Total: ' + currency(receipt.total), 'Payment: at the cafe'] : []),
    ...(details.notes ? ['Note: ' + details.notes] : []), 'Please confirm availability.'];
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(lines.join('\n'));
}
