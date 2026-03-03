
import { useState, useEffect } from 'react';
import { FiUsers, FiDollarSign, FiClock, FiActivity } from 'react-icons/fi';
import { getPendingFundRequests, processFundRequest } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            // Fetch requests assigned to BRANCH_MANAGER
            const response = await getPendingFundRequests('BRANCH_MANAGER');
            setRequests(response.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleForward = async (id) => {
        if (!window.confirm('Forward this request to MD?')) return;
        try {
            await processFundRequest({ id, action: 'FORWARD', actorRole: 'BRANCH_MANAGER' });
            fetchRequests();
        } catch (error) {
            alert('Error forwarding request');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject this request?')) return;
        try {
            await processFundRequest({ id, action: 'REJECT', actorRole: 'BRANCH_MANAGER' });
            fetchRequests();
        } catch (error) {
            alert('Error rejecting request');
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Branch Manager Dashboard</h1>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Staff Present</h3>
                    <p className="stat-value">24/28</p>
                </div>
                <div className="stat-card">
                    <h3>Today's Sales</h3>
                    <p className="stat-value">₹45,200</p>
                </div>
                <div className="stat-card">
                    <h3>Pending Requests</h3>
                    <p className="stat-value">{requests.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Overall Health</h3>
                    <p className="stat-value success">Good</p>
                </div>
            </div>

            <div className="content-section">
                <h2>Pending Reviews & Approvals</h2>
                {loading ? <p>Loading...</p> : (
                    <div className="table-responsive">
                        {requests.length === 0 ? <p>No pending items.</p> : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Reason</th>
                                        <th>Amount</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(req => (
                                        <tr key={req.id}>
                                            <td>{req.requesterName}</td>
                                            <td>{req.reason}</td>
                                            <td>₹{req.amount}</td>
                                            <td>
                                                <button className="btn-action forward" onClick={() => handleForward(req.id)}>Forward to MD</button>
                                                <button className="btn-action reject" onClick={() => handleReject(req.id)}>Reject</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
