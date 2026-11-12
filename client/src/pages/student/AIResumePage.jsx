import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Upload, Zap, CheckCircle, XCircle, AlertTriangle, Trash2,
  TrendingUp, Star, BookOpen, Lightbulb, FileText, Code2,
  Users, GraduationCap, Briefcase, FolderOpen, Key, Target
} from 'lucide-react';
import { resumeApi, getErrorMessage } from '../../services/api';
import { LoadingSpinner } from '../../components/ui';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTS = ['.pdf', '.docx'];
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, label }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor"
            strokeWidth="7" className="text-slate-200 dark:text-slate-700" />
          <motion.circle
            cx="50" cy="50" r={radius} fill="none" strokeWidth="7"
            stroke={color} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800 dark:text-white">{score}</span>
          <span className="text-xs text-slate-500">/ 100</span>
        </div>
      </div>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  );
}

// ── Generic list section ──────────────────────────────────────────────────────
function Section({ title, icon: Icon, items, color = 'blue' }) {
  const palette = {
    blue:   'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800',
    green:  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red:    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    teal:   'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
  };
  const iconPalette = {
    blue: 'text-brand-600', green: 'text-green-600', red: 'text-red-600',
    yellow: 'text-yellow-600', purple: 'text-purple-600',
    teal: 'text-teal-600', indigo: 'text-indigo-600',
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={`rounded-xl border p-5 ${palette[color]}`}>
      <h3 className={`flex items-center gap-2 font-semibold mb-3 ${iconPalette[color]}`}>
        <Icon className="h-5 w-5" /> {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
            <span className="mt-1.5 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Skill chip list ───────────────────────────────────────────────────────────
function ChipSection({ title, icon: Icon, items, chipClass }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="card p-5">
      <h3 className={`flex items-center gap-2 font-semibold mb-3 text-slate-700 dark:text-slate-200`}>
        <Icon className="h-5 w-5 text-brand-500" /> {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((s, i) => (
          <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium ${chipClass}`}>{s}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIResumePage() {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [retainFile, setRetainFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const validateAndSetFile = (f) => {
    if (!f) return;
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    const isValidExt = ALLOWED_EXTS.includes(ext);
    const isValidType = ALLOWED_TYPES.includes(f.type) || (ext === '.docx');
    if (!isValidExt || !isValidType) {
      toast.error('Only PDF (.pdf) and Word Document (.docx) files are accepted.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error('File size must be 5 MB or less.');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleFileChange = (e) => validateAndSetFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const analyze = async () => {
    if (!file) { toast.error('Please upload your resume first.'); return; }
    if (!targetRole.trim()) { toast.error('Please enter the target job role.'); return; }

    setLoading(true);
    setResult(null);

    const fd = new FormData();
    fd.append('resume', file);
    fd.append('targetRole', targetRole.trim());
    if (targetCompany.trim()) fd.append('targetCompany', targetCompany.trim());
    if (jobDescription.trim()) fd.append('jobDescription', jobDescription.trim());
    fd.append('retainFile', retainFile ? 'true' : 'false');

    try {
      const res = await resumeApi.analyze(fd);
      setResult(res.data);
      toast.success('Resume analyzed successfully!');
      // Scroll to results
      setTimeout(() => {
        document.getElementById('resume-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isPdf = file?.name.toLowerCase().endsWith('.pdf');
  const isDocx = file?.name.toLowerCase().endsWith('.docx');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Zap className="h-6 w-6 text-brand-500" /> AI Resume Analyzer
        </h1>
        <p className="page-subtitle">Upload your resume and get AI-powered feedback using Google Gemini.</p>
      </div>

      {/* Upload card */}
      <div className="card p-6 space-y-5">

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${file
              ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
              : dragOver
                ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/10'
                : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 dark:hover:border-brand-600'
            }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileChange}
          />

          {file ? (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <FileText className={`h-5 w-5 flex-shrink-0 ${isPdf ? 'text-red-500' : 'text-blue-500'}`} />
              <div className="text-left">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">{file.name}</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · {isPdf ? 'PDF' : isDocx ? 'Word Document' : 'Document'}
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="ml-2 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                title="Remove file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-9 w-9 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Drag and drop your resume here, or{' '}
                <span className="text-brand-600 dark:text-brand-400 font-semibold">Browse Files</span>
              </p>
              <div className="flex items-center justify-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                  <FileText className="h-3.5 w-3.5 text-red-500" /> PDF (.pdf)
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                  <FileText className="h-3.5 w-3.5 text-blue-500" /> Word (.docx)
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">Max 5 MB</span>
              </div>
            </>
          )}
        </div>

        {/* Role + Company */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="target-role" className="label">
              Target Job Role <span className="text-red-500">*</span>
            </label>
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
              placeholder="e.g. Google, Infosys, TCS"
            />
          </div>
        </div>

        {/* Job description */}
        <div>
          <label htmlFor="job-description" className="label">Job Description (optional)</label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            maxLength={3000}
            className="input resize-none"
            placeholder="Paste the job description for a more targeted analysis. If omitted, general role requirements will be used."
          />
          <p className="text-xs text-slate-400 mt-1">{jobDescription.length}/3000</p>
        </div>

        {/* Retain file toggle */}
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

        {/* Analyze button */}
        <button
          id="analyze-resume-btn"
          onClick={analyze}
          disabled={loading || !file}
          className="btn-primary w-full py-2.5"
        >
          {loading
            ? <><LoadingSpinner size="sm" /> Analyzing with Gemini AI…</>
            : <><Zap className="h-4 w-4" /> Analyze Resume</>
          }
        </button>

        {/* Scanned PDF notice */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Scanned PDFs are not supported.</strong> GradLink does not perform OCR.
            If your PDF is a scanned image, text cannot be extracted. Use a text-based PDF or convert to Word (.docx).
          </p>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            id="resume-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="divider" />
            <h2 className="section-title text-lg font-bold text-slate-800 dark:text-white">
              Analysis Results
            </h2>

            {/* Score rings */}
            <div className="card p-6">
              <div className="flex flex-wrap justify-center gap-10">
                <ScoreRing score={result.overallScore ?? result.matchScore ?? 0} label="Overall Resume Score" />
                <ScoreRing score={result.atsScore ?? 0} label="ATS Compatibility" />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">
                AI estimates — do not guarantee recruitment or shortlisting outcomes.
              </p>
            </div>

            {/* Skills chips */}
            <ChipSection
              title="Skills Identified"
              icon={Target}
              items={result.skillsIdentified ?? result.matchingSkills}
              chipClass="bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300"
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <ChipSection
                title="Technical Skills"
                icon={Code2}
                items={result.technicalSkills}
                chipClass="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              />
              <ChipSection
                title="Soft Skills"
                icon={Users}
                items={result.softSkills}
                chipClass="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300"
              />
            </div>

            {/* Analysis sections */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Section title="Education Analysis" icon={GraduationCap} items={result.educationAnalysis} color="indigo" />
              <Section title="Experience Analysis" icon={Briefcase} items={result.experienceAnalysis} color="blue" />
            </div>

            <Section title="Projects Analysis" icon={FolderOpen} items={result.projectsAnalysis} color="teal" />

            <div className="grid sm:grid-cols-2 gap-4">
              <Section title="Missing Skills" icon={XCircle} items={result.missingSkills} color="red" />
              <Section title="Resume Strengths" icon={Star} items={result.strengths} color="green" />
            </div>

            <Section title="Areas for Improvement" icon={AlertTriangle} items={result.areasForImprovement ?? result.weaknesses} color="yellow" />
            <Section title="Improvement Suggestions" icon={Lightbulb} items={result.suggestions} color="purple" />
            <Section title="Recommended Keywords (ATS)" icon={Key} items={result.recommendedKeywords ?? result.recommendedSkills} color="blue" />

            {result.fileRetained && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4" />
                Resume saved to your profile successfully.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
