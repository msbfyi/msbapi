import { html, css } from 'lit'
import { BaseComponent } from './base-component.js'
import { authState } from '../store/auth-signals.js'
import '@shoelace-style/shoelace/dist/components/icon/icon.js'

export class DashboardPage extends BaseComponent {
  static styles = css`
    :host {
      display: block;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .dashboard-header h1 {
      margin: 0 0 0.5rem;
      color: #1a1a1a;
    }

    .dashboard-header p {
      margin: 0;
      color: #666;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border-left: 4px solid var(--accent-color, #667eea);
    }

    .stat-card h3 {
      margin: 0 0 0.5rem;
      color: #374151;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
    }

    .recent-activity {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .recent-activity h2 {
      margin: 0 0 1rem;
      color: #1a1a1a;
    }

    .activity-item {
      padding: 1rem 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      margin: 0 0 0.25rem;
      font-weight: 500;
      color: #1a1a1a;
    }

    .activity-time {
      margin: 0;
      font-size: 0.875rem;
      color: #666;
    }
  `

  setupSubscriptions() {
    this.subscribe(authState)
  }

  render() {
    return html`
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, ${authState.value.user?.email}!</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card" style="--accent-color: #10b981">
          <h3>Total Users</h3>
          <p class="stat-value">1,234</p>
        </div>
        <div class="stat-card" style="--accent-color: #f59e0b">
          <h3>Active Sessions</h3>
          <p class="stat-value">42</p>
        </div>
        <div class="stat-card" style="--accent-color: #ef4444">
          <h3>System Alerts</h3>
          <p class="stat-value">3</p>
        </div>
        <div class="stat-card" style="--accent-color: #8b5cf6">
          <h3>Revenue</h3>
          <p class="stat-value">$12,345</p>
        </div>
      </div>

      <div class="recent-activity">
        <h2>Recent Activity</h2>
        <div class="activity-item">
          <div class="activity-icon">
            <sl-icon name="person-plus"></sl-icon>
          </div>
          <div class="activity-content">
            <p class="activity-title">New user registered</p>
            <p class="activity-time">2 minutes ago</p>
          </div>
        </div>
        <div class="activity-item">
          <div class="activity-icon">
            <sl-icon name="gear"></sl-icon>
          </div>
          <div class="activity-content">
            <p class="activity-title">System configuration updated</p>
            <p class="activity-time">1 hour ago</p>
          </div>
        </div>
        <div class="activity-item">
          <div class="activity-icon">
            <sl-icon name="bell"></sl-icon>
          </div>
          <div class="activity-content">
            <p class="activity-title">New notification sent</p>
            <p class="activity-time">3 hours ago</p>
          </div>
        </div>
      </div>
    `
  }
}

customElements.define('dashboard-page', DashboardPage)
