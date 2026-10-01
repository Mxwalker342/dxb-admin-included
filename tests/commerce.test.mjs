import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scheduledTime, whatsappLink, escapeHTML } from '../dist/commerce-core.js';
const now = Date.parse('2026-10-01T05:00:00Z');
test('booking dates use India time independently of browser timezone', () => {
  assert.equal(scheduledTime('2026-10-01T12:00', now), '2026-10-01T06:30:00.000Z');
  assert.equal(scheduledTime('2026-10-02T00:30', now), '2026-10-01T19:00:00.000Z');
});
test('reject closed hours, past dates, short notice and dates beyond window', () => {
  for (const value of ['', 'bad', '2026-10-01T10:45', '2026-10-02T01:00', '2026-10-02T11:59', '2026-11-10T12:00']) assert.throws(() => scheduledTime(value, now));
});
test('WhatsApp links use saved prices, include references, and safely encode notes', () => {
  const receipt = { reference:'DXB-TEST', scheduled_at:'2026-10-01T06:30:00Z', total:398, items:[{name:'Burger & fries', quantity:2, price:199}] };
  const details = {name:'Test',phone:'9999999999',kind:'pickup',notes:'No onions & extra sauce?'};
  const url = new URL(whatsappLink('919656110056',receipt,details));
  assert.equal(url.hostname,'wa.me'); assert.equal(url.pathname,'/919656110056');
  assert.match(url.searchParams.get('text'), /DXB-TEST/); assert.match(url.searchParams.get('text'), /398/); assert.match(url.searchParams.get('text'), /No onions & extra sauce\?/);
  assert.equal(whatsappLink('',receipt,details),null);
});
test('customer content cannot become HTML', () => { assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'); });
