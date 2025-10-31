import React, { useState, useEffect } from 'react';
import { ref, onValue, off, get, remove } from 'firebase/database';
import { signOut, User } from 'firebase/auth';
import { db, auth } from '../services/firebaseService';
import type { UserProfile, Client, Project, FieldData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

import Spinner from './Spinner';
import ClientForm from './ClientForm';
import ProjectForm from './ProjectForm';
import FieldDataForm from './FieldDataForm';
import FieldDataDetail from './FieldDataDetail';
import AiAssistant from './AiAssistant';
import AiDataScientist from './AiDataScientist';
import Map from './Map';
import InternetSearch from './InternetSearch';
import { useTranslation } from '../src/LanguageContext';

const Dashboard: React.FC<{ user: User, userProfile: UserProfile, theme: string, toggleTheme: () => void }> = ({ user, userProfile, theme, toggleTheme }) => {
    const { t, language, setLanguage } = useTranslation();
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [fieldDataEntries, setFieldDataEntries] = useState<FieldData[]>([]);
    const [loading, setLoading] = useState(true);

    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [allFieldData, setAllFieldData] = useState<FieldData[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);

    const [currentView, setCurrentView] = useState<'clients' | 'projects' | 'fieldData' | 'map' | 'settings' | 'profile'>('clients');
    const [searchTerm, setSearchTerm] = useState('');
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [filteredFieldData, setFilteredFieldData] = useState<FieldData[]>([]);
    const [showSettings, setShowSettings] = useState(false);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showClientForm, setShowClientForm] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [showFieldDataForm, setShowFieldDataForm] = useState(false);
    const [viewingFieldData, setViewingFieldData] = useState<FieldData | null>(null);
    const [showAiAssistant, setShowAiAssistant] = useState(false);
    const [showAiDataScientist, setShowAiDataScientist] = useState(false);
    const [showInternetSearch, setShowInternetSearch] = useState(false);

    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editingFieldData, setEditingFieldData] = useState<FieldData | null>(null);

    // Analytics state
    const [analytics, setAnalytics] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const clientsRef = ref(db, 'ClientInfo');
        const unsubscribe = onValue(clientsRef, (snapshot) => {
            const data = snapshot.val();
            const clientsData = Object.keys(data || {}).map(key => ({ id: key, ...data[key] } as Client));
            setClients(clientsData);
            setLoading(false);
        });
        return () => off(clientsRef, 'value', unsubscribe);
    }, []);

    useEffect(() => {
        const projectsRef = ref(db, 'ProjectsInfo');
        const unsubscribe = onValue(projectsRef, (snapshot) => {
            const data = snapshot.val();
            const allProjectsData = Object.keys(data || {}).map(key => ({ id: key, ...data[key] } as Project));
            setAllProjects(allProjectsData);

            // Load all field data
            const loadAllFieldData = async () => {
                const allEntries: FieldData[] = [];
                for (const project of allProjectsData) {
                    const biophysicalRef = ref(db, `ProjectData/${project.companyName}/${project.projectName}/Biophysical`);
                    const impactsRef = ref(db, `ProjectData/${project.companyName}/${project.projectName}/Impacts`);
                    
                    try {
                        const [biophysicalSnap, impactsSnap] = await Promise.all([get(biophysicalRef), get(impactsRef)]);
                        const biophysicalData = biophysicalSnap.val() || {};
                        const impactsData = impactsSnap.val() || {};
                        
                        const entries = Object.keys(biophysicalData).map(key => {
                            // Handle both old format (string) and new format (object) for location
                            const locationData = biophysicalData[key].location;
                            const location = typeof locationData === 'string'
                                ? { lat: 0, lng: 0, description: locationData }
                                : locationData || { lat: 0, lng: 0, description: '' };

                            return {
                                id: key,
                                projectId: project.id,
                                ownerId: user.uid,
                                location: location,
                                biophysical: {
                                    elevation: biophysicalData[key].elevation || '',
                                    ecoregion: biophysicalData[key].ecoregion || '',
                                    meanAnnualPrecipitation: biophysicalData[key].map || '',
                                    rainfallSeasonality: biophysicalData[key].rainfall || '',
                                    evapotranspiration: biophysicalData[key].evapotranspiration || '',
                                    geology: biophysicalData[key].geology || '',
                                    waterManagementArea: biophysicalData[key].waterManagementArea || '',
                                    soilErodibility: biophysicalData[key].soilErodibility || '',
                                    vegetationType: biophysicalData[key].vegetationType || '',
                                    conservationStatus: biophysicalData[key].conservationStatus || '',
                                    fepaFeatures: biophysicalData[key].fepa || ''
                                },
                                impacts: impactsData[key] ? {
                                    runoffHardSurfaces: impactsData[key].runoffHardSurfaces || '',
                                    runoffSepticTanks: impactsData[key].runoffSepticTanks || '',
                                    sedimentInput: impactsData[key].sedimentInput || '',
                                    floodPeaks: impactsData[key].floodPeaks || '',
                                    pollution: impactsData[key].pollution || '',
                                    weedsIAP: impactsData[key].weedsIAP || ''
                                } : {},
                                images: biophysicalData[key].images || [],
                                createdAt: biophysicalData[key].timestamp || 0
                            } as FieldData;
                        });
                        
                        allEntries.push(...entries);
                    } catch (error) {
                        console.error(`Error loading data for project ${project.projectName}:`, error);
                    }
                }
                setAllFieldData(allEntries);
                setStatsLoading(false);
            };
            
            loadAllFieldData();
        });
        return () => off(projectsRef, 'value', unsubscribe);
    }, [user.uid]);

    useEffect(() => {
        if (selectedClient) {
            const projectsRef = ref(db, 'ProjectsInfo');
            const unsubscribe = onValue(projectsRef, (snapshot) => {
                const data = snapshot.val();
                const allProjects = Object.keys(data || {}).map(key => ({ id: key, ...data[key] } as Project));
                const projectsData = allProjects.filter(p => p.appUserUsername === user.email && p.companyName === selectedClient.companyName);
                setProjects(projectsData);
            });
            return () => off(projectsRef, 'value', unsubscribe);
        } else {
            setProjects([]);
        }
    }, [selectedClient, user.email]);

    useEffect(() => {
        if (selectedProject) {
            const biophysicalRef = ref(db, `ProjectData/${selectedProject.companyName}/${selectedProject.projectName}/Biophysical`);
            const impactsRef = ref(db, `ProjectData/${selectedProject.companyName}/${selectedProject.projectName}/Impacts`);
            
            const loadData = async () => {
                const [biophysicalSnap, impactsSnap] = await Promise.all([get(biophysicalRef), get(impactsRef)]);
                const biophysicalData = biophysicalSnap.val() || {};
                const impactsData = impactsSnap.val() || {};
                
                const entries = Object.keys(biophysicalData).map(key => {
                    // Handle both old format (string) and new format (object) for location
                    const locationData = biophysicalData[key].location;
                    const location = typeof locationData === 'string'
                        ? { lat: 0, lng: 0, description: locationData }
                        : locationData || { lat: 0, lng: 0, description: '' };

                    return {
                        id: key,
                        projectId: selectedProject.id,
                        ownerId: user.uid,
                        location: location,
                        biophysical: {
                            elevation: biophysicalData[key].elevation || '',
                            ecoregion: biophysicalData[key].ecoregion || '',
                            meanAnnualPrecipitation: biophysicalData[key].map || '',
                            rainfallSeasonality: biophysicalData[key].rainfall || '',
                            evapotranspiration: biophysicalData[key].evapotranspiration || '',
                            geology: biophysicalData[key].geology || '',
                            waterManagementArea: biophysicalData[key].waterManagementArea || '',
                            soilErodibility: biophysicalData[key].soilErodibility || '',
                            vegetationType: biophysicalData[key].vegetationType || '',
                            conservationStatus: biophysicalData[key].conservationStatus || '',
                            fepaFeatures: biophysicalData[key].fepa || ''
                        },
                        impacts: impactsData[key] ? {
                            runoffHardSurfaces: impactsData[key].runoffHardSurfaces || '',
                            runoffSepticTanks: impactsData[key].runoffSepticTanks || '',
                            sedimentInput: impactsData[key].sedimentInput || '',
                            floodPeaks: impactsData[key].floodPeaks || '',
                            pollution: impactsData[key].pollution || '',
                            weedsIAP: impactsData[key].weedsIAP || ''
                        } : {},
                        images: biophysicalData[key].images || [],
                        createdAt: biophysicalData[key].timestamp || 0
                    } as FieldData;
                });
                
                setFieldDataEntries(entries);
            };
            
            loadData();
        } else {
            setFieldDataEntries([]);
        }
    }, [selectedProject, user.uid]);
    
    useEffect(() => {
        const filtered = fieldDataEntries.filter(entry => {
            const locationDesc = (typeof entry.location === 'string' ? entry.location : entry.location?.description || '').toLowerCase();
            const vegetationType = (entry.biophysical?.vegetationType || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            return locationDesc.includes(searchLower) || vegetationType.includes(searchLower);
        });
        setFilteredFieldData(filtered);
    }, [fieldDataEntries, searchTerm]);

    const filteredClients = clients.filter(client =>
        client.companyName.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        client.contactPerson.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
    
    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const handleDeleteClient = async (clientId: string) => {
        if (window.confirm('Are you sure you want to delete this client? This will also delete all associated projects and field data.')) {
            try {
                await remove(ref(db, `ClientInfo/${clientId}`));
                // Also delete associated projects and data, but for simplicity, RTDB will cascade or we can leave it
            } catch (error) {
                console.error('Error deleting client:', error);
            }
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (window.confirm('Are you sure you want to delete this project? This will also delete all associated field data.')) {
            try {
                await remove(ref(db, `ProjectsInfo/${projectId}`));
                // Delete associated field data
                // But since nested, perhaps leave or add deletion
            } catch (error) {
                console.error('Error deleting project:', error);
            }
        }
    };
    

    
    // Generate analytics data from field data
    const generateAnalytics = (data: FieldData[]) => {
        if (!data || data.length === 0) return null;

        const totalEntries = data.length;
        const images = data.reduce((sum, entry) => sum + (entry.images?.length || 0), 0);

        // Vegetation types
        const vegetationCounts: { [key: string]: number } = {};
        data.forEach(entry => {
            const type = entry.biophysical?.vegetationType || 'Unknown';
            vegetationCounts[type] = (vegetationCounts[type] || 0) + 1;
        });

        // Elevation data
        const elevations = data
            .map(entry => parseFloat(entry.biophysical?.elevation || '0'))
            .filter(elev => !isNaN(elev) && elev > 0);

        // Conservation status
        const conservationCounts: { [key: string]: number } = {};
        data.forEach(entry => {
            const status = entry.biophysical?.conservationStatus || 'Unknown';
            conservationCounts[status] = (conservationCounts[status] || 0) + 1;
        });

        // Impact assessments
        const impactCounts: { [key: string]: number } = {};
        data.forEach(entry => {
            Object.entries(entry.impacts || {}).forEach(([key, value]) => {
                if (value && value.trim() !== '') {
                    const impactType = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    impactCounts[impactType] = (impactCounts[impactType] || 0) + 1;
                }
            });
        });

        // Prepare chart data
        const vegetationData = Object.entries(vegetationCounts).map(([name, value]) => ({ name, value }));
        const conservationData = Object.entries(conservationCounts).map(([name, value]) => {
            const colors = {
                'Endangered': '#ef4444',
                'Vulnerable': '#f97316',
                'Near Threatened': '#eab308',
                'Least Concern': '#22c55e',
                'Unknown': '#6b7280'
            };
            return { name, value, color: colors[name as keyof typeof colors] || '#6b7280' };
        });

        const impactData = Object.entries(impactCounts).map(([name, value]) => ({ name, value }));

        // Elevation distribution (grouped)
        const elevationRanges: { [key: string]: number } = {};
        elevations.forEach(elev => {
            let range = 'Unknown';
            if (elev < 100) range = '0-100m';
            else if (elev < 500) range = '100-500m';
            else if (elev < 1000) range = '500-1000m';
            else range = '1000m+';
            elevationRanges[range] = (elevationRanges[range] || 0) + 1;
        });

        const elevationData = Object.entries(elevationRanges).map(([name, value]) => ({ name, value }));

        return {
            totalEntries,
            images,
            biophysicalStats: {
                vegetationTypes: Object.keys(vegetationCounts),
                elevation: elevations.length > 0 ? {
                    avg: elevations.reduce((a, b) => a + b, 0) / elevations.length,
                    min: Math.min(...elevations),
                    max: Math.max(...elevations)
                } : null
            },
            chartData: {
                vegetation: vegetationData,
                conservation: conservationData,
                impacts: impactData,
                elevation: elevationData
            }
        };
    };

    // Update analytics when field data changes
    useEffect(() => {
        if (fieldDataEntries.length > 0) {
            setAnalyticsLoading(true);
            const analyticsData = generateAnalytics(fieldDataEntries);
            setAnalytics(analyticsData);
            setAnalyticsLoading(false);
        } else {
            setAnalytics(null);
        }
    }, [fieldDataEntries]);
    
    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'} flex`}>
            {/* Mobile menu button */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-black text-white p-2 rounded">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`w-64 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-black text-white'} p-4 fixed md:static inset-y-0 left-0 z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
                <h2 className="text-xl font-bold text-green-400 mb-6">Navigation</h2>
                <nav className="space-y-2">
                    <button onClick={() => { setCurrentView('clients'); setSidebarOpen(false); }} className={`w-full text-left p-2 rounded ${currentView === 'clients' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>
                        {t('clients')}
                    </button>
                    <button onClick={() => { setCurrentView('projects'); setSidebarOpen(false); }} className={`w-full text-left p-2 rounded ${currentView === 'projects' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>
                        {t('projects')}
                    </button>
                    <button onClick={() => { setCurrentView('fieldData'); setSidebarOpen(false); }} className={`w-full text-left p-2 rounded ${currentView === 'fieldData' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>
                        {t('fieldData')}
                    </button>
                    <button onClick={() => { setCurrentView('map'); setSidebarOpen(false); }} className={`w-full text-left p-2 rounded ${currentView === 'map' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>
                        {t('map')}
                    </button>
                    <button onClick={() => { setCurrentView('profile'); setSidebarOpen(false); }} className={`w-full text-left p-2 rounded ${currentView === 'profile' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>
                        {t('profile')}
                    </button>
                    <button onClick={() => { setShowInternetSearch(true); setSidebarOpen(false); }} className="w-full text-left p-2 rounded hover:bg-gray-700">
                        <i className="fas fa-search mr-2"></i>{t('internetSearch')}
                    </button>
                    <button onClick={() => { setShowSettings(true); setSidebarOpen(false); }} className="w-full text-left p-2 rounded hover:bg-gray-700">
                        {t('settings')}
                    </button>
                </nav>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSidebarOpen(false)}></div>}

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-0">
                <header className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-black text-white'} shadow-md p-4 flex justify-center md:justify-between items-center`}>
                    <img src="/xamu-logo.png" alt="XAMU Logo" className="h-10 w-auto" />
                    <div className="flex items-center space-x-4">
                        <span className="text-sm hidden sm:block">{t('welcome')}, {userProfile.firstName}</span>
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-700 text-white">
                            {theme === 'dark' ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
                        </button>
                        <button onClick={handleSignOut} className="text-sm text-red-400 hover:text-red-300">Logout</button>
                    </div>
                </header>

                <main className={`flex-grow p-4 md:p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    {currentView === 'clients' && (
                        <div>
                            <div className="mb-6 flex justify-between items-center">
                                <h2 className="text-2xl font-bold">{t('clients')}</h2>
                                <button onClick={() => setShowClientForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                    + {t('add')} {t('clients').slice(0, -1)}
                                </button>
                            </div>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder={`${t('search')} ${t('clients').toLowerCase()}...`}
                                    value={clientSearchTerm}
                                    onChange={(e) => setClientSearchTerm(e.target.value)}
                                    className={`w-full p-2 border border-gray-300 rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                />
                            </div>
                            {loading ? <Spinner /> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredClients.map(client => (
                                        <div key={client.id} className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}>
                                            <div onClick={() => { setSelectedClient(client); setCurrentView('projects'); }} className="cursor-pointer p-6">
                                                {client.imageUrl && (
                                                    <div className="flex justify-center mb-4">
                                                        <img src={client.imageUrl} alt="Client logo" className="w-20 h-20 object-cover rounded-full border-4 border-green-100" />
                                                    </div>
                                                )}
                                                <div className="text-center">
                                                    <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{client.companyName}</h3>
                                                    <p className={`text-sm mb-1 flex items-center justify-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        <i className="fas fa-user mr-2 text-green-500"></i>
                                                        {client.contactPerson}
                                                    </p>
                                                    <p className={`text-sm mb-1 flex items-center justify-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        <i className="fas fa-envelope mr-2 text-blue-500"></i>
                                                        {client.contactEmail}
                                                    </p>
                                                    <p className={`text-sm flex items-center justify-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        <i className="fas fa-phone mr-2 text-purple-500"></i>
                                                        {client.contactPhone}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="px-6 pb-4 flex justify-end space-x-2">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingClient(client); setShowClientForm(true); }} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                                                    <i className="fas fa-edit mr-2"></i>{t('edit')}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center">
                                                    <i className="fas fa-trash mr-2"></i>{t('delete')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {currentView === 'projects' && selectedClient && (
                        <div>
                            <div className="mb-6 flex justify-between items-center">
                                <div className="flex items-center">
                                    <button onClick={() => setCurrentView('clients')} className="mr-4 text-green-600 hover:text-green-800">&larr; Back</button>
                                    <h2 className="text-2xl font-bold">{t('projects')} for {selectedClient.companyName}</h2>
                                </div>
                                <button onClick={() => setShowProjectForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                    + {t('add')} {t('projects').slice(0, -1)}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {projects.map(project => (
                                    <div key={project.id} className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}>
                                        <div onClick={() => { setSelectedProject(project); setCurrentView('fieldData'); }} className="cursor-pointer p-6">
                                            {project.imageUrl && (
                                                <div className="flex justify-center mb-4">
                                                    <img src={project.imageUrl} alt="Project image" className="w-20 h-20 object-cover rounded-lg border-4 border-blue-100" />
                                                </div>
                                            )}
                                            <div className="text-center">
                                                <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{project.projectName}</h3>
                                                <p className={`text-sm flex items-center justify-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    <i className="fas fa-calendar mr-2 text-green-500"></i>
                                                    Created: {new Date(project.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="px-6 pb-4 flex justify-end space-x-2">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); setShowProjectForm(true); }} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                                                <i className="fas fa-edit mr-2"></i>{t('edit')}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center">
                                                <i className="fas fa-trash mr-2"></i>{t('delete')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentView === 'projects' && !selectedClient && (
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-bold mb-4">No Client Selected</h2>
                            <p className="text-gray-600 mb-6">Please select a client from the Clients page first.</p>
                            <button onClick={() => setCurrentView('clients')} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                Go to Clients
                            </button>
                        </div>
                    )}

                    {currentView === 'fieldData' && selectedClient && selectedProject && (
                        <div>
                            <div className="mb-6 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                                <div className="flex items-center">
                                    <button onClick={() => setCurrentView('projects')} className="mr-4 text-green-600 hover:text-green-800 text-lg">&larr;</button>
                                    <h2 className="text-xl lg:text-2xl font-bold break-words">{t('fieldData')} for {selectedProject.projectName}</h2>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 lg:gap-2">
                                    <button onClick={() => setShowFieldDataForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm lg:text-base whitespace-nowrap">
                                        + {t('newEntry')}
                                    </button>
                                    <button onClick={() => setShowAiAssistant(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm lg:text-base whitespace-nowrap">
                                        🤖 {t('aiAssistant')}
                                    </button>
                                    <button onClick={() => setShowAiDataScientist(true)} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm lg:text-base whitespace-nowrap">
                                        🧠 AI Data Scientist
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder={`${t('search')} ${t('fieldData').toLowerCase()}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full p-2 border border-gray-300 rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                />
                            </div>

                            {/* Analytics Section */}
                            {analytics && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">📊 Field Data Analytics</h3>

                                    {/* Summary Metrics */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
                                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-lg text-center">
                                            <i className="fas fa-database text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 block"></i>
                                            <p className="text-xs sm:text-sm font-medium">Total Entries</p>
                                            <p className="text-lg sm:text-xl md:text-2xl font-bold">{analytics?.totalEntries || 0}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-lg text-center">
                                            <i className="fas fa-camera text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 block"></i>
                                            <p className="text-xs sm:text-sm font-medium">Images</p>
                                            <p className="text-lg sm:text-xl md:text-2xl font-bold">{analytics?.images || 0}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-lg text-center">
                                            <i className="fas fa-leaf text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 block"></i>
                                            <p className="text-xs sm:text-sm font-medium">Vegetation Types</p>
                                            <p className="text-lg sm:text-xl md:text-2xl font-bold">{analytics?.biophysicalStats?.vegetationTypes?.length || 0}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-lg text-center">
                                            <i className="fas fa-mountain text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 block"></i>
                                            <p className="text-xs sm:text-sm font-medium">Avg Elevation</p>
                                            <p className="text-lg sm:text-xl md:text-2xl font-bold">{analytics?.biophysicalStats?.elevation?.avg?.toFixed(1) || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8">
                                        {/* Vegetation Types Chart */}
                                        <div className="bg-white dark:bg-gray-700 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl shadow-lg">
                                            <h4 className="text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 text-gray-800 dark:text-white">🌿 Vegetation Type Distribution</h4>
                                            {analytics?.chartData?.vegetation?.length > 0 ? (
                                                <div className="h-40 sm:h-48 md:h-56">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={analytics.chartData.vegetation} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                            <XAxis
                                                                dataKey="name"
                                                                tick={{ fontSize: 9, fill: '#6b7280' }}
                                                                angle={-45}
                                                                textAnchor="end"
                                                                height={50}
                                                                interval={0}
                                                            />
                                                            <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: '#1f2937',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    color: '#f9fafb',
                                                                    fontSize: '12px'
                                                                }}
                                                            />
                                                            <Bar dataKey="value" fill="#22c55e" radius={[3, 3, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <div className="text-center">
                                                        <i className="fas fa-leaf text-2xl mb-2 block"></i>
                                                        <p className="text-sm">No vegetation data available</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Elevation Distribution Chart */}
                                        <div className="bg-white dark:bg-gray-700 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl shadow-lg">
                                            <h4 className="text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 text-gray-800 dark:text-white">🏔️ Elevation Distribution</h4>
                                            {analytics?.chartData?.elevation?.length > 0 ? (
                                                <div className="h-40 sm:h-48 md:h-56">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={analytics.chartData.elevation} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                            <XAxis
                                                                dataKey="name"
                                                                tick={{ fontSize: 9, fill: '#6b7280' }}
                                                                angle={-45}
                                                                textAnchor="end"
                                                                height={50}
                                                                interval={0}
                                                            />
                                                            <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: '#1f2937',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    color: '#f9fafb',
                                                                    fontSize: '12px'
                                                                }}
                                                            />
                                                            <Bar dataKey="value" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <div className="text-center">
                                                        <i className="fas fa-mountain text-2xl mb-2 block"></i>
                                                        <p className="text-sm">No elevation data available</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Conservation Status Pie Chart */}
                                        <div className="bg-white dark:bg-gray-700 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl shadow-lg">
                                            <h4 className="text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 text-gray-800 dark:text-white">🛡️ Conservation Status Overview</h4>
                                            {analytics?.chartData?.conservation?.length > 0 ? (
                                                <div className="flex flex-col sm:flex-row items-center">
                                                    <div className="h-40 sm:h-48 md:h-56 w-full sm:w-1/2 mb-4 sm:mb-0">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={analytics.chartData.conservation}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={25}
                                                                    outerRadius={60}
                                                                    paddingAngle={3}
                                                                    dataKey="value"
                                                                >
                                                                    {analytics.chartData.conservation.map((entry: any, index: number) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip
                                                                    contentStyle={{
                                                                        backgroundColor: '#1f2937',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        color: '#f9fafb',
                                                                        fontSize: '12px'
                                                                    }}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="w-full sm:w-1/2 sm:pl-3">
                                                        <div className="space-y-1.5 sm:space-y-2">
                                                            {analytics.chartData.conservation.map((item: any, index: number) => (
                                                                <div key={index} className="flex items-center space-x-2">
                                                                    <div
                                                                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                                                                        style={{ backgroundColor: item.color }}
                                                                    ></div>
                                                                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                                                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white ml-auto">{item.value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <div className="text-center">
                                                        <i className="fas fa-shield-alt text-2xl mb-2 block"></i>
                                                        <p className="text-sm">No conservation data available</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Impact Assessments Chart */}
                                        <div className="bg-white dark:bg-gray-700 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl shadow-lg">
                                            <h4 className="text-sm sm:text-base md:text-lg font-bold mb-3 sm:mb-4 text-gray-800 dark:text-white">⚠️ Environmental Impact Assessments</h4>
                                            {analytics?.chartData?.impacts?.length > 0 ? (
                                                <div className="h-40 sm:h-48 md:h-56">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={analytics.chartData.impacts} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                            <XAxis
                                                                dataKey="name"
                                                                tick={{ fontSize: 9, fill: '#6b7280' }}
                                                                angle={-45}
                                                                textAnchor="end"
                                                                height={50}
                                                                interval={0}
                                                            />
                                                            <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: '#1f2937',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    color: '#f9fafb',
                                                                    fontSize: '12px'
                                                                }}
                                                            />
                                                            <Bar dataKey="value" fill="#ef4444" radius={[3, 3, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <div className="text-center">
                                                        <i className="fas fa-exclamation-triangle text-2xl mb-2 block"></i>
                                                        <p className="text-sm">No impact assessment data available</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Field Data Entries */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {filteredFieldData.map(entry => (
                                   <div key={entry.id} className={`${theme === 'dark' ? 'bg-gray-800 border-green-700 hover:border-green-600' : 'bg-white border-green-200 hover:border-green-400'} border p-6 rounded-lg shadow-md hover:shadow-xl cursor-pointer transition-shadow`}>
                                       {entry.images && entry.images.length > 0 && (
                                           <div className="mb-4">
                                               <img src={entry.images[0].url} alt="Field data" className="w-full h-32 object-cover rounded-md" />
                                           </div>
                                       )}
                                       <div onClick={() => setViewingFieldData(entry)}>
                                           <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>Entry: {new Date(entry.createdAt || 0).toLocaleString()}</h3>
                                           <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Location: {entry.location.description}</p>
                                           {entry.images && entry.images.length > 0 && (
                                               <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>{entry.images.length} image{entry.images.length > 1 ? 's' : ''}</p>
                                           )}
                                       </div>
                                       <div className="flex justify-end space-x-2 mt-4">
                                           <button onClick={(e) => { e.stopPropagation(); setEditingFieldData(entry); setShowFieldDataForm(true); }} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                               {t('edit')}
                                           </button>
                                       </div>
                                   </div>
                               ))}
                            </div>
                        </div>
                    )}

                    {currentView === 'map' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6">{t('map')}</h2>
                            <div className={`h-96 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                <Map fieldData={fieldDataEntries} />
                            </div>
                        </div>
                    )}

                    {currentView === 'profile' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6">{t('profile')}</h2>
                            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
                                <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : ''}`}>{t('welcome')}, {userProfile.firstName} {userProfile.lastName}</h3>
                                <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Email: {user.email}</p>
                                
                                <div className="mb-6">
                                    <h4 className={`text-md font-bold mb-2 ${theme === 'dark' ? 'text-white' : ''}`}>{t('theme')}</h4>
                                    <button onClick={toggleTheme} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                        {t('switchTo')} {theme === 'dark' ? t('light') : t('dark')} {t('mode')}
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <h4 className={`text-md font-bold mb-2 ${theme === 'dark' ? 'text-white' : ''}`}>{t('statistics')}</h4>
                                    {statsLoading ? (
                                        <div className="text-center py-4">
                                            <Spinner />
                                            <p className="text-sm text-gray-600 mt-2">Loading statistics...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{clients.length}</div>
                                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Clients</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{allProjects.length}</div>
                                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Projects</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{allFieldData.length}</div>
                                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Field Entries</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{allFieldData.reduce((sum, entry) => sum + (entry.images?.length || 0), 0)}</div>
                                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Images</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className={`text-md font-bold mb-2 ${theme === 'dark' ? 'text-white' : ''}`}>Subscription Plans</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className={`${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200'} border p-4 rounded-lg`}>
                                            <h5 className={`font-bold ${theme === 'dark' ? 'text-white' : ''}`}>Basic</h5>
                                            <p className="text-2xl font-bold text-green-600">R1250/month</p>
                                            <ul className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                                                <li>• Up to 5 clients</li>
                                                <li>• Up to 10 projects</li>
                                                <li>• Basic AI insights</li>
                                            </ul>
                                        </div>
                                        <div className={`${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200'} border p-4 rounded-lg`}>
                                            <h5 className={`font-bold ${theme === 'dark' ? 'text-white' : ''}`}>Medium</h5>
                                            <p className="text-2xl font-bold text-green-600">R1500/month</p>
                                            <ul className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                                                <li>• Up to 20 clients</li>
                                                <li>• Unlimited projects</li>
                                                <li>• Advanced AI insights</li>
                                                <li>• Export reports</li>
                                            </ul>
                                        </div>
                                        <div className={`${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200'} border p-4 rounded-lg`}>
                                            <h5 className={`font-bold ${theme === 'dark' ? 'text-white' : ''}`}>Premium</h5>
                                            <p className="text-2xl font-bold text-green-600">R3500/month</p>
                                            <ul className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                                                <li>• Unlimited clients & projects</li>
                                                <li>• Premium AI features</li>
                                                <li>• Priority support</li>
                                                <li>• Custom integrations</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {showClientForm && <ClientForm user={user} editingClient={editingClient} onClose={() => { setShowClientForm(false); setEditingClient(null); }} />}
            {showProjectForm && selectedClient && <ProjectForm user={user} client={selectedClient} editingProject={editingProject} onClose={() => { setShowProjectForm(false); setEditingProject(null); }} />}
            {showFieldDataForm && selectedProject && <FieldDataForm user={user} project={selectedProject} editingEntry={editingFieldData} onClose={() => { setShowFieldDataForm(false); setEditingFieldData(null); }} />}
            {viewingFieldData && <FieldDataDetail entry={viewingFieldData} client={selectedClient} project={selectedProject} onClose={() => setViewingFieldData(null)} />}
            {showAiAssistant && selectedClient && selectedProject && <AiAssistant client={selectedClient} project={selectedProject} fieldData={filteredFieldData} onClose={() => setShowAiAssistant(false)} />}
            {showAiDataScientist && selectedClient && selectedProject && <AiDataScientist client={selectedClient} project={selectedProject} fieldData={filteredFieldData} onClose={() => setShowAiDataScientist(false)} />}
            {showInternetSearch && <InternetSearch onClose={() => setShowInternetSearch(false)} />}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('settings')}</h2>
                        
                        {/* User Profile Section */}
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{t('userProfile')}</h3>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Email:</span> {user?.email}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Last Login:</span> {new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">{t('theme')}</label>
                                <select
                                    value={theme}
                                    onChange={(e) => {
                                        const newTheme = e.target.value as 'light' | 'dark';
                                        if (newTheme !== theme) {
                                            toggleTheme();
                                        }
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">{t('language')}</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as 'en' | 'af' | 'zu')}
                                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="en">English</option>
                                    <option value="af">Afrikaans</option>
                                    <option value="zu">Zulu</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={() => setShowSettings(false)} className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white px-4 py-2 rounded-md">
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;