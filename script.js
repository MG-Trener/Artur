const periods = {
  9: ['14:00', '14:40'], 10: ['14:45', '15:25'],
  11: ['15:40', '16:20'], 12: ['16:25', '17:05'],
  13: ['17:20', '18:00'], 14: ['18:05', '18:45']
};
// Номера уроков и объединённые ячейки из расписания от 05.09.2026.
const days = [
  { name: 'Понедельник', color: 'mint', lessons: [
    ['Иностранный язык', 9, 9, '408 / 409', 'language'],
    ['Художественный труд', 10, 10, '205 / 202', 'art'],
    ['Художественный труд', 11, 11, '208 / 202', 'art'],
    ['Информатика', 12, 12, '209А / 402', 'code'],
    ['Естествознание', 13, 14, '405', 'science']
  ]},
  { name: 'Вторник', color: 'purple', lessons: [
    ['Музыка', 9, 9, '404', 'music'],
    ['Казахский язык и литература', 10, 10, '200 / 300', 'language'],
    ['Русская литература', 11, 12, '308', 'book'],
    ['Иностранный язык', 13, 13, '408 / 409', 'language'],
    ['Физкультура', 14, 14, 'Спортзал', 'sport']
  ]},
  { name: 'Среда', color: 'blue', lessons: [
    ['Русский язык', 9, 10, '309', 'language'],
    ['Всемирная история', 11, 11, '305', 'history'],
    ['Математика', 12, 13, '209', 'math']
  ]},
  { name: 'Четверг', color: 'pink', lessons: [
    ['Математика', 9, 9, '208', 'math'],
    ['Русский язык', 10, 10, '304', 'language'],
    ['История Казахстана', 11, 12, '304', 'history'],
    ['Казахский язык и литература', 13, 14, '201 / 301', 'language']
  ]},
  { name: 'Пятница', color: 'amber', lessons: [
    ['Математика', 9, 10, '208', 'math'],
    ['Физкультура', 11, 12, 'Спортзал', 'sport'],
    ['Казахский язык и литература', 13, 13, '200 / 300', 'language'],
    ['Иностранный язык', 14, 14, '408 / 409', 'language']
  ]}
];
const symbols = { language: 'Aa', art: '✎', code: '</>', science: '⌘', music: '♫', book: '▤', sport: '↗', history: '◷', math: '∑' };
const root = document.getElementById('schedule');
let selected = 'all';
function astanaDay() {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Almaty', weekday: 'short' }).format(new Date());
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(name);
}
function render() {
  const today = astanaDay();
  root.classList.toggle('single-day', selected !== 'all');
  document.getElementById('day-animation').hidden = selected === 'all';
  root.innerHTML = days.map((day, index) => {
    const count = day.lessons.reduce((total, lesson) => total + lesson[2] - lesson[1] + 1, 0);
    const last = day.lessons.at(-1);
    return `<article class="day-card ${day.color}" style="--lesson-count:${day.lessons.length}" ${selected !== 'all' && Number(selected) !== index ? 'hidden' : ''} aria-labelledby="day-${index}">
      <div class="day-heading"><div class="day-index">0${index + 1}</div><div class="day-heading-text"><h3 id="day-${index}">${day.name}</h3><span>${count} уроков · до ${periods[last[2]][1]}</span></div>${today === index ? '<span class="today">Сегодня</span>' : ''}</div>
      <div class="lessons">${day.lessons.map(([name, first, end, room, icon]) => `<div class="lesson ${end > first ? 'double' : ''}">
        <div class="lesson-top"><span class="lesson-symbol" aria-hidden="true">${symbols[icon]}</span><span class="lesson-number">${first === end ? `${first} урок` : `${first}–${end} уроки`}</span></div>
        <div class="lesson-time">${periods[first][0]} <span>—</span> ${periods[end][1]}</div>
        <h4>${name}</h4>
        <div class="room"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 13V3h10v10M1 13h14M6 13V9h4v4M6 5h1m2 0h1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>${room === 'Спортзал' ? room : `Каб. ${room}`}${end > first ? '<span class="double-mark" title="Два урока подряд" aria-label="Два урока подряд"><b>2</b> урока<span class="double-detail"> подряд</span></span>' : ''}</div>
      </div>`).join('')}</div>
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
render();
