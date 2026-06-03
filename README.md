# Timer App

Timer App — веб-приложение для командной работы с таймерами.

Пользователи работают с общим списком таймеров, отслеживают обратный отсчёт, получают звуковые уведомления и выполняют действия с таймерами в зависимости от роли.

Проект рассчитан на небольшую команду и минимальную бесплатную инфраструктуру.

---

## Текущий статус

Frontend находится в рабочем состоянии и опубликован на GitHub Pages.

Production API работает через Supabase Edge Function.

Реализовано:

- список таймеров;
- realtime countdown на frontend;
- frontend view-статусы `active`, `warning`, `stopped`, `signal`, `completed`;
- обычная длительность и диапазоны длительности;
- warning/signal-звуки;
- добавление, редактирование, удаление, перезапуск и остановка таймеров;
- перезапуск со сдвигом;
- локальное завершение конкретного запуска таймера;
- поиск и фильтр активных таймеров;
- автоматическая сортировка незакреплённых таймеров;
- персональное закрепление таймеров;
- drag-and-drop перестановка закреплённых таймеров;
- пользовательские настройки звука;
- адаптивное отображение таймеров карточками на узкой ширине;
- Supabase Auth;
- получение профиля пользователя и роли из Supabase;
- защита frontend routes;
- Supabase Edge Function API:
  - `GET /health`;
  - `GET /me`;
  - `GET /timers`;
  - `POST /timers`;
  - `PATCH /timers/{timer_id}`;
  - `DELETE /timers/{timer_id}`;
  - `POST /timers/{timer_id}/restart`;
  - `POST /timers/{timer_id}/stop`;
- backend-проверка Bearer token;
- backend-проверка ролей;
- логирование create/update/delete/restart/stop в `timer_logs`.

---

## Технологический стек

Frontend:

- Vue 3;
- Vite;
- TypeScript;
- Pinia;
- Vue Router;
- Supabase JS client.

Backend и инфраструктура:

- Supabase Edge Functions;
- Supabase Postgres;
- Supabase Auth;
- Supabase Storage;
- Supabase Realtime;
- GitHub Pages;
- GitHub Actions.

---

## Структура проекта

```txt
frontend/    Vue-приложение
supabase/    Supabase config, migrations и Edge Functions
docs/        Архитектура и рабочий прогресс
```

---

## Локальный запуск frontend

```bash
cd frontend
npm install
npm run dev
```

Сборка:

```bash
cd frontend
npm run build
```

Для локального frontend нужен файл `frontend/.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://127.0.0.1:54321/functions/v1/api
```

`VITE_SUPABASE_ANON_KEY` — publishable/anon key. Secret/service role key нельзя хранить во frontend.

---

## Локальный запуск Supabase

Для локальной разработки Supabase нужен Docker Desktop.

Запуск локального Supabase stack:

```bash
supabase start
```

Локальный запуск Edge Function:

```bash
supabase functions serve api --no-verify-jwt
```

Проверка локального API:

```txt
http://127.0.0.1:54321/functions/v1/api/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

---

## Production API

Production API находится в Supabase Edge Function:

```txt
https://khyqmlngemhhvtaawcqz.supabase.co/functions/v1/api
```

GitHub Pages frontend получает этот URL через build-time переменную:

```env
VITE_API_BASE_URL=https://khyqmlngemhhvtaawcqz.supabase.co/functions/v1/api
```

Переменные `VITE_*` должны быть доступны во время GitHub Actions build.

---

## Документация

- [`docs/architecture.md`](./docs/architecture.md) — архитектура, роли, правила данных, Supabase schema, RLS и API;
- [`docs/process.md`](./docs/process.md) — текущий прогресс, ограничения и ближайшие шаги.