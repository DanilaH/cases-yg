from pathlib import Path

opening = Path('src/game/scenes/OpeningScene.ts')
s = opening.read_text()
old = """    if (this.saveState.totalOpens > 0) {\n      this.createCollectionButton(root, true);\n      this.createMuteButton(root);\n    }\n"""
new = """    if (this.saveState.totalOpens > 0) {\n      this.createCollectionButton(root, true);\n    }\n    this.createMuteButton(root);\n"""
if old not in s:
    raise SystemExit('opening mute target missing')
s = s.replace(old, new, 1)

old_failure = """  private renderFailure(message: string): void {\n    const root = this.createRoot();\n    const metrics = this.metrics!;\n    root.add(\n      this.add\n        .text(metrics.centerX, metrics.centerY, message, {\n          color: '#ffb7c8',\n          align: 'center',\n          fontFamily: 'system-ui, sans-serif',\n          fontSize: '20px',\n          wordWrap: { width: Math.min(620, metrics.logicalWidth - 100) },\n        })\n        .setOrigin(0.5),\n    );\n  }\n"""
new_failure = """  private renderFailure(message: string): void {\n    const root = this.createRoot();\n    const metrics = this.metrics!;\n    const panelWidth = Math.min(660, metrics.logicalWidth - 100);\n    const panelHeight = 128;\n    const panel = this.add.graphics();\n    panel.fillStyle(0x21172e, 0.92);\n    panel.fillRoundedRect(\n      metrics.centerX - panelWidth / 2,\n      metrics.centerY - panelHeight / 2,\n      panelWidth,\n      panelHeight,\n      22,\n    );\n    panel.lineStyle(1.5, 0xffb7c8, 0.52);\n    panel.strokeRoundedRect(\n      metrics.centerX - panelWidth / 2,\n      metrics.centerY - panelHeight / 2,\n      panelWidth,\n      panelHeight,\n      22,\n    );\n    const text = this.add\n      .text(metrics.centerX, metrics.centerY, message, {\n        color: '#fff1f5',\n        align: 'center',\n        fontFamily: 'system-ui, sans-serif',\n        fontSize: '20px',\n        fontStyle: 'bold',\n        wordWrap: { width: panelWidth - 56 },\n      })\n      .setOrigin(0.5)\n      .setShadow(0, 2, '#120d19', 3, true, true);\n    root.add([panel, text]);\n  }\n"""
if old_failure not in s:
    raise SystemExit('opening failure target missing')
s = s.replace(old_failure, new_failure, 1)
opening.write_text(s)

collection = Path('src/game/scenes/CollectionScene.ts')
s = collection.read_text()
old_collection_failure = """  private renderFailure(): void {\n    const root = this.createRoot();\n    const metrics = this.metrics!;\n    root.add(\n      this.add\n        .text(metrics.centerX, metrics.centerY, getMessages(getPlatformRuntime().language).collection.loadError, {\n          color: '#ffb7c8',\n          fontFamily: 'system-ui, sans-serif',\n          fontSize: '18px',\n        })\n        .setOrigin(0.5),\n    );\n  }\n"""
new_collection_failure = """  private renderFailure(): void {\n    const root = this.createRoot();\n    const metrics = this.metrics!;\n    const panelWidth = Math.min(660, metrics.logicalWidth - 100);\n    const panelHeight = 128;\n    const panel = this.add.graphics();\n    panel.fillStyle(0x21172e, 0.92);\n    panel.fillRoundedRect(\n      metrics.centerX - panelWidth / 2,\n      metrics.centerY - panelHeight / 2,\n      panelWidth,\n      panelHeight,\n      22,\n    );\n    panel.lineStyle(1.5, 0xffb7c8, 0.52);\n    panel.strokeRoundedRect(\n      metrics.centerX - panelWidth / 2,\n      metrics.centerY - panelHeight / 2,\n      panelWidth,\n      panelHeight,\n      22,\n    );\n    const text = this.add\n      .text(metrics.centerX, metrics.centerY, getMessages(getPlatformRuntime().language).collection.loadError, {\n        color: '#fff1f5',\n        align: 'center',\n        fontFamily: 'system-ui, sans-serif',\n        fontSize: '18px',\n        fontStyle: 'bold',\n        wordWrap: { width: panelWidth - 56 },\n      })\n      .setOrigin(0.5)\n      .setShadow(0, 2, '#120d19', 3, true, true);\n    root.add([panel, text]);\n  }\n"""
if old_collection_failure not in s:
    raise SystemExit('collection failure target missing')
s = s.replace(old_collection_failure, new_collection_failure, 1)
collection.write_text(s)
