import { html } from 'lit'
import { BasePage } from './base-page.js'
import { authState, authService } from '../store/auth-signals.js'

export class LoginForm extends BasePage {
  setupSubscriptions() {
    this.subscribe(authState)
  }

  render() {
    const { loading, error } = authState.value

    return html`
      <div class="flex min-h-screen items-center justify-center bg-gradient-brand p-4">
        <div class="bg-white rounded-xl shadow-card-lg p-12 w-full max-w-md">
          <div class="text-center mb-8">
            <div
              class="w-16 h-16 mx-auto mb-4 bg-gradient-brand rounded-xl flex items-center justify-center"
            >
              <wa-icon name="gauge" style="font-size: 2rem; color: white;"></wa-icon>
            </div>
            <h1 class="text-2xl font-semibold text-gray-900 mb-2">Admin Dashboard</h1>
            <p class="text-gray-600">Sign in to your account</p>
          </div>

          <form class="flex flex-col gap-6" @submit=${this._handleSubmit}>
            ${error
              ? html`<div
                  class="bg-danger-50 border border-red-300 text-danger-600 p-3 rounded-lg text-sm"
                >
                  ${error}
                </div>`
              : ''}

            <div class="flex flex-col gap-2">
              <label for="email" class="font-medium text-gray-700 text-sm">Email address</label>
              <wa-input
                id="email"
                name="email"
                type="email"
                required
                ?disabled=${loading}
                placeholder="Enter your email"
              >
                <wa-icon name="envelope" slot="prefix"></wa-icon>
              </wa-input>
            </div>

            <div class="flex flex-col gap-2">
              <label for="password" class="font-medium text-gray-700 text-sm">Password</label>
              <wa-input
                id="password"
                name="password"
                type="password"
                required
                ?disabled=${loading}
                placeholder="Enter your password"
              >
                <wa-icon name="lock" slot="prefix"></wa-icon>
              </wa-input>
            </div>

            <div class="flex flex-col gap-4 mt-4">
              <wa-button
                type="submit"
                variant="primary"
                size="large"
                ?loading=${loading}
                ?disabled=${loading}
              >
                ${loading
                  ? html`
                      <div class="flex items-center justify-center gap-2">
                        <wa-icon name="arrow-rotate-right" class="animate-spin"></wa-icon>
                        Signing in...
                      </div>
                    `
                  : 'Sign In'}
              </wa-button>

              <div class="text-center">
                <a
                  href="#"
                  @click=${this._handleForgotPassword}
                  class="text-brand-purple hover:underline text-sm"
                >
                  Forgot your password?
                </a>
              </div>
            </div>
          </form>
        </div>
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
