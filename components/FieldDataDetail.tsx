
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FieldData, WeatherData, Client, Project } from '../types';

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

        // Title
        doc.setFontSize(20);
        doc.setTextColor(34, 197, 94); // Green color
        doc.text('XAMU Wetlands Field Data Report', 14, yPosition);
        yPosition += 15;

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

        const tableData = (obj: object) => Object.entries(obj).map(([key, value]) => [
            key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value || 'N/A'
        ]);

        autoTable(doc, {
            startY: yPosition,
            head: [['Attribute', 'Value']],
            body: tableData(entry.biophysical),
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 8 }
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Phase Impacts
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.text('Phase Impacts', 14, yPosition);
        yPosition += 8;

        autoTable(doc, {
            startY: yPosition,
            head: [['Impact Type', 'Value']],
            body: tableData(entry.impacts),
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 8 }
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

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Generated by XAMU Wetlands Field Data App - Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
        }

        // Save the PDF
        const fileName = `XAMU_Field_Report_${client?.companyName || 'Unknown'}_${project?.projectName || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Field Entry Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Location & Weather</h3>
                        {loadingWeather ? <p>Loading weather...</p> : weather && (
                            <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center space-x-4">
                                <img src={weather.current.condition.icon} alt="weather icon" />
                                <div>
                                    <p className="font-bold">{weather.location.name}, {weather.location.region}</p>
                                    <p>{weather.current.temp_c}°C, {weather.current.condition.text}</p>
                                    <p>Wind: {weather.current.wind_kph} kph, Humidity: {weather.current.humidity}%</p>
                                </div>
                            </div>
                        )}
                        <dl className="divide-y dark:divide-gray-700"><DetailRow label="Description" value={entry.location.description} /></dl>
                    </div>

                    <div><h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Biophysical Attributes</h3>
                        <dl className="divide-y dark:divide-gray-700">{Object.entries(entry.biophysical).map(([key, value]) => <DetailRow key={key} label={key} value={value} />)}</dl>
                    </div>
                    <div><h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Phase Impacts</h3>
                        <dl className="divide-y dark:divide-gray-700">{Object.entries(entry.impacts).map(([key, value]) => <DetailRow key={key} label={key} value={value} />)}</dl>
                    </div>
                     <div><h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Images</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {entry.images.map((img, idx) => <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer"><img src={img.url} alt={img.name} className="rounded-md object-cover h-32 w-full"/></a>)}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t dark:border-gray-700">
                    <button onClick={exportToPDF} className="mr-2 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
                        <i className="fas fa-file-pdf mr-2"></i>Export PDF
                    </button>
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Close</button>
                </div>
            </div>
        </div>
    );
};

export default FieldDataDetail;