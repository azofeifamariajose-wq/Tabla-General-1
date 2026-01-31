
import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { Login } from './components/Login';
import { MEDICAL_SCHEMA } from './constants';
import { runExtractionAgent, runAuditAgent, runQAAgent, runSupervisorAgent } from './services/geminiService';
import { LogEntry, ProcessStatus, FileResult, AgentStep, User, TokenUsage } from './types';

const ADMIN_EMAIL = "azofeifamariajose@gmail.com";
const HISTORY_STORAGE_KEY = "mediExtract_history_v1";

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // App State
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ProcessStatus>('idle');
  const [activeFileIndex, setActiveFileIndex] = useState<number>(-1);
  const [batchResults, setBatchResults] = useState<FileResult[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [history, setHistory] = useState<FileResult[]>([]);
  
  // Per-file progress tracking
  const [currentStep, setCurrentStep] = useState<AgentStep | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00");

  // Load History on Mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (savedHistory) {
        try {
            setHistory(JSON.parse(savedHistory));
        } catch (e) {
            console.error("Failed to parse history", e);
        }
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'batch_processing' && startTime) {
        interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.floor((now - startTime) / 1000);
            const m = Math.floor(diff / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setElapsedTime(`${m}:${s}`);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, startTime]);

  const handleLogin = (email: string) => {
    const isAdmin = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
    setUser({
        email,
        name: email.split('@')[0],
        isAdmin,
        avatar: `https://ui-avatars.com/api/?name=${email}&background=6366f1&color=fff`
    });
  };

  const addLog = (fileIdx: number, message: string, type: LogEntry['type'] = 'info') => {
    setBatchResults(prev => {
        const newResults = [...prev];
        if (newResults[fileIdx]) {
          newResults[fileIdx].logs.push({ timestamp: new Date().toLocaleTimeString(), message, type });
        }
        return newResults;
    });
  };

  const updateUsage = (fileIdx: number, usage: TokenUsage) => {
    setBatchResults(prev => {
        const next = [...prev];
        if(next[fileIdx]) {
            next[fileIdx].tokenUsage = {
                promptTokens: next[fileIdx].tokenUsage.promptTokens + usage.promptTokens,
                outputTokens: next[fileIdx].tokenUsage.outputTokens + usage.outputTokens,
                totalTokens: next[fileIdx].tokenUsage.totalTokens + usage.totalTokens,
            };
        }
        return next;
    });
  };

  const saveToHistory = (result: FileResult) => {
    const completedResult = { ...result, completedAt: new Date().toISOString() };
    setHistory(prev => {
        const newHistory = [completedResult, ...prev];
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
        return newHistory;
    });
  };

  const startBatch = async () => {
    if (files.length === 0) return;
    setStatus('batch_processing');
    setStartTime(Date.now());
    setView('dashboard');

    // Initialize Result Structure for all files
    const initialBatch: FileResult[] = files.map(f => ({
        fileName: f.name,
        fileSize: f.size,
        status: 'pending',
        results: [],
        logs: [],
        tokenUsage: { promptTokens: 0, outputTokens: 0, totalTokens: 0 }
    }));
    setBatchResults(initialBatch);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < files.length; i++) {
        setActiveFileIndex(i);
        const file = files[i];
        
        setBatchResults(prev => {
            const next = [...prev];
            next[i].status = 'processing';
            return next;
        });

        addLog(i, `Starting Isolated Processing for: ${file.name}`, 'info');

        const callWithRetry = async (agentFn: () => Promise<any>, agentName: string) => {
          let attempts = 0;
          const maxAttempts = 5;
    
          while (attempts < maxAttempts) {
            try {
              return await agentFn();
            } catch (error: any) {
              const errorMessage = error.message || error.toString();
              if (errorMessage.includes('429') || errorMessage.includes('exhausted') || error.status === 429) {
                attempts++;
                const waitTime = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s...
                addLog(i, `Quota exceeded in ${agentName}. Retrying in ${waitTime/1000}s...`, 'warning');
                await delay(waitTime);
              } else {
                throw error; 
              }
            }
          }
          throw new Error(`Failed all retries for ${agentName}`);
        };

        try {
            // STEP 0: Supervisor PRE (AGENT 4)
            setCurrentStep('supervisor_pre');
            setProgress({ current: 0, total: 1 });
            const preCheck = await callWithRetry(() => runSupervisorAgent(file, 'PRE'), 'Agent 4 (Supervisor Pre)');
            updateUsage(i, preCheck.usage);
            addLog(i, `Agent 4 (Supervisor): ${preCheck.result}`, 'success');

            await delay(2000);

            // STEP 1: Extraction (AGENT 1) - FLASH
            setCurrentStep('extracting');
            const extractRes = await callWithRetry(
                () => runExtractionAgent(file, MEDICAL_SCHEMA, (c, t) => setProgress({ current: c, total: t })), 
                'Agent 1 (Extraction)'
            );
            updateUsage(i, extractRes.usage);
            addLog(i, `Agent 1: Extracted ${extractRes.items.length} sections.`, 'info');

            await delay(2000);

            // STEP 2: Audit (AGENT 2) - PRO
            setCurrentStep('auditing');
            const uniqueBlocks = new Set(extractRes.items.map((item: any) => item.block_id)).size;
            const auditRes = await callWithRetry(
                () => runAuditAgent(file, extractRes.items, (c, t) => setProgress({ current: c, total: uniqueBlocks })), 
                'Agent 2 (Audit)'
            );
            updateUsage(i, auditRes.usage);
            addLog(i, `Agent 2: Audit complete.`, 'info');

            await delay(2000);

            // STEP 3: QA (AGENT 3) - FLASH (per request)
            setCurrentStep('qa');
            addLog(i, `Agent 3: Initiating Mandatory QA Protocol...`, 'warning');
            const qaFinal = await callWithRetry(
                () => runQAAgent(file, auditRes.items, MEDICAL_SCHEMA, (c, t) => setProgress({ current: c, total: MEDICAL_SCHEMA.blocks.length })), 
                'Agent 3 (QA)'
            );
            updateUsage(i, qaFinal.usage);
            addLog(i, `Agent 3: QA Validation Passed. Protocol Secured.`, 'success');

            await delay(2000);

            // STEP 4: Supervisor POST (AGENT 4)
            setCurrentStep('supervisor_post');
            const postCheck = await callWithRetry(
                () => runSupervisorAgent(file, 'POST', qaFinal.items), 
                'Agent 4 (Supervisor Post)'
            );
            updateUsage(i, postCheck.usage);
            addLog(i, `Agent 4 (Isolation Final Check): ${postCheck.result}`, 'success');

            setBatchResults(prev => {
                const next = [...prev];
                next[i].status = 'completed';
                next[i].results = qaFinal.items;
                next[i].supervisorIsolationCheck = postCheck.result;
                // Save to history immediately upon success
                saveToHistory(next[i]);
                return next;
            });

        } catch (error) {
            addLog(i, `Error: ${error instanceof Error ? error.message : "Internal Error"}`, 'error');
            setBatchResults(prev => {
                const next = [...prev];
                next[i].status = 'error';
                return next;
            });
        }
    }

    setStatus('complete');
    setActiveFileIndex(-1);
  };

  /**
   * Helper to format a single file result into a CSV row (Wide Format)
   */
  const getWideCSVData = (fileResult: FileResult) => {
    const headers = ["Source File"];
    const rowData = [fileResult.fileName];

    MEDICAL_SCHEMA.blocks.forEach(block => {
      block.sections.forEach(section => {
        const key = `${block.block_name}_${section.section_name}`;
        headers.push(key);
        const item = fileResult.results.find(r => r.block_id === block.block_number && r.section_name === section.section_name);
        rowData.push(item ? item.answer : "N/A");
      });
    });

    return { headers, rowData };
  };

  const downloadCSV = (result: FileResult) => {
    if (!result || result.results.length === 0) return;

    const { headers, rowData } = getWideCSVData(result);
    
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      rowData.map(r => `"${String(r).replace(/"/g, '""')}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.fileName.replace('.pdf', '')}_wide_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCombinedCSV = () => {
    const completedResults = batchResults.filter(r => r.status === 'completed');
    if (completedResults.length === 0) return;

    const headers = ["Source File"];
    MEDICAL_SCHEMA.blocks.forEach(block => {
      block.sections.forEach(section => {
        headers.push(`${block.block_name}_${section.section_name}`);
      });
    });

    const rows = completedResults.map(res => {
      const { rowData } = getWideCSVData(res);
      return rowData.map(r => `"${String(r).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Batch_Consolidated_Report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => {
      if(confirm('Are you sure you want to clear the extraction history? This cannot be undone.')) {
          setHistory([]);
          localStorage.removeItem(HISTORY_STORAGE_KEY);
      }
  };

  if (!user) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">M</div>
             <div>
                <h1 className="text-sm font-bold text-white tracking-wide">MediExtract AI</h1>
                <p className="text-[10px] text-slate-500 uppercase">Audit Suite v3.2</p>
             </div>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
            <button 
                onClick={() => setView('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 font-medium text-sm transition-all rounded-lg ${
                    view === 'dashboard' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'hover:bg-slate-800'
                }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Dashboard
            </button>
            <button 
                onClick={() => setView('history')}
                className={`w-full flex items-center gap-3 px-4 py-3 font-medium text-sm transition-all rounded-lg ${
                    view === 'history' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'hover:bg-slate-800'
                }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                History Logs
            </button>

            {user.isAdmin && (
                <div className="mt-8">
                     <p className="px-4 text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2">Admin Controls</p>
                     <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        Global Settings
                    </button>
                </div>
            )}
        </nav>
        
        <div className="p-4 bg-slate-950/50">
             <div className="flex items-center gap-3 mb-3">
                 <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                 <div className="overflow-hidden">
                     <p className="text-xs font-bold text-white truncate">{user.name}</p>
                     <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                 </div>
             </div>
             {user.isAdmin && (
                 <span className="block text-center text-[9px] font-black bg-indigo-600 text-white rounded py-1 uppercase tracking-widest">
                     Admin Access
                 </span>
             )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-64 p-8 max-w-[1920px]">
        
        {view === 'history' ? (
            <div className="h-full flex flex-col">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Extraction History</h2>
                        <p className="text-slate-500 text-sm">Review and download previously processed articles</p>
                    </div>
                    {history.length > 0 && (
                        <button onClick={clearHistory} className="text-sm text-red-500 hover:text-red-700 font-bold border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50">
                            Clear History
                        </button>
                    )}
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-grow">
                    {history.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                             <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             <p>No history available yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-auto h-full">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3">Date Processed</th>
                                        <th className="px-6 py-3">File Name</th>
                                        <th className="px-6 py-3 text-center">Size</th>
                                        <th className="px-6 py-3 text-center">Tokens Used</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-mono text-slate-600">
                                                {item.completedAt ? new Date(item.completedAt).toLocaleString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{item.fileName}</td>
                                            <td className="px-6 py-4 text-center text-slate-500">{(item.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                                            <td className="px-6 py-4 text-center text-slate-500">
                                                <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs font-bold">
                                                    {item.tokenUsage?.totalTokens?.toLocaleString() || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => downloadCSV(item)}
                                                    className="font-medium text-indigo-600 hover:underline hover:text-indigo-800"
                                                >
                                                    Download CSV
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <>
                {/* Header Bar */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Extraction Workspace</h2>
                        <p className="text-slate-500 text-sm">Manage and audit your clinical documents</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {status === 'batch_processing' && (
                            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest">Processing {elapsedTime}</span>
                            </div>
                        )}
                        {status === 'complete' && (
                            <button 
                            onClick={downloadCombinedCSV}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                            >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download Consolidated Report
                            </button>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-8 h-[calc(100vh-160px)]">
                    
                    {/* Left Column: File List */}
                    <div className="col-span-3 flex flex-col gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documents ({files.length})</span>
                                {files.length > 0 && status === 'idle' && (
                                    <button onClick={() => {setFiles([]); setBatchResults([]); setStatus('idle');}} className="text-[10px] text-red-400 hover:text-red-600 font-bold">CLEAR ALL</button>
                                )}
                            </div>
                            
                            <div className="p-4">
                                {status === 'idle' ? <FileUpload onFilesSelect={(f) => { setFiles(f); setSelectedFileIndex(0); }} /> : null}
                            </div>

                            <div className="flex-grow overflow-y-auto px-4 pb-4 space-y-2">
                                {files.map((f, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setSelectedFileIndex(idx)}
                                        className={`group p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden ${
                                            selectedFileIndex === idx 
                                            ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-500' 
                                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={`text-sm font-bold truncate pr-4 ${selectedFileIndex === idx ? 'text-indigo-700' : 'text-slate-700'}`}>{f.name}</p>
                                            <div className="shrink-0">
                                                {batchResults[idx]?.status === 'processing' && <svg className="animate-spin w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                                {batchResults[idx]?.status === 'completed' && <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                {batchResults[idx]?.status === 'error' && <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                {batchResults[idx]?.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-300 mt-1"></div>}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] text-slate-400 font-mono">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                            {batchResults[idx]?.tokenUsage?.totalTokens > 0 && (
                                                <p className="text-[9px] font-mono text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                    {batchResults[idx].tokenUsage.totalTokens.toLocaleString()} Tok
                                                </p>
                                            )}
                                        </div>
                                        {idx === activeFileIndex && (
                                            <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {files.length > 0 && status === 'idle' && (
                                <div className="p-4 border-t border-slate-100 bg-slate-50">
                                    <button 
                                        onClick={startBatch}
                                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        Start Extraction Batch
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Middle: Content & Results */}
                    <div className="col-span-9 flex flex-col gap-6 h-full overflow-hidden">
                        {files.length > 0 ? (
                            <>
                                {/* Status Card (Active Processing) */}
                                {activeFileIndex === selectedFileIndex && status === 'batch_processing' && (
                                    <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl flex items-center justify-between border border-slate-700 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xs font-bold bg-indigo-500 px-2 py-0.5 rounded text-white uppercase tracking-wider">Active Agent</span>
                                                <h3 className="text-lg font-bold">{currentStep?.replace('_', ' ').toUpperCase()}</h3>
                                            </div>
                                            <p className="text-slate-400 text-sm">Processing block {progress.current} of {progress.total}</p>
                                        </div>
                                        <div className="relative z-10 text-right">
                                            <p className="text-3xl font-mono font-bold text-indigo-400">{Math.round((progress.current / progress.total) * 100)}%</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Completion</p>
                                        </div>
                                    </div>
                                )}

                                {/* Results Table */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-grow flex flex-col overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-slate-800">{files[selectedFileIndex].name}</h3>
                                            {batchResults[selectedFileIndex]?.status === 'completed' && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full tracking-wide flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                    QA Verified
                                                </span>
                                            )}
                                        </div>
                                        {batchResults[selectedFileIndex]?.status === 'completed' && (
                                            <button onClick={() => downloadCSV(batchResults[selectedFileIndex])} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                                                Export CSV
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="flex-grow overflow-auto scrollbar-thin scrollbar-thumb-slate-300">
                                        <table className="w-full border-collapse">
                                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Question</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Extracted Answer</th>
                                                    <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Page</th>
                                                    <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {batchResults[selectedFileIndex]?.results.map((item, i) => (
                                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 w-1/3">
                                                            <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter mb-1">Block {item.block_id}</p>
                                                            <p className="text-xs text-slate-700 font-medium leading-relaxed">{item.question}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="bg-white border border-slate-200 p-2 rounded text-xs text-slate-800 shadow-sm">
                                                                {item.answer}
                                                            </div>
                                                            {item.qa_notes && (
                                                                <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 p-1.5 rounded border border-amber-100 flex gap-2 items-start">
                                                                    <span className="font-bold shrink-0">QA Note:</span>
                                                                    {item.qa_notes}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-xs font-mono text-slate-500">{item.page_number}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            {item.status === 'VERIFIED' 
                                                                ? <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="Verified"></span>
                                                                : <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Corrected"></span>
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        
                                        {(!batchResults[selectedFileIndex] || batchResults[selectedFileIndex].results.length === 0) && (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                                                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                <p className="text-sm font-medium">No results available yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Logs Console */}
                                <div className="h-48 bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden flex flex-col">
                                    <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Logs</span>
                                        {batchResults[selectedFileIndex]?.tokenUsage && (
                                            <span className="text-[10px] font-mono text-indigo-400">
                                                Tokens Used: {batchResults[selectedFileIndex].tokenUsage.totalTokens.toLocaleString()} (Reset per article)
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-grow p-4 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar">
                                        {batchResults[selectedFileIndex]?.logs.map((log, i) => (
                                            <div key={i} className="flex gap-2">
                                                <span className="text-slate-600">[{log.timestamp}]</span>
                                                <span className={`${
                                                    log.type === 'error' ? 'text-red-400' :
                                                    log.type === 'success' ? 'text-green-400' :
                                                    log.type === 'warning' ? 'text-amber-400' :
                                                    'text-slate-300'
                                                }`}>{log.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-center opacity-60">
                                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <h2 className="text-xl font-bold text-slate-700">Ready to Analyze</h2>
                                <p className="text-slate-500 max-w-md mt-2">Upload your clinical trial PDFs to begin the multi-agent extraction and audit workflow.</p>
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}
      </main>
    </div>
  );
}
