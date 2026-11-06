import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import { DeveloperPage } from './pages/DeveloperPage.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/developer" element={<DeveloperPage />} />
      <Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
