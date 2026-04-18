import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { applicationStore } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminDashboard.module.scss';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  const loadData = useCallback(() => {
    setAnalytics(applicationStore.getAnalytics());
    setApplications(applicationStore.getAll(statusFilter || undefined));
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleReview = (decision) => {
    try {
      applicationStore.review(
        reviewModal.applicationId,
        decision,
        reviewComment,
        user.id
      );
      toast.success(`Application ${decision.toLowerCase()} successfully`);
      setReviewModal(null);
      setReviewComment('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Review failed');
    }
  };

  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = analytics?.monthlyTrend?.map((m) => ({
    month: `${monthNames[m.month]} ${m.year}`,
    Total: m.count,
    Approved: m.approved,
    Rejected: m.rejected,
  })) || [];

  if (!analytics) {
    return <div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Admin Dashboard</h1>

      {/* Stats */}
     

      <div className={styles['dashboard-grid']}>
        {/* Applications Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Applications</h2>
            
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Applicant</th>
                  <th>Income</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.applicationId}>
                    <td style={{ fontSize: 12 }}>{app.applicationId}</td>
                    <td>{app.applicantDetails?.firstName} {app.applicantDetails?.lastName}</td>
                    <td>₹{app.income?.toLocaleString('en-IN')}</td>
                    <td>{app.creditScore || 'N/A'}</td>
                    <td><span className={`badge badge-${app.status.toLowerCase()}`}>{app.status}</span></td>
                    <td>
                      {['PENDING', 'UNDER_REVIEW'].includes(app.status) && (
                        <button className="btn btn-outline btn-sm" onClick={() => setReviewModal(app)}>
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


        </div>

        
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className={styles['review-modal']} onClick={() => setReviewModal(null)}>
          <div className={styles['review-modal-content']} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>Review Application</h2>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 8 }}>
              <strong>ID:</strong> {reviewModal.applicationId}
            </p>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 8 }}>
              <strong>Applicant:</strong> {reviewModal.applicantDetails?.firstName} {reviewModal.applicantDetails?.lastName}
            </p>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 8 }}>
              <strong>Credit Score:</strong> {reviewModal.creditScore} | <strong>Income:</strong> ₹{reviewModal.income?.toLocaleString('en-IN')}
            </p>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Comment</label>
              <textarea
                className="form-input"
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add a review comment..."
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleReview('APPROVED')}>
                Approve
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleReview('REJECTED')}>
                Reject
              </button>
              <button className="btn btn-outline" onClick={() => setReviewModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
