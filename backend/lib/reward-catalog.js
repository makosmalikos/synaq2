// Prices are in SYNAQ coins. One verified XP earns one spendable coin;
// spending coins never lowers the student's XP level.
const REWARDS = Object.freeze([
  { id: 'book', price: 4500, value: '3 000 ₸', title: { ru: 'Книга на выбор', kk: 'Таңдаған кітабың' }, detail: { ru: 'Книга по выбору ребёнка стоимостью до 3 000 ₸', kk: 'Баланың таңдауы бойынша 3 000 ₸ дейінгі кітап' } },
  { id: 'steam', price: 6000, value: '$5', title: { ru: 'Steam', kk: 'Steam' }, detail: { ru: 'Цифровой подарочный сертификат Steam на $5', kk: 'Steam цифрлық сыйлық картасы — $5' } },
  { id: 'brawl', price: 7500, value: 'Pass', title: { ru: 'Brawl Pass', kk: 'Brawl Pass' }, detail: { ru: 'Подарочный Brawl Pass для аккаунта, которому разрешено получать подарки', kk: 'Сыйлық қабылдауға рұқсаты бар аккаунтқа Brawl Pass' } },
]);

const rewardById = (id) => REWARDS.find((reward) => reward.id === id);
const coinsEarned = (xp) => Math.max(0, Math.floor(Number(xp) || 0));
const coinBalance = (xp, spent) => Math.max(0, coinsEarned(xp) - Math.max(0, Math.floor(Number(spent) || 0)));

module.exports = { REWARDS, rewardById, coinsEarned, coinBalance };
