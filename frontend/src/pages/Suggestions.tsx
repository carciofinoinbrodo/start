import { useState } from 'react';
import { Lightbulb, Loader2, FileText, Users, Award, Wrench, Star, Globe, MessageSquare, RefreshCw, Sparkles, ChevronDown, ChevronUp, Clock, Cpu } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useSuggestions } from '../hooks/useApi';
import { generateAISuggestions } from '../api/client';
import type { AISuggestionsResponse } from '../api/client';
import { config } from '../config';

const PRIORITY_COLORS = {
  high: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  low: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
};

const CATEGORY_ICONS = {
  content: FileText,
  community: Users,
  authority: Award,
  technical: Wrench,
};

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: '#22c55e' };
  if (score >= 60) return { label: 'Good - Room for improvement', color: '#f59e0b' };
  if (score >= 40) return { label: 'Needs Work', color: '#f97316' };
  return { label: 'Critical - Take Action', color: '#ef4444' };
}

export function Suggestions() {
  const { data, loading, error } = useSuggestions();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionsResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  const handleGenerateAI = async (forceRefresh: boolean = false) => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const result = await generateAISuggestions('wix', forceRefresh);
      setAiSuggestions(result);
      setShowAiSuggestions(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate AI suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header
          title="AI SEO Suggestions"
          subtitle="Actionable insights to improve your AI visibility"
        />
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--accent-primary)]" />
            <p className="text-[var(--text-muted)]">Analyzing your data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <Header
          title="AI SEO Suggestions"
          subtitle="Actionable insights to improve your AI visibility"
        />
        <div className="p-8">
          <div className="glass-card p-12 text-center">
            <p className="text-red-400 mb-2">Failed to load suggestions</p>
            <p className="text-sm text-[var(--text-muted)]">Make sure the backend is running at {config.apiHost}</p>
          </div>
        </div>
      </div>
    );
  }

  const scoreInfo = getScoreLabel(data.score);

  return (
    <div className="min-h-screen">
      <Header
        title="AI SEO Suggestions"
        subtitle="Actionable insights to improve your AI visibility"
      />

      <div className="p-4 md:p-8">
        {/* Score Card */}
        <div className="glass-card p-8 mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 relative">
              <div className="w-40 h-40 rounded-full flex items-center justify-center relative">
                {/* Background circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke={scoreInfo.color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${data.score * 4.4} 440`}
                    style={{
                      filter: `drop-shadow(0 0 8px ${scoreInfo.color}40)`,
                    }}
                  />
                </svg>
                <div className="text-center z-10">
                  <span className="text-4xl font-bold text-[var(--text-primary)]">{data.score}</span>
                  <span className="text-lg text-[var(--text-muted)]">/100</span>
                </div>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                AI SEO Score
              </h2>
              <p className="text-lg mb-4" style={{ color: scoreInfo.color }}>
                {scoreInfo.label}
              </p>
              <p className="text-[var(--text-secondary)]">
                This score reflects your brand's visibility in AI-generated responses.
                Follow the suggestions below to improve your score.
              </p>
            </div>
          </div>
        </div>

        {/* AI Suggestions Section */}
        <div className="glass-card p-6 mb-8 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="icon-glow">
                <Sparkles className="w-5 h-5 text-[var(--accent-secondary)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">AI-Powered Analysis</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Get personalized recommendations using advanced AI analysis
                </p>
              </div>
            </div>
            <button
              onClick={() => handleGenerateAI(true)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : aiSuggestions ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Suggestions
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
              {aiError}
            </div>
          )}

          {aiSuggestions && (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <button
                onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                className="flex items-center gap-2 text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors w-full"
              >
                {showAiSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="font-medium">AI Analysis Results</span>
                <span className="text-xs text-[var(--text-muted)] ml-2">
                  Score: {aiSuggestions.ai_visibility_score.toFixed(1)}%
                </span>
              </button>

              {showAiSuggestions && (
                <div className="mt-4 space-y-4">
                  {/* Summary */}
                  <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]">
                    <p className="text-[var(--text-secondary)]">{aiSuggestions.summary}</p>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Generated: {new Date(aiSuggestions.generated_at).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      Model: {aiSuggestions.model_used}
                    </span>
                  </div>

                  {/* Keyword Opportunities */}
                  {aiSuggestions.keyword_opportunities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                        Keyword Opportunities ({aiSuggestions.keyword_opportunities.length})
                      </h4>
                      <div className="space-y-2">
                        {aiSuggestions.keyword_opportunities.map((kw, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-[var(--text-primary)]">"{kw.query}"</span>
                              <div className="flex gap-1">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  kw.estimated_impact === 'high' ? 'bg-green-500/20 text-green-400' :
                                  kw.estimated_impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {kw.estimated_impact} impact
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] mt-1">{kw.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* On-Page Recommendations */}
                  {aiSuggestions.on_page_recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                        Action Items ({aiSuggestions.on_page_recommendations.length})
                      </h4>
                      <div className="space-y-2">
                        {aiSuggestions.on_page_recommendations.map((rec, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-medium text-[var(--text-primary)]">{rec.recommendation}</span>
                              <span className={`px-2 py-0.5 rounded text-xs uppercase ${
                                rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {rec.priority}
                              </span>
                            </div>
                            {rec.implementation_steps.length > 0 && (
                              <ul className="text-sm text-[var(--text-muted)] space-y-1 ml-4">
                                {rec.implementation_steps.map((step, stepIdx) => (
                                  <li key={stepIdx} className="list-disc">{step}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Competitor Insights */}
                  {aiSuggestions.competitor_insights && (
                    <div className="p-4 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30">
                      <h4 className="text-sm font-medium text-[var(--accent-primary)] mb-1">Competitor Insights</h4>
                      <p className="text-sm text-[var(--text-secondary)]">{aiSuggestions.competitor_insights}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Suggestions Header */}
        <div className="flex items-center gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="icon-glow">
            <Lightbulb className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Quick Recommendations ({data.suggestions.length})
          </h2>
        </div>

        {/* Suggestions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.suggestions.map((suggestion, idx) => {
            const CategoryIcon = CATEGORY_ICONS[suggestion.category as keyof typeof CATEGORY_ICONS] || Lightbulb;
            const priorityStyle = PRIORITY_COLORS[suggestion.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium;

            return (
              <div
                key={suggestion.id}
                className="glass-card p-6 animate-fade-in-up hover:border-[var(--accent-primary)] transition-all duration-300"
                style={{ animationDelay: `${350 + idx * 50}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      <CategoryIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {suggestion.title}
                      </h3>
                      <span className="text-xs text-[var(--text-muted)] capitalize">
                        {suggestion.category}
                      </span>
                    </div>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium uppercase"
                    style={{
                      backgroundColor: priorityStyle.bg,
                      color: priorityStyle.text,
                      border: `1px solid ${priorityStyle.border}`,
                    }}
                  >
                    {suggestion.priority}
                  </span>
                </div>

                {/* Stat highlight */}
                <div
                  className="rounded-lg p-4 mb-4 flex items-center gap-4"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div className="text-3xl font-bold text-data">
                    {suggestion.stat}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {suggestion.statLabel}
                  </div>
                </div>

                {/* Description */}
                <p className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed">
                  {suggestion.description}
                </p>

                {/* Action */}
                <div className="bg-[var(--accent-primary)]/10 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-[var(--accent-primary)]">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-medium">Action:</span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] mt-1">
                    {suggestion.action}
                  </p>
                </div>

                {/* Examples */}
                {suggestion.examples.length > 0 && (
                  <div className="border-t border-[var(--border-subtle)] pt-4">
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                      Examples from data
                    </span>
                    <ul className="mt-2 space-y-2">
                      {suggestion.examples.map((example, exIdx) => (
                        <li key={exIdx} className="flex items-start gap-2 text-sm">
                          {example.type === 'source' ? (
                            <>
                              <Globe className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
                              <span className="text-[var(--text-secondary)]">
                                {example.domain}
                                {example.title && (
                                  <span className="text-[var(--text-muted)]"> - {example.title}</span>
                                )}
                              </span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4 text-[var(--accent-secondary)] flex-shrink-0 mt-0.5" />
                              <span className="text-[var(--text-secondary)]">
                                "{example.query}"
                              </span>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="glass-card p-6 mt-8 text-center animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <p className="text-[var(--text-muted)] text-sm">
            These suggestions are based on analysis of {data.suggestions.length > 0 ? 'your tracked data' : 'AI citation patterns'}.
            Implementing these recommendations can improve your visibility in AI-generated responses.
          </p>
        </div>
      </div>
    </div>
  );
}
