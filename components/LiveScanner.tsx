import React, { useRef, useState, useEffect } from 'react';
import { Camera, Scan, CheckCircle, XCircle, AlertTriangle, Play, Pause, Loader2 } from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { analyzeFrame } from '../services/geminiService';

interface LiveScannerProps {
  students: Student[];
  onMarkAttendance: (record: AttendanceRecord) => void;
}

const LiveScanner: React.FC<LiveScannerProps> = ({ students, onMarkAttendance }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && autoMode && !isProcessing) {
      interval = setInterval(() => {
        handleScan();
      }, 8000); // Auto scan every 8 seconds
    }
    return () => clearInterval(interval);
  }, [isActive, autoMode, isProcessing]);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 10));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        addLog("Camera started");
      }
    } catch (err) {
      console.error(err);
      addLog("Error accessing camera");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsActive(false);
      setAutoMode(false);
      addLog("Camera stopped");
    }
  };

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    addLog("Scanning frame...");

    try {
      // Capture frame
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameBase64 = canvas.toDataURL('image/jpeg', 0.6); // Compress for speed

      // Send to AI
      const result = await analyzeFrame(frameBase64, students);
      setLastScanResult(result);

      // Process Result
      if (result.matchId) {
        const student = students.find(s => s.id === result.matchId);
        if (student) {
          if (result.isRealPerson) {
            
            const record: AttendanceRecord = {
              id: Date.now().toString(),
              studentId: student.id,
              studentName: student.name,
              timestamp: new Date().toLocaleTimeString(),
              date: new Date().toISOString().split('T')[0],
              status: AttendanceStatus.PRESENT,
              confidence: result.confidence,
              emotion: result.emotion,
              notes: result.description
            };
            
            onMarkAttendance(record);
            addLog(`✅ Marked ${student.name} as PRESENT`);
          } else {
            // Proxy Attempt
            const record: AttendanceRecord = {
              id: Date.now().toString(),
              studentId: student.id,
              studentName: student.name,
              timestamp: new Date().toLocaleTimeString(),
              date: new Date().toISOString().split('T')[0],
              status: AttendanceStatus.PROXY_ATTEMPT,
              confidence: result.confidence,
              emotion: result.emotion,
              notes: "Spoofing Detected: " + result.description
            };
            onMarkAttendance(record);
            addLog(`⚠️ Proxy Attempt blocked for ${student.name}`);
          }
        }
      } else {
        addLog(`ℹ️ ${result.description}`);
      }

    } catch (error) {
      console.error(error);
      addLog("❌ Scan failed: AI Error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Live AI Classroom</h2>
          <p className="text-slate-500">Real-time identification and anti-spoofing</p>
        </div>
        <div className="flex gap-3">
            {!isActive ? (
                <button onClick={startCamera} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200">
                    <Camera size={20} /> Start Camera
                </button>
            ) : (
                <>
                     <button 
                        onClick={() => setAutoMode(!autoMode)} 
                        className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors border ${autoMode ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                    >
                        {autoMode ? <Pause size={20} /> : <Play size={20} />} Auto Scan
                    </button>
                    <button onClick={stopCamera} className="bg-red-50 text-red-600 hover:bg-red-100 px-6 py-2 rounded-lg font-semibold transition-colors">
                        Stop
                    </button>
                </>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Main Feed */}
        <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl aspect-video flex items-center justify-center group">
                {!isActive && (
                    <div className="text-center text-slate-500">
                        <Scan className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Camera feed inactive</p>
                    </div>
                )}
                <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${!isActive ? 'hidden' : ''}`} />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Overlay Scanning Effect */}
                {isProcessing && (
                     <div className="absolute inset-0 bg-indigo-900/20 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="flex flex-col items-center animate-pulse">
                            <Loader2 className="w-12 h-12 text-white animate-spin mb-2" />
                            <span className="text-white font-mono font-bold tracking-widest bg-black/50 px-3 py-1 rounded">ANALYZING...</span>
                        </div>
                     </div>
                )}

                {/* Face Box Overlay (Simulated UI) */}
                {isActive && !isProcessing && (
                    <div className="absolute inset-0 pointer-events-none border-[3px] border-white/20 m-8 rounded-lg">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1"></div>
                    </div>
                )}
            </div>

            {/* Manual Scan Button */}
            {isActive && (
                <button 
                    onClick={handleScan} 
                    disabled={isProcessing}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                    <Scan size={20} /> {isProcessing ? 'Processing...' : 'Scan Now'}
                </button>
            )}
        </div>

        {/* Live Analytics Panel */}
        <div className="flex flex-col gap-4 min-h-0">
            {/* Last Result Card */}
            <div className={`p-6 rounded-2xl border shadow-sm transition-all duration-300 ${
                !lastScanResult ? 'bg-white border-slate-200' :
                lastScanResult.matchId && lastScanResult.isRealPerson ? 'bg-green-50 border-green-200' :
                lastScanResult.matchId && !lastScanResult.isRealPerson ? 'bg-red-50 border-red-200' :
                'bg-yellow-50 border-yellow-200'
            }`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">AI Analysis Result</h3>
                
                {lastScanResult ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            {lastScanResult.matchId && lastScanResult.isRealPerson ? (
                                <CheckCircle className="text-green-600 w-8 h-8" />
                            ) : lastScanResult.matchId ? (
                                <AlertTriangle className="text-red-600 w-8 h-8" />
                            ) : (
                                <XCircle className="text-yellow-600 w-8 h-8" />
                            )}
                            <div>
                                <p className="font-bold text-lg leading-tight text-slate-900">
                                    {lastScanResult.matchId ? (students.find(s => s.id === lastScanResult.matchId)?.name || 'Unknown ID') : 'No Match'}
                                </p>
                                <p className="text-sm text-slate-500">{lastScanResult.matchId ? `Confidence: ${Math.round(lastScanResult.confidence * 100)}%` : 'Unknown Subject'}</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                             <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-slate-500">Liveness:</span>
                                <span className={`font-medium ${lastScanResult.isRealPerson ? 'text-green-700' : 'text-red-700'}`}>
                                    {lastScanResult.isRealPerson ? 'PASS' : 'FAIL (Possible Proxy)'}
                                </span>
                             </div>
                             <div className="flex justify-between border-b border-black/5 pb-1">
                                <span className="text-slate-500">Emotion:</span>
                                <span className="font-medium text-slate-800">{lastScanResult.emotion || 'N/A'}</span>
                             </div>
                        </div>
                        <p className="text-xs text-slate-500 italic bg-white/50 p-2 rounded">
                            "{lastScanResult.description}"
                        </p>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                        Waiting for scan...
                    </div>
                )}
            </div>

            {/* Logs */}
            <div className="bg-slate-900 rounded-2xl p-4 flex-1 overflow-hidden flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">System Logs</h3>
                <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
                    {logs.length === 0 && <span className="text-slate-600">System ready...</span>}
                    {logs.map((log, i) => (
                        <div key={i} className="text-slate-300 border-l-2 border-slate-700 pl-2 py-0.5">
                            <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveScanner;