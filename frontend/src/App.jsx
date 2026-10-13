import { BrowserRouter, Routes, Route } from 'react-router';
import AuthProvider from './auth/AuthContext.jsx';
import RequireAuth from './auth/RequireAuth.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import ResponsesPage from './pages/ResponsesPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CluesPage from './pages/CluesPage.jsx';
import LoginPage from './pages/users/LoginPage.jsx';
import RegisterPage from './pages/users/RegisterPage.jsx';
import ProfilePage from './pages/users/ProfilePage.jsx';
import ProfileRecordPage from './pages/users/ProfileRecordPage.jsx';
import UsersPage from './pages/users/UsersPage.jsx';
import RequireRole from './auth/RequireRole.jsx';
import { ROLES } from './constants/roles.js';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/usuarios/nuevo" element={<RegisterPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/historial" element={<ProfileRecordPage />} />
              <Route path="/seguimiento" element={<CluesPage />} />
              <Route element={<RequireRole roles={[ROLES.ADMIN]} />}>
                <Route path="/usuarios" element={<UsersPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/registro" element={<ResponsesPage />} />
                <Route path="/formulario" element={<ChatPage />} />
                <Route path="/formulario/resultado" element={<ResultPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}