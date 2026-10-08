import type { Area, Goal, QuestTemplate } from '../types'

export const AREAS: { key: Area; emoji: string; label: string }[] = [
  { key: 'work', emoji: '💰', label: 'Деньги / работа' },
  { key: 'study', emoji: '🎓', label: 'Учёба' },
  { key: 'content', emoji: '📱', label: 'Контент / личный бренд' },
  { key: 'energy', emoji: '💃', label: 'Энергия / движение' },
  { key: 'social', emoji: '🤝', label: 'Социальные действия' },
]

export const areaDef = (a: Area) => AREAS.find((x) => x.key === a)!

/** Стартовые цели. createdAt подставляется при создании состояния. */
export const SEED_GOALS: Omit<Goal, 'createdAt'>[] = [
  {
    id: 'goal-income',
    title: 'Зарабатывать 100 000 ₽/месяц',
    emoji: '💰',
    outcome: 'Стабильный доход 100 000 ₽ в месяц от своей работы',
    stat: 'finance',
    metric: { source: 'income', unit: '₽', target: 100000 },
    milestones: [
      { id: 'm-inc-1', title: 'Первый доход', targetValue: 1 },
      { id: 'm-inc-10', title: '10 000 ₽ за месяц', targetValue: 10000 },
      { id: 'm-inc-30', title: '30 000 ₽ за месяц', targetValue: 30000 },
      { id: 'm-inc-50', title: '50 000 ₽ за месяц', targetValue: 50000 },
      { id: 'm-inc-75', title: '75 000 ₽ за месяц', targetValue: 75000 },
      { id: 'm-inc-100', title: '100 000 ₽ за месяц', targetValue: 100000 },
    ],
  },
  {
    id: 'goal-manager',
    title: 'Стать сильным менеджером блогеров',
    emoji: '💼',
    outcome: 'Свои клиенты, уверенные переговоры и закрытые сделки',
    stat: 'career',
    metric: { source: 'quests', unit: 'рабочих действий', target: 100 },
    milestones: [
      { id: 'm-man-10', title: '10 рабочих действий', targetValue: 10 },
      { id: 'm-man-25', title: '25 рабочих действий', targetValue: 25 },
      { id: 'm-man-50', title: '50 рабочих действий', targetValue: 50 },
      { id: 'm-man-100', title: '100 рабочих действий', targetValue: 100 },
    ],
  },
  {
    id: 'goal-brand',
    title: 'Развить личный бренд и блог',
    emoji: '📱',
    outcome: 'Регулярный контент и растущая аудитория',
    stat: 'media',
    metric: { source: 'quests', unit: 'контент-действий', target: 60 },
    milestones: [
      { id: 'm-br-1', title: 'Первое контент-действие', targetValue: 1 },
      { id: 'm-br-15', title: '15 контент-действий', targetValue: 15 },
      { id: 'm-br-30', title: '30 контент-действий', targetValue: 30 },
      { id: 'm-br-60', title: '60 контент-действий', targetValue: 60 },
    ],
  },
  {
    id: 'goal-uni',
    title: 'Успешно закончить университет',
    emoji: '🎓',
    outcome: 'Закрытые сессии и диплом без авралов',
    stat: 'knowledge',
    metric: { source: 'quests', unit: 'учебных блоков', target: 100 },
    milestones: [
      { id: 'm-uni-10', title: '10 учебных блоков', targetValue: 10 },
      { id: 'm-uni-30', title: '30 учебных блоков', targetValue: 30 },
      { id: 'm-uni-60', title: '60 учебных блоков', targetValue: 60 },
      { id: 'm-uni-100', title: '100 учебных блоков', targetValue: 100 },
    ],
  },
  {
    id: 'goal-dance',
    title: 'Развиваться в танцах',
    emoji: '💃',
    outcome: 'Регулярные тренировки и заметный прогресс в движении',
    stat: 'energy',
    metric: { source: 'quests', unit: 'тренировок', target: 50 },
    milestones: [
      { id: 'm-dn-5', title: '5 тренировок', targetValue: 5 },
      { id: 'm-dn-15', title: '15 тренировок', targetValue: 15 },
      { id: 'm-dn-30', title: '30 тренировок', targetValue: 30 },
      { id: 'm-dn-50', title: '50 тренировок', targetValue: 50 },
    ],
  },
]

const t = (
  id: string,
  area: Area,
  kind: QuestTemplate['kind'],
  title: string,
  description: string,
  stat: QuestTemplate['stat'],
  difficulty: QuestTemplate['difficulty'],
  goalId?: string,
): QuestTemplate => ({ id, area, kind, title, description, stat, difficulty, goalId, active: true })

