export const SFX_CUES = [
  'tear',
  'reveal-pop',
  'common',
  'rare',
  'epic',
  'legendary',
  'duplicate',
  'signal-gain',
  'signal-lock',
  'hidden-pocket',
  'secret-reveal',
  'collection-complete',
] as const;

export type SfxCue = (typeof SFX_CUES)[number];

export interface RuntimeSfxAsset {
  cue: SfxCue;
  assetPath: string;
}

const SFX_ASSET_PATHS: Readonly<Record<SfxCue, string>> = {
  tear: 'assets/audio/tear.mp3',
  'reveal-pop': 'assets/audio/reveal-pop.mp3',
  common: 'assets/audio/rarity-common.mp3',
  rare: 'assets/audio/rarity-rare.mp3',
  epic: 'assets/audio/rarity-epic.mp3',
  legendary: 'assets/audio/rarity-legendary.mp3',
  duplicate: 'assets/audio/duplicate.mp3',
  'signal-gain': 'assets/audio/signal-gain.mp3',
  'signal-lock': 'assets/audio/signal-lock.mp3',
  'hidden-pocket': 'assets/audio/hidden-pocket.mp3',
  'secret-reveal': 'assets/audio/secret-reveal.mp3',
  'collection-complete': 'assets/audio/collection-complete.mp3',
};

/** Enable a cue only after the matching reviewed MP3 exists under public/. */
export const AVAILABLE_SFX_CUES = new Set<SfxCue>([
  'tear',
  'reveal-pop',
  'common',
  'rare',
  'epic',
  'legendary',
  'duplicate',
  'signal-gain',
  'signal-lock',
  'hidden-pocket',
  'secret-reveal',
  'collection-complete',
]);

export const getRuntimeSfxAssets = (): readonly RuntimeSfxAsset[] =>
  SFX_CUES.filter((cue) => AVAILABLE_SFX_CUES.has(cue)).map((cue) => ({
    cue,
    assetPath: SFX_ASSET_PATHS[cue],
  }));
