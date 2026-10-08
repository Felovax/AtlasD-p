import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/soft.css';
import '@fontsource-variable/fraunces/soft-italic.css';
import '@fontsource-variable/caveat';
import './styles/global.css';
import App from './App';

// «…/admin» uten skråstrek på slutten: send videre til oversiktssiden (GitHub Pages gjør dette selv,
// men ikke alle servere gjør det).
if (window.location.pathname.endsWith('/admin')) {
  window.location.replace(`${window.location.pathname}/${window.location.search}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
