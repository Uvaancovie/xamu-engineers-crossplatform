import type { WeatherData } from '../types';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '170bd511de404e92aa8222345250910';
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';

export interface WeatherApiResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
  };
}

/**
 * Get current weather for given coordinates
 * @param latitude GPS latitude
 * @param longitude GPS longitude
 * @returns Promise<WeatherData>
 */
export const getCurrentWeather = async (latitude: number, longitude: number): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${WEATHER_API_BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&aqi=no`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const data: WeatherApiResponse = await response.json();

    return {
      location: {
        name: data.location.name,
        region: data.location.region,
      },
      current: {
        temp_c: data.current.temp_c,
        condition: {
          text: data.current.condition.text,
          icon: data.current.condition.icon,
        },
        wind_kph: data.current.wind_kph,
        humidity: data.current.humidity,
      },
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather data. Please check your API key and connection.');
  }
};

/**
 * Get weather by city name
 * @param cityName Name of the city
 * @returns Promise<WeatherData>
 */
export const getWeatherByCity = async (cityName: string): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `${WEATHER_API_BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(cityName)}&aqi=no`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const data: WeatherApiResponse = await response.json();

    return {
      location: {
        name: data.location.name,
        region: data.location.region,
      },
      current: {
        temp_c: data.current.temp_c,
        condition: {
          text: data.current.condition.text,
          icon: data.current.condition.icon,
        },
        wind_kph: data.current.wind_kph,
        humidity: data.current.humidity,
      },
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather data. Please check your API key and connection.');
  }
};