export type ActivityBlocker = 'ad' | 'orientation' | 'platform' | 'visibility';

type BlockedListener = (blocked: boolean) => void;
type BlockersListener = (blockers: ReadonlySet<ActivityBlocker>) => void;

export const shouldSuspendRuntimeLoop = (blockers: ReadonlySet<ActivityBlocker>): boolean =>
  blockers.has('ad') || blockers.has('platform') || blockers.has('visibility');

export class GameplayActivityCoordinator {
  private readonly blockers = new Set<ActivityBlocker>();
  private readonly blockedListeners = new Set<BlockedListener>();
  private readonly blockersListeners = new Set<BlockersListener>();
  private desiredGameplay = false;
  private markedGameplay = false;
  private externallyBlocked = false;

  public constructor(
    private readonly startGameplay: () => void,
    private readonly stopGameplay: () => void,
  ) {}

  public setGameplayDesired(active: boolean): void {
    this.desiredGameplay = active;
    this.syncGameplayMarkup();
  }

  public setBlocked(reason: ActivityBlocker, blocked: boolean): void {
    const hadReason = this.blockers.has(reason);
    if (blocked) {
      this.blockers.add(reason);
    } else {
      this.blockers.delete(reason);
    }

    const blockerSetChanged = hadReason !== blocked;
    const nextBlocked = this.blockers.size > 0;
    if (nextBlocked !== this.externallyBlocked) {
      this.externallyBlocked = nextBlocked;
      for (const listener of this.blockedListeners) {
        listener(nextBlocked);
      }
    }

    if (blockerSetChanged) {
      const snapshot = new Set(this.blockers);
      for (const listener of this.blockersListeners) {
        listener(snapshot);
      }
    }

    this.syncGameplayMarkup();
  }

  public onBlockedChange(listener: BlockedListener): () => void {
    this.blockedListeners.add(listener);
    // A subscriber can attach after the platform already entered a blocked state
    // (for example while YaGames storage is still initializing). Replay the current
    // aggregate state so Phaser/WebAudio cannot miss that pause edge.
    listener(this.externallyBlocked);
    return () => this.blockedListeners.delete(listener);
  }

  public onBlockersChange(listener: BlockersListener): () => void {
    this.blockersListeners.add(listener);
    // Runtime suspension needs the actual reasons, not only the aggregate boolean:
    // the portrait gate should stop gameplay markup/audio without sleeping Phaser,
    // while ads/platform/visibility still require a real render-loop suspension.
    listener(new Set(this.blockers));
    return () => this.blockersListeners.delete(listener);
  }

  private syncGameplayMarkup(): void {
    const shouldBeMarked = this.desiredGameplay && this.blockers.size === 0;
    if (shouldBeMarked === this.markedGameplay) {
      return;
    }

    this.markedGameplay = shouldBeMarked;
    if (shouldBeMarked) {
      this.startGameplay();
    } else {
      this.stopGameplay();
    }
  }
}
