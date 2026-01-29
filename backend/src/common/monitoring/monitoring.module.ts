import { Global, Module } from '@nestjs/common';
import { SentryService } from './sentry.service';
import { loadConfiguration } from '../../config/configuration';

/**
 * Global monitoring module providing Sentry error tracking.
 * Exports SentryService for use throughout the application.
 */
@Global()
@Module({
  providers: [
    {
      provide: SentryService,
      useFactory: () => {
        const config = loadConfiguration();
        return new SentryService(config);
      },
    },
  ],
  exports: [SentryService],
})
export class MonitoringModule {}
