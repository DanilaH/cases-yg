from pathlib import Path

# Presentation constants
presentation = Path('src/game/data/presentation.ts')
text = presentation.read_text()
old = """  dropSelectorArrowHitWidth: 68,
  dropSelectorSwipeThreshold: 34,
  dropSelectorSwitchMs: 120,
  tearHintIdleDelayMs: 5500,
"""
new = """  dropSelectorArrowHitWidth: 68,
  dropSelectorSwipeThreshold: 34,
  dropSelectorSwitchMs: 120,
  dropSelectorDotSize: 4,
  dropSelectorDotActiveWidth: 16,
  dropSelectorDotHeight: 4,
  dropSelectorDotGap: 8,
  dropSelectorDotBottomInset: 10,
  dropSelectorDotInactiveAlpha: 0.28,
  dropSelectorDotActiveAlpha: 0.95,
  tearHintTopOffset: 62,
  tearHintIdleDelayMs: 5500,
"""
if text.count(old) != 1:
    raise SystemExit(f'presentation anchor count={text.count(old)}')
presentation.write_text(text.replace(old, new, 1))

# Opening scene
scene = Path('src/game/scenes/OpeningScene.ts')
text = scene.read_text()
old = "const tearHintY = metrics.safeTop + 82;"
new = "const tearHintY = metrics.safeTop + OPENING_FEEL_PRESENTATION.tearHintTopOffset;"
if text.count(old) != 1:
    raise SystemExit(f'tear hint anchor count={text.count(old)}')
text = text.replace(old, new, 1)

old = """    const progress = this.add
      .text(0, 43, `${standardsLabel} ${standardCount}/${standards.length}   ·   ${secretsLabel} ${secretCount}/${secrets.length}`, {
        color: '#9feaf4',
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '8px',
      })
      .setOrigin(0.5, 0);

    const previousBack = this.add
"""
new = """    const progress = this.add
      .text(0, 43, `${standardsLabel} ${standardCount}/${standards.length}   ·   ${secretsLabel} ${secretCount}/${secrets.length}`, {
        color: '#9feaf4',
        fontFamily: DIGITAL_FONT_FAMILY,
        fontSize: '8px',
      })
      .setOrigin(0.5, 0);

    // Six-position carousel cue. It is deliberately presentation-only: arrows
    // and swipe remain the navigation targets, while the active Drop becomes a pill.
    const dotGap = OPENING_FEEL_PRESENTATION.dropSelectorDotGap;
    const dotSize = OPENING_FEEL_PRESENTATION.dropSelectorDotSize;
    const activeDotWidth = OPENING_FEEL_PRESENTATION.dropSelectorDotActiveWidth;
    const dotHeight = OPENING_FEEL_PRESENTATION.dropSelectorDotHeight;
    const dotWidths = GAME_LOOT_POOL_IDS.map((_, dotIndex) => dotIndex === index ? activeDotWidth : dotSize);
    const dotRailWidth = dotWidths.reduce((sum, dotWidth) => sum + dotWidth, 0) + dotGap * (dotWidths.length - 1);
    const dotY = height - OPENING_FEEL_PRESENTATION.dropSelectorDotBottomInset - dotHeight / 2;
    const dropDots: Phaser.GameObjects.Rectangle[] = [];
    let dotCursorX = -dotRailWidth / 2;
    for (let dotIndex = 0; dotIndex < dotWidths.length; dotIndex += 1) {
      const isActive = dotIndex === index;
      const dotWidth = dotWidths[dotIndex] ?? dotSize;
      const dot = this.add
        .rectangle(
          dotCursorX + dotWidth / 2,
          dotY,
          dotWidth,
          dotHeight,
          isActive ? 0x8df8ff : 0xdccdf0,
          isActive
            ? OPENING_FEEL_PRESENTATION.dropSelectorDotActiveAlpha
            : OPENING_FEEL_PRESENTATION.dropSelectorDotInactiveAlpha,
        )
        .setOrigin(0.5);
      if (isActive) {
        dot.setScale(0.88, 1);
        this.tweens.add({
          targets: dot,
          scaleX: 1,
          alpha: OPENING_FEEL_PRESENTATION.dropSelectorDotActiveAlpha,
          duration: OPENING_FEEL_PRESENTATION.dropSelectorSwitchMs,
          ease: 'Cubic.Out',
        });
      }
      dropDots.push(dot);
      dotCursorX += dotWidth + dotGap;
    }

    const previousBack = this.add
"""
if text.count(old) != 1:
    raise SystemExit(f'dot insertion anchor count={text.count(old)}')
