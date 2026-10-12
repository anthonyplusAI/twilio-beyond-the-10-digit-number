import test from 'node:test';
import assert from 'node:assert/strict';

let bootCount = 0;

function state(overrides = {}) {
  return {
    step: 'reached',
    audienceView: 'bank',
    audienceViewRevision: 0,
    smsMode: 'none',
    smsSid: null,
    smsStatus: null,
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

async function boot(path, initialState, { historyState = null, config = {} } = {}) {
  const location = new URL(`http://demo.test${path}`);
  const rootListeners = new Map();
  const root = {
    innerHTML: '',
    addEventListener(type, listener) { rootListeners.set(type, listener); },
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
      : { state: initialState, config: { smsReady: false, rcsReady: false, voiceReady: false, ...config } },
  });

  await import(`../public/app.js?presenter-navigation=${++bootCount}`);

  return {
    root,
    window,
    document,
    click(selector, dataset = {}) {
      const element = { dataset };
      rootListeners.get('click')?.({ target: {
        closest(candidate) { return candidate === selector ? element : null; },
      } });
    },
    send(nextState) {
      stream.onmessage({ data: JSON.stringify({ state: nextState, config: { smsReady: false, rcsReady: false, voiceReady: false, ...config } }) });
    },
  };
}

function currentActions(html) {
  return html.match(/<div class="current-actions">([\s\S]*?)<\/div>/)?.[1] ?? '';
}

test('the first outreach after a missed unknown call is SMS, with a real-phone cue', async () => {
  const app = await boot('/presenter', state({ step: 'unknownMissed' }), { config: { smsReady: true } });
  const actions = currentActions(app.root.innerHTML);

  assert.match(app.root.innerHTML, /<span class="step-index">04 \/ 10<\/span>/);
  assert.match(app.root.innerHTML, /current-scene-phone/);
  assert.match(app.root.innerHTML, /Click Send live SMS/);
  assert.match(actions, /data-action="sendSms"/);
  assert.match(actions, /data-action="previewSms"/);
  assert.doesNotMatch(actions, /data-action="rewind"/);
});

test('after the SMS is shown, the presenter can mark it ignored while tracking SMS separately', async () => {
  const app = await boot('/presenter', state({ step: 'smsSent', smsMode: 'live', smsSid: 'SM123', smsStatus: 'accepted' }));
  const actions = currentActions(app.root.innerHTML);

  assert.match(actions, /data-action="ignoreSms"/);
  assert.match(app.root.innerHTML, /<dt>SMS SID<\/dt><dd>SM123<\/dd>/);
  assert.match(app.root.innerHTML, /<dt>RCS SID<\/dt><dd>—<\/dd>/);
  assert.match(app.root.innerHTML, /Check your phone now/);
});

test('the audience phone receives the configured SMS sender from its snapshot', async () => {
  const app = await boot('/bank', state({ step: 'smsSent', smsMode: 'live' }), {
    config: { smsSenderDisplay: '+18884379561' },
  });

  assert.match(app.root.innerHTML, /<strong>\+1 \(888\) 437-9561<\/strong>/);
  assert.doesNotMatch(app.root.innerHTML, /\+1 \(800\) 555-0148/);
});

test('the audience can open the RCS profile, switch tabs, and return to chat across status updates', async () => {
  const rcs = state({ step: 'rcsSent', messageMode: 'simulated' });
  const app = await boot('/bank', rcs);

  assert.match(app.root.innerHTML, /data-rcs-profile-open/);
  assert.doesNotMatch(app.root.innerHTML, /data-rcs-profile-back/);
  app.click('[data-rcs-profile-open]');
  assert.match(app.root.innerHTML, /data-rcs-profile-back/);
  assert.match(app.root.innerHTML, /rcs-sender-banner\.png/);
  assert.match(app.root.innerHTML, /data-rcs-profile-tab="info"/);

  app.send(state({ step: 'rcsSent', messageMode: 'simulated', messageStatus: 'delivered' }));
  assert.match(app.root.innerHTML, /data-rcs-profile-back/);
  app.click('[data-rcs-profile-tab]', { rcsProfileTab: 'options' });
  assert.match(app.root.innerHTML, /Privacy policy/);
  assert.match(app.root.innerHTML, /Terms of service/);

  app.click('[data-rcs-profile-back]');
  assert.match(app.root.innerHTML, /data-rcs-profile-open/);
  assert.doesNotMatch(app.root.innerHTML, /data-rcs-profile-back/);
});

test('the RCS profile closes as the story advances and is unavailable for SMS fallback', async () => {
  const app = await boot('/bank', state({ step: 'rcsSent', messageMode: 'simulated' }));
  app.click('[data-rcs-profile-open]');
  assert.match(app.root.innerHTML, /data-rcs-profile-back/);

  app.send(state({ step: 'noResponse', messageMode: 'simulated' }));
  assert.doesNotMatch(app.root.innerHTML, /data-rcs-profile-back/);
  assert.match(app.root.innerHTML, /data-rcs-profile-open/);

  app.send(state({ step: 'rcsSent', messageMode: 'live', messageChannel: 'fallback' }));
  assert.doesNotMatch(app.root.innerHTML, /data-rcs-profile-open/);
  app.click('[data-rcs-profile-open]');
  assert.doesNotMatch(app.root.innerHTML, /data-rcs-profile-back/);
});

test('after SMS is ignored, RCS becomes the next real-phone action', async () => {
  const app = await boot('/presenter', state({ step: 'smsIgnored' }), { config: { rcsReady: true } });
  const actions = currentActions(app.root.innerHTML);

  assert.match(app.root.innerHTML, /<span class="step-index">06 \/ 10<\/span>/);
  assert.match(app.root.innerHTML, /current-scene-phone/);
  assert.match(app.root.innerHTML, /Click Send live RCS/);
  assert.match(actions, /data-action="sendRcs"/);
  assert.match(actions, /data-action="previewRcs"/);
});

test('RCS is marked missed before the branded call becomes available', async () => {
  const app = await boot('/presenter', state({ step: 'rcsSent' }), { config: { voiceReady: true } });
  assert.match(currentActions(app.root.innerHTML), /Anthony misses RCS/);

  app.send(state({ step: 'noResponse' }));
  assert.match(app.root.innerHTML, /<span class="step-index">08 \/ 10<\/span>/);
  assert.match(app.root.innerHTML, /current-scene-phone/);
  assert.match(app.root.innerHTML, /Click Place AI agent call/);
  assert.match(app.root.innerHTML, /data-action="placeCall"/);
  assert.match(app.root.innerHTML, /RCS alert was missed/);
});

test('a later RCS request that uses SMS fallback is labeled separately from the first SMS', async () => {
  const app = await boot('/presenter', state({
    step: 'rcsSent',
    smsMode: 'live',
    smsStatus: 'delivered',
    messageMode: 'live',
    messageChannel: 'fallback',
    messageStatus: 'sent',
  }));

  assert.match(app.root.innerHTML, /<h2>RCS fallback selected<\/h2>/);
  assert.match(app.root.innerHTML, /separate from the first SMS/);
  assert.doesNotMatch(app.root.innerHTML, /The RCS sender is recognizable in the illustrated phone/);
  assert.match(currentActions(app.root.innerHTML), /Anthony misses fallback text/);

  app.send(state({
    step: 'noResponse',
    smsMode: 'live',
    messageMode: 'live',
    messageChannel: 'fallback',
    messageStatus: 'delivered',
  }));
  assert.match(app.root.innerHTML, /<h2>Fallback alert missed<\/h2>/);
});

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
