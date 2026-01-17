
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { api, AuthProvider, useAuth } from './context/AuthContext';
import type { Event, ReferenceData } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { EventForm } from './components/EventForm';
import { EventGrid } from './components/EventGrid';
import { ReferenceManager } from './components/ReferenceManager';
import { ReportsPage } from './components/reports/ReportsPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPanel } from './pages/AdminPanel';

// Обёртка защищённых маршрутов
const ProtectedRoute = () => {
  const { token, user } = useAuth();
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function AppContent() {
  const [refData, setRefData] = useState<ReferenceData | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { token } = useAuth(); // Only fetch if authenticated

  const fetchData = () => {
    if (!token) return;

    api.get('/reference-data')
      .then(res => setRefData(res.data))
      .catch(err => console.error('Failed to load metadata', err));

    api.get('/events')
      .then(res => setEvents(res.data))
      .catch(err => console.error('Failed to load events', err));
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger, token]); // Re-fetch on login

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSuccess = () => {
    handleRefresh();
    alert('Запись успешно сохранена!');
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={
            <Dashboard refreshTrigger={refreshTrigger} />
          } />

          <Route path="register" element={
            <div className="max-w-7xl mx-auto">
              {refData ? (
                <EventForm
                  substations={refData.substations}
                  tps={refData.tps}
                  lines={refData.lines}
                  reasons={refData.reasons}
                  onSuccess={handleSuccess}
                />
              ) : (
                <div className="text-center p-12 text-gray-400">Загрузка справочников...</div>
              )}
            </div>
          } />

          <Route path="journal" element={
            <div className="h-full flex flex-col">
              <EventGrid events={events} refData={refData} onRefresh={handleRefresh} />
            </div>
          } />

          <Route path="reports" element={
            <ReportsPage events={events} refData={refData} />
          } />


          <Route path="references" element={
            refData ? (
              <ReferenceManager data={refData} onRefresh={handleRefresh} />
            ) : (
              <div className="text-center p-12 text-gray-400">Загрузка...</div>
            )
          } />

          <Route path="admin" element={<AdminPanel />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
