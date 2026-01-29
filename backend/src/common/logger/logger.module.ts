import { Global, Module } from '@nestjs/common';
import { StructuredLoggerService } from './structured-logger.service';
import { AppLogger } from './logger.service';
import { loadConfiguration } from '../../config/configuration';

/**
 * Global logger module providing structured logging services.
 * Exports both StructuredLoggerService (Pino-based) and AppLogger (NestJS-based) for compatibility.
 */
@Global()
@Module({
  providers: [
    {
      provide: StructuredLoggerService,
      useFactory: () => {
        const config = loadConfiguration();
        return new StructuredLoggerService(config);
      },
    },
    AppLogger,
  ],
  exports: [StructuredLoggerService, AppLogger],
})
export class LoggerModule {}
