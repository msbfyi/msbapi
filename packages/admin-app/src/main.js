// Import Shoelace theme and icons
import '@shoelace-style/shoelace/dist/themes/light.css'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'

// Set the base path for Shoelace assets
setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/')

// Import global styles
import './styles/globals.css'

// Import all components
import './components/base-component.js'
import './components/login-form.js'
import './components/dashboard-page.js'
import './components/app-shell.js'

// Initialize the application
document.body.innerHTML = '<app-shell></app-shell>'

console.log('MSB Admin App initialized')
