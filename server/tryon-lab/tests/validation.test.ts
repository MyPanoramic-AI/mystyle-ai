import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectImage, suitabilityWarnings } from '../src/validation/images.js';
import { solidPng } from '../src/testing/png.js';
import { LabError } from '../src/errors.js';

test('accepts a PNG from its bytes and ignores any filename', () => {
  const facts = inspectImage(solidPng(32, 40));
  assert.equal(facts.format, 'png');
  assert.equal(facts.width, 32);
  assert.equal(facts.height, 40);
  assert.equal(suitabilityWarnings(facts).length, 1);
});

test('rejects a non-image even when it is labelled as jpeg', () => {
  assert.throws(() => inspectImage(Buffer.from('not-a-photo')), (error: unknown) => {
    assert.ok(error instanceof LabError);
    assert.equal(error.code, 'unsupported_format');
    return true;
  });
});

test('rejects an unreadable JPEG and an undersized image', () => {
  assert.throws(() => inspectImage(Buffer.from([0xff, 0xd8, 0xff, 0xd9])), (error: unknown) => {
    assert.ok(error instanceof LabError);
    assert.equal(error.code, 'unsupported_format');
    return true;
  });
  assert.throws(() => inspectImage(solidPng(8, 8)), (error: unknown) => {
    assert.ok(error instanceof LabError);
    assert.equal(error.code, 'image_too_small');
    return true;
  });
});

test('rejects excessive size and extreme aspect ratio', () => {
  assert.throws(() => inspectImage(Buffer.alloc(30), 10), (error: unknown) => {
    assert.ok(error instanceof LabError);
    assert.equal(error.code, 'image_too_large');
    return true;
  });
  assert.throws(() => inspectImage(solidPng(16, 1000)), (error: unknown) => {
    assert.ok(error instanceof LabError);
    assert.equal(error.code, 'extreme_aspect_ratio');
    return true;
  });
});
