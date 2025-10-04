// App.jsx
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

const DEAL_STEP_MS = 500;

function genUid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const [deck, setDeck] = useState(() => createDeck());
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);

  const [dealerHidden, setDealerHidden] = useState(true);
  const [inRound, setInRound] = useState(false);
  const [message, setMessage] = useState("");

  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(100);
  const [currentBet, setCurrentBet] = useState(0);

  const [hasDoubled, setHasDoubled] = useState(false);

  function ensureDeckLocal(d) {
    if (!d || d.length < 15) {
      return createDeck();
    }
    return d;
  }

  function isBlackjack(hand) {
    return hand.length === 2 && calculateHandValue(hand) === 21;
  }

  // Завершение раунда: дилер добирает карты с плавной анимацией
  async function finishRound(playerFinalHand, deckState, stakeOverride) {
    setDealerHidden(false);
    let rest = deckState ? [...deckState] : [...deck];
    let dealerFinal = [...dealerHand];

    while (
      calculateHandValue(dealerFinal) < 17 ||
      (calculateHandValue(dealerFinal) < calculateHandValue(playerFinalHand) &&
        calculateHandValue(playerFinalHand) <= 21)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      rest = ensureDeckLocal(rest);
      const { card, rest: newRest } = drawCard(rest);

      const cardWithUid = { ...card, uid: genUid(), isNew: true };
      dealerFinal.push(cardWithUid);
      setDealerHand([...dealerFinal]);
      setDeck([...newRest]);
      rest = newRest;

      // через 800ms снимаем флаг "isNew", чтобы анимация не повторялась
      setTimeout(() => {
        setDealerHand((prev) =>
          prev.map((c) =>
            c.uid === cardWithUid.uid ? { ...c, isNew: false } : c
          )
        );
      }, 800);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    const pv = calculateHandValue(playerFinalHand);
    const dv = calculateHandValue(dealerFinal);
    const stake = typeof stakeOverride === "number" ? stakeOverride : currentBet;

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

    let localDeck = ensureDeckLocal([...deck]);
    const { player, dealer, rest } = dealInitialHands(localDeck);

    const playerWithUid = player.map((c) => ({
      ...c,
      uid: genUid(),
      isNew: true,
    }));
    const dealerWithUid = dealer.map((c) => ({
      ...c,
      uid: genUid(),
      isNew: true,
    }));

    setPlayerHand(playerWithUid);
    setDealerHand(dealerWithUid);
    setDeck(rest);
    setDealerHidden(true);
    setInRound(true);
    setHasDoubled(false);
    setMessage("");

    setBalance((prev) => prev - bet);
    setCurrentBet(bet);

    // убираем "isNew" через время, чтобы анимация проигралась 1 раз
    [...playerWithUid, ...dealerWithUid].forEach((card, idx) => {
      setTimeout(() => {
        setPlayerHand((prev) =>
          prev.map((c) =>
            c.uid === card.uid ? { ...c, isNew: false } : c
          )
        );
        setDealerHand((prev) =>
          prev.map((c) =>
            c.uid === card.uid ? { ...c, isNew: false } : c
          )
        );
      }, DEAL_STEP_MS * (idx + 1));
    });

    // Проверка на Blackjack
    const pBJ = isBlackjack(playerWithUid);
    const dBJ = isBlackjack(dealerWithUid);

    if (pBJ || dBJ) {
      setDealerHidden(false);

      if (pBJ && !dBJ) {
        setMessage("Blackjack! Вы выиграли 3:2.");
        setBalance((prev) => prev + bet * 2.5);
      } else if (!pBJ && dBJ) {
        setMessage("Дилер имеет Blackjack. Вы проиграли.");
      } else {
        setMessage("Ничья: оба Blackjack.");
        setBalance((prev) => prev + bet);
      }
      setInRound(false);
    }
  };

  const hit = () => {
    if (!inRound) return;

    let localDeck = ensureDeckLocal([...deck]);
    const { card, rest } = drawCard(localDeck);

    const cardWithUid = { ...card, uid: genUid(), isNew: true };
    const newHand = [...playerHand, cardWithUid];
    setPlayerHand(newHand);
    setDeck(rest);

    setTimeout(() => {
      setPlayerHand((prev) =>
        prev.map((c) =>
          c.uid === cardWithUid.uid ? { ...c, isNew: false } : c
        )
      );
    }, 800);

    const pv = calculateHandValue(newHand);
    if (pv > 21) {
      setDealerHidden(false);
      setMessage("Перебор! Вы проиграли.");
      setInRound(false);
    }
  };

  const stand = () => {
    if (!inRound) return;
    finishRound(playerHand, deck);
  };

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

    const doubleBet = currentBet * 2;
    setBalance((prev) => prev - currentBet);
    setCurrentBet(doubleBet);
    setHasDoubled(true);

    let localDeck = ensureDeckLocal([...deck]);
    const { card, rest } = drawCard(localDeck);
    const cardWithUid = { ...card, uid: genUid(), isNew: true };
    const newHand = [...playerHand, cardWithUid];
    setPlayerHand(newHand);
    setDeck(rest);

    setTimeout(() => {
      setPlayerHand((prev) =>
        prev.map((c) =>
          c.uid === cardWithUid.uid ? { ...c, isNew: false } : c
        )
      );
    }, 800);

    const pv = calculateHandValue(newHand);
    if (pv > 21) {
      setDealerHidden(false);
      setMessage("Перебор после Double! Вы проиграли.");
      setInRound(false);
      return;
    }

    finishRound(newHand, rest, doubleBet);
  };

  const onNextRound = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setDealerHidden(true);
    setCurrentBet(0);
    setHasDoubled(false);
    setMessage("Нажмите «Раздать», чтобы начать следующий раунд.");
    setInRound(false);
  };

  const canDouble =
    inRound && playerHand.length === 2 && !hasDoubled && balance >= currentBet;

  const roundFinished =
    !inRound && (playerHand.length > 0 || dealerHand.length > 0);

  return (
    <div className="App">
      <h1>Blackjack</h1>

      <div className="meta" style={{ marginBottom: 12 }}>
        <div>
          Баланс: <strong>💰 {balance}</strong>
        </div>
        <div style={{ marginLeft: 16 }}>
          Текущая ставка: <strong>{currentBet}</strong>
        </div>
      </div>

      <Table
        dealerHand={dealerHand}
        playerHand={playerHand}
        dealerHidden={dealerHidden}
      />

      <div className="message" style={{ marginTop: 12 }}>
        {message}
      </div>

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
