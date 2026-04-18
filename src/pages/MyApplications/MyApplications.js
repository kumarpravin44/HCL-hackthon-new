import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationStore } from '../../services/store';
import { useAuth } from '../../context/AuthContext';

export default function MyApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    if (user) {
      setApplications(applicationStore.getByUserId(user.id));
    }
  }, [user]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>My Applications</h1>
        <Link to="/apply" className="btn btn-primary">+ New Application</Link>
      </div>

      {applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No applications yet</p>
          <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>Apply for a credit card to get started!</p>
          <Link to="/apply" className="btn btn-primary">Apply Now</Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Income</th>
                  <th>Credit Score</th>
                  <th>Credit Limit</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.applicationId}>
                    <td>
                      <Link to={`/track?id=${app.applicationId}`} style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>
                        {app.applicationId}
                      </Link>
                    </td>
                    <td>₹{app.income?.toLocaleString('en-IN')}</td>
                    <td>{app.creditScore || 'N/A'}</td>
                    <td>{app.creditLimit ? `₹${app.creditLimit.toLocaleString('en-IN')}` : 'N/A'}</td>
                    <td><span className={`badge badge-${app.status.toLowerCase()}`}>{app.status}</span></td>
                    <td>{new Date(app.createdAt).toLocaleDateString()}</td>
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
