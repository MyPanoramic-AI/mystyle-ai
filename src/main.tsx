import {createRoot} from 'react-dom/client';
import { AccountRoot } from './account/AccountRoot.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<AccountRoot />);
