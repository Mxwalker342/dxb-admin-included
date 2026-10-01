import { config } from './config.js';
import { api, configured } from './db.js';
import { currency, escapeHTML as esc, scheduledTime, displayTime, whatsappLink } from './commerce-core.js';
const $ = selector => document.querySelector(selector);
let menu = [], cart = {}, mode = 'pickup', category = 'All', busy = false, pending = null;
try { cart = JSON.parse(localStorage.getItem('dxb-cart') || '{}'); if (!cart || typeof cart !== 'object' || Array.isArray(cart)) cart = {}; } catch { cart = {}; }
function persist() { try { localStorage.setItem('dxb-cart', JSON.stringify(cart)); } catch {} }
function renderMenu() {
  const term = $('#search').value.toLowerCase();
  const visible = menu.filter(i => (category === 'All' || i.category === category) && (i.name + ' ' + i.description).toLowerCase().includes(term));
  $('#products').innerHTML = visible.length ? visible.map(i => `<article class="product"><span class="category-caption">${esc(i.category)}</span><h3>${esc(i.name)}</h3><p>${esc(i.description)}</p><div class="product-bottom"><strong>${currency(i.price)}</strong><button data-add="${esc(i.id)}" ${!i.available ? 'disabled' : ''} aria-label="Add ${esc(i.name)}">${i.available ? 'Add +' : 'Sold out'}</button></div></article>`).join('') : '<p class="empty">No matching dishes. Try another search.</p>';
}
function renderCart() {
  const items = menu.filter(i => cart[i.id]);
  $('#cart').innerHTML = items.length ? items.map(i => `<div class="cart-line"><div class="cart-line-top"><strong>${esc(i.name)}</strong><span>${currency(i.price * cart[i.id])}</span></div><div class="cart-line-bottom"><div class="quantity"><button type="button" data-change="${esc(i.id)}" data-delta="-1" aria-label="Decrease ${esc(i.name)}">−</button><span>${cart[i.id]}</span><button type="button" data-change="${esc(i.id)}" data-delta="1" aria-label="Increase ${esc(i.name)}">+</button></div><button type="button" class="remove" data-remove="${esc(i.id)}">Remove</button></div></div>`).join('') : '<p class="empty">Your next favourite is waiting.<br>Add something delicious from the menu.</p>';
  $('#total').textContent = currency(items.reduce((sum, i) => sum + i.price * cart[i.id], 0));
  persist();
}
function setMode(next) {
  mode = next;
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === mode));
  for (const s of ['#food-menu', '#cart', '#total-row', '#payment-note']) $(s).hidden = mode === 'reservation';
  $('#table-info').hidden = mode !== 'reservation';
  $('#guests-label').hidden = mode === 'pickup';
  $('#checkout-form').elements.guests.required = mode !== 'pickup';
  $('#checkout-title').textContent = mode === 'reservation' ? 'Your table request.' : 'Your bag.';
  $('#submit-order').textContent = mode === 'reservation' ? 'Request a table ↗' : 'Place preorder ↗';
}
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { if (!busy) setMode(b.dataset.mode); }));
$('#search').addEventListener('input', renderMenu);
$('#category-list').addEventListener('click', e => {
  const b = e.target.closest('[data-category]'); if (!b) return;
  category = b.dataset.category;
  $('#category-list').querySelectorAll('button').forEach(c => c.setAttribute('aria-pressed', c === b)); renderMenu();
});
$('#products').addEventListener('click', e => {
  const b = e.target.closest('[data-add]'); if (!b || busy) return;
  const item = menu.find(i => i.id === b.dataset.add && i.available); if (!item) return;
  cart[item.id] = Math.min(20, (cart[item.id] || 0) + 1); renderCart();
  b.textContent = 'Added ✓'; setTimeout(() => { if (b.isConnected) b.textContent = 'Add +'; }, 900);
});
$('#cart').addEventListener('click', e => {
  if (busy) return;
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.remove) delete cart[b.dataset.remove];
  if (b.dataset.change) { const id = b.dataset.change; cart[id] = Math.min(20, Math.max(0, (cart[id] || 0) + Number(b.dataset.delta))); if (!cart[id]) delete cart[id]; }
  renderCart();
});
$('#checkout-form').addEventListener('submit', async e => {
  e.preventDefault(); if (busy) return;
  $('#form-error').textContent = '';
  try {
    const form = new FormData(e.target);
    const payload = { name: form.get('name').trim(), phone: form.get('phone').replace(/[^0-9]/g, ''), kind: mode,
      scheduled_at: scheduledTime(form.get('arrival')), guests: mode === 'pickup' ? null : Number(form.get('guests')), notes: form.get('notes').trim(),
      items: mode === 'reservation' ? [] : menu.filter(i => cart[i.id]).map(i => ({ id: i.id, quantity: cart[i.id], price: i.price })) };
    if (payload.name.length < 2 || !/^\d{10,15}$/.test(payload.phone)) throw new Error('Enter your name and a valid phone number.');
    if (mode !== 'reservation' && !payload.items.length) throw new Error('Add at least one item to your bag.');
    // Keep the same UUID for identical retries, including after a page reload.
    const serialized = JSON.stringify(payload);
    if (!pending || pending.payload !== serialized) pending = { id: crypto.randomUUID(), payload: serialized };
    try { sessionStorage.setItem('dxb-pending', JSON.stringify(pending)); } catch {}
    busy = true; $('#submit-order').disabled = true; $('#submit-order').textContent = 'Saving your request…';
    const receipt = await api('/rest/v1/rpc/place_order', { method: 'POST', body: { p_request_id: pending.id, p_payload: payload } });
    $('#booking-layout').hidden = true; $('.mode-switch').hidden = true; $('#receipt').hidden = false;
    $('#receipt-reference').textContent = 'Your reference: ' + receipt.reference;
    $('#receipt-summary').textContent = `${mode === 'reservation' ? payload.guests + ' guests' : currency(receipt.total) + ' · Pay at the café'} · ${displayTime(receipt.scheduled_at)} IST`;
    const link = whatsappLink(config.whatsappNumber, receipt, payload);
    $('#whatsapp').hidden = !link;
    if (link) $('#whatsapp').href = link;
    $('#whatsapp-help').textContent = link ? 'WhatsApp opens with your details. Press Send to share them with the café.' : 'Your request is saved. WhatsApp is not configured; please call the café with your reference.';
    $('#receipt').focus(); $('#receipt').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (mode !== 'reservation') { cart = {}; persist(); }
    pending = null; try { sessionStorage.removeItem('dxb-pending'); } catch {}
  } catch (error) { $('#form-error').textContent = error.message; }
  finally { busy = false; $('#submit-order').disabled = !configured; setMode(mode); }
});
$('#new-order').addEventListener('click', () => { $('#receipt').hidden = true; $('#booking-layout').hidden = false; $('.mode-switch').hidden = false; $('#checkout-form').reset(); renderCart(); setMode(mode); });
async function init() {
  try {
    const stored = JSON.parse(sessionStorage.getItem('dxb-pending') || 'null');
    if (stored?.id && stored?.payload) pending = stored;
  } catch {}
  if (new URLSearchParams(location.search).get('type') === 'reservation') setMode('reservation');
  try {
    menu = configured ? await api('/rest/v1/menu_items?select=*&order=sort_order.asc') : await fetch('/menu-preview.json').then(r => r.json());
    for (const id of Object.keys(cart)) if (!menu.some(i => i.id === id && i.available) || !Number.isInteger(cart[id]) || cart[id] < 1 || cart[id] > 20) delete cart[id];
    const requestedCategory = new URLSearchParams(location.search).get('category');
    if (menu.some(i => i.category === requestedCategory)) category = requestedCategory;
    $('#category-list').innerHTML = ['All', ...new Set(menu.map(i => i.category))].map(c => `<button data-category="${esc(c)}" aria-pressed="${c === category}">${esc(c)}</button>`).join('');
    if (!configured) $('#connection').textContent = 'Menu preview — online booking is not connected yet. Please call the café to place an order or reserve a table.';
    $('#submit-order').disabled = !configured;
    renderMenu(); renderCart();
  } catch { $('#connection').textContent = 'The live menu could not be loaded. Please reload or call the café. No request has been sent.'; $('#submit-order').disabled = true; }
}
init();
