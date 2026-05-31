# Timer App

Timer App — веб-приложение для командной работы с таймерами.

Пользователи работают с общим списком таймеров, отслеживают обратный отсчёт, получают звуковые уведомления и выполняют действия с таймерами в зависимости от роли.

Проект рассчитан на небольшую команду и минимальную бесплатную инфраструктуру.

---

## Текущий статус

Frontend находится в рабочем состоянии и опубликован на GitHub Pages.

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
- FastAPI backend с `/health`, `/me`, `GET /timers`, `restart` и `stop`;
- backend-проверка Bearer token через Supabase Auth;
- чтение таймеров, restart и stop через FastAPI;
- логирование restart/stop в `timer_logs`.

Чтение таймеров, restart и stop уже идут через FastAPI. Добавление, редактирование и удаление таймеров пока остаются во временной frontend/mock-реализации.

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

- Python;
- FastAPI;
- Supabase Postgres;
- Supabase Auth;
- Supabase Storage;
- Supabase Realtime;
- GitHub Pages.

---

## Структура проекта

```txt
frontend/    Vue-приложение
backend/     FastAPI-приложение
supabase/    Supabase config и миграции
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
VITE_API_BASE_URL=http://localhost:8000
```

`VITE_SUPABASE_ANON_KEY` — publishable key. Secret/service key нельзя хранить во frontend.

---

## Локальный запуск backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Проверка:

```txt
http://localhost:8000/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

---

## Документация

- [`docs/architecture.md`](./docs/architecture.md) — архитектура, роли, правила данных, Supabase schema, RLS и план API;
- [`docs/process.md`](./docs/process.md) — текущий прогресс, ограничения и ближайшие шаги.
