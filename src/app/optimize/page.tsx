'use client';

import { useState } from 'react';
import { FileUpload, TextArea, Button, Preferences, ResultsDisplay } from '@/components/ui';
import { UserPreferences, OptimizationResult, CVData } from '@/types';
import { ArrowLeft, Sparkles, FileText, Briefcase, Settings, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type Step = 'upload' | 'job' | 'preferences' | 'processing' | 'results';

export default function OptimizerPage() {
  const [step, setStep] = useState<Step>('upload');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState('');
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>({
    tone: 'professional',
    emphasis: [],
    targetSeniority: 'mid',
  });
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setCvFile(file);
    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-cv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse file');
      }

      const data = await response.json();
      
      // Store original file as base64 for later PDF generation
      let originalFileBase64: string | undefined;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        originalFileBase64 = btoa(binary);
      }
      
      setCvText(data.text);
      setCvData({
        originalText: data.text,
        fileName: data.fileName,
        fileType: data.fileType,
        originalFileBase64,
      });
    } catch (err) {
      setError('Failed to parse the CV file. Please try again or paste your CV text directly.');
      setCvFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileRemove = () => {
    setCvFile(null);
    setCvText('');
    setCvData(null);
  };

  const handleOptimize = async () => {
    setStep('processing');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvText: cvText,
          jobDescription: jobDescription,
          preferences: preferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize CV');
      }

      const data = await response.json();
      
      console.log('✅ Optimization result received:');
      console.log('optimizedCV length:', data.optimizedCV?.length);
      console.log('changes count:', data.changes?.length);
      console.log('First 300 chars of optimizedCV:', data.optimizedCV?.substring(0, 300));
      
      setResult(data);
      setStep('results');
    } catch (err) {
      setError('Failed to optimize CV. Please try again.');
      setStep('preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const blob = new Blob([result.optimizedCV], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-cv-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!result) return;

    try {
      setIsLoading(true);
      setError('');
      
      console.log('📤 Sending to PDF generator:');
      console.log('Optimized CV length:', result.optimizedCV.length);
      console.log('First 300 chars:', result.optimizedCV.substring(0, 300));
      
      // Use AI-powered PDF generation
      const response = await fetch('/api/generate-pdf-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optimizedText: result.optimizedCV,
          originalFileName: cvData?.fileName || 'cv',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cvData?.fileName 
        ? cvData.fileName.replace(/\.[^/.]+$/, '_optimized.pdf')
        : `optimized-cv-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF. Please try downloading as DOCX or text.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadDOCX = async () => {
    if (!result) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optimizedText: result.optimizedCV,
          originalFileName: cvData?.fileName || 'cv',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate DOCX');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cvData?.fileName 
        ? cvData.fileName.replace(/\.[^/.]+$/, '_optimized.docx')
        : `optimized-cv-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate DOCX. Please try downloading as text.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setCvFile(null);
    setCvText('');
    setCvData(null);
    setJobDescription('');
    setJobUrl('');
    setResult(null);
    setError('');
  };

  const canProceedToJob = cvText.trim().length > 100;
  const canProceedToPreferences = jobDescription.trim().length > 50;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          {step !== 'upload' && step !== 'results' && (
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      {/* Progress Steps */}
      {step !== 'results' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex items-center justify-center gap-4">
              <StepIndicator
                icon={<FileText className="w-5 h-5" />}
                label="Upload CV"
                isActive={step === 'upload'}
                isComplete={step !== 'upload'}
              />
              <ChevronRight className="w-5 h-5 text-gray-300" />
              <StepIndicator
                icon={<Briefcase className="w-5 h-5" />}
                label="Job Description"
                isActive={step === 'job'}
                isComplete={step === 'preferences' || step === 'processing'}
              />
              <ChevronRight className="w-5 h-5 text-gray-300" />
              <StepIndicator
                icon={<Settings className="w-5 h-5" />}
                label="Preferences"
                isActive={step === 'preferences'}
                isComplete={step === 'processing'}
              />
              <ChevronRight className="w-5 h-5 text-gray-300" />
              <StepIndicator
                icon={<Sparkles className="w-5 h-5" />}
                label="Optimize"
                isActive={step === 'processing'}
                isComplete={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Upload CV */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Your CV</h1>
            <p className="text-gray-600 mb-6">
              Upload your CV as a PDF or DOCX file, or paste the text directly below.
            </p>

            <div className="space-y-6">
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={cvFile}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or paste your CV text</span>
                </div>
              </div>

              <TextArea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Paste your CV content here..."
                rows={12}
                disabled={isLoading}
              />

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep('job')}
                  disabled={!canProceedToJob || isLoading}
                  isLoading={isLoading}
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Job Description */}
        {step === 'job' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Job Description</h1>
            <p className="text-gray-600 mb-6">
              Paste the job description you want to tailor your CV for.
            </p>

            <div className="space-y-6">
              <TextArea
                label="Job Description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={12}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep('preferences')}
                  disabled={!canProceedToPreferences}
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 'preferences' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Optimization Preferences</h1>
            <p className="text-gray-600 mb-6">
              Customize how your CV should be optimized (optional).
            </p>

            <div className="space-y-6">
              <Preferences preferences={preferences} onChange={setPreferences} />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('job')}>
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Back
                </Button>
                <Button onClick={handleOptimize} isLoading={isLoading}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Optimize CV
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center">
            <div className="animate-pulse">
              <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Optimizing Your CV</h2>
              <p className="text-gray-600">
                Analyzing job requirements and tailoring your CV...
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 'results' && result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Your Optimized CV</h1>
              <Button variant="outline" onClick={handleReset}>
                Optimize Another CV
              </Button>
            </div>
            <ResultsDisplay 
              result={result} 
              onDownloadPDF={handleDownloadPDF}
              isGeneratingPDF={isLoading}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function StepIndicator({
  icon,
  label,
  isActive,
  isComplete,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${isActive ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-400'}`}>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isActive
            ? 'bg-blue-100 text-blue-600'
            : isComplete
            ? 'bg-green-100 text-green-600'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {icon}
      </div>
      <span className="font-medium hidden sm:block">{label}</span>
    </div>
  );
}
