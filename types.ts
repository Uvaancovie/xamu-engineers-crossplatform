export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  location: string;
  email: string;
}

export interface Client {
  id: string;
  ownerId?: string; // May not be present in RTDB
  companyName: string;
  companyRegNum: string;
  companyType: string;
  companyEmail: string;
  contactPerson: string;
  phoneNumber: string;
  address: string;
  imageUrl?: string;
  createdAt?: number;
}

export interface Project {
  id:string;
  clientId?: string;
  ownerId?: string;
  projectName: string;
  createdAt: number;
  appUserUsername: string;
  companyEmail: string;
  companyName: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  description: string;
}

export interface BiophysicalAttributes {
  elevation: string;
  ecoregion: string;
  meanAnnualPrecipitation: string;
  rainfallSeasonality: string;
  evapotranspiration: string;
  geology: string;
  waterManagementArea: string;
  soilErodibility: string;
  vegetationType: string;
  conservationStatus: string;
  fepaFeatures: string;
}

export interface PhaseImpacts {
  runoffHardSurfaces: string;
  runoffSepticTanks: string;
  sedimentInput: string;
  floodPeaks: string;
  pollution: string;
  weedsIAP: string;
}

export interface FieldData {
  id: string;
  projectId?: string;
  ownerId?: string;
  location: GeoLocation;
  biophysical: BiophysicalAttributes;
  impacts: PhaseImpacts;
  images?: { url: string; name: string }[];
  createdAt?: number;
}

export interface WeatherData {
  location: {
    name: string;
    region: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    wind_kph: number;
    humidity: number;
  };
}