/** Client-side detector for spoken “show me the look” requests. */
export function voiceWantsLookVisualization(text: string): boolean {
  const value = text.toLowerCase();
  return /\b(generate|visuali[sz]e|show me|give me|send me|can you show|can you give|i want (to see|the picture|a picture|a photo|a look)|i just want the picture|show (me )?(that|it|the look)|create (an? )?(image|picture|look|photo)|render|picture of|photo of|image of|a picture|a photo|a look visualization|style my hair|change my hair|restyle|make me look|what (this|it|that|you) (would|are) look|what you are imagining|how (would|could) (i|that|it) look)\b/.test(value);
}

/** Aria sometimes promises a look before the app has started generating — catch that too. */
export function voiceAssistantPromisedLook(text: string): boolean {
  const value = text.toLowerCase();
  return /\b(putting (a |the )?look|on your screen|on the screen|look (up|visualization) on|showing you (a |the )?look|here('s| is) (a |the )?look|i('m| am) (showing|putting|sending) )\b/.test(value);
}
