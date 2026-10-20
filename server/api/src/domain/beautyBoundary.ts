export interface BeautyGenerationBoundary {
  externalTransmission: 'disabled';
  imageGeneration: 'not_connected';
  facialAnalysis: false;
  photographsAccepted: false;
  childPhotographsAccepted: false;
}

export function beautyGenerationBoundary(): BeautyGenerationBoundary {
  return {
    externalTransmission: 'disabled',
    imageGeneration: 'not_connected',
    facialAnalysis: false,
    photographsAccepted: false,
    childPhotographsAccepted: false,
  };
}
