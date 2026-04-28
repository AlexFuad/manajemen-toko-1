import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Placeholder pages for different roles
const AdminDashboard = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <h1 className="text-3xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
    <p className="text-gray-600">Welcome to the admin dashboard</p>
  </div>
);

const KasierPOS = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <h1 className="text-3xl font-bold text-gray-800 mb-4">Kasier POS</h1>
    <p className="text-gray-600">Point of Sale System</p>
  </div>
);

const OwnerReports = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <h1 className="text-3xl font-bold text-gray-800 mb-4">Owner Reports</h1>
    <p className="text-gray-600">Sales and profit reports</p>
  </div>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name}!</h2>
        <p className="text-gray-600">Your role: <span className="font-semibold">{user?.role}</span></p>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/kasir/pos"
          element={
            <ProtectedRoute allowedRoles={['kasir']}>
              <KasierPOS />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/owner/reports"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <OwnerReports />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
