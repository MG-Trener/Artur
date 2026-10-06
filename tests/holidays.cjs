const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const project = path.resolve(__dirname, '..');

function fixture(iso) {
  let now = Date.parse(iso);
  const nodes = new Map();
  const callbacks = [];
  function node(name) {
    if (!nodes.has(name)) nodes.set(name, {
      hidden: true, innerHTML: '', textContent: '', dataset: { unit: name },
      style: { setProperty() {} }, classList: { toggle() {} },
      setAttribute() {}, addEventListener(event, handler) { this[event] = handler; },
      querySelector: node, querySelectorAll() { return ['days', 'hours', 'minutes', 'seconds'].map(node); }
    });
    return nodes.get(name);
  }
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const context = vm.createContext({ Date: Clock, Intl,
    window: { addEventListener() {}, innerWidth: 390, innerHeight: 780 },
    document: { createElement: () => node('card'), body: { append() {} },
      getElementById: node, querySelectorAll: () => [], addEventListener() {} },
    setInterval: callback => callbacks.push(callback)
  });
  vm.runInContext(fs.readFileSync(path.join(project, 'holiday-widget.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(project, 'script.js'), 'utf8'), context);
  return { context, node, advance(iso) { now = Date.parse(iso); callbacks.forEach(fn => fn()); } };
}

for (const [season, start, resume] of [
  ['autumn', '2026-10-26', '2026-11-02'],
  ['winter', '2026-12-28', '2027-01-11'],
  ['spring', '2027-03-22', '2027-03-29']
]) {
  const f = fixture(`${start}T00:00:00+05:00`);
  assert.equal(f.context.window.schoolHolidays.current().id, season);
  assert.equal(f.node('card').hidden, false);
  assert.match(f.node('img').src, new RegExp(`${season}.jpg$`));
  assert.equal(f.context.window.schoolHolidays.current(new Date(Date.parse(`${start}T00:00:00+05:00`) - 1)), null);
  f.advance(`${start}T14:42:00+05:00`);
  assert.equal(f.node('break-card').hidden, true, 'No school-break popup during holidays');
  assert.doesNotMatch(f.node('schedule').innerHTML, /is-current/);
  f.advance(`${resume}T00:00:00+05:00`);
  assert.equal(f.node('card').hidden, true);
  assert.equal(f.context.window.schoolHolidays.current(), null);
  f.advance(`${resume}T14:10:00+05:00`);
  assert.match(f.node('schedule').innerHTML, /is-current/, 'School highlighting returns');
}
const f = fixture('2026-11-01T23:59:59+05:00');
assert.equal(f.node('days').textContent, '00');
assert.equal(f.node('seconds').textContent, '01');
f.node('button').click();
f.advance('2026-11-01T23:59:59.500+05:00');
assert.equal(f.node('card').hidden, true, 'Closed window stays closed');
assert.equal(fixture('2026-11-01T23:59:59+05:00').node('card').hidden, false, 'Reload shows it again');
assert.equal(fixture('2026-10-06T14:42:00+05:00').node('card').hidden, true, 'No popup outside holidays');
assert.equal(fixture('2027-02-08T14:10:00+05:00').node('card').hidden, true, 'First-grade-only holidays do not apply');
console.log('Holiday boundaries, countdown, dismissal/reload and timetable integration passed.');
