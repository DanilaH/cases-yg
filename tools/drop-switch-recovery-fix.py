from pathlib import Path

path = Path('src/game/scenes/OpeningScene.ts')
text = path.read_text()
old = "    } catch (error: unknown) {\n      this.dropSwitchInFlight = false;\n      console.error('[drop] failed to switch Drop', error);\n      this.renderIdle(getMessages(getPlatformRuntime().language).opening.dropSwitchError);\n    }"
new = "    } catch (error: unknown) {\n      this.dropSwitchInFlight = false;\n      this.saveState = this.session.getState();\n      console.error('[drop] failed to switch Drop', error);\n      this.renderIdle(getMessages(getPlatformRuntime().language).opening.dropSwitchError);\n    }"
if text.count(old) != 1:
    raise SystemExit(f'OpeningScene direct switch catch mismatch: {text.count(old)}')
path.write_text(text.replace(old, new, 1))
