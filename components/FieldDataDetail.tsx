
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FieldData, WeatherData, Client, Project } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FieldDataDetailProps {
    entry: FieldData;
    client?: Client;
    project?: Project;
    onClose: () => void;
}

// FIX: Removed invalid module augmentation. The jspdf-autotable plugin is used via type-casting instead.

const FieldDataDetail: React.FC<FieldDataDetailProps> = ({ entry, client, project, onClose }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loadingWeather, setLoadingWeather] = useState(true);

    // Generate analytics data for this specific entry
    const generateEntryAnalytics = (entry: FieldData) => {
        const biophysicalData = Object.entries(entry.biophysical).map(([key, value]) => ({
            attribute: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value: value || 'N/A'
        }));

        const impactsData = Object.entries(entry.impacts).map(([key, value]) => ({
            impact: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            severity: value || 'None'
        }));

        // Create chart data for impacts
        const impactChartData = impactsData
            .filter(item => item.severity && item.severity !== 'None' && item.severity !== 'N/A')
            .map(item => ({
                name: item.impact,
                value: 1 // Simple presence indicator
            }));

        return {
            biophysicalData,
            impactsData,
            impactChartData,
            totalImages: entry.images?.length || 0
        };
    };

    const analytics = generateEntryAnalytics(entry);

    useEffect(() => {
        const fetchWeather = async () => {
            if (!entry.location.lat || !entry.location.lng) {
                 setLoadingWeather(false);
                 return;
            }
            try {
                const apiKey = "170bd511de404e92aa8222345250910"; // As provided in prompt
                const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${entry.location.lat},${entry.location.lng}&aqi=no`);
                if (!response.ok) throw new Error('Weather data fetch failed');
                const data = await response.json();
                setWeather(data);
            } catch (error) {
                console.error("Failed to fetch weather:", error);
            } finally {
                setLoadingWeather(false);
            }
        };

        fetchWeather();
    }, [entry.location.lat, entry.location.lng]);
    
    const exportToPDF = async () => {
        const doc = new jsPDF();
        let yPosition = 20;

        // Add XAMU Logo
        try {
            // Note: In a real implementation, you'd need to load the image as base64
            // For now, we'll add a text logo
            doc.setFontSize(24);
            doc.setTextColor(34, 197, 94);
            doc.text('XAMU', 14, yPosition);
            yPosition += 10;
        } catch (error) {
            console.log('Logo not available for PDF');
        }

        // Title
        doc.setFontSize(20);
        doc.setTextColor(34, 197, 94);
        doc.text('Wetlands Field Data Report', 14, yPosition);
        yPosition += 15;

        // Project Info
        doc.setFontSize(12);
        doc.setTextColor(0);
        const projectInfo = [
            ['Client', client?.companyName || 'N/A'],
            ['Project', project?.projectName || 'N/A'],
            ['Report Date', new Date().toLocaleDateString()],
            ['Field Entry Date', new Date(entry.createdAt || 0).toLocaleDateString()]
        ];

        autoTable(doc, {
            startY: yPosition,
            head: [['Field', 'Value']],
            body: projectInfo,
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 9 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Location & Weather
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.text('Location & Weather Information', 14, yPosition);
        yPosition += 8;

        const locationInfo = [
            ['Description', entry.location.description || 'N/A'],
            ['Latitude', entry.location.lat?.toString() || 'N/A'],
            ['Longitude', entry.location.lng?.toString() || 'N/A']
        ];

        if (weather) {
            locationInfo.push(
                ['Weather Location', `${weather.location.name}, ${weather.location.region}`],
                ['Temperature', `${weather.current.temp_c}°C`],
                ['Conditions', weather.current.condition.text],
                ['Wind Speed', `${weather.current.wind_kph} km/h`],
                ['Humidity', `${weather.current.humidity}%`]
            );
        }

        autoTable(doc, {
            startY: yPosition,
            head: [['Location/Weather Field', 'Value']],
            body: locationInfo,
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 8 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Report date
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, yPosition);
        yPosition += 10;

        // Client Information
        if (client) {
            doc.setFontSize(14);
            doc.setTextColor(34, 197, 94);
            doc.text('Client Information', 14, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setTextColor(0);
            const clientInfo = [
                ['Company Name', client.companyName || 'N/A'],
                ['Registration Number', client.companyRegNum || 'N/A'],
                ['Company Type', client.companyType || 'N/A'],
                ['Contact Person', client.contactPerson || 'N/A'],
                ['Email', client.contactEmail || 'N/A'],
                ['Phone', client.contactPhone || 'N/A'],
                ['Address', client.address || 'N/A']
            ];

            autoTable(doc, {
                startY: yPosition,
                head: [['Field', 'Value']],
                body: clientInfo,
                theme: 'grid',
                headStyles: { fillColor: [34, 197, 94] },
                styles: { fontSize: 8 }
            });
            yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Project Information
        if (project) {
            doc.setFontSize(14);
            doc.setTextColor(34, 197, 94);
            doc.text('Project Information', 14, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setTextColor(0);
            const projectInfo = [
                ['Project Name', project.projectName || 'N/A'],
                ['Created Date', new Date(project.createdAt).toLocaleDateString()],
                ['Client', client?.companyName || 'N/A']
            ];

            autoTable(doc, {
                startY: yPosition,
                head: [['Field', 'Value']],
                body: projectInfo,
                theme: 'grid',
                headStyles: { fillColor: [34, 197, 94] },
                styles: { fontSize: 8 }
            });
            yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Field Data Entry Information
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.text('Field Data Entry', 14, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setTextColor(0);
        const entryInfo = [
            ['Entry Date', new Date(entry.createdAt || 0).toLocaleDateString()],
            ['Location', entry.location.description || 'N/A'],
            ['Latitude', entry.location.lat?.toString() || 'N/A'],
            ['Longitude', entry.location.lng?.toString() || 'N/A']
        ];

        autoTable(doc, {
            startY: yPosition,
            head: [['Field', 'Value']],
            body: entryInfo,
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 8 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Biophysical Attributes
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.text('Biophysical Attributes', 14, yPosition);
        yPosition += 8;

        const biophysicalTableData = analytics.biophysicalData.map(item => [
            item.attribute,
            item.value
        ]);

        autoTable(doc, {
            startY: yPosition,
            head: [['Attribute', 'Value']],
            body: biophysicalTableData,
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 8 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Environmental Impacts
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.text('Environmental Impacts Assessment', 14, yPosition);
        yPosition += 8;

        const impactsTableData = analytics.impactsData.map(item => [
            item.impact,
            item.severity
        ]);

        autoTable(doc, {
            startY: yPosition,
            head: [['Impact Type', 'Severity Level']],
            body: impactsTableData,
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 8 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Summary Statistics
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.text('Summary Statistics', 14, yPosition);
        yPosition += 8;

        const summaryStats = [
            ['Total Images', analytics.totalImages.toString()],
            ['Biophysical Attributes', Object.keys(entry.biophysical).length.toString()],
            ['Impact Assessments', analytics.impactsData.filter(i => i.severity !== 'None' && i.severity !== 'N/A').length.toString()],
            ['GPS Coordinates', `${entry.location.lat.toFixed(4)}, ${entry.location.lng.toFixed(4)}`]
        ];

        autoTable(doc, {
            startY: yPosition,
            head: [['Metric', 'Value']],
            body: summaryStats,
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 9 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Images section
        if (entry.images && entry.images.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(34, 197, 94);
            doc.text('Field Images', 14, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(`Total Images: ${entry.images.length}`, 14, yPosition);
            yPosition += 10;

            // Note about images
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text('Note: Images are referenced by URL. View the web application to see actual images.', 14, yPosition);
            yPosition += 5;

            const imageList = entry.images.map((img, index) => [
                `Image ${index + 1}`,
                img.name || `Image ${index + 1}`,
                img.url
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['#', 'Name', 'URL']],
                body: imageList,
                theme: 'grid',
                headStyles: { fillColor: [34, 197, 94] },
                styles: { fontSize: 7 },
                columnStyles: {
                    2: { cellWidth: 80 }
                }
            });
        }

        // Footer with XAMU branding
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Generated by XAMU Wetlands Field Data App - Professional Environmental Monitoring`, 14, doc.internal.pageSize.height - 15);
            doc.text(`Page ${i} of ${pageCount} | Report Date: ${new Date().toLocaleDateString()}`, 14, doc.internal.pageSize.height - 10);
        }

        // Save the PDF with XAMU branding
        const fileName = `XAMU_Field_Report_${client?.companyName || 'Unknown'}_${project?.projectName || 'Unknown'}_${entry.location.description?.replace(/[^a-zA-Z0-9]/g, '_') || 'Field_Data'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };
    
    // FIX: Added index signature `[key: string]: any` to props type to solve excess property check on `key` prop.
    const DetailRow = ({ label, value }: { label: string, value: any, [key: string]: any }) => (
        <div className="py-2 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="text-sm col-span-2">{value || '-'}</dd>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
                {/* Header with XAMU Logo */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                        <img src="/xamu-logo.png" alt="XAMU Logo" className="h-12 w-auto" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Field Data Report</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {client?.companyName} - {project?.projectName}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-6">
                        {/* Location & Weather */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                                <i className="fas fa-map-marker-alt mr-2 text-green-500"></i>
                                Location & Weather
                            </h3>
                            {loadingWeather ? (
                                <p className="text-gray-600 dark:text-gray-400">Loading weather...</p>
                            ) : weather && (
                                <div className="flex items-center space-x-4 mb-3">
                                    <img src={`https:${weather.current.condition.icon}`} alt="weather icon" className="w-12 h-12" />
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{weather.location.name}, {weather.location.region}</p>
                                        <p className="text-gray-700 dark:text-gray-300">{weather.current.temp_c}°C, {weather.current.condition.text}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Wind: {weather.current.wind_kph} kph, Humidity: {weather.current.humidity}%</p>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Coordinates:</span>
                                    <span className="text-sm text-gray-900 dark:text-white">{entry.location.lat.toFixed(4)}, {entry.location.lng.toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
                                    <span className="text-sm text-gray-900 dark:text-white">{entry.location.description}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Date:</span>
                                    <span className="text-sm text-gray-900 dark:text-white">{new Date(entry.createdAt || 0).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Biophysical Attributes */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                                <i className="fas fa-leaf mr-2 text-green-500"></i>
                                Biophysical Attributes
                            </h3>
                            <div className="space-y-2">
                                {analytics.biophysicalData.map((item, idx) => (
                                    <div key={`bio-${idx}`} className="flex justify-between py-1">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.attribute}:</span>
                                        <span className="text-sm text-gray-900 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Phase Impacts */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                                <i className="fas fa-exclamation-triangle mr-2 text-orange-500"></i>
                                Environmental Impacts
                            </h3>
                            <div className="space-y-2">
                                {analytics.impactsData.map((item, idx) => (
                                    <div key={`impact-${idx}`} className="flex justify-between py-1">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.impact}:</span>
                                        <span className={`text-sm px-2 py-1 rounded ${
                                            item.severity === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                            item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                            item.severity === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                        }`}>
                                            {item.severity}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Analytics & Images */}
                    <div className="space-y-6">
                        {/* Impact Analysis Chart */}
                        {analytics.impactChartData.length > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                                    <i className="fas fa-chart-pie mr-2 text-blue-500"></i>
                                    Impact Analysis
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics.impactChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {analytics.impactChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Summary Statistics */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                                <i className="fas fa-chart-bar mr-2 text-purple-500"></i>
                                Summary Statistics
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{analytics.totalImages}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Images</div>
                                </div>
                                <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{Object.keys(entry.biophysical).length}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Attributes</div>
                                </div>
                                <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                                    <div className="text-2xl font-bold text-orange-600">{analytics.impactsData.filter(i => i.severity !== 'None' && i.severity !== 'N/A').length}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Impacts</div>
                                </div>
                                <div className="text-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{entry.location.lat.toFixed(2)}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Latitude</div>
                                </div>
                            </div>
                        </div>

                        {/* Images */}
                        {entry.images && entry.images.length > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                                    <i className="fas fa-camera mr-2 text-red-500"></i>
                                    Field Images ({entry.images.length})
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {entry.images.slice(0, 4).map((img, idx) => (
                                        <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={img.url}
                                                alt={img.name}
                                                className="rounded-md object-cover h-24 w-full hover:opacity-80 transition-opacity"
                                            />
                                        </a>
                                    ))}
                                </div>
                                {entry.images.length > 4 && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                        +{entry.images.length - 4} more images...
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={exportToPDF} className="mr-2 px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center font-medium">
                        <i className="fas fa-file-pdf mr-2"></i>Export PDF Report
                    </button>
                    <button onClick={onClose} className="px-6 py-3 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FieldDataDetail;