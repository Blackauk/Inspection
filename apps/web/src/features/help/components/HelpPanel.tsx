import { useState, useMemo, useEffect } from 'react';
import { Search, X, BookOpen, ChevronRight } from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { helpArticles, searchHelpArticles, getHelpArticle, type HelpArticle } from '../data/helpArticles';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialArticleId?: string;
}

export function HelpPanel({ isOpen, onClose, initialArticleId }: HelpPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(
    initialArticleId ? getHelpArticle(initialArticleId) || null : null
  );

  // Listen for custom event to open specific article
  useEffect(() => {
    const handleOpenHelp = (e: CustomEvent) => {
      if (e.detail?.articleId) {
        const article = getHelpArticle(e.detail.articleId);
        if (article) {
          setSelectedArticle(article);
        }
      }
    };

    window.addEventListener('openHelp' as any, handleOpenHelp);
    return () => {
      window.removeEventListener('openHelp' as any, handleOpenHelp);
    };
  }, []);

  const filteredArticles = useMemo(() => {
    return searchHelpArticles(searchQuery);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Help & Guidance</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            aria-label="Close help panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Article List */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Article List */}
            <div className="flex-1 overflow-y-auto">
              {filteredArticles.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No articles found
                </div>
              ) : (
                <div className="p-2">
                  {filteredArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                        selectedArticle?.id === article.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {article.title}
                          </h3>
                          {article.category && (
                            <p className="text-xs text-gray-500">{article.category}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Article View */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {selectedArticle ? (
              <div className="p-6">
                <Card>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                      {selectedArticle.title}
                    </h1>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {selectedArticle.body}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select an article to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
