import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentRegistry from './components/StudentRegistry';
import LiveScanner from './components/LiveScanner';
import Reports from './components/Reports';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import { View, Student, AttendanceRecord, User, SchoolConfig } from './types';

// Mock Data for initial state
const INITIAL_STUDENTS: Student[] = [];

// The requested Super Admin
const SUPER_ADMIN: User = {
  username: 'prahald',
  password: 'Prahlad@12',
  name: 'Prahlad (Super Admin)',
  role: 'admin'
};

const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  name: 'EduScan AI',
  logo: '' // Empty string implies default icon
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Data States
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([SUPER_ADMIN]);
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(DEFAULT_SCHOOL_CONFIG);

  // Load data on mount
  useEffect(() => {
    const savedStudents = localStorage.getItem('eduscan_students');
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    
    const savedRecords = localStorage.getItem('eduscan_records');
    if (savedRecords) setRecords(JSON.parse(savedRecords));

    const savedUsers = localStorage.getItem('eduscan_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers([SUPER_ADMIN]);
      localStorage.setItem('eduscan_users', JSON.stringify([SUPER_ADMIN]));
    }

    const savedConfig = localStorage.getItem('eduscan_config');
    if (savedConfig) setSchoolConfig(JSON.parse(savedConfig));
  }, []);

  // Persist data on change
  useEffect(() => {
    localStorage.setItem('eduscan_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('eduscan_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('eduscan_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('eduscan_config', JSON.stringify(schoolConfig));
  }, [schoolConfig]);

  // Filter data based on current user role and class
  const filteredStudents = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'teacher' && currentUser.assignedClass) {
        return students.filter(s => s.classSection === currentUser.assignedClass);
    }
    return students; // Admins see all
  }, [students, currentUser]);

  const filteredRecords = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'teacher' && currentUser.assignedClass) {
        const classStudentIds = students
            .filter(s => s.classSection === currentUser.assignedClass)
            .map(s => s.id);
        
        return records.filter(r => classStudentIds.includes(r.studentId));
    }
    return records;
  }, [records, students, currentUser]);

  // Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleEditUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.username === updatedUser.username ? updatedUser : u));
  };

  const handleDeleteUser = (username: string) => {
    setUsers(prev => prev.filter(u => u.username !== username));
  };

  const handleAddStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
  };

  const handleEditStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleMarkAttendance = (record: AttendanceRecord) => {
    const recentRecord = records.find(r => 
      r.studentId === record.studentId && 
      r.date === record.date &&
      Math.abs(new Date(`1970/01/01 ${r.timestamp}`).getTime() - new Date(`1970/01/01 ${record.timestamp}`).getTime()) < 60000
    );

    if (!recentRecord) {
      setRecords(prev => [record, ...prev]);
    }
  };

  // View Router
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard students={filteredStudents} records={filteredRecords} />;
      case 'students':
        return (
          <StudentRegistry 
            students={filteredStudents} 
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            currentUser={currentUser!}
          />
        );
      case 'live':
        return (
          <LiveScanner 
            students={filteredStudents} 
            onMarkAttendance={handleMarkAttendance} 
          />
        );
      case 'reports':
        return <Reports records={filteredRecords} students={filteredStudents} />;
      case 'admin':
        return (
          <AdminPanel 
            users={users} 
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            currentUser={currentUser!}
            schoolConfig={schoolConfig}
            onUpdateSchoolConfig={setSchoolConfig}
          />
        );
      default:
        return <Dashboard students={filteredStudents} records={filteredRecords} />;
    }
  };

  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} schoolConfig={schoolConfig} />;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#f3f4f6]">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        currentUser={currentUser}
        onLogout={handleLogout}
        schoolConfig={schoolConfig}
      />
      
      <main className="flex-1 h-screen overflow-hidden flex flex-col md:ml-64 transition-all duration-300 pb-20 md:pb-0">
        {/* Mobile Title Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-10 sticky top-0">
          <span className="font-bold text-slate-800 flex items-center gap-2 text-lg tracking-tight truncate">
            {schoolConfig.logo ? (
                 <img src={schoolConfig.logo} alt="Logo" className="w-6 h-6 rounded object-cover" />
            ) : (
                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-sm font-bold">AI</span>
            )}
            {schoolConfig.name}
          </span>
          <div className="flex items-center gap-2">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                {currentUser.role === 'teacher' && <p className="text-[10px] text-slate-500">Class {currentUser.assignedClass}</p>}
             </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              {currentUser.name.charAt(0)}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;