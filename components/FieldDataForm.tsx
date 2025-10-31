import React, { useState, FormEvent, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ref, push, update } from 'firebase/database';
import { uploadImage } from '../services/cloudinaryService';
import { db, storage } from '../services/firebaseService';
import type { Project, GeoLocation, BiophysicalAttributes, PhaseImpacts, FieldData } from '../types';
import Spinner from './Spinner';
import Map from './Map';

interface FieldDataFormProps {
    user: User;
    project: Project;
    onClose: () => void;
    editingEntry?: FieldData;
}

const FieldDataForm: React.FC<FieldDataFormProps> = ({ user, project, onClose, editingEntry }) => {
    const [location, setLocation] = useState<GeoLocation>({ lat: 0, lng: 0, description: '' });
    const [biophysical, setBiophysical] = useState<BiophysicalAttributes>({
        elevation: '', ecoregion: '', meanAnnualPrecipitation: '', rainfallSeasonality: '',
        evapotranspiration: '', geology: '', waterManagementArea: '', soilErodibility: '',
        vegetationType: '', conservationStatus: '', fepaFeatures: ''
    });
    const [impacts, setImpacts] = useState<PhaseImpacts>({
        runoffHardSurfaces: '', runoffSepticTanks: '', sedimentInput: '', floodPeaks: '', pollution: '', weedsIAP: ''
    });
    const [images, setImages] = useState<FileList | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        if (editingEntry) {
            setLocation(editingEntry.location);
            setBiophysical(editingEntry.biophysical);
            setImpacts(editingEntry.impacts);
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                setLocation(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
            });
        }
    }, [editingEntry]);

    const quickFill = () => {
        setLocation({ lat: -25.7313, lng: 28.2184, description: 'Pretoria Botanical Gardens Wetland' });
        setBiophysical({
            elevation: '1350', ecoregion: 'Savanna', meanAnnualPrecipitation: '650', rainfallSeasonality: 'Summer',
            evapotranspiration: '1400', geology: 'Shale/Quartzite', waterManagementArea: 'Crocodile (West) and Marico',
            soilErodibility: 'Medium', vegetationType: 'Mixed Bushveld', conservationStatus: 'Protected Area',
            fepaFeatures: 'Identified FEPA wetland'
        });
        setImpacts({
            runoffHardSurfaces: 'Low', runoffSepticTanks: 'None', sedimentInput: 'Low',
            floodPeaks: 'Natural', pollution: 'Low urban runoff', weedsIAP: 'Lantana camara present'
        });
    };

    const handleBiophysicalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBiophysical({ ...biophysical, [e.currentTarget.name]: e.currentTarget.value });
    };

    const handleImpactsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImpacts({ ...impacts, [e.currentTarget.name]: e.currentTarget.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const imageUrls: { url: string; name: string }[] = editingEntry?.images || [];

            // Try to upload images, but don't fail the entire submission if it fails
            if (images) {
                try {
                    for (const file of Array.from(images) as File[]) {
                        const url = await uploadImage(file, `xamu-field/${project.companyName}/${project.projectName}`);
                        imageUrls.push({ url, name: file.name });
                    }
                } catch (imageError) {
                    console.warn('Image upload failed, saving field data without images:', imageError);
                    setError('Field data saved successfully, but image upload failed. You can try uploading images later by editing this entry.');
                }
            }

            const data = {
                ...biophysical,
                location: location, // Save the full location object
                map: biophysical.meanAnnualPrecipitation,
                rainfall: biophysical.rainfallSeasonality,
                fepa: biophysical.fepaFeatures,
                images: imageUrls,
                timestamp: editingEntry?.createdAt || Date.now()
            };

            if (editingEntry) {
                // Update existing entry
                await update(ref(db, `ProjectData/${project.companyName}/${project.projectName}/Biophysical/${editingEntry.id}`), data);
            } else {
                // Create new entry
                await push(ref(db, `ProjectData/${project.companyName}/${project.projectName}/Biophysical`), data);
            }

            // Also save/update impacts
            const impactsData = {
                ...impacts,
                timestamp: editingEntry?.createdAt || Date.now()
            };

            if (editingEntry) {
                await update(ref(db, `ProjectData/${project.companyName}/${project.projectName}/Impacts/${editingEntry.id}`), impactsData);
            } else {
                await push(ref(db, `ProjectData/${project.companyName}/${project.projectName}/Impacts`), impactsData);
            }

            onClose();
        } catch (err: any) {
            console.error(err);
            setError('Failed to save field data. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const inputClass = "w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 py-2 border-b border-green-200 dark:border-green-700">
                    <h2 className="text-xl font-bold">{editingEntry ? 'Edit' : 'New'} Field Entry for {project.projectName}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                     <div className="flex justify-end">
                        <button type="button" onClick={quickFill} className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Quick Fill Sample Data</button>
                    </div>
                    {/* Location */}
                    <section>
                        <h3 className="text-lg font-semibold mb-2 border-b-2 border-green-500 pb-2 text-green-700 dark:border-green-400 dark:text-green-400">Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="number" placeholder="Latitude" value={location.lat} onChange={e => setLocation({...location, lat: parseFloat(e.target.value)})} className={inputClass} />
                            <input type="number" placeholder="Longitude" value={location.lng} onChange={e => setLocation({...location, lng: parseFloat(e.target.value)})} className={inputClass} />
                            <input type="text" placeholder="Location Description" value={location.description} onChange={e => setLocation({...location, description: e.target.value})} required className={inputClass} />
                            <button type="button" onClick={() => setShowMap(true)} className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                <i className="fas fa-map-marker-alt mr-2"></i>Select Location on Map
                            </button>
                        </div>
                    </section>
                    {/* Biophysical Attributes */}
                    <section>
                        <h3 className="text-lg font-semibold mb-2 border-b-2 border-green-500 pb-2 text-green-700 dark:border-green-400 dark:text-green-400">Biophysical Attributes</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <input name="elevation" placeholder="Elevation (m)" value={biophysical.elevation} onChange={handleBiophysicalChange} className={inputClass} />
                            <input name="ecoregion" placeholder="Ecoregion" value={biophysical.ecoregion} onChange={handleBiophysicalChange} className={inputClass} />
                            <input name="meanAnnualPrecipitation" placeholder="MAP (mm)" value={biophysical.meanAnnualPrecipitation} onChange={handleBiophysicalChange} className={inputClass} />
                            <input name="rainfallSeasonality" placeholder="Rainfall Seasonality" value={biophysical.rainfallSeasonality} onChange={handleBiophysicalChange} className={inputClass} />
                            <input name="evapotranspiration" placeholder="Evapotranspiration (mm)" value={biophysical.evapotranspiration} onChange={handleBiophysicalChange} className={inputClass} />
                            <input name="geology" placeholder="Geology" value={biophysical.geology} onChange={handleBiophysicalChange} className={inputClass} />
                            <input name="waterManagementArea" placeholder="Water Management Area" value={biophysical.waterManagementArea} onChange={handleBiophysicalChange} className={inputClass} />
                            <input name="soilErodibility" placeholder="Soil Erodibility" value={biophysical.soilErodibility} onChange={handleBiophysicalChange} className={inputClass} />
                            <input name="vegetationType" placeholder="Vegetation Type" value={biophysical.vegetationType} onChange={handleBiophysicalChange} className={inputClass} />
                            <input name="conservationStatus" placeholder="Conservation Status" value={biophysical.conservationStatus} onChange={handleBiophysicalChange} className={inputClass} />
                            <input name="fepaFeatures" placeholder="FEPA Features" value={biophysical.fepaFeatures} onChange={handleBiophysicalChange} className={inputClass} />
                        </div>
                    </section>
                     {/* Phase Impacts */}
                    <section>
                        <h3 className="text-lg font-semibold mb-2 border-b-2 border-green-500 pb-2 text-green-700 dark:border-green-400 dark:text-green-400">Phase Impacts</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <input name="runoffHardSurfaces" placeholder="Runoff (Hard Surfaces)" value={impacts.runoffHardSurfaces} onChange={handleImpactsChange} className={inputClass} />
                            <input name="runoffSepticTanks" placeholder="Runoff (Septic Tanks)" value={impacts.runoffSepticTanks} onChange={handleImpactsChange} className={inputClass} />
                            <input name="sedimentInput" placeholder="Sediment Input" value={impacts.sedimentInput} onChange={handleImpactsChange} className={inputClass} />
                            <input name="floodPeaks" placeholder="Flood Peaks" value={impacts.floodPeaks} onChange={handleImpactsChange} className={inputClass} />
                            <input name="pollution" placeholder="Pollution" value={impacts.pollution} onChange={handleImpactsChange} className={inputClass} />
                            <input name="weedsIAP" placeholder="Weeds/IAP" value={impacts.weedsIAP} onChange={handleImpactsChange} className={inputClass} />
                        </div>
                    </section>
                     {/* Image Upload */}
                    <section>
                         <h3 className="text-lg font-semibold mb-2 border-b-2 border-green-500 pb-2 text-green-700 dark:border-green-400 dark:text-green-400">Images</h3>
                         {editingEntry?.images && editingEntry.images.length > 0 && (
                             <div className="mb-4">
                                 <h4 className="text-sm font-medium mb-2">Existing Images:</h4>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                     {editingEntry.images.map((img, index) => (
                                         <div key={index} className="relative">
                                             <img src={img.url} alt={img.name} className="w-full h-20 object-cover rounded" />
                                             <span className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded">{img.name}</span>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}
                         <input type="file" multiple onChange={e => setImages(e.target.files)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/50 dark:file:text-green-300 dark:hover:file:bg-green-900"/>
                         <p className="text-xs text-gray-500 mt-1">Select additional images to add to this entry</p>
                    </section>
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="flex justify-end pt-4 sticky bottom-0 bg-white dark:bg-gray-800 py-4 border-t border-green-200 dark:border-green-700">
                        <button type="button" onClick={onClose} className="mr-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300">
                            {loading ? <Spinner/> : (editingEntry ? 'Update' : 'Save') + ' Entry'}
                        </button>
                    </div>
                </form>
            </div>

            {showMap && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Select Location</h3>
                            <button onClick={() => setShowMap(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
                        </div>
                        <div className="flex-grow">
                            <Map onLocationSelect={(loc) => { setLocation(loc); setShowMap(false); }} />
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setShowMap(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FieldDataForm;