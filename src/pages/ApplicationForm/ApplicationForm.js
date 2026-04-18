import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { applicationStore } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import StatusTimeline from '../../components/StatusTimeline/StatusTimeline';
import styles from './ApplicationForm.module.scss';

const validationSchema = Yup.object({
  income: Yup.number().positive('Must be positive').required('Annual income is required'),
  employmentType: Yup.string().oneOf(['salaried', 'self-employed', 'business', 'other']).required('Required'),
  employer: Yup.string().max(200),
});

export default function ApplicationForm() {
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [serverError, setServerError] = useState('');

  const formik = useFormik({
    initialValues: { income: '', employmentType: '', employer: '' },
    validationSchema,
    onSubmit: (values, { setSubmitting, resetForm }) => {
      setServerError('');
      setResult(null);
      try {
        const application = applicationStore.submit(user.id, {
          ...values,
          income: Number(values.income),
        });
        setResult(application);
        toast.success(`Application submitted! ID: ${application.applicationId}`);
        resetForm();
      } catch (err) {
        setServerError(err.message || 'Failed to submit application.');
        toast.error(err.message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className={styles['apply-page']}>
      <h1 className="page-title">Apply for Credit Card</h1>
      <p className="page-subtitle">Fill in your employment and income details to get instant decision.</p>

      <div className="card">
        {serverError && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {serverError}
          </div>
        )}

        <form onSubmit={formik.handleSubmit}>
          <div className="form-group">
            <label>Annual Income (₹)</label>
            <input
              type="number"
              className={`form-input ${formik.touched.income && formik.errors.income ? 'error' : ''}`}
              placeholder="e.g., 500000"
              {...formik.getFieldProps('income')}
            />
            {formik.touched.income && formik.errors.income && (
              <div className="form-error">{formik.errors.income}</div>
            )}
          </div>

          <div className="form-group">
            <label>Employment Type</label>
            <select
              className={`form-select ${formik.touched.employmentType && formik.errors.employmentType ? 'error' : ''}`}
              {...formik.getFieldProps('employmentType')}
            >
              <option value="">Select employment type</option>
              <option value="salaried">Salaried</option>
              <option value="self-employed">Self Employed</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
            {formik.touched.employmentType && formik.errors.employmentType && (
              <div className="form-error">{formik.errors.employmentType}</div>
            )}
          </div>

          <div className="form-group">
            <label>Employer / Business Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Infosys Ltd."
              {...formik.getFieldProps('employer')}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Processing...' : 'Submit Application'}
          </button>
        </form>
      </div>

      {result && (
        <div className={`card ${styles['result-card']}`}>
          <span className={`badge badge-${result.status.toLowerCase()}`}>{result.status}</span>
          <h2>{result.status === 'DISPATCHED' || result.status === 'APPROVED' ? '🎉 Congratulations!' : '😔 Application Rejected'}</h2>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>{result.decisionReason}</p>

          <div className={styles['result-details']}>
            <p><strong>Application ID</strong><span>{result.applicationId}</span></p>
            <p><strong>Credit Score</strong><span>{result.creditScore}</span></p>
            {result.creditLimit && (
              <p><strong>Credit Limit</strong><span>₹{result.creditLimit.toLocaleString('en-IN')}</span></p>
            )}
            {result.cardType && (
              <p><strong>Card Type</strong><span style={{ textTransform: 'capitalize' }}>{result.cardType}</span></p>
            )}
          </div>

          {result.statusHistory && (
            <div style={{ marginTop: 24, textAlign: 'left' }}>
              <h3 style={{ marginBottom: 16 }}>Status Timeline</h3>
              <StatusTimeline history={result.statusHistory} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
