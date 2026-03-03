/**
 * Login Page - Cluster Manager Portal
 * Email → Password flow with auth via backend
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, checkUserStatus } from '../services/api';
import srmLogo from '../assets/srm-logo.png';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: Password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userName, setUserName] = useState('');

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const status = await checkUserStatus(email);
            if (!status.success || !status.registered) {
                setError('Email not found. Please contact your administrator.');
                setLoading(false);
                return;
            }
            setUserName(status.employeeName);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Server error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await loginUser(email, password);
            if (response.success && response.employee) {
                localStorage.setItem('user', JSON.stringify(response.employee));
                navigate('/');
            } else {
                setError('Login failed. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="logo-section">
                    <img src={srmLogo} alt="SRM Sweets" className="login-logo" />
                    <h2>Cluster Manager Portal</h2>
                    <p>Sign in to manage your clusters</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                {step === 1 && (
                    <form onSubmit={handleEmailSubmit} className="login-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your work email"
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Checking...' : 'Next'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleLogin} className="login-form">
                        <h3 style={{ margin: '0 0 4px 0', color: '#333' }}>Welcome Back,</h3>
                        <p className="user-name-display">{userName}</p>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <button type="button" className="back-btn" onClick={() => { setStep(1); setError(''); }}>
                            Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
