// Test script for CV parsing and optimization
import fs from 'fs';
import path from 'path';

const JOB_DESCRIPTION = `
Senior Software Engineer - Nubank

About the role:
Our Engineering team helps Nubank to create and use the technology that provides us to build the best financial products. We strive for state-of-the-art software development practices that currently include a variety of technologies.

Technologies:
• Horizontally scalable microservices written mostly in Clojure, using Finagle and leveraging upon functional programming techniques and hexagonal architecture
• High throughput jobs and inter-service communication using Kafka
• Continuous Integration and Deployment into AWS
• Storing data in Datomic and DynamoDB
• Monitoring and observability with Prometheus
• Running as much as possible in Kubernetes

You will be responsible for:
• Work with large scale distributed systems, understanding their broad architecture
• Plan and execute on entire features, collaborating with peers while planning the work ahead
• Collaborate in building microservices and work with continuous delivery and infrastructure as code
• Work with agile software development methodologies
• Write, test, instrument, document, and maintain code
• Pair, and participate in code reviews, to grow and contribute to the growth of others
• Collaborate closely with Product, Design, and partner Engineering teams
• Participate in on-call rotations for your team and respond to incidents as necessary
• Work focused on backend applications, and be open to contribute to mobile and frontend development

We are looking for a person who has:
• Work with large scale distributed systems
• Proven track experience building digital products
• Ability to quickly understand technical and business requirements
• A problem-solver who is able to communicate effectively across functional teams
• A software engineer who cares deeply about user experience
• Proven understanding of object-oriented or functional programming language
• Notions of distributed systems
• Familiarity with cloud technologies
• Collaborate with building microservices
• Have worked in teams defining asynchronous integrations using event-driven architectures
• Have practical knowledge of agile software development methodologies
• Work with continuous delivery and infrastructure as code
`;

async function testParseCV() {
  const cvPath = '/Users/andres/Downloads/Andres_Soler_CV2025.pdf';
  
  if (!fs.existsSync(cvPath)) {
    console.error('CV file not found:', cvPath);
    return null;
  }

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(cvPath);
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  formData.append('file', blob, 'Andres_Soler_CV2025.pdf');

  console.log('Testing PDF parsing...');
  
  try {
    const response = await fetch('http://localhost:3000/api/parse-cv', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Parse error:', data.error);
      return null;
    }

    console.log('✅ PDF parsed successfully!');
    console.log('File name:', data.fileName);
    console.log('Text length:', data.text.length, 'characters');
    console.log('\nFirst 500 chars of CV:\n', data.text.substring(0, 500));
    
    return data.text;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

async function testOptimize(cvText) {
  if (!cvText) {
    console.log('No CV text to optimize');
    return;
  }

  console.log('\n\nTesting CV optimization...');
  
  try {
    const response = await fetch('http://localhost:3000/api/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cvText,
        jobDescription: JOB_DESCRIPTION,
        preferences: {
          tone: 'technical',
          emphasis: ['distributed systems', 'backend'],
          targetSeniority: 'senior',
        },
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Optimize error:', data.error);
      return;
    }

    console.log('✅ CV optimized successfully!');
    console.log('\n📊 Match Score:', data.matchScore + '%');
    console.log('\n✅ Keywords Matched:', data.keywordsMatched.join(', '));
    console.log('\n❌ Keywords Missing:', data.keywordsMissing.join(', '));
    console.log('\n📝 Changes Made:', data.changes.length);
    
    data.changes.forEach((change, i) => {
      console.log(`\n--- Change ${i + 1}: ${change.section} ---`);
      console.log('Reason:', change.reason);
    });

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function main() {
  const cvText = await testParseCV();
  await testOptimize(cvText);
}

main();
