import { useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, Users, BarChart2 } from 'lucide-react';
import { adminApi, getErrorMessage } from '../../services/api';
import { LoadingSpinner } from '../../components/ui';
import { downloadBlob } from '../../utils/helpers';
import { motion } from 'framer-motion';

function ReportCard({ icon: Icon, title, description, onDownload, loading, color = 'blue' }) {
  const colors = {
    blue: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <div className={`inline-flex p-3 rounded-xl mb-4 ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{description}</p>
      <button onClick={onDownload} disabled={loading} className="btn-secondary w-full">
        {loading ? <LoadingSpinner size="sm" /> : <><Download className="h-4 w-4" /> Download</>}
      </button>
    </motion.div>
  );
}

export default function AdminReportsPage() {
  const [csvLoading, setCsvLoading] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const exportCSV = async () => {
    setCsvLoading(true);
    try {
      const res = await adminApi.exportStudentsCSV();
      downloadBlob(res.data, 'students_placement_report.csv');
      toast.success('CSV exported successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCsvLoading(false);
    }
  };

  const exportStudentPDF = async () => {
    if (!studentId.trim()) { toast.error('Enter a student ID.'); return; }
    setPdfLoading(true);
    try {
      const res = await adminApi.exportStudentProfilePDF(studentId.trim());
      downloadBlob(res.data, `student_${studentId}_profile.pdf`);
      toast.success('Student profile PDF exported.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Reports & Exports</h1>
        <p className="page-subtitle">Download placement data and student profiles.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ReportCard
          icon={Users} title="Student Placement Report" color="blue"
          description="Export all students with their CGPA, backlogs, skills, placement status, and application history as a CSV file."
          onDownload={exportCSV} loading={csvLoading}
        />

        <div className="card p-6">
          <div className="inline-flex p-3 rounded-xl mb-4 bg-green-50 dark:bg-green-900/20 text-green-600">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Student Profile PDF</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Export an individual student's full profile including academics, skills, and applications as PDF.</p>
          <div className="space-y-3">
            <div>
              <label className="label">Student MongoDB ID</label>
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="input text-sm"
                placeholder="Paste the student's ID here…"
              />
              <p className="text-xs text-slate-400 mt-1">You can find the ID in the Students Management table.</p>
            </div>
            <button onClick={exportStudentPDF} disabled={pdfLoading} className="btn-secondary w-full">
              {pdfLoading ? <LoadingSpinner size="sm" /> : <><Download className="h-4 w-4" /> Download PDF</>}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-2 flex items-center gap-2"><BarChart2 className="h-4 w-4 text-brand-500" />Export Notes</h3>
        <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1.5">
          <li>• CSV exports include all students regardless of active/inactive status.</li>
          <li>• PDF exports show the complete student profile as visible to the admin.</li>
          <li>• All exports are generated in real-time from the live database.</li>
          <li>• Exports are not cached — each download reflects the current state.</li>
          <li>• Handle all downloaded data in compliance with your institution's data policy.</li>
        </ul>
      </div>
    </div>
  );
}
