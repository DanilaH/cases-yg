from pathlib import Path

p = Path('docs/GAMEPLAY_SYSTEMS.md')
text = p.read_text()
old = """- disabled openings #1–3;
- Basic from #4: `1.5%`;
- Charged from #4: `6%`;
- only while an undiscovered Secret exists in active pool;
- current slice does not roll Secret duplicates;
- at most one Secret per opening.

Current Secret value is collection discovery, not recycle income. Phase 2.6 now communicates that reward meaning explicitly and strengthens the reveal with the bounded aura/cloud + particle/burst/shake treatment."""
intermediate = """- disabled openings #1–3;
- Basic from #4: `1.5%`;
- Hidden Pocket `6%` from opening #4 while a Secret remains;
- at most one Secret per opening.

Current Secret value is collection discovery, not recycle income. Phase 2.6 now communicates that reward meaning explicitly and strengthens the reveal with the bounded aura/cloud + particle/burst/shake treatment."""
if old not in text:
    raise SystemExit('Expected current Hidden Pocket block not found')
p.write_text(text.replace(old, intermediate, 1))
