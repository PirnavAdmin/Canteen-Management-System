import React from 'react';
import { AuthProvider } from './AuthProvider';
import { ToastProvider } from './ToastProvider';
import { CanteenProvider } from './CanteenProvider';
import { CategoryProvider } from './CategoryProvider';
import { ToastContainer } from '../../components/common/Toast';

export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <ToastProvider>
        <CanteenProvider>
          <CategoryProvider>
            {children}
            <ToastContainer />
          </CategoryProvider>
        </CanteenProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default AppProviders;
