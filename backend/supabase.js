import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
	throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variable.');
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
	realtime: {
		transport: WebSocket
	}
});

export { supabase };