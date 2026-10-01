import { config } from './config.js';
export const configured = /^https:\/\/[a-z0-9.-]+$/.test(config.supabaseUrl) && Boolean(config.supabaseKey);
export async function api(path, { method = 'GET', body, token, prefer } = {}) {
  if (!configured) throw new Error('Online booking is not connected yet. Please contact the cafe to book.');
  const headers = { apikey: config.supabaseKey, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  else if (config.supabaseKey.startsWith('eyJ')) headers.Authorization = 'Bearer ' + config.supabaseKey;
  if (prefer) headers.Prefer = prefer;
  let response;
  try { response = await fetch(config.supabaseUrl + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) }); }
  catch { throw new Error('Connection interrupted. Please try again. Retrying the same request will not duplicate it.'); }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(response.status === 401 ? 'Your session expired. Please sign in again.' : result?.message || result?.msg || result?.error_description || 'Unable to complete this request. Please try again.');
    error.status = response.status;
    throw error;
  }
  return result;
}
