import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Use a dummy key in mock mode to prevent initialization errors
const supabaseKey = config.mockData.enabled && !config.supabase.anonKey
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.mock_key_for_development'
  : config.supabase.anonKey;

export const supabase = createClient(config.supabase.url, supabaseKey);
