
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Clusters from './pages/Clusters';
import Employees from './pages/Employees';
import EmployeeForm from './pages/EmployeeForm';
import Salary from './pages/Salary';
import Requests from './pages/Requests';
import ChatGroups from './pages/ChatGroups';
import AttendanceReport from './pages/AttendanceReport';
import EmployeeRules from './pages/EmployeeRules';
import AttendanceView from './pages/AttendanceView';
import './components/Layout.css'; // Load global CSS

import Dashboard from './pages/Dashboard';

// Auth guard component
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/add" element={<EmployeeForm />} />
          <Route path="employees/edit/:id" element={<EmployeeForm />} />
          <Route path="attendance-report" element={<AttendanceReport />} />
          <Route path="chat" element={<ChatGroups />} />
          <Route path="clusters" element={<Clusters />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
