import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChangeItem, OptimizationResult, UserPreferences } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { cvText, jobDescription, preferences } = await request.json();

    if (!cvText || !jobDescription) {
      return NextResponse.json(
        { error: 'CV text and job description are required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      const result = optimizeCVRuleBased(cvText, jobDescription, preferences);
      return NextResponse.json({ ...result, method: 'rule-based' });
    }

    // Use AI-powered optimization
    console.log('\n========================================');
    console.log('🤖 OPTIMIZATION METHOD: AI-POWERED');
    console.log('========================================');
    console.log(`Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
    console.log('Using OpenAI for intelligent CV optimization');
    console.log('========================================\n');
    const result = await optimizeCVWithAI(cvText, jobDescription, preferences);
    return NextResponse.json({ ...result, method: 'ai-powered' });
  } catch (error) {
    console.error('Error optimizing CV:', error);
    // Fallback to rule-based if AI fails
    try {
      const { cvText, jobDescription, preferences } = await request.json();
      const result = optimizeCVRuleBased(cvText, jobDescription, preferences);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json(
        { error: 'Failed to optimize CV' },
        { status: 500 }
      );
    }
  }
}

async function optimizeCVWithAI(
  cvText: string,
  jobDescription: string,
  preferences?: UserPreferences
): Promise<OptimizationResult> {
  const systemPrompt = `You are an expert CV/resume optimization specialist. Your job is to ACTUALLY MODIFY the CV text to better match the job description.

CRITICAL: YOU MUST ACTUALLY CHANGE THE TEXT
- The "optimizedCV" field MUST contain the MODIFIED version with changes applied
- Do NOT return the original text unchanged
- Every change you list in "changes" MUST be reflected in "optimizedCV"

INTEGRITY RULES:
1. NEVER add new jobs, companies, roles, degrees, or certifications that don't exist
2. NEVER change names, contact info, dates, or timelines
3. NEVER invent achievements or metrics not implied by the original

WHAT YOU MUST DO:
1. REWRITE bullet points to include relevant keywords from the job description
2. ENHANCE the professional summary to highlight relevant experience
3. ADD phrases like "distributed systems", "scalable architectures" etc. where the experience supports it
4. STRENGTHEN action verbs and quantify impact where possible
5. ALIGN terminology with the job description (e.g., if job says "microservices architecture", use that exact phrase)

EXAMPLE OF WHAT TO DO:
- Original: "Built backend services using Python"
- Optimized: "Architected scalable backend microservices using Python, handling 10K+ requests/second"

The optimizedCV MUST be different from the original - that's the whole point!

Respond with JSON:
{
  "optimizedCV": "THE FULL CV TEXT WITH ALL CHANGES ACTUALLY APPLIED - NOT THE ORIGINAL",
  "changes": [{"section": "...", "originalText": "...", "newText": "...", "reason": "..."}],
  "matchScore": 85,
  "keywordsMatched": ["keyword1"],
  "keywordsMissing": ["keyword2"]
}`;

  const userPrompt = `TASK: Optimize this CV for the job below. You MUST modify the text - do not return it unchanged.

${preferences ? `Preferences:
- Tone: ${preferences.tone}
- Seniority: ${preferences.targetSeniority}
- Emphasize: ${preferences.emphasis.join(', ') || 'General optimization'}
` : ''}

=== ORIGINAL CV (MODIFY THIS) ===
${cvText}

=== TARGET JOB DESCRIPTION ===
${jobDescription}

IMPORTANT: Return the MODIFIED CV in "optimizedCV", not the original. Make real changes to improve job fit.`;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  
  const completion = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    // temperature: 0.5,  // Slightly higher temperature for more creative rewrites
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0]?.message?.content || '';
  
  try {
    const result = JSON.parse(responseText);
    
    // Validate and sanitize the response
    // Verify that the AI actually made changes
    const optimizedText = result.optimizedCV || cvText;
    const changesMade = optimizedText !== cvText;
    
    if (!changesMade && result.changes?.length > 0) {
      console.log('⚠️ WARNING: AI reported changes but text is identical! Forcing re-optimization...');
      // If AI didn't actually change the text, apply the changes manually
      let fixedCV = cvText;
      for (const change of result.changes) {
        if (change.originalText && change.newText && change.originalText !== change.newText) {
          fixedCV = fixedCV.replace(change.originalText, change.newText);
        }
      }
      if (fixedCV !== cvText) {
        console.log('✅ Manually applied changes from the changes array');
        return {
          optimizedCV: fixedCV,
          changes: result.changes,
          matchScore: typeof result.matchScore === 'number' ? Math.min(100, Math.max(0, result.matchScore)) : 75,
          keywordsMatched: Array.isArray(result.keywordsMatched) ? result.keywordsMatched : [],
          keywordsMissing: Array.isArray(result.keywordsMissing) ? result.keywordsMissing : [],
        };
      }
    }
    
    return {
      optimizedCV: optimizedText,
      changes: Array.isArray(result.changes) ? result.changes.map((c: ChangeItem) => ({
        section: c.section || 'Unknown',
        originalText: c.originalText || '',
        newText: c.newText || '',
        reason: c.reason || 'Improved alignment with job description',
      })) : [],
      matchScore: typeof result.matchScore === 'number' ? Math.min(100, Math.max(0, result.matchScore)) : 75,
      keywordsMatched: Array.isArray(result.keywordsMatched) ? result.keywordsMatched : [],
      keywordsMissing: Array.isArray(result.keywordsMissing) ? result.keywordsMissing : [],
    };
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    // Fallback to rule-based
    return optimizeCVRuleBased(cvText, jobDescription, preferences);
  }
}

// Rule-based fallback optimization
function optimizeCVRuleBased(
  cvText: string,
  jobDescription: string,
  preferences?: UserPreferences
): OptimizationResult {
  const jobKeywords = extractKeywords(jobDescription.toLowerCase());
  const cvKeywords = extractKeywords(cvText.toLowerCase());
  
  // Find matched and missing keywords
  const keywordsMatched = jobKeywords.filter(kw => 
    cvKeywords.some(cvKw => cvKw.includes(kw) || kw.includes(cvKw))
  );
  const keywordsMissing = jobKeywords.filter(kw => 
    !cvKeywords.some(cvKw => cvKw.includes(kw) || kw.includes(cvKw))
  );

  // Parse CV sections
  const sections = parseCVSections(cvText);
  const changes: ChangeItem[] = [];
  let optimizedCV = cvText;

  // Optimize each section
  for (const section of sections) {
    const sectionOptimization = optimizeSection(
      section,
      jobKeywords,
      keywordsMatched,
      preferences
    );
    
    if (sectionOptimization.changed) {
      changes.push({
        section: section.name,
        originalText: section.content.substring(0, 200) + (section.content.length > 200 ? '...' : ''),
        newText: sectionOptimization.newContent.substring(0, 200) + (sectionOptimization.newContent.length > 200 ? '...' : ''),
        reason: sectionOptimization.reason,
      });
      optimizedCV = optimizedCV.replace(section.content, sectionOptimization.newContent);
    }
  }

  // Calculate match score
  const matchScore = Math.round((keywordsMatched.length / Math.max(jobKeywords.length, 1)) * 100);

  return {
    optimizedCV,
    changes,
    matchScore: Math.min(matchScore + 10, 100),
    keywordsMatched: keywordsMatched.slice(0, 15),
    keywordsMissing: keywordsMissing.slice(0, 10),
  };
}

function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  
  // Technical skills and tools
  const technicalPatterns = [
    'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'nodejs',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql', 'mysql',
    'git', 'ci/cd', 'agile', 'scrum', 'rest', 'api', 'graphql', 'microservices',
    'machine learning', 'data analysis', 'testing', 'devops', 'linux', 'cloud',
    'html', 'css', 'sass', 'webpack', 'next.js', 'express', 'django', 'flask',
    'redis', 'elasticsearch', 'terraform', 'jenkins', 'github', 'jira',
  ];

  // Action verbs and soft skills
  const actionPatterns = [
    'leadership', 'management', 'communication', 'collaboration', 'problem-solving',
    'analytical', 'strategic', 'innovative', 'mentoring', 'stakeholder',
    'project management', 'team lead', 'cross-functional',
  ];

  for (const pattern of [...technicalPatterns, ...actionPatterns]) {
    if (text.includes(pattern)) {
      keywords.push(pattern);
    }
  }

  return [...new Set(keywords)];
}

interface CVSection {
  name: string;
  content: string;
  startIndex: number;
}

function parseCVSections(cvText: string): CVSection[] {
  const sections: CVSection[] = [];
  
  // Common section headers
  const sectionPatterns = [
    /^(professional\s*summary|summary|profile|objective|about\s*me)/im,
    /^(experience|work\s*experience|employment\s*history|professional\s*experience)/im,
    /^(education|academic\s*background|qualifications)/im,
    /^(skills|technical\s*skills|core\s*competencies|expertise)/im,
    /^(projects|key\s*projects|portfolio)/im,
    /^(certifications|certificates|credentials)/im,
  ];

  const lines = cvText.split('\n');
  let currentSection: CVSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    for (const pattern of sectionPatterns) {
      if (pattern.test(line)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          name: line,
          content: '',
          startIndex: cvText.indexOf(line),
        };
        break;
      }
    }

    if (currentSection) {
      currentSection.content += lines[i] + '\n';
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // If no sections found, treat the whole text as one section
  if (sections.length === 0) {
    sections.push({
      name: 'Content',
      content: cvText,
      startIndex: 0,
    });
  }

  return sections;
}

interface SectionOptimization {
  changed: boolean;
  newContent: string;
  reason: string;
}

function optimizeSection(
  section: CVSection,
  jobKeywords: string[],
  matchedKeywords: string[],
  preferences?: UserPreferences
): SectionOptimization {
  const sectionLower = section.name.toLowerCase();
  let newContent = section.content;
  let reason = '';
  let changed = false;

  // Optimize based on section type
  if (sectionLower.includes('summary') || sectionLower.includes('profile') || sectionLower.includes('objective')) {
    const optimization = optimizeSummary(section.content, jobKeywords, matchedKeywords, preferences);
    if (optimization.changed) {
      newContent = optimization.content;
      reason = optimization.reason;
      changed = true;
    }
  } else if (sectionLower.includes('experience') || sectionLower.includes('employment')) {
    const optimization = optimizeExperience(section.content, jobKeywords, matchedKeywords, preferences);
    if (optimization.changed) {
      newContent = optimization.content;
      reason = optimization.reason;
      changed = true;
    }
  } else if (sectionLower.includes('skill')) {
    const optimization = optimizeSkills(section.content, jobKeywords, matchedKeywords);
    if (optimization.changed) {
      newContent = optimization.content;
      reason = optimization.reason;
      changed = true;
    }
  }

  return { changed, newContent, reason };
}

function optimizeSummary(
  content: string,
  jobKeywords: string[],
  matchedKeywords: string[],
  preferences?: UserPreferences
): { changed: boolean; content: string; reason: string } {
  let newContent = content;
  const changes: string[] = [];

  // Add relevant keywords that are already implied but not explicitly stated
  const lines = content.split('\n');
  const summaryLine = lines.find(l => l.length > 50) || '';
  
  // Word replacements to better align with job description
  const replacements: Record<string, string[]> = {
    'developer': ['software engineer', 'engineer', 'developer'],
    'manage': ['lead', 'oversee', 'coordinate', 'manage'],
    'create': ['develop', 'build', 'design', 'create'],
    'help': ['support', 'assist', 'enable', 'help'],
    'work': ['collaborate', 'partner', 'work'],
    'make': ['deliver', 'produce', 'create', 'make'],
  };

  // Apply subtle improvements based on tone preference
  if (preferences?.tone === 'technical') {
    if (summaryLine.includes('developer') && jobKeywords.includes('engineer')) {
      newContent = newContent.replace(/developer/gi, 'software engineer');
      changes.push('Updated terminology to match job description (developer → software engineer)');
    }
  }

  // Improve action verbs
  for (const [weak, strong] of Object.entries(replacements)) {
    const strongOption = strong.find(s => jobKeywords.some(k => k.includes(s)));
    if (strongOption && content.toLowerCase().includes(weak) && !content.toLowerCase().includes(strongOption)) {
      // Only replace if the new term appears in job description
      const regex = new RegExp(`\\b${weak}\\b`, 'gi');
      if (regex.test(newContent)) {
        newContent = newContent.replace(regex, strongOption);
        changes.push(`Enhanced verb: "${weak}" → "${strongOption}" to align with job terminology`);
        break; // Only make one replacement to preserve style
      }
    }
  }

  return {
    changed: changes.length > 0,
    content: newContent,
    reason: changes.join('; ') || 'No changes needed',
  };
}

function optimizeExperience(
  content: string,
  jobKeywords: string[],
  matchedKeywords: string[],
  preferences?: UserPreferences
): { changed: boolean; content: string; reason: string } {
  let newContent = content;
  const changes: string[] = [];

  // Find bullet points and potentially reorder based on relevance
  const bulletPattern = /^[\s]*[-•*]\s*.+$/gm;
  const bullets = content.match(bulletPattern) || [];
  
  if (bullets.length > 1) {
    // Score each bullet by keyword relevance
    const scoredBullets = bullets.map(bullet => {
      const bulletLower = bullet.toLowerCase();
      const score = jobKeywords.filter(kw => bulletLower.includes(kw)).length;
      return { bullet, score };
    });

    // Check if reordering would help
    const sortedBullets = [...scoredBullets].sort((a, b) => b.score - a.score);
    const isReordered = sortedBullets.some((b, i) => b.bullet !== scoredBullets[i].bullet);
    
    if (isReordered && sortedBullets[0].score > 0) {
      // Reorder bullets to prioritize relevant experience
      for (let i = 0; i < bullets.length; i++) {
        newContent = newContent.replace(bullets[i], sortedBullets[i].bullet);
      }
      changes.push('Reordered bullet points to prioritize most relevant experience');
    }
  }

  // Enhance weak action verbs
  const weakVerbs: Record<string, string> = {
    'helped': 'contributed to',
    'worked on': 'developed',
    'was responsible for': 'managed',
    'did': 'executed',
    'made': 'delivered',
  };

  for (const [weak, strong] of Object.entries(weakVerbs)) {
    if (content.toLowerCase().includes(weak)) {
      const regex = new RegExp(weak, 'gi');
      newContent = newContent.replace(regex, strong);
      changes.push(`Strengthened verb: "${weak}" → "${strong}"`);
      break; // Limit changes to preserve original style
    }
  }

  return {
    changed: changes.length > 0,
    content: newContent,
    reason: changes.join('; ') || 'No changes needed',
  };
}

function optimizeSkills(
  content: string,
  jobKeywords: string[],
  matchedKeywords: string[]
): { changed: boolean; content: string; reason: string } {
  let newContent = content;
  const changes: string[] = [];

  // Reorder skills to put matched keywords first
  const skillLines = content.split('\n').filter(l => l.trim());
  
  // Try to identify if skills are listed on one line (comma-separated)
  const commaSkillLine = skillLines.find(l => l.includes(',') && l.split(',').length > 3);
  
  if (commaSkillLine) {
    const skills = commaSkillLine.split(',').map(s => s.trim());
    const scoredSkills = skills.map(skill => {
      const skillLower = skill.toLowerCase();
      const isMatch = matchedKeywords.some(kw => skillLower.includes(kw) || kw.includes(skillLower));
      return { skill, score: isMatch ? 1 : 0 };
    });

    const hasRelevantSkills = scoredSkills.some(s => s.score > 0);
    if (hasRelevantSkills) {
      const reorderedSkills = [...scoredSkills].sort((a, b) => b.score - a.score);
      const newSkillLine = reorderedSkills.map(s => s.skill).join(', ');
      
      if (newSkillLine !== commaSkillLine) {
        newContent = newContent.replace(commaSkillLine, newSkillLine);
        changes.push('Reordered skills to highlight job-relevant competencies first');
      }
    }
  }

  return {
    changed: changes.length > 0,
    content: newContent,
    reason: changes.join('; ') || 'No changes needed',
  };
}
