import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

// --- Helper: Icon Components ---
const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
    </svg>
);
const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
);

// --- Initial Data for First-Time Setup ---
const initialData = {
    managers: ["Manager - Alex Ray", "Manager - Jordan Lee", "Manager - Casey Smith"],
    reports: [
        { id: "rep_1", title: "Team Activities Today", imageUrl: "https://placehold.co/600x400/3b82f6/ffffff?text=Activities", links: { "Manager - Alex Ray": "https://example.com/report/activities/alex", "Manager - Jordan Lee": "https://example.com/report/activities/jordan", "Manager - Casey Smith": "https://example.com/report/activities/casey" } },
        { id: "rep_2", title: "Team Accounts by Status", imageUrl: "https://placehold.co/600x400/10b981/ffffff?text=Accounts", links: { "Manager - Alex Ray": "https://example.com/report/accounts/alex", "Manager - Jordan Lee": "https://example.com/report/accounts/jordan", "Manager - Casey Smith": "https://example.com/report/accounts/casey" } },
        { id: "rep_3", title: "Team Leads", imageUrl: "https://placehold.co/600x400/f97316/ffffff?text=Leads", links: { "Manager - Alex Ray": "https://example.com/report/leads/alex", "Manager - Jordan Lee": "https://example.com/report/leads/jordan", "Manager - Casey Smith": "https://example.com/report/leads/casey" } },
    ]
};

// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [view, setView] = useState('dashboard');
    const [db, setDb] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [config, setConfig] = useState({ managers: [], reports: [] });
    const [selectedManager, setSelectedManager] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // --- Firebase Initialization and Auth ---
    useEffect(() => {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;

        if (!firebaseConfig) {
            console.error("Firebase config not found.");
            setIsLoading(false);
            return;
        }

        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);

        setDb(dbInstance);

        const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
            if (!user) {
                try {
                    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    if (token) {
                        await signInWithCustomToken(authInstance, token);
                    } else {
                        await signInAnonymously(authInstance);
                    }
                } catch (error) {
                    console.error("Authentication failed:", error);
                }
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    // --- Data Fetching from Firestore ---
    useEffect(() => {
        if (!isAuthReady || !db) return;

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const configRef = doc(db, `artifacts/${appId}/public/data/dashboardConfig`, 'main');

        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setConfig(data);
                if (!selectedManager && data.managers.length > 0) {
                    setSelectedManager(data.managers[0]);
                } else if (selectedManager && !data.managers.includes(selectedManager)) {
                    setSelectedManager(data.managers[0] || '');
                }
            } else {
                console.log("No config found, creating initial document...");
                setDoc(configRef, initialData);
                setConfig(initialData);
                setSelectedManager(initialData.managers[0]);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching config:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthReady, db, selectedManager]);

    // --- Data Update Handlers ---
    const updateFirestoreReports = async (newReports) => {
        if (!db) return;
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const configRef = doc(db, `artifacts/${appId}/public/data/dashboardConfig`, 'main');
        await updateDoc(configRef, { reports: newReports });
    };

    const handleUpdateReportDetails = async (reportId, newDetails) => {
        const newReports = config.reports.map(report =>
            report.id === reportId ? { ...report, ...newDetails } : report
        );
        await updateFirestoreReports(newReports);
    };
    
    const handleUpdateLink = async (reportId, managerName, newLink) => {
        const newReports = config.reports.map(report => {
            if (report.id === reportId) {
                return { ...report, links: { ...report.links, [managerName]: newLink } };
            }
            return report;
        });
        await updateFirestoreReports(newReports);
    };

    const handleAddManager = async (managerName) => {
        if (!db || !managerName || config.managers.includes(managerName)) return;

        const newReports = config.reports.map(report => ({
            ...report,
            links: { ...report.links, [managerName]: "" }
        }));

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const configRef = doc(db, `artifacts/${appId}/public/data/dashboardConfig`, 'main');
        await updateDoc(configRef, {
            managers: arrayUnion(managerName),
            reports: newReports
        });
    };

    const handleAddReport = async (reportTitle, imageUrl) => {
        if (!db || !reportTitle) return;

        const newReportId = `rep_${new Date().getTime()}`;
        const newLinks = config.managers.reduce((acc, manager) => ({ ...acc, [manager]: "" }), {});

        const newReport = {
            id: newReportId,
            title: reportTitle,
            imageUrl: imageUrl || `https://placehold.co/600x400/cccccc/ffffff?text=New+Report`,
            links: newLinks
        };

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const configRef = doc(db, `artifacts/${appId}/public/data/dashboardConfig`, 'main');
        await updateDoc(configRef, {
            reports: arrayUnion(newReport)
        });
    };

    // --- Render Logic ---
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-medium text-gray-600">Loading Dashboard...</div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Header view={view} setView={setView} />
            <main className="container mx-auto px-4 sm:px-6 py-8">
                {view === 'dashboard' ? (
                    <DashboardView
                        config={config}
                        selectedManager={selectedManager}
                        setSelectedManager={setSelectedManager}
                        onUpdateLink={handleUpdateLink}
                    />
                ) : (
                    <SettingsView
                        config={config}
                        onUpdateLink={handleUpdateLink}
                        onUpdateReportDetails={handleUpdateReportDetails}
                        onAddManager={handleAddManager}
                        onAddReport={handleAddReport}
                    />
                )}
            </main>
        </div>
    );
}

