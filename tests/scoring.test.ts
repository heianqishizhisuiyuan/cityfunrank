import { describe, expect, it } from 'vitest';

function score(input: { rating: number; popularity: number; stability: number; value: number }) {
  return (
    input.rating * 20 * 0.5 +
    input.popularity * 0.25 +
    input.stability * 0.15 +
    input.value * 0.1
  );
}

describe('ranking score', () => {
  it('gives higher score to stronger composite metrics', () => {
    const a = score({ rating: 4.8, popularity: 95, stability: 90, value: 88 });
    const b = score({ rating: 4.3, popularity: 80, stability: 78, value: 82 });
    expect(a).toBeGreaterThan(b);
  });
});
