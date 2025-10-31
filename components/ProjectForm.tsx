import React, { useState, FormEvent, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ref, push, set } from 'firebase/database';
import { db } from '../services/firebaseService';
import { uploadImage } from '../services/cloudinaryService';
import type { Client, Project } from '../types';
import Spinner from './Spinner';

interface ProjectFormProps {
    user: User;
    client: Client;
    editingProject?: Project | null;
    onClose: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ user, client, editingProject, onClose }) => {
    const [projectName, setProjectName] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editingProject) {
            setProjectName(editingProject.projectName || '');
        }
    }, [editingProject]);

    useEffect(() => {
        if (editingProject) {
            setProjectName(editingProject.projectName || '');
        }
    }, [editingProject]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!projectName) {
            setError('Project name is required.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            let imageUrl = editingProject?.imageUrl || '';

            // Try to upload image, but don't fail if it doesn't work
            if (image) {
                try {
                    imageUrl = await uploadImage(image, `xamu-projects/${user.uid}`);
                } catch (imageError) {
                    console.warn('Project image upload failed, saving project without image:', imageError);
                    setError('Project saved successfully, but image upload failed. You can try uploading an image later by editing this project.');
                }
            }

            const projectData = {
                appUserUsername: user.email,
                companyEmail: client.companyEmail || '',
                companyName: client.companyName,
                createdAt: editingProject?.createdAt || Date.now(),
                projectName,
                imageUrl
            };

            if (editingProject) {
                await set(ref(db, `ProjectsInfo/${editingProject.id}`), projectData);
            } else {
                await push(ref(db, 'ProjectsInfo'), projectData);
            }
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to save project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editingProject ? 'Edit Project' : 'New Project'} for <span className="text-primary-600">{client.companyName}</span></h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Project Name" value={projectName} onChange={e => setProjectName(e.target.value)} required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Image</label>
                        <input type="file" onChange={e => setImage(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/50 dark:file:text-primary-300"/>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="mr-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300">
                           {loading ? <Spinner/> : 'Save Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectForm;