import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Loading from '@/components/common/Loading';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Layout from '@/components/layout/Layout';

// Code splitting (рівень 3, завдання 1): кожна сторінка — окремий chunk,
// у початковий бандл потрапляє лише каркас і публічні сторінки входу/реєстрації.
const HomePage = lazy(() => import('@/pages/HomePage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ConsultationsListPage = lazy(() => import('@/pages/ConsultationsListPage'));
const ConsultationFormPage = lazy(() => import('@/pages/ConsultationFormPage'));
const ConsultationDetailPage = lazy(() => import('@/pages/ConsultationDetailPage'));
const LawyersListPage = lazy(() => import('@/pages/LawyersListPage'));
const LawyerDetailPage = lazy(() => import('@/pages/LawyerDetailPage'));
const SpecializationsListPage = lazy(() => import('@/pages/SpecializationsListPage'));
const SpecializationFormPage = lazy(() => import('@/pages/SpecializationFormPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));

export default function App() {
  return (
    <BrowserRouter>
      {/* Сторінка — маленький chunk: спинер саме на час його завантаження */}
      <Suspense fallback={<Loading text="Завантаження сторінки..." />}>
        <Routes>
          {/* Публічні сторінки без каркасу */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* Публічні сторінки з Header/Footer */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>

          {/* Захищений кабінет із бічною панеллю */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/consultations" element={<ConsultationsListPage />} />
            <Route path="/consultations/create" element={<ConsultationFormPage />} />
            <Route path="/consultations/:id" element={<ConsultationDetailPage />} />
            <Route path="/consultations/:id/edit" element={<ConsultationFormPage />} />
            <Route path="/lawyers" element={<LawyersListPage />} />
            <Route path="/lawyers/:id" element={<LawyerDetailPage />} />
            <Route path="/specializations" element={<SpecializationsListPage />} />
            <Route
              path="/specializations/create"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <SpecializationFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/specializations/:id/edit"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <SpecializationFormPage />
                </ProtectedRoute>
              }
            />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