// --- View Components ---

function Header({ view, setView }) {
    return (
        <header className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center h-16">
                <h1 className="text-2xl font-bold">Team Dashboard</h1>
                <nav>
                    <button
                        onClick={() => setView(view === 'dashboard' ? 'settings' : 'dashboard')}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
                        title={view === 'dashboard' ? 'Go to Settings' : 'Go to Dashboard'}
                    >
                        {view === 'dashboard' ? <SettingsIcon /> : <HomeIcon />}
                        <span className="hidden sm:inline">{view === 'dashboard' ? 'Settings' : 'Dashboard'}</span>
                    </button>
                </nav>
            </div>
        </header>
    );
}

function DashboardView({ config, selectedManager, setSelectedManager, onUpdateLink }) {
    const [editing, setEditing] = useState(null); // { reportId, link }

    const handleEditClick = (report) => {
        setEditing({ reportId: report.id, link: report.links[selectedManager] || '' });
    };

    const handleSaveEdit = () => {
        if (editing) {
            onUpdateLink(editing.reportId, selectedManager, editing.link);
            setEditing(null);
        }
    };

    return (
        <div>
            <div className="mb-8 p-4 bg-white rounded-lg shadow-sm max-w-sm">
                <label htmlFor="managerFilter" className="block text-sm font-medium text-gray-700 mb-2">Select a Manager:</label>
                <select id="managerFilter" value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    {config.managers.map(manager => <option key={manager} value={manager}>{manager}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {config.reports.map(report => (
                    <div key={report.id} className="card bg-white rounded-xl shadow-md overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                        <img src={report.imageUrl} alt={report.title} className="w-full h-32 object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/cccccc/ffffff?text=Image+Error'; }} />
                        <div className="p-4 flex flex-col flex-grow justify-between relative">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 pr-8">{report.title}</h3>
                            <button onClick={() => handleEditClick(report)} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors" title="Edit Link">
                                <PencilIcon />
                            </button>
                            <div className="mt-auto">
                                <a href={report.links[selectedManager] || '#'} target="_blank" rel="noopener noreferrer" className={`block w-full text-center bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 ${!report.links[selectedManager] ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    Open Report
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {editing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Edit Report Link</h3>
                        <p className="text-gray-600 mb-1">For: <span className="font-medium text-gray-800">{selectedManager}</span></p>
                        <p className="text-gray-600 mb-4">Report: <span className="font-medium text-gray-800">{config.reports.find(r => r.id === editing.reportId)?.title}</span></p>
                        <input type="url" value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md mb-4" placeholder="https://example.com/report/..."/>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                            <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SettingsView({ config, onUpdateLink, onUpdateReportDetails, onAddManager, onAddReport }) {
    const [newManagerName, setNewManagerName] = useState('');
    const [newReportTitle, setNewReportTitle] = useState('');
    const [newReportImageUrl, setNewReportImageUrl] = useState('');

    const handleManagerSubmit = (e) => {
        e.preventDefault();
        onAddManager(newManagerName.trim());
        setNewManagerName('');
    };

    const handleReportSubmit = (e) => {
        e.preventDefault();
        onAddReport(newReportTitle.trim(), newReportImageUrl.trim());
        setNewReportTitle('');
        setNewReportImageUrl('');
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <form onSubmit={handleManagerSubmit} className="space-y-3 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700">Add New Manager</h3>
                    <input type="text" value={newManagerName} onChange={(e) => setNewManagerName(e.target.value)} placeholder="Manager's Name" className="w-full p-2 border border-gray-300 rounded-md" required />
                    <button type="submit" className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"><PlusIcon /> Add Manager</button>
                </form>
                <form onSubmit={handleReportSubmit} className="space-y-3 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700">Add New Report</h3>
                    <input type="text" value={newReportTitle} onChange={(e) => setNewReportTitle(e.target.value)} placeholder="Report Title" className="w-full p-2 border border-gray-300 rounded-md" required />
                    <input type="url" value={newReportImageUrl} onChange={(e) => setNewReportImageUrl(e.target.value)} placeholder="Image URL (optional)" className="w-full p-2 border border-gray-300 rounded-md" />
                    <button type="submit" className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"><PlusIcon /> Add Report</button>
                </form>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mb-4">Report Links & Details</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="text-left font-semibold p-3 border border-gray-200">Report Title</th>
                            <th className="text-left font-semibold p-3 border border-gray-200">Image URL</th>
                            {config.managers.map(manager => <th key={manager} className="text-left font-semibold p-3 border border-gray-200">{manager}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {config.reports.map(report => (
                            <tr key={report.id} className="hover:bg-gray-50">
                                <td className="p-2 border border-gray-200"><input type="text" value={report.title} onChange={(e) => onUpdateReportDetails(report.id, { title: e.target.value })} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"/></td>
                                <td className="p-2 border border-gray-200"><input type="url" value={report.imageUrl || ''} onChange={(e) => onUpdateReportDetails(report.id, { imageUrl: e.target.value })} placeholder="Enter image URL..." className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"/></td>
                                {config.managers.map(manager => (
                                    <td key={`${report.id}-${manager}`} className="p-2 border border-gray-200">
                                        <input type="url" value={report.links[manager] || ''} onChange={(e) => onUpdateLink(report.id, manager, e.target.value)} placeholder="Enter link..." className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"/>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
