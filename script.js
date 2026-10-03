const periods = {
  1: ['14:00', '14:40'], 2: ['14:45', '15:25'],
  3: ['15:35', '16:15'], 4: ['16:25', '17:05'],
  5: ['17:10', '17:50'], 6: ['17:55', '18:35'],
  11: ['13:20', '14:05'], 12: ['14:10', '14:55'],
  13: ['15:00', '15:45'], 14: ['16:00', '16:45'],
  15: ['17:00', '17:45'], 16: ['17:50', '18:35']
};

function displayPeriodNumber(number) {
  return number >= 11 ? number - 10 : number;
}

// Расписание 3 «Ж» класса, 1 полугодие.
// В понедельник звонки отличаются от расписания вторника–пятницы.
// По понедельникам в 13:55 — гимн.
const days = [
  { name: 'Понедельник', color: 'mint', notice: '13:55 — гимн', lessons: [
    ['Классный час', 1, 1, '', 'book'],
    ['Математика', 2, 2, '', 'math'],
    ['Русский язык', 3, 3, '', 'language'],
    ['Английский язык', 4, 4, '', 'language'],
    ['Казахский язык', 5, 5, '', 'language'],
    ['Литературное чтение', 6, 6, '', 'book']
  ]},
  { name: 'Вторник', color: 'purple', lessons: [
    ['Казахский язык', 11, 11, '', 'language'],
    ['Цифровая грамотность', 12, 12, '', 'code'],
    ['Русский язык', 13, 13, '', 'language'],
    ['Математика', 14, 14, '', 'math'],
    ['Естествознание', 15, 15, '', 'science'],
    ['Английский язык', 16, 16, '', 'language']
  ]},
  { name: 'Среда', color: 'blue', lessons: [
    ['Математика', 11, 11, '', 'math'],
    ['Русский язык', 12, 12, '', 'language'],
    ['Музыка', 13, 13, '', 'music'],
    ['Литературное чтение', 14, 14, '', 'book'],
    ['Физкультура', 15, 15, '', 'sport']
  ]},
  { name: 'Четверг', color: 'pink', lessons: [
    ['Русский язык', 11, 11, '', 'language'],
    ['Математика', 12, 12, '', 'math'],
    ['Познание мира', 13, 13, '', 'science'],
    ['ИЗО', 14, 14, '', 'art'],
    ['Физкультура', 15, 15, '', 'sport'],
    ['Казахский язык', 16, 16, '', 'language']
  ]},
  { name: 'Пятница', color: 'amber', lessons: [
    ['Физкультура', 11, 11, '', 'sport'],
    ['Математика', 12, 12, '', 'math'],
    ['Литературное чтение', 13, 13, '', 'book'],
    ['Трудовое обучение', 14, 14, '', 'art']
  ]}
];

const symbols = {
  language: 'Aa', art: '✎', code: '</>', science: '⌘',
  music: '♫', book: '▤', sport: '↗', history: '◷', math: '∑'
};

const shortNames = {
  'Классный час': 'Кл. час',
  'Математика': 'Матем.',
  'Русский язык': 'Рус. язык',
  'Английский язык': 'Англ. язык',
  'Казахский язык': 'Каз. язык',
  'Литературное чтение': 'Лит. чтение',
  'Цифровая грамотность': 'Цифр. грамот.',
  'Естествознание': 'Естеств.',
  'Музыка': 'Музыка',
  'Познание мира': 'Позн. мира',
  'ИЗО': 'ИЗО',
  'Физкультура': 'Физ-ра',
  'Трудовое обучение': 'Труд. обуч.'
};

const root = document.getElementById('schedule');
let selected = 'all';
let displayedState;
const astanaClock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Almaty', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});
function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}
function astanaState(date = new Date()) {
  const parts = Object.fromEntries(astanaClock.formatToParts(date).map(part => [part.type, part.value]));
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(parts.weekday);
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const lessonNumbers = day < 0 ? [] : days[day].lessons.flatMap(([, first, last]) =>
    Array.from({ length: last - first + 1 }, (_, index) => first + index)
  );
  const period = day < 0 ? null : lessonNumbers.find(number =>
    minutes >= toMinutes(periods[number][0]) && minutes < toMinutes(periods[number][1])
  ) ?? null;
  const seconds = minutes * 60 + Number(parts.second);
  return { day, period, seconds, key: day + ':' + period };
}

