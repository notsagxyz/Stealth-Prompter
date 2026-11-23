import { render } from 'solid-js/web';
import LauncherApp from './App';
import '../index.css';

const root = document.getElementById('root');
if (root) {
  render(() => <LauncherApp />, root);
}
