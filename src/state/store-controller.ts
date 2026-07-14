import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface Store {
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

/**
 * Bridges a plain EventTarget-based store to a Lit host: re-renders the
 * host whenever the store fires a 'change' event.
 */
export class StoreController implements ReactiveController {
  private host: ReactiveControllerHost;
  private store: Store;
  private onChange = () => this.host.requestUpdate();

  constructor(host: ReactiveControllerHost, store: Store) {
    this.host = host;
    this.store = store;
    host.addController(this);
  }

  hostConnected() {
    this.store.addEventListener('change', this.onChange);
  }

  hostDisconnected() {
    this.store.removeEventListener('change', this.onChange);
  }
}
