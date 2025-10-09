import { LitElement } from 'lit'

export class BaseComponent extends LitElement {
  constructor() {
    super()
    this._subscriptions = []
  }

  // Helper to subscribe to signals
  subscribe(signal, callback) {
    const unsubscribe = signal.subscribe(() => {
      callback?.(signal.value)
      this.requestUpdate()
    })
    this._subscriptions.push(unsubscribe)
    return unsubscribe
  }

  connectedCallback() {
    super.connectedCallback()
    this.setupSubscriptions?.()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._subscriptions.forEach(unsub => unsub())
    this._subscriptions = []
  }
}
