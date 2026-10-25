import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwrsjhfuddfoleuhkild.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_C8cJpmJR-g6gzvfbWJKHLQ_DzyDis-B';

export const supabase = createClient(supabaseUrl, supabaseKey);