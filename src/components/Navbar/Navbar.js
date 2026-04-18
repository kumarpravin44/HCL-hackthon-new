import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles['navbar-inner']}>
        <Link to="/" className={styles['navbar-brand']}>
          CreditCard
        </Link>

        <div className={styles['navbar-links']}>
          {!user && (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}

          {user?.role === 'applicant' && (
            <>
              <NavLink to="/apply">Apply Now</NavLink>
              <NavLink to="/my-applications">My Applications</NavLink>
              <NavLink to="/track">Track Status</NavLink>
            </>
          )}

          {(user?.role === 'admin' || user?.role === 'approver') && (
            <NavLink to="/admin">Dashboard</NavLink>
          )}

          {user && (
            <div className={styles['navbar-user']}>
              <span>{user.firstName} ({user.role})</span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
