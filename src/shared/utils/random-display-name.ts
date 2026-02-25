export const NAME_PREFIXES = [
  'Темный',
  'Северный',
  'Ледяной',
  'Огненный',
  'Стальной',
  'Железный',
  'Скрытный',
  'Дикий',
  'Теневой',
  'Древний',
  'Алый',
  'Серебряный',
  'Золотой',
  'Мрачный',
  'Яростный',
  'Свирепый',
  'Безмолвный',
  'Грозный',
  'Пылающий',
  'Лунный',
  'Сумрачный',
  'Светлый',
  'Черный',
  'Белый',
  'Кровавый',
  'Гордый',
  'Холодный',
  'Стремительный',
  'Могучий',
  'Таинственный',
] as const

export const NAME_NOUNS = [
  'Волк',
  'Клинок',
  'Страж',
  'Феникс',
  'Дракон',
  'Ворон',
  'Охотник',
  'Воин',
  'Хранитель',
  'Повелитель',
  'Маг',
  'Титан',
  'Берсерк',
  'Странник',
  'Каратель',
  'Призрак',
  'Стрелок',
  'Разрушитель',
  'Кузнец',
  'Гром',
  'Буря',
  'Пламя',
  'Молния',
  'Шторм',
  'Легион',
  'Коготь',
  'Клык',
  'Щит',
  'Меч',
  'Стражник',
] as const

function randomIndex(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive)
}

export function generateRandomDisplayName(): string {
  const prefix = NAME_PREFIXES[randomIndex(NAME_PREFIXES.length)]
  const noun = NAME_NOUNS[randomIndex(NAME_NOUNS.length)]
  return `${prefix} ${noun}`
}
