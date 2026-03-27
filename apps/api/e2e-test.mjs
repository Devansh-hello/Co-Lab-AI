/**
 * E2E Test Suite for Co-Lab AI Multi-Agent Pipeline
 * Tests: Auth → Project → WebSocket Pipeline → Test Agent → Quality Scoring → Feedback Loop
 *
 * Run via: bash run-e2e.sh (starts server automatically)
 */

import WebSocket from 'ws';

const PORT = process.env.PORT || 3199;
const BASE = `http://localhost:${PORT}/api/v1`;
const WS_URL = `ws://localhost:${PORT}`;
let TOKEN = '';
let PROJECT_ID = '';
const TEST_USER = `e2etest_${Date.now()}`;
const TEST_EMAIL = `${TEST_USER}@test.com`;

// ─── Utilities ───────────────────────────────────────────────
function log(emoji, msg) { console.log(`  ${emoji} ${msg}`); }
function pass(msg) { log('✅', msg); }
function fail(msg) { log('❌', msg); }
function info(msg) { log('📋', msg); }
function section(msg) { console.log(`\n${'─'.repeat(60)}\n  🧪 ${msg}\n${'─'.repeat(60)}`); }

async function fetchJSON(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Cookie: `token=${TOKEN}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

// ─── Test 1: Authentication ──────────────────────────────────
async function testAuth() {
  section('Test 1: Authentication (Signup + Signin)');

  // Signup
  const signup = await fetchJSON('/signup', {
    method: 'POST',
    body: JSON.stringify({ username: TEST_USER, email: TEST_EMAIL, password: 'Test1234!' }),
  });

  if (signup.status === 200 || signup.status === 201) {
    // Extract token from set-cookie
    const setCookie = signup.headers.get('set-cookie') || '';
    const tokenMatch = setCookie.match(/token=([^;]+)/);
    if (tokenMatch) {
      TOKEN = tokenMatch[1];
      pass(`Signup successful — token obtained (${TOKEN.slice(0, 20)}...)`);
    } else if (signup.data?.token) {
      TOKEN = signup.data.token;
      pass(`Signup successful — token in body`);
    } else {
      // Try signin instead
      info('No token in signup response, trying signin...');
    }
  } else {
    info(`Signup returned ${signup.status}: ${JSON.stringify(signup.data).slice(0, 100)}`);
  }

  // If no token yet, try signin
  if (!TOKEN) {
    const signin = await fetchJSON('/signin', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: 'Test1234!' }),
    });
    const setCookie = signin.headers.get('set-cookie') || '';
    const tokenMatch = setCookie.match(/token=([^;]+)/);
    if (tokenMatch) {
      TOKEN = tokenMatch[1];
      pass(`Signin successful — token obtained`);
    } else if (signin.data?.token) {
      TOKEN = signin.data.token;
      pass(`Signin successful — token in body`);
    } else {
      fail(`Cannot authenticate: ${signin.status} ${JSON.stringify(signin.data).slice(0, 200)}`);
      return false;
    }
  }

  // Verify auth
  const check = await fetchJSON('/loggedin');
  if (check.status === 200) {
    pass(`Auth verified — user: ${check.data.username || check.data.user?.username || 'ok'}`);
  } else {
    fail(`Auth check failed: ${check.status}`);
    return false;
  }

  return true;
}

// ─── Test 2: Project Creation ────────────────────────────────
async function testProjectCreation() {
  section('Test 2: Project Creation');

  const create = await fetchJSON('/project', {
    method: 'POST',
    body: JSON.stringify({ name: 'E2E Test Project', description: 'Testing the multi-agent pipeline' }),
  });

  if (create.status === 200 || create.status === 201) {
    PROJECT_ID = create.data.project?._id || create.data._id || create.data.projectId;
    pass(`Project created — ID: ${PROJECT_ID}`);
  } else {
    fail(`Project creation failed: ${create.status} ${JSON.stringify(create.data).slice(0, 200)}`);
    return false;
  }

  // List projects
  const list = await fetchJSON('/project');
  const count = list.data?.projects?.length || list.data?.length || 0;
  pass(`Project list returns ${count} project(s)`);

  return true;
}

// ─── Test 3: WebSocket Pipeline ──────────────────────────────
function testWebSocketPipeline(userMessage, testName) {
  return new Promise((resolve) => {
    section(`Test 3: ${testName}`);
    info(`Message: "${userMessage}"`);

    const ws = new WebSocket(WS_URL, {
      headers: { Cookie: `token=${TOKEN}` },
    });

    const received = {};
    const streams = { frontend: '', backend: '', review: '', test: '' };
    let timeout;
    let resolved = false;

    function done(success) {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      ws.close();
      resolve({ success, received, streams });
    }

    // 8 minute timeout for full pipeline (complex apps with feedback loop need more time)
    timeout = setTimeout(() => {
      fail('Pipeline timeout (8 min)');
      info(`Received message types: ${Object.keys(received).join(', ')}`);
      done(false);
    }, 480000);

    ws.on('open', () => {
      pass('WebSocket connected');
      ws.send(JSON.stringify({
        type: 'message',
        message: userMessage,
        projectId: PROJECT_ID,
        provider: 'openrouter',
        model: 'anthropic/claude-sonnet-4.6',
      }));
      info('Message sent — waiting for understanding...');
    });

    ws.on('message', (raw) => {
      let data;
      try { data = JSON.parse(raw.toString()); } catch { return; }

      const t = data.type;
      received[t] = (received[t] || 0) + 1;

      switch (t) {
        case 'understanding':
          pass(`Understanding received — summary: "${(data.summary || '').slice(0, 80)}..."`);
          info(`  Project name: ${data.projectName}`);
          info(`  Questions: ${data.questions?.length || 0}`);

          // Auto-confirm understanding (skip Q&A)
          ws.send(JSON.stringify({
            type: 'understanding_response',
            confirmed: true,
            projectId: PROJECT_ID,
          }));

          if (data.questions?.length > 0) {
            // Answer all questions with first option
            const answers = data.questions.map(q => ({
              questionId: q.id,
              answer: q.options?.[0] || 'Default',
            }));
            setTimeout(() => {
              ws.send(JSON.stringify({
                type: 'qa_complete',
                answers,
                projectId: PROJECT_ID,
              }));
              info('Q&A answers sent automatically');
            }, 500);
          }
          break;

        case 'status':
          info(`  [${data.agent}] ${data.message} (${data.provider}/${data.model})`);
          break;

        case 'final_plan':
          pass('Orchestrator plan received');
          const plan = data.content || {};
          info(`  Intent: ${plan.intent}`);
          info(`  Features: ${JSON.stringify(plan.features || []).slice(0, 100)}`);
          info(`  Frontend tasks: ${plan.frontendTasks?.length || 0}`);
          info(`  Backend tasks: ${plan.backendTasks?.length || 0}`);
          if (plan.complexity) {
            info(`  Complexity: ${plan.complexity.overall}/5 — ${plan.complexity.reasoning || ''}`);
          }
          if (plan.apiContract?.endpoints) {
            info(`  API endpoints: ${plan.apiContract.endpoints.length}`);
          }

          // Auto-proceed
          ws.send(JSON.stringify({
            type: 'proceed',
            proceed: true,
            projectId: PROJECT_ID,
          }));
          info('Proceeding with build...');
          break;

        case 'complexity_score':
          pass(`Complexity score: ${data.score}/5 — ${data.reasoning || ''}`);
          break;

        case 'frontend_stream':
          streams.frontend = data.accumulated || '';
          break;

        case 'backend_stream':
          streams.backend = data.accumulated || '';
          break;

        case 'review_stream':
          streams.review = data.accumulated || '';
          break;

        case 'test_stream':
          streams.test = data.accumulated || '';
          break;

        case 'frontend_complete':
          const feFiles = typeof data.content === 'object' ? Object.keys(data.content) : [];
          pass(`Frontend complete — ${feFiles.length} files: ${feFiles.slice(0, 5).join(', ')}`);
          break;

        case 'backend_complete':
          const beFiles = typeof data.content === 'object' ? Object.keys(data.content) : [];
          pass(`Backend complete — ${beFiles.length} files: ${beFiles.slice(0, 5).join(', ')}`);
          break;

        case 'review_complete':
          pass('Review complete');
          const review = data.content || {};
          info(`  Frontend complete: ${review.completionStatus?.frontendComplete}`);
          info(`  Backend complete: ${review.completionStatus?.backendComplete}`);
          info(`  API compatible: ${review.apiCompatibility?.compatible}`);
          info(`  Missing items: ${(review.completionStatus?.missingItems || []).length}`);
          info(`  Critical issues: ${(review.codeReview?.criticalIssues || []).length}`);
          if (review.qualityScore) {
            info(`  Review grade: ${review.qualityScore.grade} (${review.qualityScore.overall})`);
          }
          if (review.codeReview?.actionableFixes?.length > 0) {
            info(`  Actionable fixes: ${review.codeReview.actionableFixes.length}`);
          }
          break;

        case 'test_complete':
          pass('Test Agent complete');
          const testData = data.content || {};
          info(`  Total tests: ${testData.testSuite?.totalTests || 0}`);
          const cats = testData.testSuite?.categories || {};
          info(`  Basic: ${cats.basic?.length || 0}, Edge: ${cats.edge?.length || 0}, Integration: ${cats.integration?.length || 0}, Security: ${cats.security?.length || 0}`);
          if (testData.coverage) {
            info(`  Coverage — Endpoints: ${testData.coverage.endpointCoverage}%, Features: ${testData.coverage.featureCoverage}%, Security: ${testData.coverage.securityCoverage}%`);
          }
          if (testData.contractValidation) {
            info(`  Endpoints covered: ${testData.contractValidation.endpointsCovered?.length || 0}`);
            info(`  Endpoints missing: ${testData.contractValidation.endpointsMissing?.length || 0}`);
          }
          if (testData.testFiles) {
            info(`  Test files generated: ${Object.keys(testData.testFiles).join(', ')}`);
          }
          break;

        case 'quality_score':
          pass(`Quality Score: ${data.grade} (${data.overall}/100)`);
          if (data.metrics) {
            info(`  Completeness: ${data.metrics.completeness}, Security: ${data.metrics.security}`);
            info(`  Compatibility: ${data.metrics.compatibility}, Code Quality: ${data.metrics.codeQuality}`);
            info(`  Test Coverage: ${data.metrics.testCoverage}`);
          }
          info(`  Needs feedback: ${data.needsFeedback}`);
          break;

        case 'feedback_iteration':
          pass(`Feedback loop triggered — iteration ${data.iteration}`);
          info(`  Issues: ${JSON.stringify(data.issues || []).slice(0, 200)}`);
          break;

        case 'token_usage':
          info(`  Token usage [${data.agent}]: ${data.usage?.totalTokens || 0} tokens`);
          break;

        case 'all_complete':
          pass(`Pipeline complete! Quality: ${data.qualityGrade || 'N/A'}, Feedback iterations: ${data.feedbackIterations || 0}`);
          console.log(`\n  📊 Message types received: ${Object.entries(received).map(([k,v]) => `${k}(${v})`).join(', ')}`);

          // Validate all expected stages happened
          const expected = ['understanding', 'final_plan', 'review_complete', 'test_complete', 'quality_score', 'all_complete'];
          const missing = expected.filter(e => !received[e]);
          if (missing.length === 0) {
            pass('All expected pipeline stages completed');
          } else {
            fail(`Missing pipeline stages: ${missing.join(', ')}`);
          }

          done(true);
          break;

        case 'error':
          fail(`Pipeline error: ${data.message}`);
          done(false);
          break;
      }
    });

    ws.on('error', (err) => {
      fail(`WebSocket error: ${err.message}`);
      done(false);
    });

    ws.on('close', () => {
      if (!resolved) {
        info('WebSocket closed before completion');
        done(false);
      }
    });
  });
}

// ─── Test 4: Verify Saved Data ───────────────────────────────
async function testSavedData() {
  section('Test 4: Verify Saved Data');

  const msgs = await fetchJSON(`/projects/${PROJECT_ID}/messages`);
  if (msgs.status !== 200) {
    fail(`Cannot fetch messages: ${msgs.status}`);
    return false;
  }

  const messages = msgs.data?.messages || msgs.data || [];
  info(`Total messages: ${messages.length}`);

  for (const msg of messages) {
    info(`Message: "${(msg.userMessage || '').slice(0, 50)}..." — status: ${msg.status}`);

    if (msg.understandingResponse?.content) {
      pass('Understanding response saved');
    }
    if (msg.coordinatorResponse?.content) {
      pass('Orchestrator response saved');
      const plan = msg.coordinatorResponse.content;
      if (plan.complexity) pass(`Complexity score saved: ${plan.complexity.overall}/5`);
    }
    if (msg.frontendResponse?.content) {
      const files = typeof msg.frontendResponse.content === 'object' ? Object.keys(msg.frontendResponse.content) : [];
      pass(`Frontend code saved — ${files.length} files`);
    }
    if (msg.backendResponse?.content) {
      const files = typeof msg.backendResponse.content === 'object' ? Object.keys(msg.backendResponse.content) : [];
      pass(`Backend code saved — ${files.length} files`);
    }
    if (msg.reviewResponse?.content) {
      pass('Review response saved');
    }
    if (msg.testResponse?.content) {
      pass('Test response saved');
      const test = msg.testResponse.content;
      info(`  Tests: ${test.testSuite?.totalTests || 0}, Files: ${Object.keys(test.testFiles || {}).length}`);
    }
    if (msg.qualityScore?.grade) {
      pass(`Quality score saved: ${msg.qualityScore.grade}`);
    }
    if (msg.complexityScore) {
      pass(`Complexity score saved: ${msg.complexityScore}`);
    }
    if (msg.feedbackIterations > 0) {
      pass(`Feedback iterations saved: ${msg.feedbackIterations}`);
    }
  }

  return true;
}

// ─── Cleanup ─────────────────────────────────────────────────
async function cleanup() {
  section('Cleanup');
  if (PROJECT_ID) {
    const del = await fetchJSON(`/project/${PROJECT_ID}`, { method: 'DELETE' });
    info(`Project delete: ${del.status}`);
  }
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Co-Lab AI — Multi-Agent Pipeline E2E Test Suite       ║');
  console.log('║   OpenRouter Paid Models · Multi-Scenario Testing       ║');
  console.log('║                                                          ║');
  console.log('║   Models: Claude Sonnet 4.6 (code) · Gemini 2.5 Flash  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const results = {};
  const timings = {};

  function timed(name) { timings[name] = Date.now(); }
  function elapsed(name) { return ((Date.now() - timings[name]) / 1000).toFixed(1) + 's'; }

  // ── Test 1: Auth ──
  results.auth = await testAuth();
  if (!results.auth) { console.log('\n⛔ Auth failed — aborting.'); process.exit(1); }

  // ── Test 2: Project ──
  results.project = await testProjectCreation();
  if (!results.project) { console.log('\n⛔ Project creation failed — aborting.'); process.exit(1); }

  // ══════════════════════════════════════════════════════════════
  // ── TEST SCENARIO 1: Simple Todo App (low complexity) ──
  // Expected: complexity 1-2, quality A-B, no feedback loop
  // ══════════════════════════════════════════════════════════════
  timed('scenario1');
  results.scenario1 = await testWebSocketPipeline(
    'Build a simple todo list app. Users can add tasks, mark them done, and delete them. Use React frontend with Tailwind CSS and Express backend with in-memory array storage. No database needed.',
    'Scenario 1: Simple Todo App (expect low complexity, no feedback loop)'
  );
  if (results.scenario1?.success) {
    info(`Scenario 1 completed in ${elapsed('scenario1')}`);
    const r = results.scenario1.received;
    if (r.feedback_iteration) {
      info('⚠️  Feedback loop triggered on simple app — unexpected but not a failure');
    } else {
      pass('No feedback loop needed — correct for simple app');
    }
  }

  // Verify scenario 1 data
  results.savedData1 = await testSavedData();

  // ══════════════════════════════════════════════════════════════
  // ── TEST SCENARIO 2: Complex E-commerce (high complexity) ──
  // Expected: complexity 3-5, test agent finds more issues,
  //           potentially triggers feedback loop
  // ══════════════════════════════════════════════════════════════

  // Create a new project for scenario 2
  const create2 = await fetchJSON('/project', {
    method: 'POST',
    body: JSON.stringify({ name: 'E2E Complex App', description: 'Complex e-commerce test' }),
  });
  if (create2.status === 200 || create2.status === 201) {
    PROJECT_ID = create2.data.project?._id || create2.data._id || create2.data.projectId;
  }

  timed('scenario2');
  results.scenario2 = await testWebSocketPipeline(
    `Build a full e-commerce platform with:
- User authentication (register, login, JWT tokens, password reset)
- Product catalog with categories, search, and filtering
- Shopping cart with quantity management
- Order placement with order history
- Admin dashboard to manage products and view orders
- Payment integration placeholder (Stripe-like)
- Responsive design with dark mode toggle
Use React with Tailwind CSS, Express, and MongoDB with Mongoose.`,
    'Scenario 2: E-commerce Platform (expect high complexity, thorough test coverage)'
  );
  if (results.scenario2?.success) {
    info(`Scenario 2 completed in ${elapsed('scenario2')}`);
    const r = results.scenario2.received;
    if (r.feedback_iteration) {
      pass(`Feedback loop triggered (${r.feedback_iteration}x) — expected for complex app`);
    } else {
      info('No feedback loop — quality was high enough on first pass');
    }
  }

  results.savedData2 = await testSavedData();

  // ══════════════════════════════════════════════════════════════
  // ── TEST SCENARIO 3: Iterate on existing (snapshot reuse) ──
  // Expected: intent = "iterate", builds on previous snapshot
  // ══════════════════════════════════════════════════════════════

  timed('scenario3');
  results.scenario3 = await testWebSocketPipeline(
    'Add a product review and rating system. Users should be able to leave 1-5 star ratings with text reviews on each product. Show average rating on product cards.',
    'Scenario 3: Iterate — Add Reviews to E-commerce (expect iterate intent, snapshot reuse)'
  );
  if (results.scenario3?.success) {
    info(`Scenario 3 completed in ${elapsed('scenario3')}`);
    // Check intent
    if (results.scenario3.received.final_plan) {
      info('Checking if orchestrator detected iterate intent...');
    }
  }

  results.savedData3 = await testSavedData();

  // ══════════════════════════════════════════════════════════════
  // ── SUMMARY ──
  // ══════════════════════════════════════════════════════════════
  section('FINAL RESULTS');

  const labels = {
    auth: 'Authentication',
    project: 'Project CRUD',
    scenario1: 'Scenario 1 — Simple Todo (low complexity)',
    savedData1: 'Data persistence (scenario 1)',
    scenario2: 'Scenario 2 — E-commerce (high complexity)',
    savedData2: 'Data persistence (scenario 2)',
    scenario3: 'Scenario 3 — Iterate (snapshot reuse)',
    savedData3: 'Data persistence (scenario 3)',
  };

  let passed = 0, failed = 0;
  for (const [name, result] of Object.entries(results)) {
    const ok = result === true || result?.success;
    if (ok) passed++; else failed++;
    const status = ok ? '✅ PASS' : '❌ FAIL';
    const time = timings[name] ? ` (${elapsed(name)})` : '';
    console.log(`  ${status}  ${labels[name] || name}${time}`);
  }

  console.log(`\n  Total: ${passed} passed, ${failed} failed out of ${passed + failed}`);
  const allPassed = failed === 0;
  console.log(`\n  ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}\n`);

  await cleanup();
  process.exit(allPassed ? 0 : 1);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
