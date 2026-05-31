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

- Python;
- FastAPI;
- Supabase Postgres;
- Supabase Auth;
- Supabase Storage;
- Supabase Realtime;
- GitHub Pages.

---

## Текущая схема приложения

```txt
```txt
Vue + Pinia
↓
Frontend service layer
↓
FastAPI для чтения таймеров, restart и stop
↓
Supabase Auth
Supabase Postgres
```

Временные frontend-only/localStorage части пока остаются для:
- добавления, редактирования и удаления таймеров;
- закреплений;
- пользовательских настроек звука;
- локального completed.

Целевая схема:

```txt
Vue + Pinia
↓
Frontend service layer
↓
FastAPI
↓
Supabase Auth
Supabase Postgres
Supabase Storage
Supabase Realtime
```

---

## Страницы

| Route | Статус | Назначение |
|---|---|---|
| `/` | реализовано | список таймеров, protected route |
| `/login` | реализовано | вход по email/password |
| `/login-test` | временно | диагностика Supabase Auth/RLS, удалить позже |
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

Проверки на frontend не считаются безопасностью. Для глобальных действий с таймерами проверки должны быть продублированы в FastAPI и RLS.

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

БД и backend работают с UTC.

Все даты в Supabase Postgres должны использовать `timestamptz`.

Backend принимает, считает и отдаёт datetime в UTC.

Frontend отображает даты и время в локальной timezone пользователя.

Frontend не должен отправлять `startedAt`, `createdAt`, `updatedAt` как источник истины. Серверное время фиксирует backend или БД.

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

FastAPI:
- выполняет глобальные mutations;
- проверяет роль;
- пишет логи;
- работает с Storage.
```

Для `timers` прямой `INSERT/UPDATE/DELETE` из frontend запрещён RLS. Глобальные изменения должны идти через FastAPI.

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
Frontend → FastAPI → Supabase Storage → timers.image_url
```

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

---

## Планируемый API

Health/Auth:

- `GET /health` — реализовано;
- `GET /me` — реализовано.

Таймеры:

- `GET /timers` — реализовано;
- `POST /timers/{timer_id}/restart` — реализовано;
- `POST /timers/{timer_id}/stop` — реализовано;
- `POST /timers` — план;
- `PATCH /timers/{timer_id}` — план;
- `DELETE /timers/{timer_id}` — план.

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

- добавление, редактирование и удаление таймеров пока остаются во временной frontend/mock-реализации;
- закрепления и порядок закреплённых таймеров пока в `localStorage`;
- настройки звука пока в `localStorage`;
- локальный `completed` остаётся frontend-only;
- `/login-test` временно оставлен для диагностики и должен быть удалён перед MVP.
