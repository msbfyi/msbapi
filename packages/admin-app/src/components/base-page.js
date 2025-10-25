import { LitElement } from 'lit'

/**
 * BasePage - Base component for page-level components
 * Uses Light DOM to enable Tailwind CSS styling
 *
 * Use this for:
 * - Pages and routes
 * - Layout components
 * - Components that need Tailwind utilities
 */
export class BasePage extends LitElement {
  constructor() {
    super()
    this._subscriptions = []
  }

  // Remove Shadow DOM to enable Tailwind styling
  createRenderRoot() {
    return this
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
