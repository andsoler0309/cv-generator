'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { UserPreferences } from '@/types';

interface PreferencesProps {
  preferences: UserPreferences;
  onChange: (preferences: UserPreferences) => void;
}

const toneOptions = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-oriented' },
  { value: 'creative', label: 'Creative', description: 'Innovative and dynamic' },
  { value: 'technical', label: 'Technical', description: 'Detailed and precise' },
  { value: 'executive', label: 'Executive', description: 'Leadership-focused' },
] as const;

const seniorityOptions = [
  { value: 'entry', label: 'Entry Level', description: '0-2 years experience' },
  { value: 'mid', label: 'Mid Level', description: '3-5 years experience' },
  { value: 'senior', label: 'Senior', description: '6-10 years experience' },
  { value: 'executive', label: 'Executive', description: '10+ years experience' },
] as const;

const emphasisOptions = [
  'Leadership', 'Technical Skills', 'Communication', 'Problem Solving',
  'Project Management', 'Innovation', 'Teamwork', 'Results-driven',
];

export default function Preferences({ preferences, onChange }: PreferencesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleEmphasis = (emphasis: string) => {
    const newEmphasis = preferences.emphasis.includes(emphasis)
      ? preferences.emphasis.filter((e) => e !== emphasis)
      : [...preferences.emphasis, emphasis];
    onChange({ ...preferences, emphasis: newEmphasis });
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-700">Optimization Preferences (Optional)</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onChange({ ...preferences, tone: option.value })}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    preferences.tone === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Seniority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Seniority
            </label>
            <div className="grid grid-cols-2 gap-2">
              {seniorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onChange({ ...preferences, targetSeniority: option.value })}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    preferences.targetSeniority === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Emphasis Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Areas to Emphasize
            </label>
            <div className="flex flex-wrap gap-2">
              {emphasisOptions.map((emphasis) => (
                <button
                  key={emphasis}
                  onClick={() => toggleEmphasis(emphasis)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    preferences.emphasis.includes(emphasis)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {emphasis}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
