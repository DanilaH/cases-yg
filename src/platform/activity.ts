export type ActivityBlocker = 'ad' | 'platform' | 'visibility';

type BlockedListener = (blocked: boolean) => void;

export class GameplayActivityCoordinator {
  private readonly blockers = new Set<ActivityBlocker>();
  private readonly blockedListeners = new Set<BlockedListener>();
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
    if (blocked) {
      this.blockers.add(reason);
    } else {
      this.blockers.delete(reason);
    }

    const nextBlocked = this.blockers.size > 0;
    if (nextBlocked !== this.externallyBlocked) {
      this.externallyBlocked = nextBlocked;
      for (const listener of this.blockedListeners) {
        listener(nextBlocked);
      }
    }

    this.syncGameplayMarkup();
  }

  public onBlockedChange(listener: BlockedListener): () => void {
    this.blockedListeners.add(listener);
    return () => this.blockedListeners.delete(listener);
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
