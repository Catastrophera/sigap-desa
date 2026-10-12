import { supabase, Aduan } from './supabase';
import { MOCK_ADUAN_DATA } from './mock-data';

const STORAGE_KEY = 'sigap_aduan_reports_v3';
const DELETED_KEY = 'sigap_deleted_report_ids_v1';

/**
 * Get set of permanently deleted report IDs and ticket codes
 */
export function getDeletedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

/**
 * Record a report as deleted so it can never be resurrected by remote sync
 */
export function recordDeleted(id: string, ticketCode?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedSet();
    if (id) set.add(id);
    if (ticketCode) set.add(ticketCode);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

/**
 * Get all cached reports from localStorage (excluding deleted)
 */
export function getLocalCache(): Aduan[] {
  const deletedSet = getDeletedSet();

  if (typeof window === 'undefined') {
    return MOCK_ADUAN_DATA.filter((r) => !deletedSet.has(r.id) && !deletedSet.has(r.ticket_code));
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((r) => !deletedSet.has(r.id) && !deletedSet.has(r.ticket_code));
      }
    }
  } catch (err) {
    console.warn('Failed to read localStorage aduan cache:', err);
  }

  // Initialize with MOCK_ADUAN_DATA if empty
  const initial = MOCK_ADUAN_DATA.filter((r) => !deletedSet.has(r.id) && !deletedSet.has(r.ticket_code));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

/**
 * Save updated list to localStorage and trigger live update event
 */
export function setLocalCache(reports: Aduan[]) {
  if (typeof window === 'undefined') return;
  const deletedSet = getDeletedSet();
  const cleanList = reports.filter((r) => !deletedSet.has(r.id) && !deletedSet.has(r.ticket_code));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    window.dispatchEvent(new CustomEvent('sigap_aduan_updated'));
  } catch (err) {
    console.warn('Failed to save localStorage aduan cache:', err);
  }
}

/**
 * Fetch all reports with guaranteed persistence and exclusion of deleted items
 */
