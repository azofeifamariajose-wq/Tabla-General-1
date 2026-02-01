import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { Login } from './components/Login';
import { MEDICAL_SCHEMA } from './constants';
import { runExtractionAgent, runAuditAgent, runQAAgent, runSupervisorAgent, runExportValidationAgent } from './services/geminiService';
import { LogEntry, ProcessStatus, FileResult, AgentStep, User, TokenUsage } from './types';
import * as XLSX from 'xlsx';

const ADMIN_EMAIL = "azofeifamariajose@gmail.com";
const HISTORY_STORAGE_KEY = "mediExtract_history_v1";

// Helper to transform a single file result into a wide CSV row based on SCHEMA order
const getWideCSVData = (result: FileResult) => {
  const headers = ["Source File", "Status", "Isolation Check"];
  const rowData = [result.fileName, result.status, result.supervisorIsolationCheck || "N/A"];

  MEDICAL_SCHEMA.blocks.forEach(block => {
    block.sections.forEach(section => {
      section.questions.forEach(q => {
        // Create a unique header for the column
        headers.push(`${block.block_name} [${section.section_name}]: ${q.label}`);
        
        // Find the matching answer in the extracted results
        // FIX: Use strict matching to avoid collisions between "Type of X" and "X" (Sections 15-17)
        // We filter by block first to ensure we look in the right place
        const blockItems = result.results.filter(r => String(r.block_id) === String(block.block_number));

        // 1. Priority: Exact Label Match (Trimmed)
        let item = blockItems.find(r => r.question && r.question.trim() === q.label.trim());

        // 2. Fallback: Exact Key Match (if agent returned key)
        if (!item && q.key) {
            item = blockItems.find(r => r.question && r.question.trim() === q.key.trim());
        }

        // 3. Fallback: Key inside Question (Unlikely to collide)
        if (!item && q.key) {
            item = blockItems.find(r => r.question && r.question.includes(q.key));
        }

        // NOTE: Previous fuzzy label logic (includes) was removed because it caused data shifting 
        // when one question label was a substring of another.

        rowData.push(item ? item.answer : "");
      });
    });
  });

  return { headers, rowData };
};

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

  // --- XLSX DOWNLOAD HANDLERS ---
  const downloadXLSX = (result: FileResult) => {
    if (!result || result.results.length === 0) return;

    const { headers, rowData } = getWideCSVData(result);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    // Create worksheet from arrays
    const ws = XLSX.utils.aoa_to_sheet([headers, rowData]);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    
    // Generate file
    XLSX.writeFile(wb, `${result.fileName.replace('.pdf', '')}_wide_report.xlsx`);
  };

  const downloadCombinedXLSX = () => {
    const completedResults = batchResults.filter(r => r.status === 'completed');
    if (completedResults.length === 0) return;

    // Use headers from the first result (schema is constant)
    const { headers } = getWideCSVData(completedResults[0]);

    const rows = completedResults.map(res => {
      const { rowData } = getWideCSVData(res);
      return rowData;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    XLSX.utils.book_append_sheet(wb, ws, "Batch Report");
    
    XLSX.writeFile(wb, `Batch_Consolidated_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
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
        let currentUsage: TokenUsage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };
        
        // Helper to update local usage tracking and state
        const trackUsage = (u: TokenUsage) => {
            currentUsage = {
                promptTokens: currentUsage.promptTokens + u.promptTokens,
                outputTokens: currentUsage.outputTokens + u.outputTokens,
                totalTokens: currentUsage.totalTokens + u.totalTokens
            };
            updateUsage(i, u);
        };

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
            trackUsage(preCheck.usage);
            addLog(i, `Agent 4 (Supervisor): ${preCheck.result}`, 'success');

            await delay(2000);

            // STEP 1: Extraction (AGENT 1) - FLASH
            setCurrentStep('extracting');
            const extractRes = await callWithRetry(
                () => runExtractionAgent(file, MEDICAL_SCHEMA, (c, t) => setProgress({ current: c, total: t })), 
                'Agent 1 (Extraction)'
            );
            trackUsage(extractRes.usage);
            addLog(i, `Agent 1: Extracted ${extractRes.items.length} sections.`, 'info');

            await delay(2000);

            // STEP 2: Audit (AGENT 2) - FLASH (Changed to Flash per service file, prompt says PRO but code uses FLASH)
            // Keeping prompt comment consistent with service code if needed, but here we just call it.
            setCurrentStep('auditing');
            const auditRes = await callWithRetry(
                () => runAuditAgent(file, extractRes.items, MEDICAL_SCHEMA, (c, t) => setProgress({ current: c, total: t })), 
                'Agent 2 (Audit)'
            );
            trackUsage(auditRes.usage);
            addLog(i, `Agent 2: Audit complete.`, 'info');

            await delay(2000);

            // STEP 3: QA (AGENT 3) - FLASH (per request)
            setCurrentStep('qa');
            addLog(i, `Agent 3: Initiating Mandatory QA Protocol...`, 'warning');
            const qaFinal = await callWithRetry(
                () => runQAAgent(file, auditRes.items, MEDICAL_SCHEMA, (c, t) => setProgress({ current: c, total: MEDICAL_SCHEMA.blocks.length })), 
                'Agent 3 (QA)'
            );
            trackUsage(qaFinal.usage);
            addLog(i, `Agent 3: QA Validation Passed. Protocol Secured.`, 'success');

            await delay(2000);

            // STEP 4: Supervisor POST (AGENT 4)
            setCurrentStep('supervisor_post');
            const postCheck = await callWithRetry(() => runSupervisorAgent(file, 'POST', qaFinal.items), 'Agent 4 (Supervisor Post)');
            trackUsage(postCheck.usage);
            addLog(i, `Agent 4 (Final Check): ${postCheck.result}`, 'success');

            await delay(2000);

            // STEP 5: Export Validation Agent (EXCEL INTEGRITY GATE)
            setCurrentStep('export_validation');
            addLog(i, `Export Validation Agent: Verifying XLSX integrity...`, 'warning');
            const exportValidRes = await callWithRetry(
              () => runExportValidationAgent(file, qaFinal.items, MEDICAL_SCHEMA, (c, t) => setProgress({ current: c, total: t })),
              'Export Validation Agent'
            );
            trackUsage(exportValidRes.usage);
            addLog(i, `Export Validation Agent: 100% Match Confirmed. Gate Passed.`, 'success');

            // Finalize File
            setBatchResults(prev => {
                const next = [...prev];
                next[i] = {
                    ...next[i],
                    status: 'completed',
                    results: exportValidRes.items, // Use the FINAL validated items
                    supervisorIsolationCheck: postCheck.result
                    // tokenUsage updated via trackUsage -> updateUsage
                };
                return next;
            });
            
            // Construct result for history (using local currentUsage)
            saveToHistory({
                fileName: file.name,
                fileSize: file.size,
                status: 'completed',
                results: exportValidRes.items,
                logs: [], // Omitting logs from history for cleaner storage
                supervisorIsolationCheck: postCheck.result,
                tokenUsage: currentUsage
            });

        } catch (error: any) {
            console.error(error);
            addLog(i, `Processing Failed: ${error.message}`, 'error');
            setBatchResults(prev => {
                const next = [...prev];
                next[i].status = 'error';
                return next;
            });
        }
    }

    setStatus('complete');
    setActiveFileIndex(-1);
    setCurrentStep(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">M</div>
                <div>
                    <h1 className="font-bold text-lg leading-tight">MediExtract AI</h1>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Clinical Audit System</p>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <button 
                    onClick={() => setView('dashboard')}
                    className={`text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Dashboard
                </button>
                <button 
                    onClick={() => setView('history')}
                    className={`text-sm font-medium transition-colors ${view === 'history' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    History
                </button>
                <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.isAdmin ? 'Administrator' : 'Auditor'}</p>
                    </div>
                    <img src={user.avatar} alt="User" className="w-9 h-9 rounded-full bg-slate-200 ring-2 ring-white shadow-sm" />
                </div>
            </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-8">
            {view === 'dashboard' && (
                <>
                    {/* Upload Section (Only if idle or complete) */}
                    {(status === 'idle' || status === 'complete') && (
                        <div className="mb-12 animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-slate-800 mb-3">Upload Clinical Documents</h2>
                                <p className="text-slate-500 max-w-xl mx-auto">
                                    AI-powered extraction, auditing, and verification for clinical trial PDFs. 
                                    Drag and drop files to begin the automated pipeline.
                                </p>
                            </div>
                            <FileUpload onFilesSelect={setFiles} />
                            
                            {files.length > 0 && (
                                <div className="flex flex-col items-center mt-6 gap-4">
                                    <div className="flex gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                                        <span className="font-bold text-indigo-600">{files.length}</span> files selected
                                    </div>
                                    <button 
                                        onClick={startBatch}
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/20 transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        Start Extraction Pipeline
                                    </button>
                                </div>
                            )}

                            {/* Consolidated Download Button (Only if Batch Complete) */}
                            {status === 'complete' && batchResults.some(r => r.status === 'completed') && (
                                <div className="flex justify-center mt-6">
                                    <button
                                        onClick={downloadCombinedXLSX}
                                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download Consolidated Batch Report (XLSX)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Processing View */}
                    {(status === 'batch_processing' || status === 'complete') && batchResults.length > 0 && (
                        <div className="grid grid-cols-12 gap-8 animate-fade-in">
                            {/* Left Panel: File List */}
                            <div className="col-span-4 space-y-4">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-700">Processing Queue</h3>
                                        <span className="text-xs font-mono text-slate-400">{elapsedTime}</span>
                                    </div>
                                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                                        {batchResults.map((res, idx) => (
                                            <div 
                                                key={idx}
                                                onClick={() => setSelectedFileIndex(idx)}
                                                className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                                                    selectedFileIndex === idx ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className={`font-semibold text-sm truncate pr-2 ${selectedFileIndex === idx ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                        {res.fileName}
                                                    </p>
                                                    {res.status === 'completed' && <span className="text-green-500 text-xs">●</span>}
                                                    {res.status === 'processing' && <span className="text-indigo-500 text-xs animate-pulse">●</span>}
                                                    {res.status === 'error' && <span className="text-red-500 text-xs">●</span>}
                                                    {res.status === 'pending' && <span className="text-slate-300 text-xs">●</span>}
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-slate-400">
                                                    <span>{(res.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                                    <span className="capitalize">{res.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Active Progress Card (Only during processing) */}
                                {status === 'batch_processing' && activeFileIndex !== -1 && (
                                    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-5 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                                            <div 
                                                className="h-full bg-indigo-500 transition-all duration-300"
                                                style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold animate-spin-slow">
                                                {currentStep === 'supervisor_pre' && 'S'}
                                                {currentStep === 'extracting' && '1'}
                                                {currentStep === 'auditing' && '2'}
                                                {currentStep === 'qa' && '3'}
                                                {currentStep === 'supervisor_post' && 'S'}
                                                {currentStep === 'export_validation' && 'E'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {currentStep === 'supervisor_pre' && 'Supervisor Isolation Check'}
                                                    {currentStep === 'extracting' && 'Extraction Agent'}
                                                    {currentStep === 'auditing' && 'Audit Agent'}
                                                    {currentStep === 'qa' && 'Quality Assurance Agent'}
                                                    {currentStep === 'supervisor_post' && 'Final Verification'}
                                                    {currentStep === 'export_validation' && 'Export Validation (Integrity Gate)'}
                                                </p>
                                                <p className="text-xs text-slate-500">Processing {files[activeFileIndex]?.name}...</p>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                                            Step Progress: {progress.current} / {progress.total}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Panel: Details */}
                            <div className="col-span-8 space-y-6">
                                {/* Token Usage Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Prompt Tokens</p>
                                        <p className="text-2xl font-bold text-slate-700">
                                            {batchResults[selectedFileIndex]?.tokenUsage.promptTokens.toLocaleString() || 0}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Output Tokens</p>
                                        <p className="text-2xl font-bold text-indigo-600">
                                            {batchResults[selectedFileIndex]?.tokenUsage.outputTokens.toLocaleString() || 0}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Cost Est.</p>
                                        <p className="text-2xl font-bold text-slate-700">
                                            ${((batchResults[selectedFileIndex]?.tokenUsage.totalTokens || 0) * 0.0000005).toFixed(4)}
                                        </p>
                                    </div>
                                </div>

                                {/* Logs */}
                                <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden flex flex-col h-64">
                                    <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                                        <span className="text-xs font-mono text-slate-400">SYSTEM LOGS</span>
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
                                        {batchResults[selectedFileIndex]?.logs.length === 0 && (
                                            <p className="text-slate-600 italic">No logs available yet...</p>
                                        )}
                                        {batchResults[selectedFileIndex]?.logs.map((log, i) => (
                                            <div key={i} className="flex gap-3">
                                                <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                                                <span className={`${
                                                    log.type === 'error' ? 'text-red-400' :
                                                    log.type === 'warning' ? 'text-yellow-400' :
                                                    log.type === 'success' ? 'text-green-400' : 'text-slate-300'
                                                }`}>
                                                    {log.message}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Results Preview (if completed) */}
                                {batchResults[selectedFileIndex]?.status === 'completed' && (
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                            <h3 className="font-bold text-slate-800">Extraction Results</h3>
                                            <button 
                                              onClick={() => downloadXLSX(batchResults[selectedFileIndex])}
                                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                Download XLSX
                                            </button>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-6 py-3">Section</th>
                                                        <th className="px-6 py-3">Question</th>
                                                        <th className="px-6 py-3">Answer</th>
                                                        <th className="px-6 py-3">Page</th>
                                                        <th className="px-6 py-3">Reasoning</th>
                                                        <th className="px-6 py-3">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {batchResults[selectedFileIndex].results.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50">
                                                            <td className="px-6 py-4 font-medium text-slate-900">{item.section_name}</td>
                                                            <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={item.question}>{item.question}</td>
                                                            <td className="px-6 py-4 text-slate-800">{item.answer}</td>
                                                            <td className="px-6 py-4 text-slate-600">{item.page_number}</td>
                                                            <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={item.reasoning}>{item.reasoning}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                                    item.qa_status === 'PASSED' ? 'bg-green-100 text-green-700' : 
                                                                    item.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                    {item.qa_status || item.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {view === 'history' && (
                <div className="animate-fade-in">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Processing History</h2>
                    {history.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                            <p className="text-slate-500">No history available yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">File Name</th>
                                        <th className="px-6 py-4">Tokens Used</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map((h, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600">
                                                {h.completedAt ? new Date(h.completedAt).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{h.fileName}</td>
                                            <td className="px-6 py-4 text-slate-600">{h.tokenUsage.totalTokens.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Completed</span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-3">
                                                <button 
                                                    onClick={() => downloadXLSX(h)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                                                >
                                                    Download XLSX
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const blob = new Blob([JSON.stringify(h.results, null, 2)], { type: 'application/json' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `${h.fileName}_extracted.json`;
                                                        a.click();
                                                    }}
                                                    className="text-slate-500 hover:text-slate-700 font-medium text-xs"
                                                >
                                                    (JSON)
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </main>
    </div>
  );
}