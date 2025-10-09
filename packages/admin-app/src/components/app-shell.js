import { html, css } from 'lit'
import { BaseComponent } from './base-component.js'
import { authState, isAuthenticated, authService } from '../store/auth-signals.js'

// Import Shoelace components
import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/icon/icon.js'

export class AppShell extends BaseComponent {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
    }

    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1400px;
      margin: 0 auto;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: white;
    }

    .logo sl-icon {
      font-size: 1.5rem;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: white;
    }

    .user-menu sl-button::part(base) {
      color: white;
    }

    .main-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidebar {
      width: 250px;
      background: white;
      border-right: 1px solid #e5e7eb;
      padding: 1rem;
      overflow-y: auto;
    }

    .nav-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      color: #374151;
      text-decoration: none;
      transition: background-color 0.2s;
      cursor: pointer;
    }

    .nav-item:hover {
      background: #f3f4f6;
    }

    .nav-item.active {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .main-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      background: #f9fafb;
    }

    .content-wrapper {
      max-width: 1400px;
      margin: 0 auto;
    }

    .footer {
      background: white;
      border-top: 1px solid #e5e7eb;
      padding: 1rem 2rem;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      gap: 1rem;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }
    }
  `

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
        <div class="loading-state">
          <sl-icon
            name="arrow-clockwise"
            style="font-size: 2rem; animation: spin 1s linear infinite;"
          ></sl-icon>
          <span>Loading...</span>
        </div>
      `
    }

    if (!isAuthenticated.value) {
      return html`<login-form></login-form>`
    }

    return html`
      <div class="app-layout">
        <!-- Header -->
        <header class="header">
          <div class="header-content">
            <div class="logo">
              <sl-icon name="speedometer"></sl-icon>
              Admin Dashboard
            </div>
            <div class="user-menu">
              <span>${authState.value.user?.email}</span>
              <sl-button variant="text" @click=${this._handleSignOut}>
                <sl-icon name="box-arrow-right" slot="prefix"></sl-icon>
                Sign Out
              </sl-button>
            </div>
          </div>
        </header>

        <!-- Main Layout -->
        <div class="main-layout">
          <!-- Sidebar -->
          <aside class="sidebar">
            <nav class="nav-items">
              <div
                class="nav-item ${this.currentView === 'dashboard' ? 'active' : ''}"
                @click=${() => this._setView('dashboard')}
              >
                <sl-icon name="house"></sl-icon>
                Dashboard
              </div>
              <div
                class="nav-item ${this.currentView === 'users' ? 'active' : ''}"
                @click=${() => this._setView('users')}
              >
                <sl-icon name="people"></sl-icon>
                Users (Coming Soon)
              </div>
              <div
                class="nav-item ${this.currentView === 'settings' ? 'active' : ''}"
                @click=${() => this._setView('settings')}
              >
                <sl-icon name="gear"></sl-icon>
                Settings (Coming Soon)
              </div>
            </nav>
          </aside>

          <!-- Main Content -->
          <main class="main-content">
            <div class="content-wrapper">${this._renderCurrentView()}</div>
          </main>
        </div>

        <!-- Footer -->
        <footer class="footer">
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
