import React, { useState } from 'react';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface InternetSearchProps {
  onClose: () => void;
}

const InternetSearch: React.FC<InternetSearchProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchInternet = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      // Using DuckDuckGo Instant Answer API (free and doesn't require API key)
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

      const response = await fetch(searchUrl);
      const data = await response.json();

      const searchResults: SearchResult[] = [];

      // Add instant answer if available
      if (data.Answer) {
        searchResults.push({
          title: 'Instant Answer',
          link: data.AnswerURL || '#',
          snippet: data.Answer
        });
      }

      // Add abstract if available
      if (data.Abstract) {
        searchResults.push({
          title: data.Heading || 'Abstract',
          link: data.AbstractURL || '#',
          snippet: data.Abstract
        });
      }

      // Add related topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            searchResults.push({
              title: topic.Text.split(' - ')[0] || 'Related Topic',
              link: topic.FirstURL,
              snippet: topic.Text
            });
          }
        });
      }

      // If no results from DuckDuckGo, try a fallback search
      if (searchResults.length === 0) {
        // Fallback: suggest searching on popular search engines
        searchResults.push(
          {
            title: `Search Google for "${query}"`,
            link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            snippet: 'Click to search on Google'
          },
          {
            title: `Search Bing for "${query}"`,
            link: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
            snippet: 'Click to search on Bing'
          },
          {
            title: `Search DuckDuckGo for "${query}"`,
            link: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            snippet: 'Click to search on DuckDuckGo'
          }
        );
      }

      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');

      // Provide fallback links even on error
      setResults([
        {
          title: `Search Google for "${query}"`,
          link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          snippet: 'Click to search on Google'
        },
        {
          title: `Search Bing for "${query}"`,
          link: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
          snippet: 'Click to search on Bing'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchInternet();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <i className="fas fa-search text-green-600 mr-3"></i>
            Internet Search
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">
            &times;
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search the internet..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={searchInternet}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <i className="fas fa-search mr-2"></i>
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {result.title}
                    </a>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {result.snippet}
                  </p>
                  <div className="mt-2">
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      Visit Link <i className="fas fa-external-link-alt ml-1"></i>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && query && (
            <div className="text-center py-12">
              <i className="fas fa-search text-gray-400 text-4xl mb-4"></i>
              <p className="text-gray-500 dark:text-gray-400">
                Enter a search query and click Search to find information on the internet.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InternetSearch;