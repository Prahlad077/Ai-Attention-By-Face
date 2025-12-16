import React, { useState, useMemo } from 'react';
import { Download, Search, Filter, Calendar } from 'lucide-react';
import { AttendanceRecord, Student, AttendanceStatus } from '../types';

interface ReportsProps {
  records: AttendanceRecord[];
  students: Student[];
}

const Reports: React.FC<ReportsProps> = ({ records, students }) => {
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');

  // Monthly Calculations
  const monthlyStats = useMemo(() => {
    if (reportType !== 'monthly') return [];

    const [year, month] = selectedMonth.split('-').map(Number);
    
    // Filter records for selected month
    const monthRecords = records.filter(r => {
        const rDate = new Date(r.date);
        return rDate.getFullYear() === year && (rDate.getMonth() + 1) === month;
    });

    // Calculate total unique days attendance was taken in this month
    const uniqueDays = new Set(monthRecords.map(r => r.date)).size;
    const totalDays = uniqueDays > 0 ? uniqueDays : 0; // Avoid div by zero

    return students.map(student => {
        const studentRecords = monthRecords.filter(r => r.studentId === student.id);
        const presentCount = studentRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
        // Absent is total possible days minus days present
        const absentCount = totalDays - presentCount;
        
        return {
            student,
            present: presentCount,
            absent: absentCount < 0 ? 0 : absentCount, // Safety check
            percentage: totalDays === 0 ? 0 : Math.round((presentCount / totalDays) * 100)
        };
    }).filter(stat => stat.student.name.toLowerCase().includes(searchTerm.toLowerCase()));

  }, [records, students, selectedMonth, reportType, searchTerm]);

  const exportCSV = () => {
    let csvContent = "";
    
    if (reportType === 'monthly') {
        const headers = ["Student Name", "Roll No", "Class", "Total Present", "Total Absent", "Percentage"];
        csvContent = [
            headers.join(","),
            ...monthlyStats.map(s => 
                [s.student.name, s.student.rollNumber, s.student.classSection, s.present, s.absent, `${s.percentage}%`].join(",")
            )
        ].join("\n");
    } else {
        // Daily Dump
        const headers = ["ID", "Student Name", "Date", "Time", "Status", "Confidence", "Emotion", "Notes"];
        csvContent = [
            headers.join(","),
            ...records.map(r => 
                [r.studentId, r.studentName, r.date, r.timestamp, r.status, r.confidence, r.emotion, `"${r.notes}"`].join(",")
            )
        ].join("\n");
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${reportType}-${selectedMonth}.csv`;
    a.click();
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-3xl font-bold text-slate-800">Attendance Report</h2>
           <p className="text-slate-500">Track monthly progress and daily logs</p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center">
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setReportType('daily')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${reportType === 'daily' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Daily Logs
                </button>
                <button 
                    onClick={() => setReportType('monthly')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${reportType === 'monthly' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Monthly Summary
                </button>
            </div>

            {reportType === 'monthly' && (
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                </div>
            )}

            <div className="relative flex-1 max-w-md ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by student name..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
            {reportType === 'monthly' ? (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Student Name</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Roll No</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Class</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Present (Days)</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Absent (Days)</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Percentage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {monthlyStats.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No data found for selected month.</td></tr>
                        ) : (
                            monthlyStats.map((stat, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-900">{stat.student.name}</td>
                                    <td className="p-4 text-slate-600 text-sm">{stat.student.rollNumber}</td>
                                    <td className="p-4 text-slate-600 text-sm">{stat.student.classSection}</td>
                                    <td className="p-4 text-green-600 font-bold">{stat.present}</td>
                                    <td className="p-4 text-red-500 font-bold">{stat.absent}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                                                <div className={`h-full rounded-full ${stat.percentage >= 75 ? 'bg-green-500' : stat.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${stat.percentage}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{stat.percentage}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Date & Time</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Student Name</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Status</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">Emotion</th>
                            <th className="p-4 font-semibold text-slate-600 text-sm border-b border-slate-200">AI Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400">No attendance records found yet.</td>
                            </tr>
                        ) : (
                            records.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 text-slate-600 text-sm">
                                        <div className="font-medium text-slate-900">{record.date}</div>
                                        <div className="text-xs">{record.timestamp}</div>
                                    </td>
                                    <td className="p-4 text-slate-900 font-medium">
                                        {record.studentName}
                                        <div className="text-xs text-slate-400">ID: {record.studentId}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            record.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                                            record.status === 'PROXY_ATTEMPT' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {record.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm">{record.emotion || '-'}</td>
                                    <td className="p-4 text-slate-500 text-xs max-w-xs truncate" title={record.notes}>
                                        {record.notes}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
};

export default Reports;