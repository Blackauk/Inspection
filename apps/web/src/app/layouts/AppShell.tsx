import { Outlet } from 'react-router-dom';
import { SideMenu } from '../../components/common/SideMenu';
import { TopBar } from '../../components/common/TopBar';
import { ToastContainer } from '../../components/common/Toast';

export function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SideMenu />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
