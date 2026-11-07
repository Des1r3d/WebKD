import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './lib/AuthProvider';
import { router } from './router';

export default () => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);
