import { Outlet } from 'react-router';
import AppHeader from './AppHeader.jsx';

export default function AppLayout() {
  return (
    <div className="flex h-dvh flex-col"> 
      <AppHeader />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <Outlet />
      </main>
    </div>
  );
}