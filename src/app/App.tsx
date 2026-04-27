import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { BookProvider } from './context/BookContext';
import { LoanProvider } from './context/LoanContext';
import { LoanRequestProvider } from './context/LoanRequestContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuditLogProvider } from './context/AuditLogContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <AuditLogProvider>
        <SettingsProvider>
          <BookProvider>
            <LoanProvider>
              <LoanRequestProvider>
                <NotificationProvider>
                  <RouterProvider router={router} />
                  <Toaster position="top-right" richColors />
                </NotificationProvider>
              </LoanRequestProvider>
            </LoanProvider>
          </BookProvider>
        </SettingsProvider>
      </AuditLogProvider>
    </AuthProvider>
  );
}

export default App;