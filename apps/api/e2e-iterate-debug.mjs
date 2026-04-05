/**
 * E2E Test: Build → Iterate → Debug flows
 */
import WebSocket from 'ws';

const BASE = `http://localhost:5000/api/v1`;
let TOKEN = '';
const testUser = `e2e_v2_${Date.now()}`;

async function fetchJSON(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Cookie: `token=${TOKEN}` } : {}), ...opts.headers },
    ...opts,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

function runPipeline(projectId, message, label) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}\nTEST: ${label}\n${'='.repeat(60)}`);

    const ws = new WebSocket('ws://localhost:5000/ws', { headers: { Cookie: `token=${TOKEN}` } });
    const events = [];
    let resolved = false;
    const timer = setTimeout(() => { console.log('  TIMEOUT'); ws.close(); resolve({ success: false, events }); }, 150000);

    function done(success, extra) {
      if (resolved) return; resolved = true;
      clearTimeout(timer); ws.close(); resolve({ success, events, ...extra });
    }

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'message', message, projectId }));
      console.log('  -> Sent');
    });

    ws.on('message', (raw) => {
      let d; try { d = JSON.parse(raw.toString()); } catch { return; }
      events.push(d);
      const ts = new Date().toISOString().substr(11, 8);
      switch (d.type) {
        case 'session': break;
        case 'status': console.log(`  [${ts}] ${d.agent}: ${d.message}`); break;
        case 'understanding':
          console.log(`  [${ts}] Understanding OK`);
          ws.send(JSON.stringify({ type: 'understanding_response', confirmed: true, projectId }));
          break;
        case 'final_plan': {
          const p = d.content || {};
          console.log(`  [${ts}] Plan: intent=${p.intent} fe=${p.frontendTasks?.length || 0} be=${p.backendTasks?.length || 0}`);
          ws.send(JSON.stringify({ type: 'proceed', proceed: true, projectId }));
          break;
        }
        case 'complexity_score': console.log(`  [${ts}] Complexity: ${d.score}`); break;
        case 'frontend_stream': case 'backend_stream': case 'review_stream': case 'test_stream': case 'token_usage': break;
        case 'frontend_complete':
          console.log(`  [${ts}] FE: ${Object.keys(d.content || {}).length} files`);
          break;
        case 'backend_complete':
          console.log(`  [${ts}] BE: ${Object.keys(d.content || {}).length} files`);
          break;
        case 'review_complete': console.log(`  [${ts}] Review done`); break;
        case 'test_complete': console.log(`  [${ts}] Test done`); break;
        case 'quality_score': console.log(`  [${ts}] Quality: ${d.grade} (${d.overall})`); break;
        case 'feedback_iteration': console.log(`  [${ts}] FEEDBACK #${d.iteration}: ${d.message}`); break;
        case 'all_complete':
          console.log(`  [${ts}] DONE grade=${d.qualityGrade} feedback=${d.feedbackIterations}`);
          done(true, { grade: d.qualityGrade, feedbackIters: d.feedbackIterations });
          break;
        case 'error':
          console.error(`  [${ts}] ERROR: ${d.message}`);
          done(false, { error: d.message });
          break;
        default: console.log(`  [${ts}] ${d.type}`); break;
      }
    });
    ws.on('error', (err) => { console.error('  WS err:', err.message); done(false); });
  });
}

async function main() {
  // Auth
  console.log('AUTH');
  await fetchJSON('/signup', { method: 'POST', body: JSON.stringify({ username: testUser, email: `${testUser}@test.com`, password: 'Test1234!' }) });
  const signin = await fetchJSON('/signin', { method: 'POST', body: JSON.stringify({ email: `${testUser}@test.com`, password: 'Test1234!' }) });
  TOKEN = ((signin.headers.get('set-cookie') || '').match(/token=([^;]+)/) || [])[1];
  if (!TOKEN) { console.log('Auth failed'); process.exit(1); }

  const create = await fetchJSON('/project', { method: 'POST', body: JSON.stringify({ name: 'V2 Test', description: '' }) });
  const pid = create.data?.projectId;
  console.log('Project:', pid);

  // 1. BUILD
  const r1 = await runPipeline(pid,
    'Build a todo app. Add, complete, delete todos. React+Tailwind frontend, Express backend with JSON file storage.',
    '1. BUILD'
  );
  if (!r1.success) { console.log('Build failed'); process.exit(1); }

  // 2. ITERATE
  const r2 = await runPipeline(pid,
    'Add a priority system. Each todo has priority: low, medium, high. Show colored badges. Filter by priority.',
    '2. ITERATE'
  );

  // Check iterate merged files
  const msgs = await fetchJSON(`/projects/${pid}/messages`);
  const allMsgs = msgs.data?.messages || msgs.data || [];
  const lastMsg = allMsgs[allMsgs.length - 1];
  if (lastMsg?.frontendResponse?.content) {
    console.log(`  Iterate FE total files: ${Object.keys(lastMsg.frontendResponse.content).length}`);
  }
  if (lastMsg?.backendResponse?.content) {
    console.log(`  Iterate BE total files: ${Object.keys(lastMsg.backendResponse.content).length}`);
  }

  // 3. DEBUG
  const r3 = await runPipeline(pid,
    'Fix bug: when marking a todo complete, the completed state does not persist to the JSON file. Toggle works in UI but resets on page refresh.',
    '3. DEBUG'
  );

  // Intents
  const i2 = r2.events?.find(e => e.type === 'final_plan')?.content?.intent;
  const i3 = r3.events?.find(e => e.type === 'final_plan')?.content?.intent;

  console.log(`\n${'='.repeat(40)}\nRESULTS\n${'='.repeat(40)}`);
  console.log(`Build:   ${r1.success ? 'PASS' : 'FAIL'} ${r1.grade} fb=${r1.feedbackIters}`);
  console.log(`Iterate: ${r2.success ? 'PASS' : 'FAIL'} ${r2.grade} intent=${i2} fb=${r2.feedbackIters}`);
  console.log(`Debug:   ${r3.success ? 'PASS' : 'FAIL'} ${r3.grade} intent=${i3} fb=${r3.feedbackIters}`);

  process.exit(r1.success && r2.success && r3.success ? 0 : 1);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
