import { NormalizedDetectionResult } from '@ai-detector/shared-types';

export const DETECTION_PROVIDER = Symbol('DETECTION_PROVIDER');

export interface DetectionRequest {
  text: string;
}

export interface DetectionProvider {
  readonly name: string;
  detectText(request: DetectionRequest): Promise<NormalizedDetectionResult>;
}
