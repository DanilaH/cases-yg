import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('compact signal HUD label fit', () => {
  it('uses a smaller compact font for the lock-ready label without changing normal signal copy sizing', () => {
    const source = readFileSync('src/game/scenes/OpeningScene.ts', 'utf8');
    expect(source).toContain(
      "fontSize: chrome.compact ? (lockReady ? '13px' : '19px') : lockReady ? '8px' : '9px',",
    );
  });
});
