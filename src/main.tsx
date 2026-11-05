import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { MedicationProvider } from './context/MedicationContext';
import { PharmacyProvider } from './context/PharmacyContext';
import { ChatProvider } from './context/ChatContext';
import { OrderProvider } from './context/OrderContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <LanguageProvider>
        <AuthProvider>
          <MedicationProvider>
            <PharmacyProvider>
              <OrderProvider>
                <ChatProvider>
                  <App />
                </ChatProvider>
              </OrderProvider>
            </PharmacyProvider>
          </MedicationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ToastProvider>
  </React.StrictMode>
);
