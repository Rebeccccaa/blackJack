// src/gameEngine.js

let uidCounter = 0;
function genUid() {
  return `c_${Date.now().toString(36)}_${uidCounter++}`;
}

// Создаём колоду
export function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  const deck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ rank, suit, uid: genUid() }); // uid сразу
    }
  }
  return shuffle(deck);
}

// Перемешивание Фишера–Йетса
function shuffle(array) {
  let m = array.length, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    [array[m], array[i]] = [array[i], array[m]];
  }
  return array;
}

// Раздаём начальные руки
export function dealInitialHands(deck) {
  const player = [deck[0], deck[2]];
  const dealer = [deck[1], deck[3]];
  const rest = deck.slice(4);
  return { player, dealer, rest };
}

// Тянем карту
export function drawCard(deck) {
  const card = deck[0];
  const rest = deck.slice(1);
  return { card, rest };
}

// Считаем стоимость руки
export function calculateHandValue(hand) {
  let total = 0;
  let aces = 0;

  for (let card of hand) {
    if (card.rank === "A") {
      aces += 1;
      total += 11;
    } else if (["K", "Q", "J"].includes(card.rank)) {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }

  // Если перебор и есть тузы — уменьшаем по 10
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}
