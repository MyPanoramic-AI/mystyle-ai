/**
 * Convert model follow-up strings into tap-to-send customer prompts.
 * Chips under stylist messages must be things the customer wants to ask —
 * never questions the stylist is asking them.
 */

function tidy(value: string): string {
  return value.replace(/\s+/g, ' ').trim().replace(/[?!.]+$/, '');
}

function shortenLabel(prompt: string, max = 56): string {
  const clean = tidy(prompt);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

/** True when the string reads as a stylist asking the customer. */
export function looksLikeStylistQuestion(text: string): boolean {
  const value = text.trim();
  return /^(do you|would you|should you|can you tell me|which|what|want |shall we|are you|have you|could you|may i ask)\b/i.test(value)
    || /\?\s*$/.test(value);
}

/**
 * Rewrite a follow-up into a first-person / imperative customer message.
 * Already-good customer prompts pass through mostly unchanged.
 */
export function toCustomerFollowUpPrompt(raw: string): string {
  const text = tidy(raw);
  if (!text) return '';

  // Already customer-voiced.
  if (/^(i |i'd |i’d |show me|let's |let’s |finalise|finalize|pick |go with|help me|suggest|recommend|compare|add |keep |find |style |give me)\b/i.test(text)) {
    return text.endsWith('?') || text.endsWith('.') ? text : `${text}.`;
  }

  let match = text.match(/^which option(?: do you want me to)?\s*(.+)$/i);
  if (match) {
    const rest = tidy(match[1]).replace(/^(me to\s+)?/i, '');
    if (/finali[sz]e/i.test(rest)) {
      return `Finalise option 1 ${rest.replace(/^finali[sz]e\s*/i, '')}.`.replace(/\s+/g, ' ');
    }
    return `Let's go with option 1 and ${rest || 'refine it'}.`;
  }

  match = text.match(/^which (?:vibe|look|one|outfit)\b(.*)$/i);
  if (match) {
    return `I'd like to refine the option that fits best${tidy(match[1]) ? ` ${tidy(match[1])}` : ''}.`;
  }

  match = text.match(/^do you prefer\s+(.+?)\s+or\s+(?:would you consider\s+)?(.+)$/i);
  if (match) {
    return `Compare ${tidy(match[1])} vs ${tidy(match[2])} for this look.`;
  }

  match = text.match(/^do you (?:want|prefer)\s+(.+)$/i);
  if (match) return `I'd like ${tidy(match[1])}.`;

  match = text.match(/^would you (?:like|prefer|consider)\s+(.+)$/i);
  if (match) return `Please suggest ${tidy(match[1])}.`;

  match = text.match(/^should (?:the |my )?(.+)$/i);
  if (match) return `Advise me on whether ${tidy(match[1])}.`;

  match = text.match(/^want\s+(.+)$/i);
  if (match) return `Show me ${tidy(match[1])}.`;

  match = text.match(/^what (?:is|are|about)\s+(.+)$/i);
  if (match) return `Tell me about ${tidy(match[1])}.`;

  if (looksLikeStylistQuestion(text)) {
    return `Help me decide: ${text.replace(/\?$/, '')}.`;
  }

  return text.endsWith('?') || text.endsWith('.') ? text : `${text}.`;
}

export function customerFollowUpChip(id: string, raw: string): { id: string; label: string; prompt: string; variant: 'secondary' } {
  const prompt = toCustomerFollowUpPrompt(raw);
  return {
    id,
    label: shortenLabel(prompt),
    prompt,
    variant: 'secondary',
  };
}
