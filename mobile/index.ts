import { registerRootComponent } from 'expo';
import App from './App';

// Register root component synchronously so the native app finds the entry point.
// RTL and i18n bootstrap run inside App (see App.tsx).
registerRootComponent(App);
