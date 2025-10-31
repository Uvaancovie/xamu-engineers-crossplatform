import React, { useState, FormEvent, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ref, push, set } from 'firebase/database';
import { uploadImage } from '../services/cloudinaryService';
import { db, storage } from '../services/firebaseService';
import type { Client } from '../types';
import Spinner from './Spinner';

interface ClientFormProps {
    user: User;
    editingClient?: Client | null;
    onClose: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ user, editingClient, onClose }) => {
    const [companyName, setCompanyName] = useState('');
    const [companyRegNum, setCompanyRegNum] = useState('');
    const [companyType, setCompanyType] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editingClient) {
            setCompanyName(editingClient.companyName || '');
            setCompanyRegNum(editingClient.companyRegNum || '');
            setCompanyType(editingClient.companyType || '');
            setCompanyEmail(editingClient.contactEmail || '');
            setContactPerson(editingClient.contactPerson || '');
            setPhoneNumber(editingClient.contactPhone || '');
            setAddress(editingClient.address || '');
        }
    }, [editingClient]);

    const quickFill = () => {
        setCompanyName('Eco Solutions Ltd');
        setCompanyRegNum('2023/123456/07');
        setCompanyType('Environmental Consulting');
        setCompanyEmail('contact@ecosolutions.test');
        setContactPerson('Dr. Jane Goodall');
        setPhoneNumber('0821234567');
        setAddress('123 Green Way, Cape Town');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!companyName) {
            setError('Company name is required.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            let imageUrl = editingClient?.imageUrl || '';

            // Try to upload image, but don't fail if it doesn't work
            if (image) {
                try {
                    imageUrl = await uploadImage(image, `xamu-clients/${user.uid}`);
                } catch (imageError) {
                    console.warn('Client image upload failed, saving client without image:', imageError);
                    setError('Client saved successfully, but image upload failed. You can try uploading an image later by editing this client.');
                }
            }

            const clientData = {
                ownerId: user.uid,
                companyName,
                companyRegNum,
                companyType,
                contactEmail: companyEmail,
                contactPerson,
                contactPhone: phoneNumber,
                address,
                imageUrl,
                createdAt: editingClient?.createdAt || Date.now()
            };

            if (editingClient) {
                await set(ref(db, `ClientInfo/${editingClient.id}`), clientData);
            } else {
                await push(ref(db, 'ClientInfo'), clientData);
            }
            onClose();

        } catch (err) {
            console.error(err);
            setError('Failed to save client. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-end">
                        <button type="button" onClick={quickFill} className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Quick Fill</button>
                    </div>
                    
                    <input type="text" placeholder="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Company Registration No." value={companyRegNum} onChange={e => setCompanyRegNum(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      <input type="text" placeholder="Company Type" value={companyType} onChange={e => setCompanyType(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <input type="email" placeholder="Company Email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Contact Person" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <input type="text" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Image/Logo</label>
                        <input type="file" onChange={e => setImage(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/50 dark:file:text-primary-300 dark:hover:file:bg-primary-900"/>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="mr-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300">
                            {loading ? <Spinner/> : 'Save Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientForm;