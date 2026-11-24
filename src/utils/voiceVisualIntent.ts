/** Client-side detector for spoken “show me the look” requests. */
export function voiceWantsLookVisualization(text: string): boolean {
  const value = text.toLowerCase();
  return /\b(generate|visuali[sz]e|show me (an? )?(image|picture|look|photo)|show me what|create (an? )?(image|picture|look)|render|picture of me|photo of me|style my hair|change my hair|restyle( my hair)?|add accessories|with accessories|make me look|show (me )?how (it|this) (would|could) look|what (this|it|that) would look like|can you show|show (me )?that|picture of (it|that|the look)|see (the|this|that) look)\b/.test(value);
}
