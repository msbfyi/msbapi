// Import global styles
import './styles/globals.css'

// Web Awesome will be loaded via CDN in index.html

// Import all components
import './components/base-component.js'
import './components/base-page.js'
import './components/login-form.js'
import './components/dashboard-page.js'
import './components/app-shell.js'

// Initialize the application
document.body.innerHTML = '<app-shell></app-shell>'

console.log('MSB Admin App initialized')