function currentBreak(state) {
  if (state.day < 0 || state.period !== null) return null;
  const slots = days[state.day].lessons.flatMap(([name, first, last, room]) =>
    Array.from({ length: last - first + 1 }, (_, index) => ({ number: first + index, name, room }))
  );
  for (let index = 1; index < slots.length; index += 1) {
    const previous = slots[index - 1];
    const next = slots[index];
    const start = toMinutes(periods[previous.number][1]) * 60;
    const end = toMinutes(periods[next.number][0]) * 60;
    if (state.seconds >= start && state.seconds < end) {
      return { key: `${state.day}:${next.number}`, remaining: end - state.seconds, duration: end - start, next };
    }
  }
  return null;
}
const breakCard = document.getElementById('break-card');
let visibleBreak = null;
let dismissedBreak = null;
let dismissedUrgent = false;
function updateFloatingBounds() {
  if (breakCard.hidden) return;
  breakCard.style.setProperty('--float-x', `${Math.max(0, window.innerWidth - breakCard.offsetWidth - 24)}px`);
  breakCard.style.setProperty('--float-y', `${Math.max(0, window.innerHeight - breakCard.offsetHeight - 24)}px`);
}
function updateBreak(state) {
  const pause = currentBreak(state);
  visibleBreak = pause;
  const urgent = pause !== null && pause.remaining <= 60;
  if (pause === null) {
    dismissedBreak = null;
    dismissedUrgent = false;
  }
  if (pause === null || (dismissedBreak === pause.key && (!urgent || dismissedUrgent))) {
    breakCard.hidden = true;
    return;
  }
  const opening = breakCard.hidden;
  breakCard.hidden = false;
  breakCard.classList.toggle('is-urgent', urgent);
  const hue = pause.duration > 60 ? Math.max(0, Math.min(150, 150 * (pause.remaining - 60) / (pause.duration - 60))) : 0;
  breakCard.style.setProperty('--break-hue', hue.toFixed(1));
  const minutes = Math.floor(pause.remaining / 60).toString().padStart(2, '0');
  const seconds = (pause.remaining % 60).toString().padStart(2, '0');
  document.getElementById('break-clock').textContent = `${minutes}:${seconds}`;
  const message = document.getElementById('break-message');
  const text = urgent ? 'Пора занять место в классе' : 'Выдохни и улыбнись!';
  if (message.textContent !== text) message.textContent = text;
  document.getElementById('break-title').textContent = urgent ? 'Скоро звонок!' : 'Перемена!';
  document.getElementById('break-next').textContent = `Дальше: ${pause.next.name}`;
  document.getElementById('break-room').textContent = 'Начало: ' + periods[pause.next.number][0];
  document.getElementById('break-progress-fill').style.width = `${100 * (1 - pause.remaining / pause.duration)}%`;
  if (opening || urgent) updateFloatingBounds();
}
document.getElementById('break-close').addEventListener('click', () => {
  if (visibleBreak === null) return;
  dismissedBreak = visibleBreak.key;
  dismissedUrgent = visibleBreak.remaining <= 60;
  breakCard.hidden = true;
});
window.addEventListener('resize', updateFloatingBounds);
function render() {
  const { day: today, period: currentPeriod, key } = astanaState();
  displayedState = key;
  document.querySelectorAll('.day-button').forEach(button => {
    button.classList.toggle('is-today', button.dataset.day !== 'all' && Number(button.dataset.day) === today);
  });
  root.classList.toggle('single-day', selected !== 'all');
  document.getElementById('day-animation').hidden = selected === 'all';
  root.innerHTML = days.map((day, index) => {
    const count = day.lessons.reduce((total, lesson) => total + lesson[2] - lesson[1] + 1, 0);
    const last = day.lessons.at(-1);
    return `<article class="day-card ${day.color}${today === index ? ' is-today' : ''}" style="--lesson-count:${day.lessons.length}" ${selected !== 'all' && Number(selected) !== index ? 'hidden' : ''} aria-labelledby="day-${index}">
      <div class="day-heading"><div class="day-index">0${index + 1}</div><div class="day-heading-text"><h3 id="day-${index}">${day.name}</h3><span>${count} уроков · до ${periods[last[2]][1]}${day.notice ? ` · ${day.notice}` : ''}</span></div>${today === index ? '<span class="today">Сегодня</span>' : ''}</div>
      <div class="lessons">${day.lessons.map(([name, first, end, room, icon]) => {
        const current = today === index && currentPeriod !== null && currentPeriod >= first && currentPeriod <= end;
        return `<div class="lesson ${end > first ? 'double' : ''}${current ? ' is-current' : ''}"${current ? ' aria-current="true"' : ''}>
        ${current ? '<span class="sr-only">Сейчас идёт урок</span>' : ''}
        <div class="lesson-top"><span class="lesson-symbol" aria-hidden="true">${symbols[icon]}</span><span class="lesson-number">${first === end ? `${displayPeriodNumber(first)} урок` : `${displayPeriodNumber(first)}–${displayPeriodNumber(end)} уроки`}</span></div>
        <div class="lesson-time">${periods[first][0]} <span>—</span> ${periods[end][1]}</div>
        <h4 aria-label="${name}" title="${name}"><span class="subject-full">${name}</span><span class="subject-short" aria-hidden="true">${shortNames[name] || name}</span></h4>
        <div class="room"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 13V3h10v10M1 13h14M6 13V9h4v4M6 5h1m2 0h1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>${room ? (room === 'Спортзал' ? room : `Каб. ${room}`) : 'Кабинет не указан'}${end > first ? '<span class="double-mark" title="Два урока подряд" aria-label="Два урока подряд"><b>2</b> урока<span class="double-detail"> подряд</span></span>' : ''}</div>
      </div>`;
      }).join('')}</div>
      <div class="day-end"><span class="end-dot"></span> ${periods[last[2]][1]} <span>· Конец занятий</span></div>
    </article>`;
  }).join('');
}
document.querySelectorAll('.day-button').forEach(button => {
  button.addEventListener('click', () => {
    selected = button.dataset.day;
    document.querySelectorAll('.day-button').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    render();
  });
});
function refreshCurrentLesson() {
  const state = astanaState();
  if (state.key !== displayedState) render();
  updateBreak(state);
}
refreshCurrentLesson();
setInterval(refreshCurrentLesson, 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshCurrentLesson();
});
