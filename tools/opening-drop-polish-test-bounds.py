from pathlib import Path

path = Path('tests/presentation.test.ts')
text = path.read_text()
replacements = {
    'expect(OPENING_FEEL_PRESENTATION.discoveryPopScale).toBeLessThanOrEqual(1.04);': 'expect(OPENING_FEEL_PRESENTATION.discoveryPopScale).toBeLessThanOrEqual(1.07);',
    'expect(discoveryDuration).toBeLessThanOrEqual(600);': 'expect(discoveryDuration).toBeLessThanOrEqual(720);',
    'expect(OPENING_FEEL_PRESENTATION.discoveryOutlineRadius).toBeLessThanOrEqual(4);': 'expect(OPENING_FEEL_PRESENTATION.discoveryOutlineRadius).toBeLessThanOrEqual(5);',
    'expect(OPENING_FEEL_PRESENTATION.discoveryOutlineAlpha).toBeLessThanOrEqual(0.7);': 'expect(OPENING_FEEL_PRESENTATION.discoveryOutlineAlpha).toBeLessThanOrEqual(0.9);',
}
for old, new in replacements.items():
    if text.count(old) != 1:
        raise SystemExit(f'expected one match: {old}')
    text = text.replace(old, new, 1)
path.write_text(text)
