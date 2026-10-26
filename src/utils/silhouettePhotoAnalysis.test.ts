import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyFromWidths,
  estimateSilhouetteFromImageData,
  type PixelImage,
} from './silhouettePhotoAnalysis.ts';

function makeFigure(options: {
  width: number;
  height: number;
  shoulderRatio: number;
  waistRatio: number;
  hipRatio: number;
}): PixelImage {
  const { width, height } = options;
  const data = new Uint8ClampedArray(width * height * 4);
  // Light backdrop
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 240;
    data[i + 1] = 238;
    data[i + 2] = 232;
    data[i + 3] = 255;
  }
  const bodyTop = Math.floor(height * 0.08);
  const bodyBottom = Math.floor(height * 0.92);
  const bodyLen = bodyBottom - bodyTop;
  for (let y = bodyTop; y <= bodyBottom; y += 1) {
    const t = (y - bodyTop) / bodyLen;
    // Piecewise-constant bands aligned with extractBodyWidths sample windows.
    let ratio = options.shoulderRatio;
    if (t >= 0.40 && t < 0.58) ratio = options.waistRatio;
    else if (t >= 0.58) ratio = options.hipRatio;
    const half = Math.floor((width * ratio) / 2);
    const cx = Math.floor(width / 2);
    for (let x = cx - half; x <= cx + half; x += 1) {
      if (x < 0 || x >= width) continue;
      const i = (y * width + x) * 4;
      data[i] = 60;
      data[i + 1] = 48;
      data[i + 2] = 42;
      data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

test('classifyFromWidths maps classic fashion proportions', () => {
  assert.equal(classifyFromWidths(100, 70, 102).id, 'hourglass');
  assert.equal(classifyFromWidths(90, 78, 118).id, 'pear');
  assert.equal(classifyFromWidths(120, 90, 95).id, 'inverted-triangle');
  assert.equal(classifyFromWidths(100, 100, 100).id, 'apple');
  assert.equal(classifyFromWidths(100, 92, 102).id, 'rectangle');
});

test('photo scan detects pear and hourglass figures from pixel widths', () => {
  const pear = estimateSilhouetteFromImageData(makeFigure({
    width: 200,
    height: 400,
    shoulderRatio: 0.28,
    waistRatio: 0.26,
    hipRatio: 0.42,
  }));
  assert.equal(pear.id, 'pear');
  assert.equal(pear.source, 'photo_scan');
  assert.ok(pear.bands.hip > pear.bands.shoulder);

  const hourglass = estimateSilhouetteFromImageData(makeFigure({
    width: 200,
    height: 400,
    shoulderRatio: 0.34,
    waistRatio: 0.22,
    hipRatio: 0.35,
  }));
  assert.equal(hourglass.id, 'hourglass');
});