/**
 * Шаблоны квестов. Только реальные, проверяемые действия с понятным результатом.
 * Каждый день из каждого направления берётся один шаблон (по кругу).
 */
export const SEED_TEMPLATES: QuestTemplate[] = [
  // 💰 Деньги / работа
  t('t-leads', 'work', 'daily', 'Найти 5 потенциальных клиентов', 'Бренды или блогеры, с которыми реально можно работать. Сохрани список с контактами.', 'career', 'normal', 'goal-manager'),
  t('t-offers', 'work', 'daily', 'Отправить 3 предложения клиентам', 'Конкретное предложение: что ты делаешь, для кого и какой результат. Не шаблон «давайте сотрудничать».', 'finance', 'hard', 'goal-income'),
  t('t-followup', 'work', 'daily', 'Сделать 3 follow-up', 'Напомни о себе тем, кто не ответил. Коротко и по делу.', 'career', 'normal', 'goal-manager'),
  t('t-skill', 'work', 'daily', '30 минут прокачки навыка продаж', 'Разбор кейса, урок или скрипт переговоров. Запиши один вывод.', 'career', 'normal', 'goal-manager'),

  // 🎓 Учёба
  t('t-study40', 'study', 'daily', 'Учебный блок 40 минут', 'Таймер на 40 минут, телефон в другой комнате. Одна тема — до конца.', 'knowledge', 'normal', 'goal-uni'),
  t('t-study-task', 'study', 'daily', 'Закрыть одно учебное задание', 'Конкретная работа, конспект или задача, которую можно сдать.', 'knowledge', 'hard', 'goal-uni'),
  t('t-review', 'study', 'daily', 'Повторить материал 20 минут', 'Пройди по конспекту и ответь себе на 3 вопроса без подсказок.', 'knowledge', 'tiny', 'goal-uni'),

  // 📱 Контент
  t('t-post', 'content', 'daily', 'Опубликовать 1 пост или сторис', 'Опубликовано — значит засчитано. Неидеально лучше, чем в черновиках.', 'media', 'normal', 'goal-brand'),
  t('t-ideas', 'content', 'daily', 'Придумать 3 идеи для контента', 'Запиши их в заметки: тема, формат, первая фраза.', 'media', 'tiny', 'goal-brand'),
  t('t-reels', 'content', 'daily', 'Снять и смонтировать короткое видео', 'Reels / Shorts до 30 секунд. Можно выложить завтра.', 'media', 'hard', 'goal-brand'),

  // 💃 Энергия
  t('t-move30', 'energy', 'daily', '30 минут движения', 'Прогулка, растяжка, зал — любое движение, которое поднимает энергию.', 'energy', 'normal', 'goal-dance'),
  t('t-dance', 'energy', 'daily', 'Танцевальная тренировка', 'Класс, отработка связки или фристайл под 5 треков.', 'energy', 'hard', 'goal-dance'),
  t('t-walk', 'energy', 'daily', 'Прогулка 7 000 шагов', 'Можно совместить с подкастом по продажам или учёбе.', 'energy', 'tiny', 'goal-dance'),

  // 🤝 Социальные действия
  t('t-net', 'social', 'daily', 'Написать одному человеку из индустрии', 'Блогер, менеджер, маркетолог. Искренний комментарий или вопрос, без продажи.', 'social', 'normal'),
  t('t-call', 'social', 'daily', 'Созвониться или встретиться с кем-то', 'Живой разговор: коллега, друг, потенциальный партнёр.', 'social', 'normal'),
  t('t-event', 'social', 'daily', 'Найти мероприятие или комьюнити', 'Митап, чат, вечеринка индустрии. Запишись или вступи.', 'social', 'tiny'),

  // ⚔️ Главные квесты
  t('m-offers5', 'work', 'main', 'Отправить 5 коммерческих предложений брендам', 'Пять персональных предложений. Каждое — с понятной выгодой для бренда.', 'career', 'big', 'goal-manager'),
  t('m-negotiate', 'work', 'main', 'Провести переговоры с потенциальным клиентом', 'Созвон или переписка до конкретного следующего шага: цена, дата, решение.', 'finance', 'big', 'goal-income'),
  t('m-content-plan', 'content', 'main', 'Сделать контент-план на неделю и снять 2 единицы', 'План на 7 дней + 2 готовых материала в запасе.', 'media', 'big', 'goal-brand'),
  t('m-study-deep', 'study', 'main', 'Глубокая учёба: 2 блока по 45 минут', 'Самая важная учебная задача недели. Два блока с перерывом.', 'knowledge', 'big', 'goal-uni'),
  t('m-portfolio', 'work', 'main', 'Собрать кейс или портфолио для клиентов', 'Одна страница: что умеешь, примеры, результаты, контакты.', 'career', 'big', 'goal-manager'),
]
