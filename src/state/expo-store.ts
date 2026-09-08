import { getExpoConfig, type ExpoConfig } from '../api/expo-api';

// Shown on the storefront whenever no admin-authored fallback message has
// been saved yet (a freshly created ExpoConfig row has fallbackMessage set
// server-side, but this covers the brief moment before the first load).
export const DEFAULT_FALLBACK_MESSAGE = 'Handwoven sarees, curated for every occasion — shop the collection today.';

class ExpoStore extends EventTarget {
  private _config: ExpoConfig | null = null;
  private _loading = false;
  private _loaded = false;
  private _loadPromise: Promise<void> | null = null;

  get config(): ExpoConfig | null {
    return this._config;
  }

  get loading(): boolean {
    return this._loading;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  load(): Promise<void> {
    if (this._loaded || this._loading) return this._loadPromise ?? Promise.resolve();
    return this.fetchNow();
  }

  refresh(): Promise<void> {
    return this.fetchNow();
  }

  // Called by the admin panel right after a successful save, so the change
  // reflects immediately for the editor without waiting on a refetch.
  setConfig(config: ExpoConfig) {
    this._config = config;
    this._loaded = true;
    this.dispatchEvent(new Event('change'));
  }

  private fetchNow(): Promise<void> {
    this._loading = true;
    this.dispatchEvent(new Event('change'));
    this._loadPromise = getExpoConfig()
      .then((config) => {
        this._config = config;
        this._loaded = true;
      })
      .catch(() => {
        // Server unreachable — the storefront just falls back to the
        // default hero rather than surfacing an error for a banner.
        this._loaded = true;
      })
      .finally(() => {
        this._loading = false;
        this.dispatchEvent(new Event('change'));
      });
    return this._loadPromise;
  }
}

export const expoStore = new ExpoStore();
