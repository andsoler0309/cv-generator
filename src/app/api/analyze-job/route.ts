import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { jobDescription } = await request.json();

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'No job description provided' },
        { status: 400 }
      );
    }

    // Analyze the job description
    const analysis = analyzeJobDescription(jobDescription);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing job description:', error);
    return NextResponse.json(
      { error: 'Failed to analyze job description' },
      { status: 500 }
    );
  }
}

function analyzeJobDescription(text: string): AnalysisResult {
  const lowerText = text.toLowerCase();
  
  // Extract keywords and skills
  const technicalSkills = extractTechnicalSkills(lowerText);
  const softSkills = extractSoftSkills(lowerText);
  const responsibilities = extractResponsibilities(text);
  
  // Determine seniority level
  const seniorityLevel = determineSeniority(lowerText);
  
  // Extract all relevant keywords
  const keywords = [...new Set([...technicalSkills, ...softSkills])];
  
  return {
    responsibilities,
    requiredSkills: technicalSkills.slice(0, 10),
    preferredSkills: softSkills.slice(0, 5),
    keywords,
    seniorityLevel,
  };
}

function extractTechnicalSkills(text: string): string[] {
  const skillPatterns = [
    // Programming languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin',
    // Frameworks
    'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring', 'rails',
    // Databases
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'github actions',
    // Tools & Technologies
    'git', 'rest api', 'graphql', 'microservices', 'agile', 'scrum', 'jira', 'figma',
    // Data & AI
    'machine learning', 'data analysis', 'tableau', 'power bi', 'pandas', 'numpy', 'tensorflow',
    // General tech
    'html', 'css', 'sass', 'webpack', 'linux', 'api', 'testing', 'unit testing', 'tdd',
  ];

  return skillPatterns.filter(skill => text.includes(skill));
}

function extractSoftSkills(text: string): string[] {
  const softSkillPatterns = [
    'leadership', 'communication', 'teamwork', 'problem-solving', 'problem solving',
    'collaboration', 'analytical', 'critical thinking', 'time management',
    'project management', 'mentoring', 'stakeholder', 'presentation',
    'negotiation', 'decision-making', 'adaptability', 'creativity',
    'attention to detail', 'self-motivated', 'proactive', 'strategic',
  ];

  return softSkillPatterns.filter(skill => text.includes(skill));
}

function extractResponsibilities(text: string): string[] {
  // Look for lines that start with common responsibility indicators
  const lines = text.split('\n').filter(line => line.trim().length > 10);
  const responsibilities: string[] = [];
  
  const responsibilityIndicators = [
    /^[-•*]\s*/,
    /^\d+[.)]\s*/,
    /^(responsible|manage|lead|develop|design|implement|create|build|maintain|support|work|collaborate)/i,
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (responsibilityIndicators.some(pattern => pattern.test(trimmedLine))) {
      const cleanedLine = trimmedLine.replace(/^[-•*\d.)]+\s*/, '').trim();
      if (cleanedLine.length > 15 && cleanedLine.length < 300) {
        responsibilities.push(cleanedLine);
      }
    }
  }

  return responsibilities.slice(0, 10);
}

function determineSeniority(text: string): string {
  if (text.includes('director') || text.includes('vp ') || text.includes('vice president') || text.includes('head of')) {
    return 'executive';
  }
  if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('staff')) {
    return 'senior';
  }
  if (text.includes('junior') || text.includes('entry') || text.includes('associate') || text.includes('graduate')) {
    return 'entry';
  }
  // Check for years of experience
  const yearsMatch = text.match(/(\d+)\+?\s*years?/i);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    if (years >= 10) return 'executive';
    if (years >= 5) return 'senior';
    if (years >= 2) return 'mid';
    return 'entry';
  }
  return 'mid';
}
