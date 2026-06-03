# Timer App — Progress

## Назначение документа

Документ фиксирует текущий рабочий статус, ограничения и ближайшие шаги.

Архитектурные решения, роли, статусы, Supabase schema, RLS и API описаны в `docs/architecture.md`.

---

## Текущий статус

Frontend находится в рабочем состоянии и опубликован на GitHub Pages.

Production API работает через Supabase Edge Function.

Supabase project подготовлен:

- Postgres schema применена миграцией;
- Auth включён;
- первый пользователь создан и назначен `admin`;
- Storage bucket `timer-images` создан;
- RLS проверен: frontend может читать `profiles` и `timers`, но не может напрямую создавать `timers`;
- Edge Function `api` развёрнута в production.

Frontend интеграция с Supabase выполнена:

- добавлен Supabase client;
- реализован `authStore`;
- добавлен `/login`;
- защищён route `/`;
- роль пользователя берётся из `profiles.role`;
- `usePermissions.ts` больше не использует mock-роль;
- frontend service layer ходит в Supabase Edge Function API.

Supabase Edge Function API реализует:

- проверку Bearer token через Supabase Auth;
- получение текущего пользователя и профиля;
- `GET /health`;
- `GET /me`;
- `GET /timers`;
- `POST /timers`;
- `PATCH /timers/{timer_id}`;
- `DELETE /timers/{timer_id}`;
- `POST /timers/{timer_id}/restart`;
- `POST /timers/{timer_id}/stop`;
- backend-проверку ролей;
- логирование create/update/delete/restart/stop в `timer_logs`.

GitHub Pages production-сценарий проверен:

- login;
- logout;
- загрузка таймеров;
- создание таймера;
- редактирование таймера;
- удаление таймера;
- перезапуск таймера;
- остановка таймера.

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
- чтение таймеров через Supabase Edge Function;
- добавление, редактирование, удаление, перезапуск и остановка таймеров через Supabase Edge Function;
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
- Storage bucket `timer-images`;
- Edge Function `api`.

### Edge Function API

- структура `supabase/functions/api`;
- CORS;
- env-config через Supabase Function secrets;
- Supabase user client для auth/profile/read-запросов;
- Supabase service role client для серверных mutations;
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

- закрепления и настройки звука пока хранятся в `localStorage`;
- изображения в UI всё ещё могут использовать временный frontend-flow, полноценная загрузка в Storage не подключена;
- realtime-обновления таймеров ещё не подключены;
- `timer_logs.timer_id` становится `null` после удаления таймера из-за FK `on delete set null`.

---

## Проверки, которые уже выполнены

- `npm run build` для frontend проходит;
- GitHub Pages получает Supabase env variables во время build;
- GitHub Pages получает `VITE_API_BASE_URL` во время build;
- прямые Vue routes на GitHub Pages работают через `404.html` fallback;
- Supabase Auth login работает;
- logout работает;
- чтение `profiles` через RLS работает;
- чтение `timers` через RLS работает;
- прямой insert в `timers` из frontend блокируется RLS;
- Supabase Edge Function `/health` локально и в production возвращает `{"status":"ok"}`;
- Supabase Edge Function `/me` в production возвращает текущего пользователя и роль;
- Supabase Edge Function `/timers` в production возвращает список таймеров;
- создание, редактирование, удаление, перезапуск и остановка таймеров через production UI работают;
- create/update/delete/restart/stop пишут записи в `timer_logs`.

---

## Ближайший план

### 1. Перенести персональные данные из localStorage

- `user_pinned_timers`;
- `user_settings`;
- `timer_user_settings`.

### 2. Подключить Storage

- загрузка изображений таймеров через Supabase Storage;
- сохранение `timers.image_url`.

### 3. Подключить Realtime

- realtime-подписка на изменения `timers`;
- обновление списка таймеров у всех пользователей без ручного refresh.

---

## Перед следующим этапом

Базовые команды проверки:

Frontend:

```bash
cd frontend
npm run build
```

Supabase local stack:

```bash
supabase start
```

Локальная Edge Function:

```bash
supabase functions serve api --no-verify-jwt
```

Проверка локального API:

```txt
http://127.0.0.1:54321/functions/v1/api/health
```

Production API:

```txt
https://khyqmlngemhhvtaawcqz.supabase.co/functions/v1/api/health
```