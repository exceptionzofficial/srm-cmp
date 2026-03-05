import { useState, useEffect, useRef } from 'react';
import { FiLayers, FiEdit2, FiTrash2, FiSearch, FiExternalLink, FiUser, FiFileText, FiX } from 'react-icons/fi';
import { getClustersByManager, getBranches, updateCluster, deleteCluster, getClusterDetails } from '../services/api';

const Clusters = () => {
    const [clusters, setClusters] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Map refs
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const circlesRef = useRef([]);
    const [mapReady, setMapReady] = useState(false);

    // Cluster color palette for distinguishing clusters on the map
    const clusterColors = ['#EF4136', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#795548', '#E91E63'];

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCluster, setEditingCluster] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        branchIds: [],
        isActive: true
    });
    const [searchTerm, setSearchTerm] = useState('');

    // Details Modal State
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedClusterDetails, setSelectedClusterDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Get logged-in user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const managerId = user.employeeId || user.managerId;

    useEffect(() => {
        loadData();
        initMap();
    }, []);

    // Update map markers when data or map changes
    useEffect(() => {
        if (mapReady && clusters.length > 0 && branches.length > 0) {
            updateMapMarkers();
        }
    }, [clusters, branches, mapReady]);

    const initMap = () => {
        const checkGoogleMaps = () => {
            if (window.google && window.google.maps && mapRef.current) {
                const defaultCenter = { lat: 11.3410, lng: 77.7172 }; // Erode, TN approximate

                mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                    center: defaultCenter,
                    zoom: 8,
                    styles: [
                        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                    ],
                });

                setMapReady(true);
            } else {
                setTimeout(checkGoogleMaps, 200);
            }
        };
        setTimeout(checkGoogleMaps, 100);
    };

    const updateMapMarkers = () => {
        // Clear existing
        markersRef.current.forEach(m => m.setMap(null));
        circlesRef.current.forEach(c => c.setMap(null));
        markersRef.current = [];
        circlesRef.current = [];

        if (!mapInstanceRef.current) return;

        const bounds = new window.google.maps.LatLngBounds();
        let hasMarkers = false;

        clusters.forEach((cluster, clusterIdx) => {
            const color = clusterColors[clusterIdx % clusterColors.length];

            (cluster.branchIds || []).forEach(branchId => {
                const branch = branches.find(b => b.branchId === branchId);
                if (!branch || !branch.latitude || !branch.longitude) return;

                const position = { lat: branch.latitude, lng: branch.longitude };
                hasMarkers = true;

                // Branch marker
                const marker = new window.google.maps.Marker({
                    position,
                    map: mapInstanceRef.current,
                    title: `${branch.name} (${cluster.name})`,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: color,
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                    },
                });

                // Info window
                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 8px; font-family: inherit;">
                            <strong>${branch.name}</strong><br/>
                            <small style="color: ${color}; font-weight: 600;">Cluster: ${cluster.name}</small><br/>
                            <small>${branch.address || 'No address'}</small><br/>
                            <small>Radius: ${branch.radiusMeters || 100}m</small>
                        </div>
                    `,
                });

                marker.addListener('click', () => {
                    infoWindow.open(mapInstanceRef.current, marker);
                });

                // Radius circle
                const circle = new window.google.maps.Circle({
                    map: mapInstanceRef.current,
                    center: position,
                    radius: branch.radiusMeters || 100,
                    fillColor: color,
                    fillOpacity: 0.15,
                    strokeColor: color,
                    strokeOpacity: 0.6,
                    strokeWeight: 2,
                });

                markersRef.current.push(marker);
                circlesRef.current.push(circle);
                bounds.extend(position);
            });
        });

        if (hasMarkers) {
            mapInstanceRef.current.fitBounds(bounds);
            if (markersRef.current.length === 1) {
                mapInstanceRef.current.setZoom(15);
            }
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [clusterRes, branchRes] = await Promise.all([
                getClustersByManager(managerId),
                getBranches()
            ]);
            setClusters(clusterRes.clusters || []);
            setBranches(branchRes.branches || []);
        } catch (err) {
            console.error('Error loading clusters data:', err);
            setError('Failed to load clusters.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (cluster) => {
        setEditingCluster(cluster);
        setFormData({
            name: cluster.name,
            branchIds: cluster.branchIds || [],
            isActive: cluster.isActive
        });
        setIsModalOpen(true);
        setError('');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCluster(null);
    };

    const handleToggleBranch = (branchId) => {
        setFormData(prev => {
            const currentIds = prev.branchIds;
            if (currentIds.includes(branchId)) {
                return { ...prev, branchIds: currentIds.filter(id => id !== branchId) };
            } else {
                return { ...prev, branchIds: [...currentIds, branchId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Cluster name is required');
            return;
        }

        try {
            await updateCluster(editingCluster.clusterId, {
                ...formData,
                managerId: managerId
            });
            setSuccess('Cluster updated successfully');
            handleCloseModal();
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error updating cluster');
        }
    };

    const handleDelete = async (clusterId) => {
        if (!window.confirm('Are you sure you want to delete this cluster?')) return;
        try {
            await deleteCluster(clusterId);
            setSuccess('Cluster deleted successfully');
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Error deleting cluster');
        }
    };

    const handleViewDetails = async (clusterId) => {
        try {
            setDetailsLoading(true);
            setIsDetailsModalOpen(true);
            const res = await getClusterDetails(clusterId);
            setSelectedClusterDetails(res.cluster);
        } catch (err) {
            console.error('Error fetching cluster details:', err);
            setError('Failed to load cluster details.');
        } finally {
            setDetailsLoading(false);
        }
    };

    const getBranchNames = (ids) => {
        if (!ids || ids.length === 0) return 'No branches assigned';
        return ids.map(id => {
            const branch = branches.find(b => b.branchId === id);
            return branch ? branch.name : 'Unknown';
        }).join(', ');
    };

    const filteredClusters = clusters.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="clusters-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="page-title"><FiLayers style={{ marginRight: '10px' }} /> My Clusters</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="search-box" style={{ background: 'white', padding: '8px 12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', width: '250px' }}>
                        <FiSearch style={{ marginRight: '8px', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search clusters..."
                            style={{ border: 'none', outline: 'none', fontSize: '14px', width: '100%' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {success && <div className="badge badge-success" style={{ display: 'block', marginBottom: '15px', padding: '10px' }}>{success}</div>}
            {error && !isModalOpen && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '15px', padding: '10px' }}>{error}</div>}

            {/* Map showing cluster branches */}
            <div className="card" style={{ marginBottom: '24px', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#333' }}>📍 Cluster Branches Map</h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {clusters.map((cluster, idx) => (
                            <div key={cluster.clusterId} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                                <span style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: clusterColors[idx % clusterColors.length], display: 'inline-block'
                                }}></span>
                                {cluster.name}
                            </div>
                        ))}
                    </div>
                </div>
                <div ref={mapRef} style={{ width: '100%', height: '350px' }}></div>
            </div>

            {/* Clusters table */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Cluster Name</th>
                                <th>Branches</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClusters.length > 0 ? (
                                filteredClusters.map(cluster => (
                                    <tr key={cluster.clusterId}>
                                        <td>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{cluster.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {cluster.clusterId}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {getBranchNames(cluster.branchIds)}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--primary)' }}>
                                                {cluster.branchIds?.length || 0} branches assigned
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${cluster.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                {cluster.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                                <button className="action-btn edit" style={{ background: '#f0f9ff', color: '#0369a1' }} onClick={() => handleViewDetails(cluster.clusterId)} title="View Details">
                                                    <FiExternalLink />
                                                </button>
                                                <button className="action-btn edit" onClick={() => handleOpenModal(cluster)}>
                                                    <FiEdit2 />
                                                </button>
                                                <button className="action-btn delete" onClick={() => handleDelete(cluster.clusterId)}>
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        No clusters assigned to you yet. Please contact your administrator.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Edit */}
            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content card" style={{ width: '500px', padding: '24px', position: 'relative' }}>
                        <h2 style={{ marginBottom: '20px' }}>Edit Cluster</h2>

                        {error && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '15px', padding: '10px' }}>{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Cluster Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '4px' }}
                                    placeholder="e.g. South Zone"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Assign Branches</label>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px' }}>
                                    {branches.map(branch => (
                                        <label key={branch.branchId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.branchIds.includes(branch.branchId)}
                                                onChange={() => handleToggleBranch(branch.branchId)}
                                            />
                                            <span style={{ fontSize: '14px' }}>{branch.name}</span>
                                        </label>
                                    ))}
                                    {branches.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No branches available.</p>}
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    Selected: {formData.branchIds.length} branches
                                </p>
                            </div>

                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span style={{ fontWeight: '500' }}>Active Cluster</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Update Cluster
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for Details */}
            {isDetailsModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content card" style={{ width: '800px', maxWidth: '95vw', maxHeight: '90vh', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FiLayers /> {selectedClusterDetails?.name || 'Cluster Details'}
                            </h2>
                            <button onClick={() => setIsDetailsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>
                                <FiX />
                            </button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            {detailsLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div className="spinner"></div>
                                    <p style={{ marginTop: '15px', color: '#64748b' }}>Loading cluster details...</p>
                                </div>
                            ) : selectedClusterDetails ? (
                                <>
                                    {/* Managers Section */}
                                    <section style={{ marginBottom: '32px' }}>
                                        <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                                            <FiUser style={{ color: 'var(--primary)' }} /> Assigned Managers
                                        </h3>
                                        {selectedClusterDetails.assignedManagers?.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                                {selectedClusterDetails.assignedManagers.map(mgr => (
                                                    <div key={mgr.managerId} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{mgr.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{mgr.role}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px' }}>
                                                            {branches.find(b => b.branchId === mgr.branchId)?.name || 'Unknown Branch'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>No managers specifically assigned to branches in this cluster.</p>
                                        )}
                                    </section>

                                    {/* Requests Section */}
                                    <section>
                                        <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                                            <FiFileText style={{ color: 'var(--primary)' }} /> Branch Requests
                                        </h3>
                                        <div className="table-container" style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                            <table style={{ margin: 0 }}>
                                                <thead>
                                                    <tr style={{ background: '#f8fafc' }}>
                                                        <th>Employee</th>
                                                        <th>Type</th>
                                                        <th>Branch</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedClusterDetails.branchRequests?.length > 0 ? (
                                                        selectedClusterDetails.branchRequests.map(req => (
                                                            <tr key={req.requestId}>
                                                                <td>
                                                                    <div style={{ fontWeight: '500' }}>{req.employeeName}</div>
                                                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>ID: {req.employeeId}</div>
                                                                </td>
                                                                <td>
                                                                    <span style={{ fontSize: '12px', fontWeight: '500' }}>{req.type}</span>
                                                                </td>
                                                                <td>
                                                                    <div style={{ fontSize: '12px' }}>
                                                                        {branches.find(b => b.branchId === req.branchId)?.name || 'Unknown'}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge badge-${req.status === 'APPROVED' ? 'success' :
                                                                            req.status === 'REJECTED' ? 'danger' : 'warning'
                                                                        }`} style={{ fontSize: '10px' }}>
                                                                        {req.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No requests found for this cluster.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                </>
                            ) : null}
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: '1px solid #eee', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clusters;
