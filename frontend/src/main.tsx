import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './App';
import { setOnUnauthorised } from './api-client';
import { clearSession } from './auth-slice';
import { createAppStore } from './store';
import './index.css';

const store = createAppStore();

setOnUnauthorised(() => {
  store.dispatch(clearSession());
});

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element was not found');
}

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
