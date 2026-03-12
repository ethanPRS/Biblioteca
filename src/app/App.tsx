import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { BookProvider } from './context/BookContext';
import { LoanProvider } from './context/LoanContext';
import { LoanRequestProvider } from './context/LoanRequestContext';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <BookProvider>
        <LoanProvider>
          <LoanRequestProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" richColors />
          </LoanRequestProvider>
        </LoanProvider>
      </BookProvider>
    </AuthProvider>
  );
}

export default App;