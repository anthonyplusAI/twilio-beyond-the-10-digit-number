import test from 'node:test';
import assert from 'node:assert/strict';

let bootCount = 0;

function state(overrides = {}) {
  return {
    step: 'reached',
    audienceView: 'bank',
    audienceViewRevision: 0,
    messageMode: 'simulated',
    messageChannel: 'simulated',
    callMode: 'simulated',
    callPreviewDevice: 'android',
    messageSid: null,
    callSid: null,
    chargeDecision: 'unrecognized',
    decisionSource: 'presenter',
    messageStatus: null,
    callStatus: null,
    events: [],
    ...overrides,
  };
}

async function boot(path, initialState, { historyState = null } = {}) {
  const location = new URL(`http://demo.test${path}`);
  const root = {
    innerHTML: '',
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  const document = {
    title: '',
    activeElement: null,
    documentElement: { dataset: { theme: 'light' } },
    getElementById(id) { return id === 'app' ? root : null; },
  };
  const window = {
    location,
    history: {
      state: historyState,
      replaceState(nextState, _title, pathAndQuery) {
        this.state = nextState;
        location.href = new URL(pathAndQuery, location.href).href;
      },
    },
    addEventListener() {},
    clearTimeout,
    setTimeout,
  };
  let stream;
  globalThis.document = document;
  globalThis.window = window;
  globalThis.EventSource = class {
    constructor() { stream = this; }
  };
  globalThis.fetch = async (url) => ({
    ok: true,
    status: 200,
    json: async () => url === '/api/presenter/session'
      ? { authenticated: true }
      : { state: initialState, config: { rcsReady: false, voiceReady: false } },
  });

  await import(`../public/app.js?presenter-navigation=${++bootCount}`);

  return {
    root,
    window,
    document,
    send(nextState) {
      stream.onmessage({ data: JSON.stringify({ state: nextState, config: { rcsReady: false, voiceReady: false } }) });
    },
  };
}

test('the presenter next step advances from the bank outcome to architecture and technical notes', async () => {
  const bankState = state();
  const app = await boot('/presenter', bankState);
  assert.match(app.root.innerHTML.match(/<div class="current-actions">([\s\S]*?)<\/div>/)?.[1] ?? '', /data-action="showArchitecture"/);

  app.send(state({ audienceView: 'architecture', audienceViewRevision: 1 }));
  assert.match(app.root.innerHTML.match(/<div class="current-actions">([\s\S]*?)<\/div>/)?.[1] ?? '', /data-action="showTechnicalNotes"/);
  assert.match(app.root.innerHTML, /<h2>Architecture overview<\/h2>/);
  assert.match(app.root.innerHTML, /<span class="current-scene-label">Presenter-selected page<\/span>/);

  app.send(state({ audienceView: 'technicalNotes', audienceViewRevision: 2 }));
  assert.match(app.root.innerHTML, /<h2>Technical notes<\/h2>/);
});

test('the shared audience window follows presenter navigation through technical notes and back to bank', async () => {
  const app = await boot('/architecture', state({ audienceView: 'architecture', audienceViewRevision: 1 }));
  assert.equal(app.document.title, 'Architecture · Twilio Bank');

  app.send(state({ audienceView: 'technicalNotes', audienceViewRevision: 2 }));
  assert.equal(app.window.location.pathname, '/architecture/details');
  assert.equal(app.document.title, 'Technical notes · Twilio Bank');

  app.send(state({ audienceView: 'bank', audienceViewRevision: 3 }));
  assert.equal(app.window.location.pathname, '/bank');
  assert.equal(app.document.title, 'Customer account · Twilio Bank');
});

test('an explicit audience page stays open until the presenter selects a view again', async () => {
  const notes = await boot('/architecture/details', state({ audienceView: 'bank', audienceViewRevision: 4 }));
  assert.equal(notes.window.location.pathname, '/architecture/details');
  assert.equal(notes.document.title, 'Technical notes · Twilio Bank');
  notes.send(state({ audienceView: 'bank', audienceViewRevision: 5 }));
  assert.equal(notes.window.location.pathname, '/bank');

  const home = await boot('/bank?home=1', state({ audienceView: 'architecture', audienceViewRevision: 10 }));
  assert.equal(home.window.location.pathname, '/bank');
  assert.equal(home.window.location.search, '');
  home.send(state({ audienceView: 'architecture', audienceViewRevision: 11 }));
  assert.equal(home.window.location.pathname, '/architecture');
});

test('audience header navigation survives a refresh until the presenter selects another view', async () => {
  const architectureState = state({ audienceView: 'architecture', audienceViewRevision: 10 });
  const home = await boot('/bank?home=1', architectureState);
  const reloadedHome = await boot('/bank', architectureState, { historyState: home.window.history.state });
  assert.equal(reloadedHome.window.location.pathname, '/bank');
  assert.equal(reloadedHome.document.title, 'Customer account · Twilio Bank');

  const notesState = state({ audienceView: 'technicalNotes', audienceViewRevision: 20 });
  const overview = await boot('/architecture?view=1', notesState);
  const reloadedOverview = await boot('/architecture', notesState, { historyState: overview.window.history.state });
  assert.equal(reloadedOverview.window.location.pathname, '/architecture');
  assert.equal(reloadedOverview.document.title, 'Architecture · Twilio Bank');
});
