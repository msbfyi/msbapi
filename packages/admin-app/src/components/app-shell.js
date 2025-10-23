import { html } from 'lit'
import { BasePage } from './base-page.js'
import { authState, isAuthenticated, authService } from '../store/auth-signals.js'

// Import Shoelace components
import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/icon/icon.js'

export class AppShell extends BasePage {
  constructor() {
    super()
    this.currentView = 'dashboard'
  }

  setupSubscriptions() {
    this.subscribe(authState)
    this.subscribe(isAuthenticated)
  }

  render() {
    if (authState.value.loading) {
      return html`
        <div class="flex justify-center items-center h-screen gap-4">
          <sl-icon name="arrow-clockwise" class="animate-spin text-3xl"></sl-icon>
          <span>Loading...</span>
        </div>
      `
    }

    if (!isAuthenticated.value) {
      return html`<login-form></login-form>`
    }

    return html`
      <div class="flex flex-col h-screen">
        <!-- Header -->
        <header class="bg-gradient-brand text-white px-8 py-4 shadow-card">
          <div class="flex justify-between items-center max-w-screen-2xl mx-auto">
            <div class="flex items-center gap-3 text-xl font-semibold">
              <sl-icon name="speedometer" style="font-size: 1.5rem;"></sl-icon>
              Admin Dashboard
            </div>
            <div class="flex items-center gap-4">
              <span class="text-white">${authState.value.user?.email}</span>
              <sl-button variant="text" @click=${this._handleSignOut}>
                <sl-icon name="box-arrow-right" slot="prefix" style="color: white;"></sl-icon>
                <span style="color: white;">Sign Out</span>
              </sl-button>
            </div>
          </div>
        </header>

        <!-- Main Layout -->
        <div class="flex flex-1 overflow-hidden">
          <!-- Sidebar -->
          <aside class="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto md:block hidden">
            <nav class="flex flex-col gap-2">
              <div
                class="flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-colors ${this
                  .currentView === 'dashboard'
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'}"
                @click=${() => this._setView('dashboard')}
              >
                <sl-icon name="house"></sl-icon>
                Dashboard
              </div>
              <div
                class="flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-colors ${this
                  .currentView === 'users'
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'}"
                @click=${() => this._setView('users')}
              >
                <sl-icon name="people"></sl-icon>
                Users (Coming Soon)
              </div>
              <div
                class="flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-colors ${this
                  .currentView === 'settings'
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'}"
                @click=${() => this._setView('settings')}
              >
                <sl-icon name="gear"></sl-icon>
                Settings (Coming Soon)
              </div>
            </nav>
          </aside>

          <!-- Main Content -->
          <main class="flex-1 p-8 overflow-y-auto bg-gray-50">
            <div class="max-w-screen-2xl mx-auto">${this._renderCurrentView()}</div>
          </main>
        </div>

        <!-- Footer -->
        <footer
          class="bg-white border-t border-gray-200 px-8 py-4 text-center text-gray-500 text-sm"
        >
          <p>&copy; 2025 MSB Admin Dashboard. All rights reserved.</p>
        </footer>
      </div>
    `
  }

  _renderCurrentView() {
    switch (this.currentView) {
      case 'dashboard':
        return html`<dashboard-page></dashboard-page>`
      case 'users':
        return html`<div>Users page will be implemented in Phase 2</div>`
      case 'settings':
        return html`<div>Settings page will be implemented in Phase 2</div>`
      default:
        return html`<dashboard-page></dashboard-page>`
    }
  }

  _setView(view) {
    this.currentView = view
    this.requestUpdate()
  }

  async _handleSignOut() {
    await authService.signOut()
  }
}

customElements.define('app-shell', AppShell)
