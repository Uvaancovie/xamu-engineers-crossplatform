import React, { useState, useEffect } from 'react';
import type { FieldData, WeatherData } from '../types';
import { getCurrentWeather } from '../services/weatherService';
import Spinner from './Spinner';

interface WeatherDashboardProps {
  fieldData: FieldData[];
  theme: string;
}

const WeatherDashboard: React.FC<WeatherDashboardProps> = ({ fieldData, theme }) => {
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [selectedLocation, setSelectedLocation] = useState<FieldData | null>(null);

  // Automatically fetch weather for all field data locations on mount
  useEffect(() => {
    fieldData.forEach(entry => {
      fetchWeatherForLocation(entry);
    });
  }, [fieldData]);

  const fetchWeatherForLocation = async (entry: FieldData) => {
    const locationKey = `${entry.location.lat},${entry.location.lng}`;
    if (weatherData[locationKey] || loading[locationKey]) return;

    setLoading(prev => ({ ...prev, [locationKey]: true }));

    try {
      const weather = await getCurrentWeather(entry.location.lat, entry.location.lng);
      setWeatherData(prev => ({ ...prev, [locationKey]: weather }));
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(prev => ({ ...prev, [locationKey]: false }));
    }
  };

  const handleLocationClick = (entry: FieldData) => {
    setSelectedLocation(entry);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        <i className="fas fa-cloud-sun mr-2 text-blue-500"></i>
        Weather Dashboard
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field Data Locations */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            <i className="fas fa-map-marker-alt mr-2 text-green-500"></i>
            Field Data Locations
          </h3>

          {fieldData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <i className="fas fa-database text-3xl mb-2 block"></i>
              <p>No field data entries available</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fieldData.map(entry => {
                const locationKey = `${entry.location.lat},${entry.location.lng}`;
                const weather = weatherData[locationKey];
                const isLoading = loading[locationKey];

                return (
                  <div
                    key={entry.id}
                    onClick={() => handleLocationClick(entry)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedLocation?.id === entry.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : theme === 'dark'
                        ? 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 dark:text-white">
                          {entry.location.description}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.location.lat.toFixed(4)}, {entry.location.lng.toFixed(4)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(entry.createdAt || 0).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="ml-4 text-right">
                        {isLoading ? (
                          <div className="flex items-center">
                            <Spinner />
                            <span className="text-xs text-gray-500 ml-2">Loading...</span>
                          </div>
                        ) : weather ? (
                          <div className="text-center">
                            <img
                              src={`https:${weather.current.condition.icon}`}
                              alt={weather.current.condition.text}
                              className="w-8 h-8 mx-auto mb-1"
                            />
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                              {weather.current.temp_c}°C
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {weather.current.condition.text}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <i className="fas fa-cloud-sun text-gray-400 text-lg"></i>
                            <p className="text-xs text-gray-500 mt-1">Loading...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weather Details */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            <i className="fas fa-info-circle mr-2 text-blue-500"></i>
            Weather Details
          </h3>

          {selectedLocation ? (
            (() => {
              const locationKey = `${selectedLocation.location.lat},${selectedLocation.location.lng}`;
              const weather = weatherData[locationKey];
              const isLoading = loading[locationKey];

              if (isLoading) {
                return (
                  <div className="flex items-center justify-center py-12">
                    <Spinner />
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading weather data...</span>
                  </div>
                );
              }

              if (!weather) {
                return (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-cloud-sun text-4xl mb-4 block"></i>
                    <p>Click on a location to view weather details</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {/* Location Header */}
                  <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-600">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                      {selectedLocation.location.description}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedLocation.location.lat.toFixed(4)}, {selectedLocation.location.lng.toFixed(4)}
                    </p>
                  </div>

                  {/* Current Weather */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <img
                        src={`https:${weather.current.condition.icon}`}
                        alt={weather.current.condition.text}
                        className="w-16 h-16"
                      />
                    </div>
                    <h5 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                      {weather.current.temp_c}°C
                    </h5>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
                      {weather.current.condition.text}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Feels like {weather.current.temp_c}°C
                    </p>
                  </div>

                  {/* Weather Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center mb-2">
                        <i className="fas fa-wind text-blue-500 mr-2"></i>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wind</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        {weather.current.wind_kph} km/h
                      </p>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center mb-2">
                        <i className="fas fa-tint text-blue-500 mr-2"></i>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Humidity</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        {weather.current.humidity}%
                      </p>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center mb-2">
                        <i className="fas fa-eye text-green-500 mr-2"></i>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        {weather.current.vis_km} km
                      </p>
                    </div>

                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center mb-2">
                        <i className="fas fa-sun text-yellow-500 mr-2"></i>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">UV Index</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        {weather.current.uv}
                      </p>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h6 className="font-medium text-gray-800 dark:text-white mb-2">
                      <i className="fas fa-map-pin mr-2 text-red-500"></i>
                      Location Details
                    </h6>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Region:</strong> {weather.location.region}<br />
                      <strong>Entry Date:</strong> {new Date(selectedLocation.createdAt || 0).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <i className="fas fa-hand-pointer text-4xl mb-4 block"></i>
              <p>Select a field data location to view weather information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;