text = text.replace(old, new, 1)
old = "panel.add([background, inner, label, progress, previousBack, nextBack, previous, next, previousHit, nextHit, swipeHit]);"
new = "panel.add([background, inner, label, progress, ...dropDots, previousBack, nextBack, previous, next, previousHit, nextHit, swipeHit]);"
if text.count(old) != 1:
    raise SystemExit(f'panel add anchor count={text.count(old)}')
scene.write_text(text.replace(old, new, 1))

# Focused contract tests
tests = Path('tests/drop-pouch-presentation.test.ts')
text = tests.read_text()
old = """    expect(OPENING_FEEL_PRESENTATION.dropSelectorSwipeThreshold).toBeGreaterThanOrEqual(24);
    expect(OPENING_FEEL_PRESENTATION.dropSelectorHeight).toBeGreaterThanOrEqual(72);
  });

  it('delays the tear hint until genuine inactivity', () => {
"""
new = """    expect(OPENING_FEEL_PRESENTATION.dropSelectorSwipeThreshold).toBeGreaterThanOrEqual(24);
    expect(OPENING_FEEL_PRESENTATION.dropSelectorHeight).toBeGreaterThanOrEqual(72);
    expect(OPENING_FEEL_PRESENTATION.dropSelectorDotSize).toBeGreaterThan(0);
    expect(OPENING_FEEL_PRESENTATION.dropSelectorDotActiveWidth).toBeGreaterThan(
      OPENING_FEEL_PRESENTATION.dropSelectorDotSize,
    );
    expect(OPENING_FEEL_PRESENTATION.dropSelectorDotBottomInset).toBeGreaterThanOrEqual(8);
  });

  it('delays the tear hint until genuine inactivity and keeps it clear of the pouch', () => {
"""
if text.count(old) != 1:
    raise SystemExit(f'test anchor count={text.count(old)}')
text = text.replace(old, new, 1)
old = """    expect(OPENING_FEEL_PRESENTATION.tearHintIdleDelayMs).toBeGreaterThanOrEqual(4_000);
    expect(OPENING_FEEL_PRESENTATION.tearHintNudgeRepeats).toBeGreaterThanOrEqual(2);
  });
"""
new = """    expect(OPENING_FEEL_PRESENTATION.tearHintIdleDelayMs).toBeGreaterThanOrEqual(4_000);
    expect(OPENING_FEEL_PRESENTATION.tearHintNudgeRepeats).toBeGreaterThanOrEqual(2);
    expect(OPENING_FEEL_PRESENTATION.tearHintTopOffset).toBeLessThanOrEqual(62);
  });
"""
if text.count(old) != 1:
    raise SystemExit(f'tear test anchor count={text.count(old)}')
tests.write_text(text.replace(old, new, 1))

# Canonical UX doc
doc = Path('docs/OPENING_DROP_POLISH_2026-09-10.md')
text = doc.read_text()
old = "- The panel has a filled surface, bordered/inner treatment, restrained idle shimmer/pulse, and short press/switch motion.\n"
new = old + "- A six-position dot rail sits at the bottom of the panel as a carousel affordance: inactive positions are small dots and the displayed Drop is a short active pill. The rail is visual only; arrows and swipe remain the interaction targets.\n"
if text.count(old) != 1:
    raise SystemExit(f'doc selector anchor count={text.count(old)}')
text = text.replace(old, new, 1)
old = "- It is hidden on initial idle render.\n"
new = old + "- Its idle position is lifted above the pouch top/handle area so the label does not visually collide with the authored package.\n"
if text.count(old) != 1:
    raise SystemExit(f'doc hint anchor count={text.count(old)}')
doc.write_text(text.replace(old, new, 1))
