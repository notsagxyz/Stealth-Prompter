import { render } from 'solid-js/web';
import HudApp from './App';
import '../index.css';

const root = document.getElementById('root');
if (root) {
  render(() => <HudApp />, root);
}
