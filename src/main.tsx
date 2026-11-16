import { createRoot } from 'react-dom/client'
import './styles/app.css'
import { App } from './App'
import { boot } from './store'
createRoot(document.getElementById('root')!).render(<App />)
void boot()
