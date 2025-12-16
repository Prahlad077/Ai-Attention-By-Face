import React, { useState, useRef } from 'react';
import { Shield, UserPlus, Trash2, Key, User, BookOpen, Edit2, School, Upload, Save, X } from 'lucide-react';
import { User as UserType, SchoolConfig } from '../types';

interface AdminPanelProps {
  users: UserType[];
  onAddUser: (user: UserType) => void;
  onEditUser: (user: UserType) => void;
  onDeleteUser: (username: string) => void;
  currentUser: UserType;
  schoolConfig: SchoolConfig;
  onUpdateSchoolConfig: (config: SchoolConfig) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  users, 
  onAddUser, 
  onEditUser,
  onDeleteUser, 
  currentUser,
  schoolConfig,
  onUpdateSchoolConfig
}) => {
  // User Form State
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
  const [assignedClass, setAssignedClass] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // School Config State
  const [schoolName, setSchoolName] = useState(schoolConfig.name);
  const [schoolLogo, setSchoolLogo] = useState(schoolConfig.logo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [configSuccess, setConfigSuccess] = useState('');

  const handleEditClick = (user: UserType) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword(user.password);
    setName(user.name);
    setRole(user.role);
    setAssignedClass(user.assignedClass || '');
    setUserError('');
    setUserSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setName('');
    setRole('teacher');
    setAssignedClass('');
    setUserError('');
    setUserSuccess('');
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!username || !password || !name) {
      setUserError('All fields are required');
      return;
    }

    if (role === 'teacher' && !assignedClass) {
      setUserError('Teachers must be assigned a Class Section');
      return;
    }

    if (!editingUser && users.some(u => u.username === username)) {
      setUserError('Username already exists');
      return;
    }

    const userData: UserType = {
      username,
      password,
      name,
      role,
      assignedClass: role === 'teacher' ? assignedClass : undefined
    };

    if (editingUser) {
        onEditUser(userData);
        setUserSuccess('User updated successfully!');
        handleCancelEdit(); // Reset form
    } else {
        onAddUser(userData);
        setUserSuccess('User created successfully!');
        handleCancelEdit(); // Reset form
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchoolConfig({
        name: schoolName,
        logo: schoolLogo
    });
    setConfigSuccess('School settings saved!');
    setTimeout(() => setConfigSuccess(''), 3000);
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="p-8 flex items-center justify-center h-full text-slate-500">
        Access Denied. Admin privileges required.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="bg-slate-900 p-3 rounded-xl">
           <Shield className="text-white w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Admin Panel</h2>
          <p className="text-slate-500">System configuration and user management</p>
        </div>
      </div>

      {/* School Settings Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <School className="text-indigo-600" /> School Settings
          </h3>
          <form onSubmit={handleConfigSubmit} className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                  <input 
                      type="text" 
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
              </div>
              <div className="flex-1 w-full">
                   <label className="block text-sm font-medium text-slate-700 mb-1">School Logo</label>
                   <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 flex items-center justify-center overflow-hidden">
                            {schoolLogo ? (
                                <img src={schoolLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <School size={20} className="text-slate-400" />
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleLogoUpload} 
                        />
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm flex items-center gap-2"
                        >
                            <Upload size={16} /> Upload Logo
                        </button>
                   </div>
              </div>
              <button 
                type="submit" 
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                  <Save size={18} /> Save Settings
              </button>
          </form>
          {configSuccess && <p className="text-green-600 text-sm mt-2">{configSuccess}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create/Edit User Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 sticky top-4">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              {editingUser ? <Edit2 className="text-indigo-600" /> : <UserPlus className="text-indigo-600" />} 
              {editingUser ? 'Edit User' : 'Create Credentials'}
            </h3>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teacher Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Mr. Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!!editingUser} // Cannot change username when editing
                  className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${editingUser ? 'bg-slate-100 text-slate-500' : ''}`}
                  placeholder="e.g. smith_math"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    placeholder="Set password"
                  />
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value as 'teacher' | 'admin')}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                {role === 'teacher' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                    <input
                      type="text"
                      value={assignedClass}
                      onChange={(e) => setAssignedClass(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. 10-A"
                    />
                  </div>
                )}
              </div>

              {userError && <p className="text-red-500 text-sm">{userError}</p>}
              {userSuccess && <p className="text-green-500 text-sm">{userSuccess}</p>}

              <div className="flex gap-2 mt-4">
                  {editingUser && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-all"
                      >
                          Cancel
                      </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
                  >
                    {editingUser ? 'Update User' : 'Create Account'}
                  </button>
              </div>
            </form>
          </div>
        </div>

        {/* User List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
               <h3 className="text-xl font-bold text-slate-800">Authorized Users</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Name</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Username</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Role / Class</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.username} className={`hover:bg-slate-50/50 ${editingUser?.username === user.username ? 'bg-indigo-50' : ''}`}>
                      <td className="p-4 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                          <User size={16} />
                        </div>
                        <span className="font-medium text-slate-900">{user.name}</span>
                        {user.username === currentUser.username && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">You</span>}
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-sm">{user.username}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {user.role}
                            </span>
                            {user.role === 'teacher' && user.assignedClass && (
                                <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border">
                                    <BookOpen size={10} /> Class {user.assignedClass}
                                </span>
                            )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEditClick(user)}
                                className="text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-lg"
                                title="Edit User"
                            >
                                <Edit2 size={18} />
                            </button>
                            {user.username !== 'prahald' && user.username !== currentUser.username && (
                            <button
                                onClick={() => onDeleteUser(user.username)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                title="Delete User"
                            >
                                <Trash2 size={18} />
                            </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;