import { html, css } from 'lit'
import { BaseComponent } from './base-component.js'
import { authState, authService } from '../store/auth-signals.js'

// Import Shoelace components
import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/input/input.js'
import '@shoelace-style/shoelace/dist/components/icon/icon.js'

export class LoginForm extends BaseComponent {
  static styles = css`
    :host {
      display: flex;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .login-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      padding: 3rem;
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      width: 64px;
      height: 64px;
      margin: 0 auto 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo sl-icon {
      color: white;
    }

    h1 {
      margin: 0 0 0.5rem;
      color: #1a1a1a;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .subtitle {
      color: #666;
      margin: 0;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    sl-input {
      --border-radius: 8px;
    }

    .form-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1rem;
    }

    .forgot-password {
      text-align: center;
    }

    .forgot-password a {
      color: #667eea;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .forgot-password a:hover {
      text-decoration: underline;
    }

    .error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `

  setupSubscriptions() {
    this.subscribe(authState)
  }

  render() {
    const { loading, error } = authState.value

    return html`
      <div class="login-container">
        <div class="login-header">
          <div class="logo">
            <sl-icon name="speedometer" style="font-size: 2rem;"></sl-icon>
          </div>
          <h1>Admin Dashboard</h1>
          <p class="subtitle">Sign in to your account</p>
        </div>

        <form class="form" @submit=${this._handleSubmit}>
          ${error ? html`<div class="error">${error}</div>` : ''}

          <div class="field">
            <label for="email">Email address</label>
            <sl-input
              id="email"
              name="email"
              type="email"
              required
              ?disabled=${loading}
              placeholder="Enter your email"
            >
              <sl-icon name="envelope" slot="prefix"></sl-icon>
            </sl-input>
          </div>

          <div class="field">
            <label for="password">Password</label>
            <sl-input
              id="password"
              name="password"
              type="password"
              required
              ?disabled=${loading}
              placeholder="Enter your password"
            >
              <sl-icon name="lock" slot="prefix"></sl-icon>
            </sl-input>
          </div>

          <div class="form-actions">
            <sl-button
              type="submit"
              variant="primary"
              size="large"
              ?loading=${loading}
              ?disabled=${loading}
            >
              ${loading
                ? html`
                    <div class="loading">
                      <sl-icon
                        name="arrow-clockwise"
                        style="animation: spin 1s linear infinite;"
                      ></sl-icon>
                      Signing in...
                    </div>
                  `
                : 'Sign In'}
            </sl-button>

            <div class="forgot-password">
              <a href="#" @click=${this._handleForgotPassword}> Forgot your password? </a>
            </div>
          </div>
        </form>
      </div>
    `
  }

  async _handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')

    const result = await authService.signIn(email, password)
    if (result.error) {
      console.error('Login failed:', result.error)
    }
  }

  _handleForgotPassword(e) {
    e.preventDefault()
    // TODO: Implement forgot password flow in Phase 2
    alert('Forgot password functionality will be implemented in Phase 2')
  }
}

customElements.define('login-form', LoginForm)
