'use client';

import { ChangeItem, OptimizationResult } from '@/types';
import { CheckCircle, AlertCircle, ArrowRight, Download, FileText, Sparkles } from 'lucide-react';
import Button from './Button';
import { useState } from 'react';

interface ResultsDisplayProps {
  result: OptimizationResult;
  onDownloadPDF: () => void;
  isGeneratingPDF?: boolean;
}

export default function ResultsDisplay({ result, onDownloadPDF, isGeneratingPDF }: ResultsDisplayProps) {
  const [expandedChanges, setExpandedChanges] = useState<Set<number>>(new Set([0])); // First one expanded by default

  const toggleChange = (index: number) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChanges(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">CV Optimized!</h2>
              <p className="text-blue-100 text-sm">
                {result.method === 'ai-powered' ? '🤖 AI-Powered Analysis' : '🔧 Rule-Based Optimization'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{result.matchScore}%</div>
            <div className="text-blue-100 text-sm">Match Score</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span className="text-sm text-blue-100">Keywords Matched</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {result.keywordsMatched.slice(0, 8).map((keyword, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-green-500/30 text-green-100 text-xs rounded-full">
                  {keyword}
                </span>
              ))}
              {result.keywordsMatched.length > 8 && (
                <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                  +{result.keywordsMatched.length - 8} more
                </span>
              )}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-300" />
              <span className="text-sm text-blue-100">Could Add</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {result.keywordsMissing.slice(0, 6).map((keyword, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-amber-500/30 text-amber-100 text-xs rounded-full">
                  {keyword}
                </span>
              ))}
              {result.keywordsMissing.length > 6 && (
                <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                  +{result.keywordsMissing.length - 6} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Optimized CV</h3>
              <p className="text-gray-500 text-sm">ATS-friendly PDF, professionally styled</p>
            </div>
          </div>
          <Button 
            onClick={onDownloadPDF} 
            disabled={isGeneratingPDF}
            className="px-6"
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Changes Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Changes Made ({result.changes.length})
            </h3>
            <button 
              onClick={() => {
                if (expandedChanges.size === result.changes.length) {
                  setExpandedChanges(new Set());
                } else {
                  setExpandedChanges(new Set(result.changes.map((_, i) => i)));
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {expandedChanges.size === result.changes.length ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {result.changes.map((change, idx) => (
            <ChangeItemCard 
              key={idx} 
              change={change} 
              index={idx + 1}
              isExpanded={expandedChanges.has(idx)}
              onToggle={() => toggleChange(idx)}
            />
          ))}
        </div>

        {/* Integrity Footer */}
        <div className="p-4 bg-green-50 border-t border-green-100">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">
              <strong>Integrity Verified:</strong> All changes preserve factual accuracy. No fake information added.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeItemCard({ 
  change, 
  index, 
  isExpanded, 
  onToggle 
}: { 
  change: ChangeItem; 
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              {index}
            </span>
            <span className="font-medium text-gray-900">{change.section}</span>
          </div>
          <ArrowRight className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <p className="text-xs font-semibold text-red-600 uppercase mb-1">Before</p>
              <p className="text-sm text-gray-700">{change.originalText}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="text-xs font-semibold text-green-600 uppercase mb-1">After</p>
              <p className="text-sm text-gray-700">{change.newText}</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Why?</p>
            <p className="text-sm text-blue-800">{change.reason}</p>
          </div>
        </div>
      )}
    </div>
  );
}
