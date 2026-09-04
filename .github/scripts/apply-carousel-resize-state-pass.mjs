import fs from 'node:fs/promises';

const path = 'src/game/scenes/OpeningScene.ts';
let source = await fs.readFile(path, 'utf8');

const replaceExact = (from, to, label) => {
  if (!source.includes(from)) throw new Error(`Missing patch target: ${label}`);
  source = source.replace(from, to);
};

replaceExact(
`    if (this.phase === 'result' && this.lastReveal) {
      this.renderResolvedResult(this.lastReveal);
      return;
    }`,
`    if (this.phase === 'result' && this.lastReveal) {
      const selectedCarouselIndex = this.resultCarouselIndex;
      this.renderResolvedResult(this.lastReveal, selectedCarouselIndex);
      return;
    }`,
'preserve carousel selection on resize',
);

replaceExact(
`  private renderHiddenPocketCarousel(
    pending: PendingReveal,
    root: Phaser.GameObjects.Container,
    metrics: LayoutMetrics,
  ): void {`,
`  private renderHiddenPocketCarousel(
    pending: PendingReveal,
    root: Phaser.GameObjects.Container,
    metrics: LayoutMetrics,
    selectedIndex = 1,
  ): void {`,
'hidden pocket selected index parameter',
);

replaceExact(
`    this.resultCarouselItems = [standardPage, secretPage];
    this.resultCarouselIndex = 1;
    this.resultCarouselDrag = null;`,
`    this.resultCarouselItems = [standardPage, secretPage];
    this.resultCarouselIndex = Phaser.Math.Clamp(selectedIndex, 0, this.resultCarouselItems.length - 1);
    this.resultCarouselDrag = null;`,
'clamp restored carousel selection',
);

replaceExact(
`  private renderResolvedResult(pending: PendingReveal): void {`,
`  private renderResolvedResult(pending: PendingReveal, selectedCarouselIndex?: number): void {`,
'resolved result selected index parameter',
);

replaceExact(
`    if (pending.hiddenPocket) {
      this.renderHiddenPocketCarousel(pending, root, metrics);`,
`    if (pending.hiddenPocket) {
      this.renderHiddenPocketCarousel(pending, root, metrics, selectedCarouselIndex);`,
'forward preserved carousel selection',
);

await fs.writeFile(path, source);
