// src/App.jsx
import React, { useState } from "react";
import Controls from "./components/Controls";
import Table from "./components/Table";
import {
  createDeck,
  dealInitialHands,
  calculateHandValue,
  drawCard,
} from "./gameEngine";
import "./App.css";

/**
 * App — главный компонент игры Blackjack.
 * Корректно управляет колодой, руками игрока/дилера, ставкой, Double и Stand.
 */

export default function App() {
  // Инициализация колоды один раз при монтировании
  const [deck, setDeck] = useState(() => createDeck());

  // Руки
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);

  // UI / игровой статус
  const [dealerHidden, setDealerHidden] = useState(true); // true — вторая карта дилера скрыта
  const [inRound, setInRound] = useState(false);
  const [message, setMessage] = useState("");

  // Финансы
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(100);
  const [currentBet, setCurrentBet] = useState(0);

  // Double
  const [hasDoubled, setHasDoubled] = useState(false);

  // ----- Вспомогательные функции -----

  // Если колода маленькая — пересоздаём (reshuffle)
  function ensureDeckLocal(d) {
    if (!d || d.length < 15) {
      const nd = createDeck();
      return nd;
    }
    return d;
  }

  // Проверка на натуральный Blackjack (две карты = 21)
  function isBlackjack(hand) {
    return hand.length === 2 && calculateHandValue(hand) === 21;
  }

  // Завершение раунда: дилер добирает, считаем результат и обновляем баланс (с анимацией)
  async function finishRound(playerFinalHand, deckState, stakeOverride) {
    setDealerHidden(false);
    let rest = deckState ? [...deckState] : [...deck];
    let dealerFinal = [...dealerHand];

    // Анимированный добор дилера
    while (calculateHandValue(dealerFinal) < 17) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      rest = ensureDeckLocal(rest);
      const { card, rest: newRest } = drawCard(rest);
      dealerFinal.push(card);
      rest = newRest;
      setDealerHand([...dealerFinal]);
      setDeck([...rest]);
    }

    // Ждём, чтобы последняя карта "дошла"
    await new Promise((resolve) => setTimeout(resolve, 400));

    const pv = calculateHandValue(playerFinalHand);
    const dv = calculateHandValue(dealerFinal);
    const stake = typeof stakeOverride === 'number' ? stakeOverride : currentBet;

    if (pv > 21) {
      setMessage("Перебор! Вы проиграли.");
    } else if (dv > 21) {
      setMessage(`Дилер перебрал — вы выиграли! +${stake}`);
      setBalance((prev) => prev + stake * 2);
    } else if (pv > dv) {
      setMessage("Вы выиграли!");
      setBalance((prev) => prev + stake * 2);
    } else if (pv < dv) {
      setMessage("Вы проиграли.");
    } else {
      setMessage("Ничья (push). Ставка возвращена.");
      setBalance((prev) => prev + stake);
    }
    setInRound(false);
  }

  // ----- Действия игрока -----

  // Раздать
  const deal = () => {
    if (inRound) return;
    if (bet <= 0) {
      setMessage("Ставка должна быть положительной.");
      return;
    }
    if (balance < bet) {
      setMessage("Недостаточно средств для ставки.");
      return;
    }

    // Если в колоде мало карт — пересобираем
    let localDeck = ensureDeckLocal([...deck]);

    // Раздача первых карт (функция возвращает player, dealer, rest)
    const { player, dealer, rest } = dealInitialHands(localDeck);

    setPlayerHand(player);
    setDealerHand(dealer);
    setDeck(rest);
    setDealerHidden(true);
    setInRound(true);
    setHasDoubled(false);
    setMessage("");

    // Списываем первоначальную ставку
    setBalance((prev) => prev - bet);
    setCurrentBet(bet);

    // Проверка на Blackjack сразу после раздачи
    const pBJ = isBlackjack(player);
    const dBJ = isBlackjack(dealer);

    if (pBJ || dBJ) {
      // Открываем карту дилера
      setDealerHidden(false);

      if (pBJ && !dBJ) {
        // Выигрыш 3:2 — вернуть 2.5 * bet (учитывая, что bet уже списан)
        setMessage("Blackjack! Вы выиграли 3:2.");
        setBalance((prev) => prev + bet * 2.5);
      } else if (!pBJ && dBJ) {
        setMessage("Дилер имеет Blackjack. Вы проиграли.");
        // ставка удерживается
      } else {
        // Оба — Blackjack => push, вернуть ставку
        setMessage("Ничья: оба Blackjack.");
        setBalance((prev) => prev + bet);
      }
      setInRound(false);
    }
  };

  // Hit — взять карту
  const hit = () => {
    if (!inRound) return;

    let localDeck = ensureDeckLocal([...deck]);
    const { card, rest } = drawCard(localDeck);

    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(rest);

    const pv = calculateHandValue(newHand);
    if (pv > 21) {
      // Игрок перебрал — раскрываем дилера и завершаем
      setDealerHidden(false);
      setMessage("Перебор! Вы проиграли.");
      setInRound(false);
    }
  };

  // Stand — игрок завершает ход; дилер добирает и считаем результат
  const stand = () => {
    if (!inRound) return;
    finishRound(playerHand, deck);
  };

  // Double Down — удвоить ставку, получить одну карту и закончить ход
  const doubleDown = () => {
    if (!inRound) return;
    if (hasDoubled) return;
    if (playerHand.length !== 2) {
      setMessage("Double доступен только на первых двух картах.");
      return;
    }
    if (balance < currentBet) {
      setMessage("Недостаточно средств для удвоения ставки.");
      return;
    }

    // вычисляем новую ставку ДО обновления стейта
    const doubleBet = currentBet * 2;
    setBalance((prev) => prev - currentBet);
    setCurrentBet(doubleBet);
    setHasDoubled(true);

    // даём ровно одну карту
    let localDeck = ensureDeckLocal([...deck]);
    const { card, rest } = drawCard(localDeck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(rest);

    const pv = calculateHandValue(newHand);
    if (pv > 21) {
      setDealerHidden(false);
      setMessage("Перебор после Double! Вы проиграли.");
      setInRound(false);
      return;
    }

    // иначе дилер играет и раунд завершается, явно передаём doubleBet
    finishRound(newHand, rest, doubleBet);
  };

  // Новый раунд — сброс поля (оставляем баланс)
  const onNextRound = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setDealerHidden(true);
    setCurrentBet(0);
    setHasDoubled(false);
    setMessage("Нажмите «Раздать», чтобы начать следующий раунд.");
    setInRound(false);
  };

  // ----- Вычисления для UI -----
  const canDouble =
    inRound &&
    playerHand.length === 2 &&
    !hasDoubled &&
    balance >= currentBet;

  const roundFinished = !inRound && (playerHand.length > 0 || dealerHand.length > 0);

  return (
    <div className="App">
      <h1>Blackjack</h1>

      <div className="meta" style={{ marginBottom: 12 }}>
        <div>Баланс: <strong>💰 {balance}</strong></div>
        <div style={{ marginLeft: 16 }}>Текущая ставка: <strong>{currentBet}</strong></div>
      </div>

      <Table dealerHand={dealerHand} playerHand={playerHand} dealerHidden={dealerHidden} />

      <div className="message" style={{ marginTop: 12 }}>{message}</div>

      <Controls
        balance={balance}
        bet={bet}
        setBet={setBet}
        inRound={inRound}
        onDeal={deal}
        onHit={hit}
        onStand={stand}
        onDouble={doubleDown}
        canDouble={canDouble}
        roundFinished={roundFinished}
        onNextRound={onNextRound}
      />
    </div>
  );
}
