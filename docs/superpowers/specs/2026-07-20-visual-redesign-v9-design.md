# Visual Redesign v9 — Design

> Джерело вимог: designer's `DESIGN_SPEC_v9.md`. Два нові SVG-асети (`logo.svg`, `illustration_settle.svg`) — user підтвердив, що це правильні файли, попри назви/вміст, що на перший погляд натякали на інший проєкт.

## 1. Welcome — лого замість тексту

Файли копіюються в `public/logo.svg` (720×720 viewBox, кольори `#1f1b17`/`#b4522f`, вже відповідають палітрі продукту — без перефарбування).

`src/components/welcome-screen.tsx`: `<h1>AI Day Planner</h1>` видаляється повністю, замінюється на:
```tsx
<img src="/logo.svg" alt="AI Day Planner" className="w-[120px]" />
```

## 2. Порожній стан Today — ілюстрація замість emoji

`public/illustration-settle.svg` (kebab-case ім'я файлу в проєкті, вміст той самий).

`src/app/page.tsx`: `<span className="text-4xl">📝</span>` замінюється на:
```tsx
<img src="/illustration-settle.svg" alt="" className="w-[160px]" />
```
`alt=""` — декоративне зображення, сенс несе текст нижче (не дублюємо опис для скрінрідера).

## 3. Текст порожнього стану — два рядки різної ваги

Замість одного `<p>`, два окремі рядки:
```tsx
<div className="mt-1 flex flex-col items-center gap-1">
  <p className="text-base font-semibold text-text-primary">Що плануєш сьогодні?</p>
  <p className="text-sm text-text-secondary">Натисни + і розкажи все що в голові</p>
</div>
```

## Що НЕ чіпаємо

Решта v1-v8 — без змін.

## Тестування (ручне)

1. Welcome екран — лого рендериться замість тексту, розмір ~120px, по центру над теглайном.
2. Today з порожнім списком — нова ілюстрація замість emoji, ~160px, два текстові рядки різної ваги під нею.
3. Візуально порівняти кольори SVG з палітрою продукту (не мають виглядати "чужорідно").
