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

Backend skeleton создан:

- FastAPI-приложение в `backend/`;
- env-config через `pydantic-settings`;
- CORS подготовлен;
- `GET /health` работает локально.

Таймеры пока работают через mock service layer в `frontend/src/services/timerService.ts`.

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
- добавление, редактирование, удаление, перезапуск и остановка таймеров через mock service layer;
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
- `backend/app/main.py`;
- `backend/app/core/config.py`;
- `backend/requirements.txt`;
- `backend/.env.example`;
- endpoint `GET /health`.

---

## Временные решения и ограничения

- `timerService` пока использует mock-данные;
- изменения таймеров не сохраняются после перезагрузки;
- backend ещё не подключён к Supabase Auth и БД;
- FastAPI пока не выполняет timer mutations;
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

### 1. Подключить FastAPI к Supabase Auth

Нужно реализовать:

- backend env для Supabase URL и secret/service key;
- проверку Bearer token;
- получение текущего пользователя;
- получение профиля пользователя;
- `GET /me`.

### 2. Реализовать backend timer read

- `GET /timers` через FastAPI;
- маппинг DB rows → API response;
- frontend service для чтения таймеров через backend.

### 3. Реализовать timer mutations

Рекомендуемый порядок:

1. `POST /timers/{timer_id}/restart`;
2. `POST /timers/{timer_id}/stop`;
3. `POST /timers`;
4. `PATCH /timers/{timer_id}`;
5. `DELETE /timers/{timer_id}`.

Для каждого mutation:

- проверять роль;
- валидировать данные;
- писать `updated_by` / `last_run_by`;
- логировать действие в `timer_logs`.

### 4. Перенести персональные данные из localStorage

- `user_pinned_timers`;
- `user_settings`;
- `timer_user_settings`.

### 5. Подключить Storage и Realtime

- загрузка изображений таймеров через FastAPI в Supabase Storage;
- realtime-подписка на изменения `timers`.

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
