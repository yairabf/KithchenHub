import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

@Global() // Make it global so we don't need to import it in every feature module
@Module({
  imports: [ConfigModule],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
