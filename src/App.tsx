import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Layout from '@/components/layout/Layout';

const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ConsultationDetailPage = lazy(() => import('@/pages/ConsultationDetailPage'));
const ConsultationFormPage = lazy(() => import('@/pages/ConsultationFormPage'));
const ConsultationsListPage = lazy(() => import('@/pages/ConsultationsListPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const LawyerDetailPage = lazy(() => import('@/pages/LawyerDetailPage'));
const LawyersListPage = lazy(() => import('@/pages/LawyersListPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const SpecializationFormPage = lazy(() => import('@/pages/SpecializationFormPage'));
const SpecializationsListPage = lazy(() => import('@/pages/SpecializationsListPage'));

function RouteFallback() {
  return (
    <div className="grid min-h-40 place-items-center text-gray-500">Завантаження сторінки…</div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
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
