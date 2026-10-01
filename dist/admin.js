import { api, configured } from './db.js';
import { currency, escapeHTML as esc, displayTime } from './commerce-core.js';
const $ = s => document.querySelector(s);
let session = null, orders = [], offset = 0, loading = false;
const statuses = ['pending','confirmed','preparing','ready','completed','cancelled'];
const message = (text, error = false) => { $('#admin-message').textContent = text; $('#admin-message').classList.toggle('error', error); };
function signedOut() { session = null; orders = []; $('#orders').replaceChildren(); $('#inventory').replaceChildren(); $('#dashboard').hidden = true; $('#logout').hidden = true; $('#login-panel').hidden = false; }
async function staffApi(path, options = {}) {
  try {
    if (!session) throw new Error('Please sign in.');
    if (Date.now() > session.expires_at - 60000) {
      const next = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } });
      session = { ...next, expires_at: Date.now() + next.expires_in * 1000 };
    }
    return await api(path, { ...options, token: session.access_token });
  } catch (error) { if (error.status === 401 || error.status === 400 && Date.now() > (session?.expires_at || 0) - 60000) signedOut(); throw error; }
}
$('#login').addEventListener('submit', async e => {
  e.preventDefault(); const button = e.target.querySelector('button'); button.disabled = true; message('Signing in…');
  try {
    const form = new FormData(e.target);
    const result = await api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: form.get('email'), password: form.get('password') } });
    if (result.user?.app_metadata?.cafe_role !== 'admin') {
      await api('/auth/v1/logout', { method: 'POST', token: result.access_token }).catch(() => {});
      throw new Error('This account does not have café administrator access.');
    }
    session = { ...result, expires_at: Date.now() + result.expires_in * 1000 }; e.target.reset();
    $('#login-panel').hidden = true; $('#dashboard').hidden = false; $('#logout').hidden = false;
    await loadOrders();
  } catch (error) { message(error.message, true); } finally { button.disabled = false; }
});
$('#logout').addEventListener('click', async () => { const token = session?.access_token; signedOut(); message('Signed out.'); if (token) await api('/auth/v1/logout', { method: 'POST', token }).catch(() => {}); });
function renderOrders() {
  $('#orders').innerHTML = orders.length ? orders.map(o => `<article class="order-card"><div class="reference">${esc(o.reference)} <span class="badge">${esc(o.status)}</span></div><h2>${esc(o.kind === 'reservation' ? 'Table request' : o.kind + ' preorder')}</h2><p><strong>${esc(o.customer_name)}</strong> · <a href="tel:+${esc(o.phone.length === 10 ? '91' + o.phone : o.phone)}">${esc(o.phone)}</a><br>${esc(displayTime(o.scheduled_at))} IST${o.guests ? ' · ' + o.guests + ' guests' : ''}</p>${o.items.length ? '<ul>' + o.items.map(i => `<li>${i.quantity} × ${esc(i.name)} — ${currency(i.price * i.quantity)}</li>`).join('') + '</ul><strong>' + currency(o.total) + ' · Pay at café</strong>' : ''}${o.notes ? '<p>Note: ' + esc(o.notes) + '</p>' : ''}<div class="order-actions"><label>Status<select data-status="${o.id}">${statuses.filter(s => o.kind !== 'reservation' || !['preparing','ready'].includes(s)).map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>${o.kind !== 'reservation' ? `<label>Payment<select data-payment="${o.id}"><option value="unpaid" ${o.payment_status === 'unpaid' ? 'selected' : ''}>Unpaid</option><option value="paid" ${o.payment_status === 'paid' ? 'selected' : ''}>Paid</option></select></label>` : ''}</div><button class="secondary" data-save="${o.id}">Save changes</button></article>`).join('') : '<p class="empty">No bookings match these filters.</p>';
  $('#pending-count').textContent = orders.filter(o => o.status === 'pending').length;
  $('#table-count').textContent = orders.filter(o => o.kind === 'reservation').length;
  $('#order-value').textContent = currency(orders.filter(o => o.status !== 'cancelled').reduce((s,o) => s + o.total, 0));
}
async function loadOrders(more = false) {
  if (loading) return; loading = true; $('#load-more').disabled = true; message('Loading bookings…');
  try {
    if (!more) offset = 0;
    const params = new URLSearchParams({ select: 'id,reference,created_at,customer_name,phone,kind,guests,scheduled_at,notes,items,total,status,payment_status', order: 'created_at.desc,id.desc', limit: '50', offset: String(offset) });
    const status = $('#status-filter').value, day = $('#date-filter').value;
    if (status) params.set('status', 'eq.' + status);
    if (day) { const start = new Date(day + 'T00:00:00+05:30'); params.append('scheduled_at','gte.'+start.toISOString()); params.append('scheduled_at','lt.'+new Date(start.getTime()+86400000).toISOString()); }
    const rows = await staffApi('/rest/v1/orders?' + params);
    orders = more ? [...orders, ...rows.filter(r => !orders.some(o => o.id === r.id))] : rows;
    offset += rows.length; $('#load-more').hidden = rows.length < 50; renderOrders(); message('Bookings updated. All arrival times are IST.');
  } catch (error) { message(error.message, true); } finally { loading = false; $('#load-more').disabled = false; }
}
$('#refresh').addEventListener('click', () => loadOrders()); $('#load-more').addEventListener('click', () => loadOrders(true));
$('#status-filter').addEventListener('change', () => loadOrders()); $('#date-filter').addEventListener('change', () => loadOrders());
$('#clear-date').addEventListener('click', () => { $('#date-filter').value = ''; loadOrders(); });
$('#orders').addEventListener('click', async e => {
  const b = e.target.closest('[data-save]'); if (!b) return; b.disabled = true;
  try {
    const id = b.dataset.save, original = orders.find(o => o.id === id);
    const status = document.querySelector(`[data-status="${id}"]`).value;
    const payment_status = document.querySelector(`[data-payment="${id}"]`)?.value || original.payment_status;
    const result = await staffApi('/rest/v1/orders?id=eq.' + id + '&status=eq.' + original.status + '&payment_status=eq.' + original.payment_status, { method: 'PATCH', body: { status, payment_status }, prefer: 'return=representation' });
    if (!result?.length) throw new Error('This booking changed or access was denied. Refresh before trying again.');
    await loadOrders(); message('Booking updated. Contact the customer directly to confirm.');
  } catch (error) { message(error.message, true); } finally { b.disabled = false; }
});
async function loadInventory() {
  message('Loading menu…');
  try { const rows = await staffApi('/rest/v1/menu_items?select=*&order=sort_order.asc');
    $('#inventory').innerHTML = rows.map(i => `<tr data-id="${esc(i.id)}"><td><strong>${esc(i.name)}</strong><br><small>${esc(i.category)}</small></td><td><input aria-label="Price for ${esc(i.name)}" type="number" min="1" max="100000" step="1" value="${i.price}"></td><td><input aria-label="${esc(i.name)} available" type="checkbox" ${i.available ? 'checked' : ''}></td><td><button class="secondary" data-menu-save>Save</button></td></tr>`).join(''); message('Menu loaded.');
  } catch (error) { message(error.message, true); }
}
$('#inventory').addEventListener('click', async e => {
  const button = e.target.closest('[data-menu-save]'); if (!button) return;
  const row = button.closest('tr'), price = Number(row.querySelector('input[type=number]').value);
  if (!Number.isInteger(price) || price < 1 || price > 100000) { message('Enter a whole-rupee price from 1 to 100000.', true); return; }
  button.disabled = true;
  try { const result = await staffApi('/rest/v1/menu_items?id=eq.' + encodeURIComponent(row.dataset.id), { method: 'PATCH', body: { price, available: row.querySelector('input[type=checkbox]').checked }, prefer: 'return=representation' });
    if (!result?.length) throw new Error('Update denied. Please sign in again.'); message('Menu item saved.');
  } catch (error) { message(error.message, true); } finally { button.disabled = false; }
});
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('[data-view]').forEach(t => t.setAttribute('aria-pressed', t === b)); $('#orders-view').hidden = b.dataset.view !== 'orders'; $('#inventory-view').hidden = b.dataset.view !== 'inventory'; if (b.dataset.view === 'inventory') loadInventory(); }));
if (!configured) { message('Staff login is not connected yet. Complete the Supabase setup in SETUP.md.', true); $('#login button').disabled = true; }
