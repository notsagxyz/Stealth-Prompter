import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import { render } from 'solid-js/web';
import HudApp from './App';
import '../index.css';

const root = document.getElementById('root');
if (root) {
  render(() => <HudApp />, root);
}
