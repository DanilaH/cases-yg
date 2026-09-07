from pathlib import Path

scene_path = Path('src/game/scenes/OpeningScene.ts')
scene = scene_path.read_text()

old_resize = """    if (this.phase === 'revealing' || this.phase === 'banking') {\n      this.deferredResize = true;\n      return;\n    }\n"""
new_resize = """    if (this.phase === 'revealing' || this.phase === 'banking') {\n      this.deferredResize = true;\n      if (this.phase === 'banking') this.requestPresentationFastForward();\n      return;\n    }\n"""
if old_resize not in scene:
    raise SystemExit('handleResize target not found')
scene = scene.replace(old_resize, new_resize, 1)

old_bank_start = """  private async animateRewardBanking(pending: PendingReveal): Promise<void> {\n    if (!this.saveState || !this.root || this.isSceneShutdown()) return;\n"""
new_bank_start = """  private finishDeferredBankingResize(): boolean {\n    if (!this.deferredResize || this.phase !== 'banking' || this.isSceneShutdown()) return false;\n    this.presentationSkip.reset();\n    this.renderIdle();\n    return true;\n  }\n\n  private async animateRewardBanking(pending: PendingReveal): Promise<void> {\n    if (!this.saveState || !this.root || this.isSceneShutdown()) return;\n"""
if old_bank_start not in scene:
    raise SystemExit('banking method target not found')
scene = scene.replace(old_bank_start, new_bank_start, 1)

old_bank_sequence = """    let nextValue = pending.chips.before - pending.chips.cost;\n    const chargedCost = getChargedCost(LITE_V2_BALANCE);\n    let readyShown = false;\n"""
new_bank_sequence = """    if (this.finishDeferredBankingResize()) return;\n\n    let nextValue = pending.chips.before - pending.chips.cost;\n    const chargedCost = getChargedCost(LITE_V2_BALANCE);\n    let readyShown = false;\n"""
if old_bank_sequence not in scene:
    raise SystemExit('banking sequence target not found')
scene = scene.replace(old_bank_sequence, new_bank_sequence, 1)

old_checks = """    await bankLeg(pending.chips.base);\n    if (this.isSceneShutdown()) return;\n    await bankLeg(pending.chips.cacheBonus);\n    if (this.isSceneShutdown()) return;\n    await bankLeg(pending.chips.recycle);\n    if (this.isSceneShutdown()) return;\n    await this.bankSignalGain(pending);\n    if (this.isSceneShutdown()) return;\n"""
new_checks = """    await bankLeg(pending.chips.base);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await bankLeg(pending.chips.cacheBonus);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await bankLeg(pending.chips.recycle);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n    await this.bankSignalGain(pending);\n    if (this.isSceneShutdown() || this.finishDeferredBankingResize()) return;\n"""
if old_checks not in scene:
    raise SystemExit('banking completion checks target not found')
scene = scene.replace(old_checks, new_checks, 1)
scene_path.write_text(scene)

styles_path = Path('src/styles.css')
styles = styles_path.read_text()
old_gate = """#orientation-gate {\n  position: absolute;\n  inset: 0;\n  z-index: 1000;\n  display: none;\n  place-items: center;\n  padding: 24px;\n  box-sizing: border-box;\n  background: #171421;\n  color: #f4eefc;\n  font: 700 20px/1.3 system-ui, sans-serif;\n  text-align: center;\n}\n\n#orientation-gate[data-visible='true'] {\n  display: grid;\n}\n"""
new_gate = """#orientation-gate {\n  position: absolute;\n  inset: 0;\n  z-index: 1000;\n  isolation: isolate;\n  display: none;\n  place-items: center;\n  padding: 24px;\n  overflow: hidden;\n  box-sizing: border-box;\n  background:\n    radial-gradient(circle at 50% 44%, rgb(141 248 255 / 13%), transparent 34%),\n    radial-gradient(circle at 16% 18%, rgb(211 169 255 / 10%), transparent 28%),\n    linear-gradient(155deg, #171421 0%, #241a31 56%, #15121d 100%);\n  color: #f4eefc;\n  font: 400 17px/1.55 'Press Start 2P', ui-monospace, monospace;\n  letter-spacing: 0.01em;\n  text-align: center;\n  text-shadow: 0 2px 0 #4f385f, 0 0 18px rgb(232 212 255 / 20%);\n}\n\n#orientation-gate::before {\n  position: absolute;\n  left: 50%;\n  top: 50%;\n  z-index: -1;\n  width: min(420px, calc(100% - 48px));\n  height: 180px;\n  border: 1px solid rgb(240 221 255 / 25%);\n  border-radius: 24px;\n  background: linear-gradient(180deg, rgb(62 44 78 / 90%), rgb(31 24 42 / 92%));\n  box-shadow:\n    0 24px 70px rgb(7 5 12 / 45%),\n    inset 0 1px 0 rgb(255 255 255 / 8%),\n    0 0 0 6px rgb(141 248 255 / 3%);\n  content: '';\n  transform: translate(-50%, -50%);\n}\n\n#orientation-gate::after {\n  position: absolute;\n  left: 50%;\n  top: calc(50% - 61px);\n  color: #8df8ff;\n  content: '✦';\n  font: 400 24px/1 'Press Start 2P', ui-monospace, monospace;\n  text-shadow: 0 0 18px rgb(141 248 255 / 45%);\n  transform: translate(-50%, -50%);\n}\n\n#orientation-gate[data-visible='true'] {\n  display: grid;\n}\n"""
if old_gate not in styles:
    raise SystemExit('orientation gate target not found')
styles = styles.replace(old_gate, new_gate, 1)
styles_path.write_text(styles)
