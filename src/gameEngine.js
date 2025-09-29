// src/gameEngine.js

// Создание колоды (52 карты)
export function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = [
    "A", "2", "3", "4", "5", "6", "7",
    "8", "9", "10", "J", "Q", "K"
  ];
  let deck = [];

  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  // тасуем колоду
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// Подсчёт значения руки
export function calculateHandValue(hand) {
  let value = 0;
  let aces = 0;

  for (let card of hand) {
    if (card.rank === "A") {
      value += 11;
      aces += 1;
    } else if (["K", "Q", "J"].includes(card.rank)) {
      value += 10;
    } else {
      value += Number(card.rank);
    }
  }

  // Корректировка тузов (A = 1 вместо 11 при переборе)
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }

  return value;
}

// Вытянуть карту
export function drawCard(deck) {
  const card = deck[0];
  const rest = deck.slice(1);
  return { card, rest };
}

// Раздача начальных карт
export function dealInitialHands(deck) {
  const player = [deck[0], deck[2]];
  const dealer = [deck[1], deck[3]];
  const rest = deck.slice(4);
  return { player, dealer, rest };
}
