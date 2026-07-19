# Phase 3 — localStorage + Welcome/Onboarding

> Джерело вимог: `PRODUCT_SPEC.md`, розділ 8, кроки 5-6 (localStorage, Welcome/onboarding).
> Settings + Inbox (крок 7, опційний) — окрема наступна фаза, не входить сюди.

## Архітектура

- `src/lib/storage.ts` — чисті функції для роботи з localStorage:
  - `loadTasks(): Task[]` — читає ключ `"tasks"`, `JSON.parse`; на будь-яку помилку (відсутній ключ, невалідний JSON, не масив) повертає `[]`.
  - `saveTasks(tasks: Task[]): void` — `JSON.stringify` + `localStorage.setItem("tasks", ...)`, обгорнуто в `try/catch` (тихо ігнорує помилки запису — quota exceeded, приватний режим).
  - `loadOnboardingDone(): boolean` — `localStorage.getItem("onboarding_done") === "true"`.
  - `saveOnboardingDone(): void` — `localStorage.setItem("onboarding_done", "true")`, теж у `try/catch`.
- `src/components/welcome-screen.tsx` — презентаційний компонент: назва продукту, слоган *"Розкажи все, що в голові. Ми складемо план на день"*, кнопка "Почати" з `onStart: () => void`.
- `src/lib/seed-tasks.ts` — видаляється. Нові юзери після Welcome бачать справжній порожній Today (Флоу A зі спеку), а не хардкоджені демо-задачі.
- `src/app/page.tsx`:
  - Стан: `tasks: Task[] | null`, `onboardingDone: boolean | null` (`null` = ще не прочитано з localStorage — сигнал "не гідровано").
  - Один `useEffect` на маунті читає обидва значення через `loadTasks()`/`loadOnboardingDone()` і виставляє стан.
  - Поки `tasks === null || onboardingDone === null` — компонент рендерить `null` (без DOM). `localStorage.getItem` синхронний, тож це один короткий кадр одразу після першого рендера, не помітний користувачу — **буде перевірено на живому телефоні після деплою** (окремий крок тестування).
  - `!onboardingDone` → рендер `WelcomeScreen`; клік "Почати" викликає `saveOnboardingDone()` і `setOnboardingDone(true)`.
  - `onboardingDone === true` → існуючий Today UI (без змін відносно Фази 2, крім джерела початкових задач).
  - Окремий `useEffect`, залежний від `tasks`, що викликає `saveTasks(tasks)` — але тільки коли `tasks !== null` (тобто вже після гідратації), щоб не перезаписати збережені дані порожнім початковим станом до завершення читання.

## Обробка помилок

- Невалідний/корумпований JSON у `localStorage["tasks"]` → `loadTasks` повертає `[]`, юзер бачить порожній стан замість краху застосунку.
- `localStorage` недоступний або переповнений (приватний режим Safari, quota exceeded) → запис у `try/catch`, помилка йде в `console.error`, застосунок продовжує працювати в межах поточної сесії, просто без збереження між перезавантаженнями. Це не показується юзеру як помилка — не блокує основний флоу.
- Existing error-стан Capture sheet (Фаза 2, невдалий AI-парсинг) — без змін.

## Стилі Welcome-екрану

Мінімалістичний, по центру екрану, узгоджений з палітрою Today (zinc). Один месседж, жодного зайвого тексту, як вимагає розділ 7 спеку.

## Тестування (ручне)

1. `npm run dev`, очистити localStorage браузера → перезавантажити → показується Welcome, не Today.
2. Тап "Почати" → порожній Today (без seed-задач), `localStorage.onboarding_done === "true"`.
3. Додати задачу через Capture (Фаза 2 флоу) → перезавантажити сторінку → задача лишається.
4. Позначити задачу виконаною → перезавантажити → стан `done` зберігся.
5. Очистити тільки ключ `tasks` (лишити `onboarding_done`) → перезавантажити → одразу порожній Today, не Welcome — підтверджує Флоу B (повторний запуск).
6. **Живий телефон після деплою**: відкрити live Vercel URL на реальному пристрої, візуально підтвердити відсутність помітного мигання/білого екрану при завантаженні. Якщо є затримка — повернутись і продумати явний loading state.
