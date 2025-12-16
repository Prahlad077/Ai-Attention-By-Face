import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Camera, Save, Trash2, UserPlus, Upload, Image as ImageIcon, Users, Edit2, X } from 'lucide-react';
import { Student, User } from '../types';

interface StudentRegistryProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  currentUser: User;
}

const StudentRegistry: React.FC<StudentRegistryProps> = ({ students, onAddStudent, onEditStudent, onDeleteStudent, currentUser }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [classSection, setClassSection] = useState('');

  // Auto-fill class if teacher
  useEffect(() => {
    if (!editingId && currentUser.role === 'teacher' && currentUser.assignedClass) {
        setClassSection(currentUser.assignedClass);
    }
  }, [currentUser, editingId]);

  const handleEditClick = (student: Student) => {
    setEditingId(student.id);
    setName(student.name);
    setRollNo(student.rollNumber);
    setClassSection(student.classSection);
    setCapturedImage(student.photoUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setRollNo('');
    // Reset class logic
    if (currentUser.role === 'teacher' && currentUser.assignedClass) {
        setClassSection(currentUser.assignedClass);
    } else {
        setClassSection('');
    }
    setCapturedImage(null);
    stopCamera();
  };

  // Group students by class
  const groupedStudents = useMemo(() => {
    const groups: Record<string, Student[]> = {};
    students.forEach(student => {
      const cls = student.classSection && student.classSection.trim() !== '' ? student.classSection : 'Unassigned';
      if (!groups[cls]) groups[cls] = [];
      groups[cls].push(student);
    });
    return groups;
  }, [students]);

  const sortedClasses = useMemo(() => Object.keys(groupedStudents).sort(), [groupedStudents]);

  const startCamera = async () => {
    try {
      setCapturedImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        stopCamera(); // Stop camera if it was running
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rollNo || !classSection || !capturedImage) {
      alert("Please fill all fields and provide a photo.");
      return;
    }
    
    if (editingId) {
        // Update existing
        const updatedStudent: Student = {
            id: editingId,
            name,
            rollNumber: rollNo,
            classSection,
            photoUrl: capturedImage,
            registeredAt: new Date().toISOString() // Or keep original
        };
        onEditStudent(updatedStudent);
        handleCancelEdit();
    } else {
        // Create New
        const newStudent: Student = {
            id: Date.now().toString(),
            name,
            rollNumber: rollNo,
            classSection,
            photoUrl: capturedImage,
            registeredAt: new Date().toISOString()
        };
        onAddStudent(newStudent);
        setName('');
        setRollNo('');
        if (currentUser.role === 'admin') setClassSection('');
        setCapturedImage(null);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-full pb-24 md:pb-8">
      <h2 className="text-3xl font-bold text-slate-800 mb-8">Student Registry</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 md:sticky md:top-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              {editingId ? <Edit2 className="text-indigo-600" /> : <UserPlus className="text-indigo-600" />}
              {editingId ? 'Edit Student' : 'New Registration'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Roll Number</label>
                  <input 
                    type="text" 
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Class / Section</label>
                  <input 
                    type="text" 
                    value={classSection}
                    onChange={(e) => setClassSection(e.target.value)}
                    disabled={currentUser.role === 'teacher'} // Lock for teachers
                    className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${currentUser.role === 'teacher' ? 'bg-slate-100 text-slate-500' : ''}`}
                    placeholder="e.g. 10-A"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Reference Photo</label>
                
                <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border-2 border-dashed border-slate-300 flex flex-col items-center justify-center">
                  {!isCameraActive && !capturedImage && (
                    <div className="text-center p-4">
                      <ImageIcon className="mx-auto text-slate-400 mb-2" size={32} />
                      <p className="text-sm text-slate-500">No photo selected</p>
                    </div>
                  )}
                  
                  {isCameraActive && (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  )}
                  
                  {capturedImage && !isCameraActive && (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  )}
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                />

                <div className="grid grid-cols-2 gap-2">
                  {!isCameraActive ? (
                    <>
                      <button 
                        type="button" 
                        onClick={startCamera}
                        className="py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Camera size={18} /> Camera
                      </button>
                      <button 
                        type="button" 
                        onClick={triggerFileUpload}
                        className="py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload size={18} /> Upload
                      </button>
                    </>
                  ) : (
                    <>
                       <button 
                        type="button" 
                        onClick={capturePhoto}
                        className="col-span-2 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Capture Frame
                      </button>
                    </>
                  )}
                  
                  {(isCameraActive || capturedImage) && (
                     <button 
                      type="button" 
                      onClick={() => {stopCamera(); setCapturedImage(null);}}
                      className="col-span-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      Clear / Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                {editingId && (
                    <button 
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-all flex items-center justify-center"
                    >
                        Cancel
                    </button>
                )}
                <button 
                    type="submit" 
                    className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                >
                    <Save size={20} /> {editingId ? 'Update Student' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Student List grouped by Class */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-slate-800">Class Lists ({students.length} Total)</h3>
            <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border">
                {currentUser.role === 'teacher' ? `Class ${currentUser.assignedClass}` : 'All Classes'}
            </span>
          </div>

          {students.length === 0 ? (
             <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <UserPlus className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500">No students registered yet.</p>
                <p className="text-sm text-slate-400">Add students using the form to start.</p>
              </div>
          ) : (
            sortedClasses.map(className => (
               <div key={className} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-4 border-b border-slate-200 pb-3">
                     <Users className="text-indigo-500" size={24} />
                     <h4 className="text-lg font-bold text-slate-700">Class {className}</h4>
                     <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                        {groupedStudents[className].length} Students
                     </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedStudents[className].map(student => (
                      <div key={student.id} className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all ${editingId === student.id ? 'ring-2 ring-indigo-500' : ''}`}>
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-100 flex-shrink-0 relative">
                          <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 truncate">{student.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">Roll: {student.rollNumber}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <button 
                                onClick={() => handleEditClick(student)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit Student"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => onDeleteStudent(student.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove Student"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRegistry;