import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Payments from './pages/Payments';
import Plans from './pages/Plans';
import Network from './pages/Network';

function PrivateLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 36px', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#151b22', border: '1px solid #1e2d3d', color: '#e8edf3', fontFamily: 'Sora, sans-serif', fontSize: 13 },
            success: { iconTheme: { primary: '#00e676', secondary: '#000' } },
            error: { iconTheme: { primary: '#ff4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
          <Route path="/clients" element={<PrivateLayout><Clients /></PrivateLayout>} />
          <Route path="/payments" element={<PrivateLayout><Payments /></PrivateLayout>} />
          <Route path="/plans" element={<PrivateLayout><Plans /></PrivateLayout>} />
          <Route path="/network" element={<PrivateLayout><Network /></PrivateLayout>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
