import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FileText, Download } from 'lucide-react';
import { jobsApi, getErrorMessage } from '../../services/api';
import { EmptyState, StatusBadge, LoadingSpinner } from '../../components/ui';
import { formatDate, downloadBlob } from '../../utils/helpers';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    jobsApi.getMyApplications()
      .then((res) => setApplications(res.data.applications || []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const downloadPDF = async (id, company) => {
    setDownloading(id);
    try {
      const res = await jobsApi.downloadApplicationPDF(id);
      downloadBlob(res.data, `application_${company}.pdf`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">My Applications</h1>
        <p className="page-subtitle">{applications.length} total applications</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState icon={FileText} title="No applications yet" description="Apply to jobs and your applications will appear here." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Applied</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Deadline</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500 dark:text-slate-400">PDF</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{app.job?.company}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{app.job?.title}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-500">{formatDate(app.submittedAt)}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-500">{formatDate(app.job?.deadline)}</td>
                    <td className="py-3 px-4"><StatusBadge status={app.status} /></td>
                    <td className="py-3 px-4 text-right">
                      {app.job?.applicationMethod === 'internal' && (
                        <button
                          onClick={() => downloadPDF(app._id, app.job?.company)}
                          disabled={downloading === app._id}
                          className="btn-ghost p-1.5 text-brand-600"
                          title="Download PDF"
                        >
                          {downloading === app._id ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
