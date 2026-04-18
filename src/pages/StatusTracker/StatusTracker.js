import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { applicationStore } from '../../services/store';
import StatusTimeline from '../../components/StatusTimeline/StatusTimeline';

export default function StatusTracker() {
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: { applicationId: '' },
    validationSchema: Yup.object({
      applicationId: Yup.string()
        .matches(/^CCA-/, 'Must start with CCA-')
        .required('Application ID is required'),
    }),
    onSubmit: (values) => {
      setError('');
      setApplication(null);
      const found = applicationStore.getByApplicationId(values.applicationId);
      if (found) {
        setApplication(found);
      } else {
        setError('Application not found.');
      }
    },
  });

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h1 className="page-title">Track Application</h1>
      <p className="page-subtitle">Enter your application ID to track status in real-time.</p>

      <div className="card">
        <form onSubmit={formik.handleSubmit} style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              className={`form-input ${formik.touched.applicationId && formik.errors.applicationId ? 'error' : ''}`}
              placeholder="CCA-XXXXXXXXX-XXXXXXXX"
              {...formik.getFieldProps('applicationId')}
            />
            {formik.touched.applicationId && formik.errors.applicationId && (
              <div className="form-error">{formik.errors.applicationId}</div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            Track
          </button>
        </form>
      </div>

      {error && (
        <div className="card" style={{ marginTop: 16, background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      )}

      {application && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{application.applicationId}</h2>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
                {application.applicantDetails?.firstName} {application.applicantDetails?.lastName}
              </p>
            </div>
            <span className={`badge badge-${application.status.toLowerCase()}`}>{application.status}</span>
          </div>

          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Credit Score</p>
              <p style={{ fontSize: 20, fontWeight: 700 }}>{application.creditScore || 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Credit Limit</p>
              <p style={{ fontSize: 20, fontWeight: 700 }}>
                {application.creditLimit ? `₹${application.creditLimit.toLocaleString('en-IN')}` : 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Card Type</p>
              <p style={{ fontSize: 20, fontWeight: 700, textTransform: 'capitalize' }}>
                {application.cardType || 'N/A'}
              </p>
            </div>
          </div>

          {application.dispatchDetails?.trackingNumber && (
            <div style={{ background: 'var(--gray-50)', padding: 14, borderRadius: 8, marginBottom: 20 }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>📦 Dispatch Details</p>
              <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                Tracking: {application.dispatchDetails.trackingNumber} | 
                Carrier: {application.dispatchDetails.carrier} | 
                Expected: {new Date(application.dispatchDetails.expectedDelivery).toLocaleDateString()}
              </p>
            </div>
          )}

          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Status Timeline</h3>
          <StatusTimeline history={application.statusHistory || []} />
        </div>
      )}
    </div>
  );
}
