import React from 'react';
import { Users, UserCheck, UserX, Clock, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';

interface DashboardProps {
  students: Student[];
  records: AttendanceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, records }) => {
  const totalStudents = students.length;
  // Get unique present students today
  const today = new Date().toISOString().split('T')[0];
  const todaysRecords = records.filter(r => r.date === today);
  const presentCount = new Set(todaysRecords.filter(r => r.status === AttendanceStatus.PRESENT).map(r => r.studentId)).size;
  const proxyAttempts = todaysRecords.filter(r => r.status === AttendanceStatus.PROXY_ATTEMPT).length;
  const absentCount = totalStudents - presentCount;

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'bg-blue-500' },
    { label: 'Present Today', value: presentCount, icon: UserCheck, color: 'bg-green-500' },
    { label: 'Absent Today', value: absentCount < 0 ? 0 : absentCount, icon: UserX, color: 'bg-red-500' },
    { label: 'Proxy Attempts', value: proxyAttempts, icon: AlertTriangle, color: 'bg-orange-500' },
  ];

  const pieData = [
    { name: 'Present', value: presentCount, color: '#22c55e' },
    { name: 'Absent', value: absentCount < 0 ? 0 : absentCount, color: '#ef4444' },
  ];

  // Dummy weekly data (can be made real if desired, keeping simple for now)
  const barData = [
    { day: 'Mon', present: Math.round(totalStudents * 0.9), absent: Math.round(totalStudents * 0.1) },
    { day: 'Tue', present: Math.round(totalStudents * 0.85), absent: Math.round(totalStudents * 0.15) },
    { day: 'Wed', present: Math.round(totalStudents * 0.92), absent: Math.round(totalStudents * 0.08) },
    { day: 'Thu', present: Math.round(totalStudents * 0.88), absent: Math.round(totalStudents * 0.12) },
    { day: 'Fri', present: presentCount, absent: absentCount < 0 ? 0 : absentCount },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-slate-800">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className={`${stat.color} p-4 rounded-xl text-white shadow-lg shadow-blue-500/20`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Attendance Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Weekly Trend</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="present" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="absent" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;