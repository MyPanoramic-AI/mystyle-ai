import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGeminiRequest } from '../src/ai/geminiProvider.js';
import { buildOpenAiRequest } from '../src/ai/openaiProvider.js';

test('OpenAI stylist request includes vision image parts for attached photos', () => {
  const request = buildOpenAiRequest(
    'gpt-5-mini',
    {
      system: 'You are a stylist.',
      context: null,
      messages: [
        {
          role: 'user',
          text: 'How should I style this?',
          images: [{ mimeType: 'image/jpeg', base64: '/9j/fake' }],
        },
      ],
    },
    800,
  );
  const input = request.body.input as { role: string; content: unknown }[];
  assert.equal(input.length, 1);
  assert.equal(input[0]?.role, 'user');
  assert.ok(Array.isArray(input[0]?.content));
  const parts = input[0]!.content as Record<string, unknown>[];
  assert.equal(parts[0]?.type, 'input_text');
  assert.equal(parts[1]?.type, 'input_image');
  assert.equal(parts[1]?.detail, 'auto');
  assert.match(String(parts[1]?.image_url), /^data:image\/jpeg;base64,/);
});

test('OpenAI stylist request stays plain text without attachments', () => {
  const request = buildOpenAiRequest(
    'gpt-5-mini',
    {
      system: 'You are a stylist.',
      context: null,
      messages: [{ role: 'user', text: 'Brunch outfit?' }],
    },
    800,
  );
  const input = request.body.input as { role: string; content: unknown }[];
  assert.equal(input[0]?.content, 'Brunch outfit?');
});

test('Gemini stylist request includes inline image parts for attached photos', () => {
  const call = buildGeminiRequest(
    'gemini-2.5-flash',
    {
      system: 'You are a stylist.',
      context: null,
      messages: [
        {
          role: 'user',
          text: 'How do I look in this?',
          images: [{ mimeType: 'image/jpeg', base64: '/9j/fake' }],
        },
      ],
    },
    { maxOutputTokens: 800, thinkingBudget: 0 },
  );
  const body = call.body as {
    systemInstruction: { parts: { text: string }[] };
    contents: { role: string; parts: Record<string, unknown>[] }[];
  };
  assert.match(body.systemInstruction.parts[0]!.text, /You are a stylist/);
  assert.equal(body.contents.length, 1);
  assert.equal(body.contents[0]?.role, 'user');
  assert.equal(body.contents[0]?.parts[0]?.text, 'How do I look in this?');
  assert.deepEqual(body.contents[0]?.parts[1], {
    inline_data: { mime_type: 'image/jpeg', data: '/9j/fake' },
  });
});
