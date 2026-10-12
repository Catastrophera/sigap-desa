import { supabase, Aduan } from './supabase';
import { MOCK_ADUAN_DATA } from './mock-data';

const STORAGE_KEY = 'sigap_aduan_reports_v2';

/**
 * Get all cached reports from localStorage if available
 */
function getLocalCache(): Aduan[] {
  if (typeof window === 'undefined') return MOCK_ADUAN_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read localStorage aduan cache:', err);
  }
  // Initialize with MOCK_ADUAN_DATA if empty
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ADUAN_DATA));
  } catch {}
  return MOCK_ADUAN_DATA;
}

/**
 * Save updated list to localStorage
 */
function setLocalCache(reports: Aduan[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (err) {
    console.warn('Failed to save localStorage aduan cache:', err);
  }
}

/**
 * Fetch all reports with seamless fallback to mock data
 */
export async function getAllAduan(): Promise<Aduan[]> {
  try {
    const { data, error } = await supabase
      .from('aduan')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setLocalCache(data);
      return data;
    }
  } catch (err) {
    console.warn('Supabase query failed, using mock data fallback:', err);
  }

  return getLocalCache();
}

/**
 * Fetch a single report by ticket code (e.g. SIGAP-1082)
 */
export async function getAduanByTicket(ticketCode: string): Promise<Aduan | null> {
  const cleanCode = ticketCode.trim().toUpperCase().replace(/^#/, '');

  try {
    const { data, error } = await supabase
      .from('aduan')
      .select('*')
      .ilike('ticket_code', cleanCode)
      .maybeSingle();

    if (!error && data) return data;
  } catch (err) {
    console.warn('Supabase getAduanByTicket failed:', err);
  }

  // Fallback to local / mock data
  const localList = getLocalCache();
  return (
    localList.find(
      (r) => r.ticket_code.toUpperCase() === cleanCode || r.ticket_code.replace(/^SIGAP-/, '') === cleanCode
    ) || null
  );
}

/**
 * Fetch a single report by ID
 */
export async function getAduanById(id: string): Promise<Aduan | null> {
  try {
    const { data, error } = await supabase
      .from('aduan')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) return data;
  } catch (err) {
    console.warn('Supabase getAduanById failed:', err);
  }

  const localList = getLocalCache();
  return localList.find((r) => r.id === id) || null;
}

/**
 * Save a new user report
 */
export async function submitNewAduan(
  newReport: Omit<Aduan, 'id' | 'created_at'> & { id?: string; created_at?: string }
): Promise<{ success: boolean; data: Aduan }> {
  const item: Aduan = {
    id: newReport.id || `aduan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: newReport.created_at || new Date().toISOString(),
    ...newReport,
  };

  // 1. Immediately store in local cache so user sees it instantly
  const localList = getLocalCache();
  const updated = [item, ...localList.filter((r) => r.ticket_code !== item.ticket_code)];
  setLocalCache(updated);

  // 2. Try Supabase insert in background
  try {
    await supabase.from('aduan').insert([item]);
  } catch (err) {
    console.warn('Supabase insert failed, saved to local cache only:', err);
  }

  return { success: true, data: item };
}

/**
 * Update an existing report status / admin notes
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
