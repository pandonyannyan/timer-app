# Timer App (MVP)

## Описание

Веб-приложение для командной работы с таймерами.

Пользователи видят общий список таймеров, отслеживают обратный отсчёт и получают звуковые уведомления по истечению времени.

Приложение рассчитано на небольшую команду (до 50 пользователей) и использует только бесплатные сервисы.

---

## Технологический стек

### Frontend

* Vue 3
* Vite
* TypeScript
* Pinia
* Vue Router
* Supabase JS

### Backend

* Python (FastAPI)

### Инфраструктура

* Frontend: GitHub Pages
* Backend: Render (free tier)
* База данных + Auth + Storage: Supabase

---

## Роли пользователей

| Роль    | Доступ                                    |
| ------- | ----------------------------------------- |
| user    | Просмотр таймеров                         |
| manager | Просмотр таймеров + доступ к логам        |
| admin   | Полный доступ + управление пользователями |

---

## Страницы приложения

```text
/
/logs
/admin/users
```

* `/` — список таймеров
* `/logs` — лог действий (manager, admin)
* `/admin/users` — управление пользователями (admin)

Авторизация и формы — модальные окна.

---

## Модель таймера

### Параметры таймера

```text
title
description
image_url
duration_seconds
```

⚠️ Эти параметры **не изменяются при запуске**

---

## Перезапуск таймера с учётом сдвига

При запуске или перезапуске можно указать:

```text
time_shift_seconds (опционально)
```

### Формула отсчёта:

```text
effective_duration = duration_seconds - time_shift_seconds
```

Если сдвиг не указан:

```text
effective_duration = duration_seconds
```

### Ограничения

```text
time_shift_seconds >= 0
time_shift_seconds < duration_seconds
```

---

## Что хранится в БД

```text
duration_seconds
started_at
time_shift_seconds
status
```

---

## Расчёт времени на фронте

```text
remaining = (duration_seconds - time_shift_seconds) - (now - started_at)
```

---

## Статусы

### В БД

```text
active
stopped
```

### На фронте

```text
Активен
Остановлен
Сигнал
Завершён
```

---

## Локальные состояния

```text
signal      (runtime)
completed   (localStorage)
```

```text
completed_signal_timer_ids = []
```

---

## Поведение таймера

| Условие                                                               | Отображение         |
| --------------------------------------------------------------------- | ------------------- |
| status = active и remaining > 0                                       | Активен             |
| status = stopped                                                      | Остановлен          |
| status = active и remaining <= 0 и пользователь видел окончание       | Сигнал              |
| status = active и remaining <= 0 и пользователь открыл страницу позже | Завершён            |
| пользователь нажал "Завершить"                                        | Завершён (локально) |

---

## Действия с таймером

| Действие       | Условие      | Результат                                                                |
| -------------- | ------------ | ------------------------------------------------------------------------ |
| Перезапустить  | любой статус | status = active, started_at = now, time_shift задаётся                   |
| Остановить     | active       | status = stopped                                                         |
| Выключить звук | любой        | сохраняется персонально                                                  |
| Завершить      | signal       | локально отключает сигнал и переводит состояние из `Сигнал` в `Завершён` |

---

## Таблица `timers`

```text
id
title
description
image_url
duration_seconds
started_at
time_shift_seconds
status
created_by
updated_by
created_at
updated_at
```

---

## Пользовательские настройки

### `timer_user_settings`

```text
id
timer_id
user_id
sound_enabled
created_at
updated_at
```

### Правила

* Если записи нет → `sound_enabled = true`
* Настройки индивидуальны для каждого пользователя
* Не логируются

---

## Лог действий

### `timer_logs`

```text
id
timer_id
user_id
action
old_status
new_status
created_at
```

### Логируем

```text
created
updated
restarted
stopped
deleted
```

### Не логируем

```text
signal
completed
sound_enabled / disabled
```

---

## Realtime

```text
timer_created
timer_updated
timer_restarted
timer_stopped
timer_deleted
```

Frontend подписывается на изменения и обновляет список таймеров.

---

## Звуковое уведомление

Условия воспроизведения:

```text
remaining <= 0
status = active
sound_enabled = true
таймер не завершён локально
```

---

## API (Backend)

```text
GET    /timers
POST   /timers
PATCH  /timers/{id}
DELETE /timers/{id}

POST   /timers/{id}/restart   (body: time_shift_seconds)
POST   /timers/{id}/stop

GET    /logs

GET    /users
PATCH  /users/{id}/role
PATCH  /users/{id}/deactivate

POST   /timers/{id}/sound/enable
POST   /timers/{id}/sound/disable
```

---

## Архитектура

```text
Vue (GitHub Pages)
   ↓
Supabase Auth
   ↓
Supabase Realtime
   ↓
Supabase Postgres + Storage

FastAPI (Render)
   ↓
бизнес-логика + роли + логирование
```

---

## Ограничения MVP

* до 50 пользователей
* без сложных прав доступа
* без серверного таймера
* без push-уведомлений (только звук в браузере)

---

## Принципы

* минимальная сложность
* максимум логики на frontend
* минимум записей в БД
* отсутствие лишнего логирования
* неизменяемая базовая длительность таймера
* параметры запуска отделены от таймера
* бесплатная инфраструктура

---

## Следующие шаги

1. Инициализация репозитория
2. Поднятие frontend (Vue + Vite)
3. Подключение Supabase (Auth + DB + Realtime + Storage)
4. Реализация таблицы таймеров
5. Реализация локального таймера
6. Подключение realtime
7. Добавление backend (FastAPI)
8. Реализация ролей и логов