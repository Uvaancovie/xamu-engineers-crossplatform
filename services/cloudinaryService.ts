import SHA1 from 'crypto-js/sha1';

const CLOUD_NAME = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = (import.meta as any).env.VITE_CLOUDINARY_API_KEY;
const API_SECRET = (import.meta as any).env.VITE_CLOUDINARY_API_SECRET;

export const uploadImage = async (file: File, folder: string): Promise<string> => {
  const timestamp = Math.round((new Date).getTime() / 1000);

  // Try signed upload first
  try {
    const signature = generateSignature(folder, timestamp);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      return result.secure_url;
    }

    // If signed upload fails, log the error
    const errorText = await response.text();
    console.warn('Signed upload failed, trying unsigned upload:', response.status, errorText);

  } catch (error) {
    console.warn('Signed upload failed, trying unsigned upload:', error);
  }

  // Fallback to unsigned upload
  console.log('Attempting unsigned upload...');
  const unsignedFormData = new FormData();
  unsignedFormData.append('file', file);
  unsignedFormData.append('upload_preset', 'xamu-uploads'); // You'll need to create this preset in Cloudinary
  unsignedFormData.append('folder', folder);

  const unsignedResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: unsignedFormData,
  });

  if (!unsignedResponse.ok) {
    const errorText = await unsignedResponse.text();
    console.error('Both signed and unsigned uploads failed:', unsignedResponse.status, errorText);
    throw new Error(`Cloudinary upload failed: ${unsignedResponse.statusText}`);
  }

  const result = await unsignedResponse.json();
  return result.secure_url;
};

const generateSignature = (folder: string, timestamp: number): string => {
  // Create the string to sign: all parameters in alphabetical order + API secret
  const paramsString = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  return SHA1(paramsString).toString();
};