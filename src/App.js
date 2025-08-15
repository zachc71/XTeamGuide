import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

// --- Your Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyAnlJKLpN9Pcr0XGBGjHYtKpnKo89z_7a4",
    authDomain: "team-guide-71f64.firebaseapp.com",
    projectId: "team-guide-71f64",
    storageBucket: "team-guide-71f64.firebasestorage.app",
    messagingSenderId: "1085668818935",
    appId: "1:1085668818935:web:25e2b4eb0d6e9b2ccbf8f2",
    measurementId: "G-7L89ZV8PVS"
};

// --- Helper: Icon Components ---
const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
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
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
);
const UpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
    </svg>
);
const DownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

// --- Initial Data for First-Time Setup ---
const initialData = {
    managers: ["Manager - Alex Ray", "Manager - Jordan Lee", "Manager - Casey Smith"],
    folders: [{ id: "folder_general", name: "General" }],
    reports: [
        {
            id: "rep_1",
            title: "Team Activities Today",
            folderId: "folder_general",
            links: {
                "Manager - Alex Ray": "https://example.com/report/activities/alex",
                "Manager - Jordan Lee": "https://example.com/report/activities/jordan",
                "Manager - Casey Smith": "https://example.com/report/activities/casey"
            }
        },
        {
            id: "rep_2",
            title: "Team Accounts by Status",
            folderId: "folder_general",
            links: {
                "Manager - Alex Ray": "https://example.com/report/accounts/alex",
                "Manager - Jordan Lee": "https://example.com/report/accounts/jordan",
                "Manager - Casey Smith": "https://example.com/report/accounts/casey"
            }
        },
        {
            id: "rep_3",
            title: "Team Leads",
            folderId: "folder_general",
            links: {
                "Manager - Alex Ray": "https://example.com/report/leads/alex",
                "Manager - Jordan Lee": "https://example.com/report/leads/jordan",
                "Manager - Casey Smith": "https://example.com/report/leads/casey"
            }
        },
    ]
};

// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [view, setView] = useState('dashboard');
    const [db, setDb] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [config, setConfig] = useState({ managers: [], reports: [], folders: [] });
    const [selectedManager, setSelectedManager] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // --- Firebase Initialization and Auth ---
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);

        setDb(dbInstance);

        const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
            if (!user) {
                try {
                    await signInAnonymously(authInstance);
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

        const configRef = doc(db, 'publicDashboard/mainConfig');

        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (!data.folders) {
                    data.folders = [{ id: "folder_general", name: "General" }];
                }
                if (data.reports) {
                    data.reports = data.reports.map(r => ({ folderId: r.folderId || data.folders[0].id, ...r }));
                }
                setConfig(data);
                if (!selectedManager && data.managers.length > 0) {
                    setSelectedManager(data.managers[0]);
                } else if (selectedManager && !data.managers.includes(selectedManager)) {
                    setSelectedManager(data.managers[0] || '');
                }
                if (!selectedFolder && data.folders.length > 0) {
                    setSelectedFolder(data.folders[0].id);
                } else if (selectedFolder && !data.folders.some(f => f.id === selectedFolder)) {
                    setSelectedFolder(data.folders[0]?.id || '');
                }
            } else {
                console.log("No config found, creating initial document...");
                setDoc(configRef, initialData);
                setConfig(initialData);
                setSelectedManager(initialData.managers[0]);
                setSelectedFolder(initialData.folders[0].id);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching config:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthReady, db, selectedManager, selectedFolder]);

    // --- Data Update Handlers ---
    const updateFirestoreReports = async (newReports) => {
        if (!db) return;
        const configRef = doc(db, 'publicDashboard/mainConfig');
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

        const configRef = doc(db, 'publicDashboard/mainConfig');
        await updateDoc(configRef, {
            managers: arrayUnion(managerName),
            reports: newReports
        });
    };

    const handleAddReport = async (reportTitle) => {
        if (!db || !reportTitle) return;

        const newReportId = `rep_${new Date().getTime()}`;
        const newLinks = config.managers.reduce((acc, manager) => ({ ...acc, [manager]: "" }), {});

        const newReport = {
            id: newReportId,
            title: reportTitle,
            folderId: config.folders[0]?.id || "",
            links: newLinks
        };

        const configRef = doc(db, 'publicDashboard/mainConfig');
        await updateDoc(configRef, {
            reports: arrayUnion(newReport)
        });
    };

    const handleAddFolder = async (folderName) => {
        if (!db || !folderName) return;
        const newFolder = { id: `fol_${new Date().getTime()}`, name: folderName };
        const configRef = doc(db, 'publicDashboard/mainConfig');
        await updateDoc(configRef, {
            folders: arrayUnion(newFolder)
        });
        setSelectedFolder(prev => prev || newFolder.id);
    };

    const handleMoveReport = async (reportId, direction) => {
        const index = config.reports.findIndex(r => r.id === reportId);
        if (index === -1) return;
        const newReports = [...config.reports];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newReports.length) return;
        const [moved] = newReports.splice(index, 1);
        newReports.splice(newIndex, 0, moved);
        await updateFirestoreReports(newReports);
    };

    const handleDeleteManager = async (managerName) => {
        if (!db) return;

        const newManagers = config.managers.filter(m => m !== managerName);
        const newReports = config.reports.map(report => {
            const { [managerName]: _removed, ...links } = report.links;
            return { ...report, links };
        });

        const configRef = doc(db, 'publicDashboard/mainConfig');
        await updateDoc(configRef, { managers: newManagers, reports: newReports });
    };

    const handleDeleteReport = async (reportId) => {
        if (!db) return;
        const newReports = config.reports.filter(r => r.id !== reportId);
        const configRef = doc(db, 'publicDashboard/mainConfig');
        await updateDoc(configRef, { reports: newReports });
    };

    // --- Render Logic ---
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-medium text-gray-600">Loading Dashboard...</div></div>;
    }

    return (
        <div className="min-h-screen bg-[#f4f6f8] font-sans">
            <Header view={view} setView={setView} />
            <main className="container mx-auto p-8">
                {view === 'dashboard' ? (
                    <DashboardView
                        config={config}
                        selectedManager={selectedManager}
                        setSelectedManager={setSelectedManager}
                        selectedFolder={selectedFolder}
                        setSelectedFolder={setSelectedFolder}
                        onUpdateLink={handleUpdateLink}
                    />
                ) : (
                    <SettingsView
                        config={config}
                        onUpdateLink={handleUpdateLink}
                        onUpdateReportDetails={handleUpdateReportDetails}
                        onAddManager={handleAddManager}
                        onAddReport={handleAddReport}
                        onAddFolder={handleAddFolder}
                        onDeleteManager={handleDeleteManager}
                        onDeleteReport={handleDeleteReport}
                        onMoveReport={handleMoveReport}
                    />
                )}
            </main>
        </div>
    );
}

// --- View Components ---

function Header({ view, setView }) {
    return (
        <header className="bg-[#1a73e8] text-white text-center py-4 px-8">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold flex-grow">Team Dashboard</h1>
                <nav>
                    <button
                        onClick={() => setView(view === 'dashboard' ? 'settings' : 'dashboard')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
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

function DashboardView({ config, selectedManager, setSelectedManager, selectedFolder, setSelectedFolder, onUpdateLink }) {
    const [editing, setEditing] = useState(null);

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
            <div className="mb-4 flex gap-2 border-b overflow-x-auto">
                {config.folders.map(folder => (
                    <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder.id)}
                        className={`px-4 py-2 rounded-t ${selectedFolder === folder.id ? 'bg-white border border-b-white text-[#1a73e8]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                    >
                        {folder.name}
                    </button>
                ))}
            </div>
            <div className="mb-8 p-4 bg-white rounded-lg shadow-sm max-w-sm">
                <label htmlFor="managerFilter" className="block text-sm font-medium text-gray-700 mb-2">Select a Manager:</label>
                <select id="managerFilter" value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    {config.managers.map(manager => <option key={manager} value={manager}>{manager}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {config.reports.filter(report => report.folderId === selectedFolder).map(report => (
                    <div key={report.id} className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6 flex flex-col justify-between transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_8px_18px_rgba(0,0,0,0.12)]">
                        <div className="flex justify-between items-start">
                             <h3 className="text-xl font-semibold text-gray-800 mb-4">{report.title}</h3>
                             <button onClick={() => handleEditClick(report)} className="p-1 text-gray-400 hover:text-[#1a73e8] rounded-full hover:bg-gray-100 transition-colors" title="Edit Link">
                                <PencilIcon />
                            </button>
                        </div>
                        <div className="mt-auto">
                            <a href={report.links[selectedManager] || '#'} target="_blank" rel="noopener noreferrer" className={`block w-full text-center bg-[#1a73e8] text-white font-medium py-2.5 px-4 rounded-md hover:bg-[#1558b0] transition-colors duration-200 ${!report.links[selectedManager] ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                Open Report
                            </a>
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
                            <button onClick={handleSaveEdit} className="px-4 py-2 bg-[#1a73e8] text-white rounded-md hover:bg-[#1558b0] transition-colors">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SettingsView({ config, onUpdateLink, onUpdateReportDetails, onAddManager, onAddReport, onAddFolder, onDeleteManager, onDeleteReport, onMoveReport }) {
    const [newManagerName, setNewManagerName] = useState('');
    const [newReportTitle, setNewReportTitle] = useState('');
    const [newFolderName, setNewFolderName] = useState('');

    const handleManagerSubmit = (e) => {
        e.preventDefault();
        onAddManager(newManagerName.trim());
        setNewManagerName('');
    };

    const handleReportSubmit = (e) => {
        e.preventDefault();
        onAddReport(newReportTitle.trim());
        setNewReportTitle('');
    };

    const handleFolderSubmit = (e) => {
        e.preventDefault();
        onAddFolder(newFolderName.trim());
        setNewFolderName('');
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <form onSubmit={handleManagerSubmit} className="space-y-3 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700">Add New Manager</h3>
                    <input type="text" value={newManagerName} onChange={(e) => setNewManagerName(e.target.value)} placeholder="Manager's Name" className="w-full p-2 border border-gray-300 rounded-md" required />
                    <button type="submit" className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#1a73e8] text-white rounded-md hover:bg-[#1558b0] transition"><PlusIcon /> Add Manager</button>
                </form>
                <form onSubmit={handleReportSubmit} className="space-y-3 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700">Add New Report</h3>
                    <input type="text" value={newReportTitle} onChange={(e) => setNewReportTitle(e.target.value)} placeholder="Report Title" className="w-full p-2 border border-gray-300 rounded-md" required />
                    <button type="submit" className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#1a73e8] text-white rounded-md hover:bg-[#1558b0] transition"><PlusIcon /> Add Report</button>
                </form>
                <form onSubmit={handleFolderSubmit} className="space-y-3 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700">Add New Folder</h3>
                    <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder Name" className="w-full p-2 border border-gray-300 rounded-md" required />
                    <button type="submit" className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#1a73e8] text-white rounded-md hover:bg-[#1558b0] transition"><PlusIcon /> Add Folder</button>
                </form>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mb-4">Report Links & Details</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="text-left font-semibold p-3 border border-gray-200">Report Title</th>
                            <th className="text-left font-semibold p-3 border border-gray-200">Folder</th>
                            {config.managers.map(manager => (
                                <th key={manager} className="text-left font-semibold p-3 border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span>{manager}</span>
                                        <button onClick={() => onDeleteManager(manager)} className="ml-2 p-1 text-red-500 hover:text-red-700" title="Delete Manager">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th className="text-left font-semibold p-3 border border-gray-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {config.reports.map(report => (
                            <tr key={report.id} className="hover:bg-gray-50">
                                <td className="p-2 border border-gray-200">
                                    <input type="text" value={report.title} onChange={(e) => onUpdateReportDetails(report.id, { title: e.target.value })} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"/>
                                </td>
                                <td className="p-2 border border-gray-200">
                                    <select value={report.folderId || ''} onChange={(e) => onUpdateReportDetails(report.id, { folderId: e.target.value })} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                        {config.folders.map(folder => (
                                            <option key={folder.id} value={folder.id}>{folder.name}</option>
                                        ))}
                                    </select>
                                </td>
                                {config.managers.map(manager => (
                                    <td key={`${report.id}-${manager}`} className="p-2 border border-gray-200">
                                        <input type="url" value={report.links[manager] || ''} onChange={(e) => onUpdateLink(report.id, manager, e.target.value)} placeholder="Enter link..." className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"/>
                                    </td>
                                ))}
                                <td className="p-2 border border-gray-200 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => onMoveReport(report.id, 'up')} className="p-1 text-gray-500 hover:text-gray-700" title="Move Up">
                                            <UpIcon />
                                        </button>
                                        <button onClick={() => onMoveReport(report.id, 'down')} className="p-1 text-gray-500 hover:text-gray-700" title="Move Down">
                                            <DownIcon />
                                        </button>
                                        <button onClick={() => onDeleteReport(report.id)} className="p-1 text-red-500 hover:text-red-700" title="Delete Report">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
