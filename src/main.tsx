import {createRoot} from 'react-dom/client';
import { AccountRoot } from './account/AccountRoot.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AccountRoot />
  </ErrorBoundary>,
);
