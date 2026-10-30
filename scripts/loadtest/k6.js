/**
 * k6 Load Test Script for Velora
 *
 * Usage:
 *   k6 run scripts/loadtest/k6.js
 *   BASE_URL=http://localhost:3000 k6 run scripts/loadtest/k6.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<100'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/api/ping`);
  check(res, {
    'GET /api/ping status is 200': (r) => r.status === 200,
    'GET /api/ping body has ok: true': (r) => r.json('ok') === true,
  });
  sleep(0.05);
}
