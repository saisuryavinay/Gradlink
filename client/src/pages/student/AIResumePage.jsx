import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Upload, Zap, CheckCircle, XCircle, AlertTriangle, Trash2,
  Target, TrendingUp, Star, BookOpen, Lightbulb, FileText
} from 'lucide-react';
import { resumeApi, getErrorMessage } from '../../services/api';
import { LoadingSpinner, EmptyState } from '../../components/ui';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function ResultSection({ title, icon: Icon, items, color = 'blue' }) {
  const colors = {
    blue: 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };
  const iconColors = { blue: 'text-brand-600', green: 'text-green-600', red: 'text-red-600', yellow: 'text-yellow-600', purple: 'text-purple-600' };

  if (!items || items.length === 0) return null;

  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <h3 className={`flex items-center gap-2 font-semibold mb-3 ${iconColors[color]}`}>
        <Icon className="h-5 w-5" /> {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
            <span className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MatchScoreRing({ score }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
          <motion.circle
            cx="60" cy="60" r={radius} fill="none" strokeWidth="8"
            stroke={color} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-800 dark:text-white">{score}</span>
          <span className="text-xs text-slate-500">/ 100</span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">AI Match Score</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-[200px] mt-1">
        This is an AI estimate and does not guarantee recruitment or shortlisting outcomes.
      </p>
    </div>
  );
}

export default function AIResumePage() {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [retainFile, setRetainFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.pdf') || f.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error('File size must be 10 MB or less.');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileChange({ target: { files: [f] } });
  };

  const analyze = async () => {
    if (!file) { toast.error('Please upload your resume PDF.'); return; }
    if (!targetRole.trim()) { toast.error('Please enter the target job role.'); return; }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', targetRole.trim());
    if (targetCompany.trim()) formData.append('targetCompany', targetCompany.trim());
    if (jobDescription.trim()) formData.append('jobDescription', jobDescription.trim());
    formData.append('retainFile', retainFile ? 'true' : 'false');

    try {
      const res = await resumeApi.analyze(formData);
      setResult(res.data);
      toast.success('Resume analyzed successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2"><Zap className="h-6 w-6 text-brand-500" /> AI Resume Analyzer</h1>
        <p className="page-subtitle">Upload your resume and get AI-powered feedback using Google Gemini.</p>
      </div>

      {/* Upload form */}
      <div className="card p-6 space-y-5">
        {/* File drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 dark:hover:border-brand-600'}`}
        >
          <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} id="resume-file-input" />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">{file.name}</span>
              <span className="text-xs text-green-600">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drop your PDF resume here, or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">PDF only · Maximum 10 MB · Text-based PDFs only (not scanned images)</p>
            </>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="target-role" className="label">Target Job Role <span className="text-red-500">*</span></label>
            <input
              id="target-role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="input"
              placeholder="e.g. Software Engineer, Data Analyst"
            />
          </div>
          <div>
            <label htmlFor="target-company" className="label">Target Company (optional)</label>
            <input
              id="target-company"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              className="input"
              placeholder="e.g. Google, Infosys"
            />
          </div>
        </div>

        <div>
          <label htmlFor="job-description" className="label">Job Description (optional)</label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            maxLength={3000}
            className="input resize-none"
            placeholder="Paste the job description here for a more targeted analysis. If omitted, general role requirements will be used."
          />
          <p className="text-xs text-slate-400 mt-1">{jobDescription.length}/3000</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="retain-file"
            checked={retainFile}
            onChange={(e) => setRetainFile(e.target.checked)}
            className="rounded border-slate-300 text-brand-600"
          />
          <label htmlFor="retain-file" className="text-sm text-slate-600 dark:text-slate-400">
            Save resume to my profile for placement management
          </label>
        </div>

        <button
          id="analyze-resume-btn"
          onClick={analyze}
          disabled={loading}
          className="btn-primary w-full py-2.5"
        >
          {loading
            ? <><LoadingSpinner size="sm" /> Analyzing with Gemini AI…</>
            : <><Zap className="h-4 w-4" /> Analyze Resume</>
          }
        </button>

        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            GradLink does not perform OCR. If your resume is a scanned image PDF, text cannot be extracted and the analysis will fail.
          </p>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="divider" />
            <h2 className="section-title">Analysis Results</h2>

            {/* Score ring */}
            <div className="card p-6 flex flex-col items-center">
              <MatchScoreRing score={result.matchScore} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <ResultSection title="Matching Skills" icon={CheckCircle} items={result.matchingSkills} color="green" />
              <ResultSection title="Missing / Underrepresented Skills" icon={XCircle} items={result.missingSkills} color="red" />
              <ResultSection title="Strengths" icon={Star} items={result.strengths} color="blue" />
              <ResultSection title="Areas to Improve" icon={AlertTriangle} items={result.weaknesses} color="yellow" />
            </div>

            <ResultSection title="Resume Improvement Suggestions" icon={Lightbulb} items={result.suggestions} color="purple" />
            <ResultSection title="Recommended Skills to Learn" icon={TrendingUp} items={result.recommendedSkills} color="blue" />

            {result.fileRetained && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Resume saved to your profile.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
