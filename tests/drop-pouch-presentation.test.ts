import { describe, expect, it } from 'vitest';

import {
  OPENING_FEEL_PRESENTATION,
  POUCH_PRESENTATION,
  POUCH_VARIANT_PRESENTATION,
} from '../src/game/data/presentation';

describe('Drop pouch presentation contract', () => {
  it('keeps authored Basic and Charged pouches neutral and independently tunable', () => {
    expect(POUCH_VARIANT_PRESENTATION.basic.stripWidthOffset).toBe(-8);
    expect(POUCH_VARIANT_PRESENTATION.charged.bodyOffsetX).toBe(-7);
    expect(POUCH_VARIANT_PRESENTATION.charged.bodyWidthOffset).toBe(-7);
    expect(POUCH_VARIANT_PRESENTATION.charged.stripWidthOffset).toBe(4);
  });

  it('keeps the Drop selector touch-friendly and swipeable', () => {
    expect(OPENING_FEEL_PRESENTATION.dropSelectorArrowHitWidth).toBeGreaterThanOrEqual(48);
    expect(OPENING_FEEL_PRESENTATION.dropSelectorSwipeThreshold).toBeGreaterThanOrEqual(24);
    expect(OPENING_FEEL_PRESENTATION.dropSelectorHeight).toBeGreaterThanOrEqual(72);
    expect(OPENING_FEEL_PRESENTATION.dropSelectorDotSize).toBeGreaterThan(0);
    expect(OPENING_FEEL_PRESENTATION.dropSelectorDotActiveWidth).toBeGreaterThan(
      OPENING_FEEL_PRESENTATION.dropSelectorDotSize,
    );
    expect(OPENING_FEEL_PRESENTATION.dropSelectorDotBottomInset).toBeGreaterThanOrEqual(8);
  });

  it('delays the tear hint until genuine inactivity and keeps it clear of the pouch', () => {
    expect(OPENING_FEEL_PRESENTATION.tearHintIdleDelayMs).toBeGreaterThanOrEqual(4_000);
    expect(OPENING_FEEL_PRESENTATION.tearHintNudgeRepeats).toBeGreaterThanOrEqual(2);
    expect(OPENING_FEEL_PRESENTATION.tearHintTopOffset).toBeLessThanOrEqual(62);
  });

  it('optically counter-shifts the authored Charged body without rotation', () => {
    expect(POUCH_PRESENTATION.chargedBodyOpticalOffsetX).toBe(-7);
    expect(POUCH_PRESENTATION.chargedBodyOpticalOffsetY).toBe(-2);
  });

  it('keeps every reveal outlined while making NEW materially stronger', () => {
    expect(OPENING_FEEL_PRESENTATION.standardOutlineAlpha).toBeGreaterThan(0);
    expect(OPENING_FEEL_PRESENTATION.standardOutlinePeakAlpha).toBeGreaterThan(
      OPENING_FEEL_PRESENTATION.standardOutlineAlpha,
    );
    expect(OPENING_FEEL_PRESENTATION.newPersistentOutlineAlpha).toBeGreaterThan(
      OPENING_FEEL_PRESENTATION.standardOutlineAlpha,
    );
    expect(OPENING_FEEL_PRESENTATION.newPersistentOutlinePeakAlpha).toBeGreaterThan(
      OPENING_FEEL_PRESENTATION.standardOutlinePeakAlpha,
    );
    expect(OPENING_FEEL_PRESENTATION.discoveryOutlineAlpha).toBeGreaterThan(
      OPENING_FEEL_PRESENTATION.newPersistentOutlinePeakAlpha,
    );
  });
});
