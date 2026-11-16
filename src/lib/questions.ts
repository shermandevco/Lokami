import { getLang } from './i18n'
import { diffDays } from './dates'
/** Same order in every language. Lighter questions first; the daily pick walks the list, so depth grows over time. */
const Q: [string, string, string][] = [
  ['Що сьогодні тебе порадувало?', 'What made you smile today?', 'Co cię dziś ucieszyło?'],
  ['Яку їжу ти міг би їсти щодня?', 'What food could you eat every day?', 'Jakie jedzenie mógłbyś jeść codziennie?'],
  ['Куди б ти поїхав на вихідні, якби все було оплачено?', 'Where would you go for a weekend if everything was paid for?', 'Gdzie pojechałbyś na weekend, gdyby wszystko było opłacone?'],
  ['Яка пісня зараз найкраще описує твій настрій?', 'Which song best describes your mood right now?', 'Jaka piosenka najlepiej opisuje teraz twój nastrój?'],
  ['Що маленьке я можу зробити, щоб твій тиждень був кращим?', 'What small thing could I do to make your week better?', 'Jaką drobną rzecz mogę zrobić, żeby twój tydzień był lepszy?'],
  ['Який твій найкращий спогад цього місяця?', 'What is your best memory from this month?', 'Jakie jest twoje najlepsze wspomnienie z tego miesiąca?'],
  ['Чого ти хотів би навчитися цього року?', 'What would you like to learn this year?', 'Czego chciałbyś się nauczyć w tym roku?'],
  ['Що ти цінуєш у наших буднях?', 'What do you value in our ordinary days?', 'Co cenisz w naszej codzienności?'],
  ['Який ідеальний ледачий день для тебе?', 'What is your perfect lazy day?', 'Jak wygląda twój idealny leniwy dzień?'],
  ['Що тебе останнім часом втомлює найбільше?', 'What has been tiring you the most lately?', 'Co ostatnio najbardziej cię męczy?'],
  ['За що ти мені вдячний цього тижня?', 'What are you grateful to me for this week?', 'Za co jesteś mi wdzięczny w tym tygodniu?'],
  ['Яку традицію ти хотів би, щоб у нас була?', 'What tradition would you like us to have?', 'Jaką tradycję chciałbyś, żebyśmy mieli?'],
  ['Коли ти востаннє відчував себе по-справжньому вільним?', 'When did you last feel truly free?', 'Kiedy ostatnio czułeś się naprawdę wolny?'],
  ['Що з дитинства ти досі носиш у собі?', 'What from your childhood do you still carry with you?', 'Co z dzieciństwa wciąż w sobie nosisz?'],
  ['Яка моя звичка тебе тихо смішить?', 'Which of my habits quietly makes you laugh?', 'Który mój nawyk po cichu cię rozśmiesza?'],
  ['Про що ти мрієш, але рідко говориш вголос?', 'What do you dream about but rarely say out loud?', 'O czym marzysz, ale rzadko mówisz na głos?'],
  ['Як ти зрозумієш, що тебе по-справжньому почули?', 'How do you know you have really been heard?', 'Po czym poznajesz, że naprawdę cię wysłuchano?'],
  ['Що для тебе означає дім?', 'What does home mean to you?', 'Czym jest dla ciebie dom?'],
  ['Чого ти боїшся у майбутньому і що допомагає з цим жити?', 'What do you fear about the future, and what helps you live with it?', 'Czego boisz się w przyszłości i co pomaga ci z tym żyć?'],
  ['Яка розмова змінила твоє життя?', 'Which conversation changed your life?', 'Która rozmowa zmieniła twoje życie?'],
  ['Що я роблю, від чого ти відчуваєш себе коханим?', 'What do I do that makes you feel loved?', 'Co robię, że czujesz się kochany?'],
  ['У чому ми з тобою виросли разом?', 'In what ways have we grown together?', 'W czym razem dojrzeliśmy?'],
  ['Яке рішення ти досі обдумуєш?', 'Which decision are you still thinking over?', 'Nad jaką decyzją wciąż się zastanawiasz?'],
  ['Яким ти бачиш наш звичайний день через п’ять років?', 'How do you picture an ordinary day for us in five years?', 'Jak widzisz nasz zwykły dzień za pięć lat?'],
  ['Що тобі важко попросити в мене?', 'What is hard for you to ask me for?', 'O co trudno ci mnie poprosić?'],
  ['Коли ти пишався собою останнім часом?', 'When were you proud of yourself recently?', 'Kiedy ostatnio byłeś z siebie dumny?'],
  ['Що б ти хотів, щоб я знав про тебе краще?', 'What would you like me to know about you better?', 'Co chciałbyś, żebym lepiej o tobie wiedział?'],
  ['Яка наша сварка чогось тебе навчила?', 'Which of our disagreements taught you something?', 'Której naszej kłótni coś cię nauczyła?'],
  ['Що для тебе найважливіше у дружбі й близькості?', 'What matters most to you in friendship and closeness?', 'Co jest dla ciebie najważniejsze w przyjaźni i bliskości?'],
  ['Що ти хочеш сказати мені сьогодні, але ще не сказав?', 'What do you want to tell me today that you have not said yet?', 'Co chcesz mi dziś powiedzieć, a jeszcze nie powiedziałeś?'],
]
export const QUESTIONS = Q.length
/** Question number for a given day in a space: walks the list from the space start, offset by the space id so groups differ. */
export function questionFor(spaceId: string, day: string, since: string): number {
  const seed = [...spaceId].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const n = diffDays(since || '2026-01-01', day)
  return ((n % Q.length) + Q.length + seed) % Q.length
}
export const questionText = (q: number) => Q[((q % Q.length) + Q.length) % Q.length][getLang()]
