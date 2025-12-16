import React from 'react';
import { LayoutDashboard, Users, ScanFace, FileBarChart, LogOut, GraduationCap, Shield } from 'lucide-react';
import { View, User, SchoolConfig } from '../types';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  currentUser: User;
  onLogout: () => void;
  schoolConfig: SchoolConfig;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, currentUser, onLogout, schoolConfig }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Attendance', icon: ScanFace },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ];

  // Only add Admin Panel if user is admin
  if (currentUser.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <>
      {/* Desktop Sidebar - Hidden on Mobile */}
      <div className="hidden md:flex fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white shadow-xl z-30 flex-col">
        <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-500 p-2 rounded-lg flex items-center justify-center overflow-hidden w-10 h-10">
                {schoolConfig.logo ? (
                     <img src={schoolConfig.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                    <GraduationCap className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold tracking-tight truncate" title={schoolConfig.name}>{schoolConfig.name}</h1>
                <p className="text-xs text-slate-400">v1.4.0</p>
              </div>
            </div>
            
            <div className="bg-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-400 capitalize">{currentUser.role}</p>
              </div>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as View)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors rounded-xl hover:bg-slate-800"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Hidden on Desktop */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 px-2 py-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-around items-center pb-safe">
        {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as View)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[64px] ${
                  isActive
                    ? 'text-indigo-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-indigo-50' : ''}`}>
                   <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium mt-0.5 ${isActive ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
              </button>
            );
          })}
          
          <button
             onClick={onLogout}
             className="flex flex-col items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-500 min-w-[64px]"
          >
             <div className="p-1">
                <LogOut size={22} strokeWidth={2} />
             </div>
             <span className="text-[10px] font-medium mt-0.5 opacity-80">Logout</span>
          </button>
      </div>
    </>
  );
};

export default Sidebar;