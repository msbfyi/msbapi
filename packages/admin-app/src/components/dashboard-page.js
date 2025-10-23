import { html, css } from 'lit'
import { BaseComponent } from './base-component.js'
import { authState } from '../store/auth-signals.js'
import '@shoelace-style/shoelace/dist/components/icon/icon.js'
import { tailwindStylesheet } from '../styles/tailwind-shadow.js'

export class DashboardPage extends BaseComponent {
  static styles = [
    tailwindStylesheet,
    css`
      :host {
        display: block;
      }
    `,
  ]

  setupSubscriptions() {
    this.subscribe(authState)
  }

  render() {
    return html`
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p class="text-gray-600">Welcome back, ${authState.value.user?.email}!</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-card border-l-4 border-success-500">
          <h3 class="text-xs uppercase tracking-wider text-gray-600 mb-2">Total Users</h3>
          <p class="text-3xl font-semibold text-gray-900">1,234</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-card border-l-4 border-warning-500">
          <h3 class="text-xs uppercase tracking-wider text-gray-600 mb-2">Active Sessions</h3>
          <p class="text-3xl font-semibold text-gray-900">42</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-card border-l-4 border-danger-500">
          <h3 class="text-xs uppercase tracking-wider text-gray-600 mb-2">System Alerts</h3>
          <p class="text-3xl font-semibold text-gray-900">3</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-card border-l-4 border-primary-500">
          <h3 class="text-xs uppercase tracking-wider text-gray-600 mb-2">Revenue</h3>
          <p class="text-3xl font-semibold text-gray-900">$12,345</p>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-card">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div class="py-4 border-b border-gray-200 flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <sl-icon name="person-plus"></sl-icon>
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900 mb-1">New user registered</p>
            <p class="text-sm text-gray-600">2 minutes ago</p>
          </div>
        </div>
        <div class="py-4 border-b border-gray-200 flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <sl-icon name="gear"></sl-icon>
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900 mb-1">System configuration updated</p>
            <p class="text-sm text-gray-600">1 hour ago</p>
          </div>
        </div>
        <div class="py-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <sl-icon name="bell"></sl-icon>
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900 mb-1">New notification sent</p>
            <p class="text-sm text-gray-600">3 hours ago</p>
          </div>
        </div>
      </div>
    `
  }
}

customElements.define('dashboard-page', DashboardPage)
