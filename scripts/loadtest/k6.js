/**
 * k6 Load Test Script for Velora
 *
 * Usage:
 *   k6 run scripts/loadtest/k6.js
 *   BASE_URL=http://localhost:3000 AI_STUB_URL=http://localhost:3106 k6 run scripts/loadtest/k6.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    ping_endpoint: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10s',
      exec: 'testPing',
    },
    stubbed_ai_route: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10s',
      exec: 'testStubbedAiAnalyze',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{scenario:ping_endpoint}': ['p(95)<50'],
    'http_req_duration{scenario:stubbed_ai_route}': ['p(95)<100'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AI_STUB_URL = __ENV.AI_STUB_URL || 'http://localhost:3106';

const SAMPLE_PAYLOAD = JSON.stringify({
  company: 'Acme Cloud',
  role: 'Senior Backend Engineer',
  jdText:
    'We are looking for a Senior Backend Engineer experienced with TypeScript, Go, PostgreSQL, Redis, Docker, and Kubernetes to scale distributed microservices.',
  resumeContent: {
    personalInfo: {
      fullName: 'Ada Lovelace',
      email: 'ada@analytical.engine',
      phone: '+1-555-234-5678',
      location: 'London, UK',
      website: 'adalovelace.dev',
      linkedin: 'linkedin.com/in/adalovelace',
      github: 'github.com/adalovelace',
      summary:
        'Staff Software Engineer with 8 years of experience architecting distributed cloud systems and reducing API latency by 45%.',
    },
    experience: [
      {
        id: 'exp-1',
        company: 'Analytical Systems',
        role: 'Senior Backend Engineer',
        location: 'Remote',
        startDate: 'Jan 2021',
        endDate: 'Present',
        current: true,
        description:
          '- Cut p99 API latency by 42% using Redis caching and PostgreSQL indexing.\n- Scaled event pipeline to 50,000+ requests/sec.',
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'University of London',
        degree: 'B.S.',
        field: 'Computer Science',
        startDate: '2014',
        endDate: '2018',
        gpa: '3.9',
      },
    ],
    projects: [],
    skills: [
      {
        id: 'skill-1',
        category: 'Backend & Cloud',
        items: 'TypeScript, Go, PostgreSQL, Redis, Docker',
      },
    ],
  },
});

export function testPing() {
  const res = http.get(`${BASE_URL}/api/ping`);
  check(res, {
    'GET /api/ping status is 200': (r) => r.status === 200,
    'GET /api/ping body has ok: true': (r) => r.json('ok') === true,
  });
  sleep(0.05);
}

export function testStubbedAiAnalyze() {
  const res = http.post(`${AI_STUB_URL}/api/ai/analyze-resume`, SAMPLE_PAYLOAD, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'POST /api/ai/analyze-resume status is 200': (r) => r.status === 200,
    'POST /api/ai/analyze-resume returns data.score': (r) =>
      typeof r.json('data.score') === 'number',
  });
  sleep(0.05);
}
