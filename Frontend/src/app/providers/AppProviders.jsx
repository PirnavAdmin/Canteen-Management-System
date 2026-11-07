import React from 'react';
import { ToastProvider } from './ToastProvider';
import { CanteenProvider } from './CanteenProvider';
import { CategoryProvider } from './CategoryProvider';
import { ToastContainer } from '../../components/common/Toast';

export const AppProviders = ({ children }) => {
  return (
    <ToastProvider>
      <CanteenProvider>
        <CategoryProvider>
          {children}
          <ToastContainer />
        </CategoryProvider>
      </CanteenProvider>
    </ToastProvider>
  );
};

