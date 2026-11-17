import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateScanDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(300, {
    message: 'Text must be at least 300 characters for reliable statistical detection.',
  })
  @MaxLength(6000, {
    message: 'Text cannot exceed 6,000 characters per scan.',
  })
  text!: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}

export class GuestScanDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(300, {
    message: 'Text must be at least 300 characters for reliable statistical detection.',
  })
  @MaxLength(3000, {
    message: 'Anonymous guest scans are limited to 3,000 characters. Please sign in for higher limits.',
  })
  text!: string;
}