export async function getAllAduan(): Promise<Aduan[]> {
  const deletedSet = getDeletedSet();
  const localList = getLocalCache().filter((r) => !deletedSet.has(r.id) && !deletedSet.has(r.ticket_code));

  try {
    const { data, error } = await supabase
      .from('aduan')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      // Filter out any locally deleted reports
      const validRemote = data.filter((d) => !deletedSet.has(d.id) && !deletedSet.has(d.ticket_code));
      const remoteKeys = new Set(validRemote.map((d) => d.id || d.ticket_code));
      const localOnly = localList.filter((l) => !remoteKeys.has(l.id) && !remoteKeys.has(l.ticket_code));
      const merged = [...localOnly, ...validRemote];
      setLocalCache(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Supabase query failed, using local/mock data fallback:', err);
  }

  return localList;
}

/**
 * Fetch a single report by ticket code (e.g. SIGAP-1082)
 */
export async function getAduanByTicket(ticketCode: string): Promise<Aduan | null> {
  const cleanCode = ticketCode.trim().toUpperCase().replace(/^#/, '');
  const deletedSet = getDeletedSet();
  if (deletedSet.has(cleanCode) || deletedSet.has(`SIGAP-${cleanCode}`)) return null;

  try {
    const { data, error } = await supabase
      .from('aduan')
      .select('*')
      .ilike('ticket_code', cleanCode)
      .maybeSingle();

    if (!error && data && !deletedSet.has(data.id) && !deletedSet.has(data.ticket_code)) return data;
  } catch (err) {
    console.warn('Supabase getAduanByTicket failed:', err);
  }

  const localList = getLocalCache();
  return (
    localList.find(
      (r) =>
        !deletedSet.has(r.id) &&
        !deletedSet.has(r.ticket_code) &&
        (r.ticket_code.toUpperCase() === cleanCode || r.ticket_code.replace(/^SIGAP-/, '') === cleanCode)
    ) || null
  );
}

/**
 * Fetch a single report by ID
 */
export async function getAduanById(id: string): Promise<Aduan | null> {
  const deletedSet = getDeletedSet();
  if (deletedSet.has(id)) return null;

  try {
    const { data, error } = await supabase
      .from('aduan')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data && !deletedSet.has(data.id) && !deletedSet.has(data.ticket_code)) return data;
  } catch (err) {
    console.warn('Supabase getAduanById failed:', err);
  }

  const localList = getLocalCache();
  return localList.find((r) => r.id === id && !deletedSet.has(r.id) && !deletedSet.has(r.ticket_code)) || null;
}

/**
 * Save a new user report and immediately broadcast to all pages
 */
export async function submitNewAduan(
  newReport: Omit<Aduan, 'id' | 'created_at'> & { id?: string; created_at?: string }
): Promise<{ success: boolean; data: Aduan }> {
  const item: Aduan = {
    id: newReport.id || `aduan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: newReport.created_at || new Date().toISOString(),
    ...newReport,
  };

  // 1. Immediately prepend to local list and broadcast live event
  const currentList = getLocalCache();
  const updated = [item, ...currentList.filter((r) => r.ticket_code !== item.ticket_code)];
  setLocalCache(updated);

  // 2. Try Supabase insert in background
  try {
    await supabase.from('aduan').insert([item]);
  } catch (err) {
    console.warn('Supabase insert skipped or offline:', err);
  }

  return { success: true, data: item };
}

/**
 * Update an existing report status / admin notes and broadcast live
 */
export async function updateAduan(
  id: string,
  updates: Partial<Aduan>
): Promise<{ success: boolean; data?: Aduan }> {
  const localList = getLocalCache();
  let updatedItem: Aduan | undefined;

  const nextList = localList.map((r) => {
    if (r.id === id) {
      updatedItem = { ...r, ...updates };
      return updatedItem;
    }
    return r;
  });

  setLocalCache(nextList);

  try {
    await supabase.from('aduan').update(updates).eq('id', id);
  } catch (err) {
    console.warn('Supabase update failed, saved to local cache only:', err);
  }

  return { success: true, data: updatedItem };
}

/**
 * Permanently delete a report (local cache + Supabase)
 */
export async function deleteAduan(idOrTicket: string): Promise<boolean> {
  const localList = getLocalCache();
  const target = localList.find((r) => r.id === idOrTicket || r.ticket_code === idOrTicket);
  const targetId = target?.id || idOrTicket;
  const ticketCode = target?.ticket_code || (idOrTicket.startsWith('SIGAP-') ? idOrTicket : null);

  // 1. Blacklist locally so remote sync can NEVER bring it back
  recordDeleted(targetId, ticketCode);

  // 2. Filter from local cache and immediately broadcast
  const nextList = localList.filter(
    (r) => r.id !== targetId && r.ticket_code !== ticketCode && r.id !== idOrTicket
  );
  setLocalCache(nextList);

  // 3. Delete from Supabase by ID and/or ticket_code
  try {
    const { error: err1 } = await supabase.from('aduan').delete().eq('id', targetId);
    if (err1) {
      console.warn('Supabase delete by id failed (likely RLS):', err1.message);
    }
  } catch (err) {
    console.warn('Supabase delete error:', err);
  }

  if (ticketCode) {
    try {
      const { error: err2 } = await supabase.from('aduan').delete().eq('ticket_code', ticketCode);
      if (err2) {
        console.warn('Supabase delete by ticket_code failed (likely RLS):', err2.message);
      }
    } catch (err) {
      console.warn('Supabase delete by ticket error:', err);
    }
  }

  return true;
}

/**
 * Helper to subscribe to live aduan changes (from same window or other tabs)
 */
export function subscribeToAduanUpdates(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => {
    callback();
  };

  window.addEventListener('sigap_aduan_updated', handleUpdate);
  window.addEventListener('storage', handleUpdate);
  window.addEventListener('focus', handleUpdate);

  return () => {
    window.removeEventListener('sigap_aduan_updated', handleUpdate);
    window.removeEventListener('storage', handleUpdate);
    window.removeEventListener('focus', handleUpdate);
  };
}
