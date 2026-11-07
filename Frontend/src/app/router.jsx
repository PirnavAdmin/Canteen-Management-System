import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import {
  CanteenListPage,
  AddCanteenPage,
  EditCanteenPage,
  CanteenDetailsPage
} from '../modules/canteen';
import {
  CategoryListPage,
  AddCategoryPage,
  EditCategoryPage,
  CategoryDetailsPage
} from '../modules/categories';
import { NotFoundPage } from '../components/common/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/canteen" replace />
      },
      // Canteen Management Routes
      {
        path: 'canteen',
        children: [
          {
            index: true,
            element: <CanteenListPage />
          },
          {
            path: 'create',
            element: <AddCanteenPage />
          },
          {
            path: ':id',
            element: <CanteenDetailsPage />
          },
          {
            path: ':id/edit',
            element: <EditCanteenPage />
          }
        ]
      },
      // Categories Management Routes
      {
        path: 'categories',
        children: [
          {
            index: true,
            element: <CategoryListPage />
          },
          {
            path: 'create',
            element: <AddCategoryPage />
          },
          {
            path: ':id',
            element: <CategoryDetailsPage />
          },
          {
            path: ':id/edit',
            element: <EditCategoryPage />
          }
        ]
      },
      // 404 Fallback Route
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
]);

