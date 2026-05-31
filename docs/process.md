# Timer App — Progress

## Назначение документа

Документ фиксирует текущий рабочий статус, ограничения и ближайшие шаги.

Архитектурные решения, роли, статусы, Supabase schema, RLS и план API описаны в `docs/architecture.md`.

---

## Текущий статус

Frontend находится в рабочем состоянии и опубликован на GitHub Pages.

Supabase project подготовлен:

- Postgres schema применена миграцией;
- Auth включён;
- первый пользователь создан и назначен `admin`;
- Storage bucket `timer-images` создан;
- RLS проверен: frontend может читать `profiles` и `timers`, но не может напрямую создавать `timers`.

Frontend интеграция с Supabase частично выполнена:

- добавлен Supabase client;
- реализован `authStore`;
- добавлен `/login`;
- защищён route `/`;
- роль пользователя берётся из `profiles.role`;
- `usePermissions.ts` больше не использует mock-роль.

Backend частично интегрирован с Supabase:

- добавлен backend Supabase config;
- реализована проверка Bearer token;
- реализован `GET /me`;
- реализован `GET /timers`;
- реализованы `POST /timers`, `PATCH /timers/{timer_id}` и `DELETE /timers/{timer_id}`;
- реализованы `POST /timers/{timer_id}/restart` и `POST /timers/{timer_id}/stop`;
- create/update/delete/restart/stop пишут записи в `timer_logs`;
- основная страница читает таймеры через FastAPI;
- основные действия с таймерами на странице идут через FastAPI.

---

## Реализовано на текущем этапе

### Frontend

- основная страница таймеров;
- таблица таймеров;
- адаптивное отображение таймеров карточками на узкой ширине;
- realtime countdown на frontend;
- frontend view-статусы `active`, `warning`, `stopped`, `signal`, `completed`;
- обычная длительность и диапазоны длительности;
- warning-состояние;
- warning/signal-звуки;
- чтение таймеров через FastAPI;
- добавление, редактирование, удаление, перезапуск и остановка таймеров через FastAPI;
- перезапуск со сдвигом;
- локальное завершение конкретного запуска таймера;
- поиск и фильтр активных таймеров;
- персональные закрепления и reorder через `localStorage`;
- настройки звука через `localStorage`;
- Supabase Auth login;
- получение профиля и роли;
- logout;
- protected routes.

### Supabase

- `supabase/migrations/001_initial_schema.sql`;
- таблицы `profiles`, `timers`, `user_pinned_timers`, `user_settings`, `timer_user_settings`, `timer_logs`;
- enum-типы для ролей, статусов и логов;
- constraints и индексы;
- updated_at triggers;
- auto-create profile/settings для новых auth users;
- RLS policies;
- Storage bucket `timer-images`.

### Backend

- структура `backend/app`;
- env-config через `pydantic-settings`;
- Supabase backend client;
- проверка Bearer token через Supabase Auth;
- получение текущего пользователя и профиля;
- endpoint `GET /health`;
- endpoint `GET /me`;
- endpoint `GET /timers`;
- endpoint `POST /timers`;
- endpoint `PATCH /timers/{timer_id}`;
- endpoint `DELETE /timers/{timer_id}`;
- endpoint `POST /timers/{timer_id}/restart`;
- endpoint `POST /timers/{timer_id}/stop`;
- логирование create/update/delete/restart/stop в `timer_logs`.

---

## Временные решения и ограничения

- restart и stop уже сохраняются в Supabase через FastAPI;
- закрепления и настройки звука пока хранятся в `localStorage`;
- изображения в UI всё ещё могут использовать временный frontend-flow, полноценная загрузка в Storage не подключена;
- realtime-обновления таймеров ещё не подключены;
- `/login-test` временно оставлен для диагностики и должен быть удалён позже.

---

## Проверки, которые уже выполнены

- `npm run build` для frontend проходит;
- GitHub Pages получает Supabase env variables во время build;
- прямые Vue routes на GitHub Pages работают через `404.html` fallback;
- production `/login-test` проверен;
- Supabase Auth login работает;
- чтение `profiles` через RLS работает;
- чтение `timers` через RLS работает;
- прямой insert в `timers` из frontend блокируется RLS;
- FastAPI `/health` локально возвращает `{"status":"ok"}`.

---

## Ближайший план

### 1. Перенести персональные данные из localStorage

- `user_pinned_timers`;
- `user_settings`;
- `timer_user_settings`.

### 2. Подключить Storage и Realtime

- загрузка изображений таймеров через FastAPI в Supabase Storage;
- realtime-подписка на изменения `timers`.

### 3. Удалить временный `/login-test`

- убрать route и связанные временные диагностические элементы перед MVP.

---

## Перед следующим этапом

Базовые команды проверки:

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Проверка backend:

```txt
http://localhost:8000/health
```
