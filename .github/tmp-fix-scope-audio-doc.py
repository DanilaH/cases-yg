from pathlib import Path

scope = Path('docs/OPENING_FEEL_CORRECTION_SCOPE.md')
text = scope.read_text(encoding='utf-8')
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
if old in text:
    text = text.replace(old, new, 1)
elif 'Current runtime implements it as the synthesized `chip-clack` cue.' not in text:
    raise SystemExit('neither old nor current CHIPS audio section found')

old_pass = '- `chips-collect` SFX;'
new_pass = '- CHIPS-banking SFX (`chip-clack` in current runtime);'
if old_pass in text:
    text = text.replace(old_pass, new_pass, 1)
elif new_pass not in text:
    raise SystemExit('neither old nor current Pass B cue line found')
scope.write_text(text, encoding='utf-8')

probe = Path('docs/PROBE_VALIDATION.md')
probe_text = probe.read_text(encoding='utf-8')
old_probe = '- `chips-collect` SFX is satisfying over repetition and not casino-like.'
new_probe = '- `chip-clack` is satisfying over repetition and not casino-like.'
if old_probe in probe_text:
    probe_text = probe_text.replace(old_probe, new_probe, 1)
elif new_probe not in probe_text:
    raise SystemExit('neither old nor current probe cue line found')
probe.write_text(probe_text, encoding='utf-8')

print('canonical audio wording current')
