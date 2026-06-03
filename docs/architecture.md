# Timer App — Architecture

## Назначение

Timer App — веб-приложение для командной работы с таймерами.

Пользователи работают с общим списком таймеров, отслеживают обратный отсчёт, получают звуковые уведомления и выполняют действия в зависимости от роли.

Приложение рассчитано на небольшую команду и минимальную бесплатную инфраструктуру.

---

## Стек

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

## Текущая схема приложения

```txt
Vue + Pinia
↓
Frontend service layer
↓
Supabase Edge Function API
↓
Supabase Auth
Supabase Postgres
Supabase Storage
Supabase Realtime
```

Frontend опубликован на GitHub Pages.

Production API находится в Supabase Edge Function:

```txt
https://khyqmlngemhhvtaawcqz.supabase.co/functions/v1/api
```

Frontend получает URL API через build-time переменную:

```env
VITE_API_BASE_URL=https://khyqmlngemhhvtaawcqz.supabase.co/functions/v1/api
```

---

## Страницы

| Route | Статус | Назначение |
|---|---|---|
| `/` | реализовано | список таймеров, protected route |
| `/login` | реализовано | вход по email/password |
| `/logs` | план | лог действий |
| `/admin/users` | план | управление пользователями |

---

## Авторизация и роли

Авторизация реализована через Supabase Auth.

Профиль пользователя хранится в таблице `profiles`.

Роль пользователя берётся из `profiles.role`:

- `admin`;
- `manager`;
- `member`.

Frontend routes защищены через router guard.

`usePermissions.ts` использует реальную роль из `authStore.profile`, а не mock-роль.

Проверки на frontend не считаются безопасностью. Для глобальных действий с таймерами проверки выполняются в Supabase Edge Function API и дополнительно ограничиваются RLS.

---

## Права

| Действие | admin | manager | member |
|---|---:|---:|---:|
| Читать таймеры | да | да | да |
| Добавить таймер | да | да | нет |
| Редактировать таймер | да | да | нет |
| Удалить таймер | да | да | нет |
| Перезапустить таймер | да | да | да |
| Остановить таймер | да | да | да |
| Управлять пользователями | да | нет | нет |

Персональные действия доступны всем активным авторизованным пользователям:

- поиск;
- фильтры;
- включение и выключение звука;
- закрепление таймеров;
- изменение порядка закреплённых таймеров.

---

## Модель таймера

Текущая frontend-модель:

```ts
export type TimerStatus = 'active' | 'stopped'

export type TimerViewStatus =
  | 'active'
  | 'warning'
  | 'stopped'
  | 'signal'
  | 'completed'

export interface Timer {
  id: string
  title: string
  description: string
  imageUrl?: string
  durationSeconds: number
  minDurationSeconds: number | null
  timeShiftSeconds: number
  startedAt: string
  lastRunBy: string
  status: TimerStatus
  soundEnabled: boolean
  createdAt: string
  updatedAt: string
}
```

В БД хранятся только серверные статусы:

- `active`;
- `stopped`.

`warning`, `signal` и `completed` — только frontend view-статусы.

`completed` остаётся локальным состоянием пользователя и относится к конкретному запуску:

```txt
timerId + startedAt
```

---

## Время и timezone

БД и backend API работают с UTC.

Все даты в Supabase Postgres должны использовать `timestamptz`.

Edge Function принимает, считает и отдаёт datetime в UTC.

Frontend отображает даты и время в локальной timezone пользователя.

Frontend не должен отправлять `startedAt`, `createdAt`, `updatedAt` как источник истины. Серверное время фиксирует Edge Function или БД.

Countdown рассчитывается по абсолютному времени:

```txt
elapsed = Date.now() - new Date(startedAt).getTime()
```

---

## Supabase schema

Миграция находится в:

```txt
supabase/migrations/001_initial_schema.sql
```

Основные таблицы:

| Таблица | Назначение |
|---|---|
| `profiles` | профиль, роль и активность пользователя |
| `timers` | базовое серверное состояние таймеров |
| `user_pinned_timers` | персональные закрепления и порядок |
| `user_settings` | персональные глобальные настройки |
| `timer_user_settings` | персональные настройки конкретного таймера |
| `timer_logs` | лог серверных действий |

Основные enum-типы:

- `app_role`;
- `timer_status`;
- `timer_log_action`.

---

## RLS и доступ к данным

RLS включён на основных таблицах.

Принцип доступа:

```txt
Frontend Supabase client:
- может читать разрешённые данные;
- может работать со своими персональными настройками;
- не может напрямую менять общие таймеры.

Supabase Edge Function API:
- проверяет Bearer token;
- получает профиль и роль пользователя;
- выполняет глобальные mutations через service role client;
- пишет логи;
- работает с Storage.
```

Для `timers` прямой `INSERT/UPDATE/DELETE` из frontend запрещён RLS. Глобальные изменения должны идти через Supabase Edge Function API.

