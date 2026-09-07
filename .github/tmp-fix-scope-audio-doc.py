from pathlib import Path

p = Path('docs/OPENING_FEEL_CORRECTION_SCOPE.md')
text = p.read_text(encoding='utf-8')
old = '''# 8. CHIPS audio

Add **one concise reusable `chips-collect` SFX** because hands-on identified a real feedback gap.

Desired character:

- fast electronic token/chip cascade or light clatter;
- satisfying but not casino/slot-machine coded;
- short enough for repeated play;
- aligned with the visual bank/count-up.

Normal / Cache / Big / Mega should reuse the same sonic identity through timing, bounded repetition, playback variation or layering where supported. Do not create one new file per cache tier.

A dedicated `charged-ready` SFX remains optional; first test whether the CHIPS intake cue + UI activation is sufficient.
'''
new = '''# 8. CHIPS audio

Use **one concise reusable CHIPS-banking sonic identity** because hands-on identified a real feedback gap. Current runtime implements it as the synthesized `chip-clack` cue.

Current character:

- short dry/percussive plastic-chip clack rather than a soft tonal puff;
- satisfying but not casino/slot-machine coded;
- short enough for repeated play;
- aligned with visual chip arrivals and HUD count-up;
- audio density is bounded independently of the exact visual chip count, so large rewards never create unbounded simultaneous sources.

Normal / Cache / Big / Mega reuse the same `chip-clack` identity through bounded repetition/timing rather than one sound asset per tier. A reviewed physical sample may replace the synth only if hands-on proves the current sound quality insufficient.

A dedicated `charged-ready` SFX remains optional; first test whether the CHIPS intake cue + UI activation is sufficient.
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one old CHIPS audio section, found {text.count(old)}')
p.write_text(text.replace(old, new, 1), encoding='utf-8')
print('scope audio contract updated')
