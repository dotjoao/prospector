import 'dotenv/config';
import { getSupabase } from '../src/lib/supabase.js';

const { data, error } = await getSupabase().from('app_settings').select('id').limit(1);
console.log(JSON.stringify({ data, error }, null, 2));

const leads = await getSupabase().from('leads').select('id', { count: 'exact', head: true });
console.log('leads count:', leads.count, leads.error?.message);
