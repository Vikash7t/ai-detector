import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DETECTION_PROVIDER } from './detection.provider.interface';
import { SaplingProvider } from './sapling.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    SaplingProvider,
    {
      provide: DETECTION_PROVIDER,
      useExisting: SaplingProvider,
    },
  ],
  exports: [DETECTION_PROVIDER, SaplingProvider],
})
export class DetectionModule {}
