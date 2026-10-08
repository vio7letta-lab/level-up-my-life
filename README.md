# LEVEL UP: MY LIFE

RPG, где игровой мир — моя реальная жизнь.

**Real action → Game progress → Real life result.**
Прогресс в игре даёт только зафиксированный реальный результат, а не нажатие кнопки.

🔗 Игра: https://vio7letta-lab.github.io/level-up-my-life/

## Стек

React + TypeScript + Vite + Tailwind CSS v4. Без backend: данные хранятся в браузере
(через `StorageAdapter`, чтобы позже подключить аккаунт и облачную синхронизацию).

## Запуск

```bash
npm install
npm run dev        # локально: http://localhost:5173
npm run build      # проверка типов + сборка в dist/
npm run preview    # посмотреть собранную версию
```

## Деплой

Каждый push в `main` или рабочую ветку автоматически публикует игру на GitHub Pages
(`.github/workflows/deploy.yml`).

## Структура

```
src/
  app/          тема, навигация, настройки интерфейса
  components/   базовые UI-компоненты (Card, ProgressBar, BottomNav…)
  config/       характеристики, уровни, награды — всё, что легко менять
  screens/      Home, Goals, Quests, Stats, Character, Welcome
  types/        модель данных игры
  storage/      StorageAdapter (localStorage сейчас, облако позже)
  generators/   QuestGenerator (шаблоны сейчас, ИИ позже)
```

## На iPhone

Открыть ссылку в Safari → «Поделиться» → «На экран „Домой“».
