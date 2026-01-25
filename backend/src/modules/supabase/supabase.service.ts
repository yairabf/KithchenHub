import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnvConfig } from '../../config/env.validation';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService<EnvConfig, true>) {
    this.initializeClient();
  }

  private initializeClient() {
    const supabaseUrl = this.configService.get('SUPABASE_URL', { infer: true });
    // Prefer service role key for backend operations if available, otherwise fallback to anon key (though backend usually needs service role)
    // Actually, for client-side ops passed through, anon key might be used, but backend logic typically bypasses RLS or acts as admin.
    // Let's use the provided key.
    const supabaseKey =
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true }) ||
      this.configService.get('SUPABASE_ANON_KEY', { infer: true });

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase URL or Key is missing in configuration.');
      throw new Error('Supabase configuration missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Supabase client initialized');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
