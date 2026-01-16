import Link from 'next/link';
import { FileText, Target, Shield, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CV Optimizer</span>
          </div>
          <Link
            href="/optimize"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          AI-Powered CV Optimization
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Tailor Your CV to Any Job<br />
          <span className="text-blue-600">In Seconds</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Upload your CV and a job description. Our AI analyzes both and optimizes your CV 
          to match the role—without adding fake experience or altering facts.
        </p>
        <Link
          href="/optimize"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
        >
          Optimize Your CV Now
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FileText className="w-8 h-8 text-blue-600" />}
            title="Upload Your CV"
            description="Upload your existing CV as PDF, DOCX, or paste the text directly. We'll parse and analyze it."
          />
          <FeatureCard
            icon={<Target className="w-8 h-8 text-blue-600" />}
            title="Add Job Description"
            description="Paste the job description you're applying for. We extract key requirements and skills."
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8 text-blue-600" />}
            title="Get Optimized CV"
            description="Receive your tailored CV with a detailed summary of what was changed and why."
          />
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Shield className="w-10 h-10 text-green-400" />
            <h2 className="text-3xl font-bold">Integrity Guaranteed</h2>
          </div>
          <p className="text-gray-300 text-center max-w-3xl mx-auto mb-10 text-lg">
            Unlike other tools, we never fabricate experience, invent credentials, or alter your core data.
            Our AI only optimizes wording and emphasis while preserving complete factual integrity.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4">What We DO</h3>
              <ul className="space-y-3">
                {[
                  'Rewrite bullets to match job terminology',
                  'Reorder points to prioritize relevance',
                  'Add keywords already supported by your CV',
                  'Improve clarity and impact',
                  'Refine your professional summary',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4">What We NEVER Do</h3>
              <ul className="space-y-3">
                {[
                  'Add new jobs or companies',
                  'Invent skills or certifications',
                  'Change dates or timelines',
                  'Alter contact information',
                  'Add experience not implied by your CV',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0">✕</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Land Your Dream Job?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Start optimizing your CV for free. No sign-up required.
        </p>
        <Link
          href="/optimize"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
        >
          Start Optimizing
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
          <p>© 2026 CV Optimizer. Built with integrity in mind.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
