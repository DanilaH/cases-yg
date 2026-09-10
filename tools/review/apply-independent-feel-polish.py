from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'expected snippet not found in {path}')
    text = text.replace(old, new, 1)
    file.write_text(text, encoding='utf-8')


collection_path = 'src/game/scenes/CollectionScene.ts'
old_pager = '''  private renderPager(root: Phaser.GameObjects.Container): void {
    if (!this.metrics) return;
    const pageCount = GAME_LOOT_POOL_IDS.length;
    if (pageCount <= 1) return;

    const y = 640;
    const previous = this.add
      .text(this.metrics.centerX - 72, y, '‹', {
        color: this.page > 0 ? '#f1e8f7' : '#5b5064',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
      })
      .setOrigin(0.5);
    const next = this.add
      .text(this.metrics.centerX + 72, y, '›', {
        color: this.page < pageCount - 1 ? '#f1e8f7' : '#5b5064',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
      })
      .setOrigin(0.5);
    const pageLabel = this.add
      .text(this.metrics.centerX, y, `${getMessages(getPlatformRuntime().language).drops[this.selectedLootPoolId()]} · ${this.page + 1}/${pageCount}`, {
        color: '#a99bb5',
        fontFamily: 'monospace',
        fontSize: '13px',
      })
      .setOrigin(0.5);

    if (this.page > 0) {
      previous.setInteractive({ useHandCursor: true }).on('pointerup', () => void this.browseDrop(-1));
    }
    if (this.page < pageCount - 1) {
      next.setInteractive({ useHandCursor: true }).on('pointerup', () => void this.browseDrop(1));
    }
    root.add([previous, pageLabel, next]);
  }
'''
new_pager = '''  private renderPager(root: Phaser.GameObjects.Container): void {
    if (!this.metrics) return;
    const pageCount = GAME_LOOT_POOL_IDS.length;
    if (pageCount <= 1) return;

    const messages = getMessages(getPlatformRuntime().language);
    const y = 638;
    const width = Phaser.Math.Clamp(this.metrics.logicalWidth * 0.42, 360, 500);
    const height = 66;
    const pager = this.add.container(this.metrics.centerX, y);
    const surface = this.add.graphics();
    surface.fillStyle(0x17101f, 0.94);
    surface.fillRoundedRect(-width / 2, -height / 2, width, height, 22);
    surface.lineStyle(2, 0xbda7d6, 0.36);
    surface.strokeRoundedRect(-width / 2, -height / 2, width, height, 22);

    const title = this.add
      .text(0, -14, messages.drops[this.selectedLootPoolId()], {
        color: '#f7f2ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#120d19', 3, true, true);
    const pageLabel = this.add
      .text(0, 6, `${this.page + 1} / ${pageCount}`, {
        color: '#c8b9d8',
        fontFamily: 'monospace',
        fontSize: '10px',
      })
      .setOrigin(0.5);

    const dotGap = 13;
    const dotsWidth = dotGap * (pageCount - 1);
    const dotStartX = -dotsWidth / 2;
    for (let index = 0; index < pageCount; index += 1) {
      const active = index === this.page;
      const dot = this.add
        .rectangle(dotStartX + index * dotGap, 22, active ? 14 : 5, 5, active ? 0xe9ddf6 : 0x7d6d8b, active ? 0.95 : 0.62)
        .setOrigin(0.5);
      if (active) dot.setStrokeStyle(1, 0xffffff, 0.25);
      pager.add(dot);
    }

    let swipeStartX: number | null = null;
    const swipeZone = this.add
      .zone(0, 0, Math.max(120, width - 150), height)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    swipeZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.dropBrowseInFlight) return;
      swipeStartX = pointer.x;
    });
    swipeZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (swipeStartX === null || this.dropBrowseInFlight) return;
      const delta = pointer.x - swipeStartX;
      swipeStartX = null;
      if (Math.abs(delta) < 34) return;
      const direction: -1 | 1 = delta < 0 ? 1 : -1;
      if ((direction < 0 && this.page === 0) || (direction > 0 && this.page === pageCount - 1)) return;
      void this.browseDrop(direction);
    });
    swipeZone.on('pointerout', () => {
      swipeStartX = null;
    });

    const createArrow = (direction: -1 | 1, x: number, enabled: boolean): Phaser.GameObjects.Container => {
      const button = this.add.container(x, 0);
      const background = this.add
        .rectangle(0, 0, 54, 48, enabled ? 0x302641 : 0x211a2b, enabled ? 0.98 : 0.72)
        .setStrokeStyle(2, enabled ? 0xe8d8f7 : 0x75677f, enabled ? 0.54 : 0.2);
      const glyph = this.add
        .text(0, -1, direction < 0 ? '‹' : '›', {
          color: enabled ? '#fff8ff' : '#6f6377',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '34px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      button.add([background, glyph]);
      if (enabled) {
        background.setInteractive({ useHandCursor: true });
        background.on('pointerover', () => button.setScale(1.035));
        background.on('pointerout', () => button.setScale(1));
        background.on('pointerdown', () => button.setScale(0.95));
        background.on('pointerup', () => {
          button.setScale(1.035);
          if (!this.dropBrowseInFlight) void this.browseDrop(direction);
        });
      }
      return button;
    };

    const previous = createArrow(-1, -width / 2 + 38, this.page > 0);
    const next = createArrow(1, width / 2 - 38, this.page < pageCount - 1);
    pager.add([surface, swipeZone, title, pageLabel, previous, next]);
    pager.sendToBack(surface);
    root.add(pager);
  }
'''
replace_once(collection_path, old_pager, new_pager)
replace_once(
    collection_path,
    "    this.dropBrowseInFlight = true;\n    getGameAudio().play('ui-click');\n",
    "    this.dropBrowseInFlight = true;\n    getGameAudio().play('carousel-switch');\n",
)
replace_once(
    'src/game/scenes/OpeningScene.ts',
    "    this.hideTearHint();\n    getGameAudio().play('ui-click');\n",
    "    this.hideTearHint();\n    getGameAudio().play('carousel-switch');\n",
)
replace_once(
    'src/game/systems/audio.ts',
    "  'carousel-switch': [\n    { frequency: 720, endFrequency: 810, duration: 0.038, type: 'triangle', gain: 0.014 },\n    { frequency: 1080, endFrequency: 980, duration: 0.026, type: 'sine', gain: 0.008, delay: 0.012 },\n  ],",
    "  'carousel-switch': [\n    { frequency: 720, endFrequency: 810, duration: 0.038, type: 'triangle', gain: 0.028 },\n    { frequency: 1080, endFrequency: 980, duration: 0.026, type: 'sine', gain: 0.016, delay: 0.012 },\n  ],",
)
print('independent feel polish applied')
