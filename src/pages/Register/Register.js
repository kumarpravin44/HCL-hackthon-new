import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import styles from '../Login/Login.module.scss';

const validationSchema = Yup.object({
  firstName: Yup.string().required('Required').max(50),
  lastName: Yup.string().required('Required').max(50),
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string()
    .min(8, 'Min 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number')
    .required('Required'),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Valid Indian phone number required')
    .required('Required'),
  dateOfBirth: Yup.date()
    .max(new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000), 'Must be at least 18 years old')
    .required('Required'),
  pan: Yup.string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Valid PAN required (e.g., ABCDE1234F)')
    .required('Required'),
});

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const formik = useFormik({
    initialValues: {
      firstName: '', lastName: '', email: '', password: '',
      phone: '', dateOfBirth: '', pan: '',
      address: { street: '', city: '', state: '', pincode: '' },
    },
    validationSchema,
    onSubmit: (values, { setSubmitting }) => {
      setServerError('');
      try {
        register({ ...values, pan: values.pan.toUpperCase() });
        navigate('/my-applications');
      } catch (err) {
        setServerError(err.message || 'Registration failed.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const field = (name, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        name={name}
        className={`form-input ${formik.touched[name] && formik.errors[name] ? 'error' : ''}`}
        placeholder={placeholder}
        {...formik.getFieldProps(name)}
      />
      {formik.touched[name] && formik.errors[name] && (
        <div className="form-error">{formik.errors[name]}</div>
      )}
    </div>
  );

  return (
    <div className={styles['auth-page']}>
      <div className={`card ${styles['auth-card']}`} style={{ maxWidth: 520 }}>
        <h1>Create Account</h1>
        <p className={styles['auth-subtitle']}>Register to apply for a credit card</p>

        {serverError && <div className={styles['server-error']}>{serverError}</div>}

        <form onSubmit={formik.handleSubmit}>
          <div className="grid-2">
            {field('firstName', 'First Name', 'text', 'John')}
            {field('lastName', 'Last Name', 'text', 'Doe')}
          </div>
          {field('email', 'Email', 'email', 'you@example.com')}
          {field('password', 'Password', 'password', '••••••••')}
          {field('phone', 'Phone', 'tel', '9876543210')}
          {field('dateOfBirth', 'Date of Birth', 'date')}
          {field('pan', 'PAN Number', 'text', 'ABCDE1234F')}

          

          <button type="submit" className="btn btn-primary" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className={styles['auth-footer']}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