Для `timer_logs` прямой `INSERT` из frontend запрещён RLS. Логи серверных действий пишет Edge Function.

---

## Edge Function API

Основная Edge Function:

```txt
supabase/functions/api/index.ts
```

Production URL:

```txt
https://khyqmlngemhhvtaawcqz.supabase.co/functions/v1/api
```

Функция использует внутренний роутинг.

Реализованные endpoints:

Health/Auth:

- `GET /health`;
- `GET /me`.

Таймеры:

- `GET /timers`;
- `POST /timers`;
- `PATCH /timers/{timer_id}`;
- `DELETE /timers/{timer_id}`;
- `POST /timers/{timer_id}/restart`;
- `POST /timers/{timer_id}/stop`.

Принцип работы:

- публичный `/health` используется для проверки доступности функции;
- остальные endpoints требуют `Authorization: Bearer <access_token>`;
- пользователь проверяется через Supabase Auth;
- профиль и роль читаются из `profiles`;
- create/update/delete доступны только `admin` и `manager`;
- restart/stop доступны всем активным пользователям;
- mutations выполняются через service role client внутри Edge Function;
- create/update/delete/restart/stop пишут записи в `timer_logs`.

---

## API contracts

### `GET /me`

Возвращает текущего пользователя:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "admin",
  "is_active": true
}
```

### `GET /timers`

Возвращает список таймеров:

```json
[
  {
    "id": "uuid",
    "title": "Timer title",
    "description": "",
    "imageUrl": null,
    "durationSeconds": 300,
    "minDurationSeconds": null,
    "timeShiftSeconds": 0,
    "startedAt": "2026-06-03T17:18:28.340749+00:00",
    "lastRunBy": "uuid",
    "status": "active",
    "createdAt": "2026-06-03T17:18:28.340749+00:00",
    "updatedAt": "2026-06-03T17:18:28.340749+00:00",
    "soundEnabled": true
  }
]
```

### `POST /timers`

Создаёт таймер.

Доступно:

- `admin`;
- `manager`.

Тело запроса:

```json
{
  "title": "Timer title",
  "description": "",
  "imageUrl": null,
  "durationSeconds": 300,
  "minDurationSeconds": null,
  "timeShiftSeconds": 0,
  "soundEnabled": true
}
```

Пишет лог:

```txt
action = created
```

### `PATCH /timers/{timer_id}`

Редактирует таймер.

Доступно:

- `admin`;
- `manager`.

Тело запроса частичное:

```json
{
  "title": "Updated title",
  "durationSeconds": 360
}
```

Пишет лог:

```txt
action = updated
details.updatedFields = [...]
```

### `DELETE /timers/{timer_id}`

Удаляет таймер.

Доступно:

- `admin`;
- `manager`.

Пишет лог:

```txt
action = deleted
```

После удаления `timer_logs.timer_id` становится `null`, потому что FK настроен как `on delete set null`.

### `POST /timers/{timer_id}/restart`

Перезапускает таймер.

Доступно:

- `admin`;
- `manager`;
- `member`.

Тело запроса:

```json
{
  "timeShiftSeconds": 0
}
```

Сервер:

- устанавливает `status = active`;
- обновляет `started_at`;
- обновляет `time_shift_seconds`;
- обновляет `last_run_by`;
- пишет лог `restarted`.

### `POST /timers/{timer_id}/stop`

Останавливает таймер.

Доступно:

- `admin`;
- `manager`;
- `member`.

Сервер:

- устанавливает `status = stopped`;
- пишет лог `stopped`.

---

## Изображения

Изображения таймеров должны храниться в Supabase Storage bucket:

```txt
timer-images
```

В таблице `timers` хранится URL или путь изображения, а не сам файл.

Для MVP bucket сделан public.

Целевая загрузка изображений:

```txt
Frontend → Supabase Edge Function API → Supabase Storage → timers.image_url
```

Полноценная загрузка изображений ещё не подключена.

---

## Realtime

Realtime нужен для общих таймеров.

MVP-события:

- timer created;
- timer updated;
- timer restarted;
- timer stopped;
- timer deleted.

Realtime для закреплений и пользовательских настроек не обязателен, потому что это персональные данные.

Realtime-подписка на `timers` ещё не подключена.

---

## Планируемые API

Закрепления:

- `GET /me/pinned-timers`;
- `POST /me/pinned-timers`;
- `DELETE /me/pinned-timers/{timer_id}`;
- `PATCH /me/pinned-timers/reorder`.

Пользователи и логи:

- `GET /logs`;
- `GET /users`;
- `PATCH /users/{id}/role`;
- `PATCH /users/{id}/deactivate`.

---

## Текущие временные решения

- закрепления и порядок закреплённых таймеров пока в `localStorage`;
- настройки звука пока в `localStorage`;
- локальный `completed` остаётся frontend-only;
- загрузка изображений в Storage ещё не подключена;
- realtime-обновления таймеров ещё не подключены.