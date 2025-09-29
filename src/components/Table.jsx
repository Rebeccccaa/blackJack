// src/components/Table.jsx
import React, { useEffect, useRef, useState } from 'react';
import { calculateHandValue } from '../gameEngine';

const STEP_MS = 420; // задержка между появлением карт

export default function Table({ dealerHand = [], playerHand = [], dealerHidden = true }) {
  const [shownDealer, setShownDealer] = useState([]);
  const [shownPlayer, setShownPlayer] = useState([]);

  // таймеры для очистки при обновлениях/анимациях
  const dealerTimers = useRef([]);
  const playerTimers = useRef([]);

  // очистка таймеров (утилита)
  const clearTimers = (timersRef) => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  };

  // ----- Dealer: добавляем только новые карты, не сбрасывая старые -----
  useEffect(() => {
    // сначала очистим предыдущие таймеры
    clearTimers(dealerTimers);

    // если нет карт — синхронизируем shownDealer (например, новый раунд)
    if (!dealerHand || dealerHand.length === 0) {
      setShownDealer([]);
      return;
    }

    // если реальная рука стала короче показанной (например, очистка), синхронизируем
    if (dealerHand.length < shownDealer.length) {
      setShownDealer(dealerHand.slice(0)); // либо [], если длина 0
      return;
    }

    // если новых карт нет — ничего не делаем
    if (dealerHand.length === shownDealer.length) return;

    // добавляем недостающие карты с задержкой
    const startIndex = shownDealer.length;
    for (let i = startIndex; i < dealerHand.length; i++) {
      // используем let i (блочная область) — индекс сохранится корректно
      const delay = (i - startIndex) * STEP_MS;
      const timerId = setTimeout(() => {
        // защитимся: карта может измениться между планированием и вызовом
        const card = dealerHand[i];
        if (!card) return;

        setShownDealer((prev) => {
          // защита от дублей (если кто-то уже вставил эту карту)
          if (prev.some((c) => c && c.uid && card.uid && c.uid === card.uid)) {
            return prev;
          }
          return [...prev, card];
        });
      }, delay);
      dealerTimers.current.push(timerId);
    }

    // очистка при unmount или при следующем эффекте
    return () => clearTimers(dealerTimers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealerHand]);

  // ----- Player: аналогично dealer -----
  useEffect(() => {
    clearTimers(playerTimers);

    if (!playerHand || playerHand.length === 0) {
      setShownPlayer([]);
      return;
    }

    if (playerHand.length < shownPlayer.length) {
      setShownPlayer(playerHand.slice(0));
      return;
    }

    if (playerHand.length === shownPlayer.length) return;

    const startIndex = shownPlayer.length;
    for (let i = startIndex; i < playerHand.length; i++) {
      const delay = (i - startIndex) * STEP_MS;
      const timerId = setTimeout(() => {
        const card = playerHand[i];
        if (!card) return;

        setShownPlayer((prev) => {
          if (prev.some((c) => c && c.uid && card.uid && c.uid === card.uid)) {
            return prev;
          }
          return [...prev, card];
        });
      }, delay);
      playerTimers.current.push(timerId);
    }

    return () => clearTimers(playerTimers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerHand]);

  // --- render ---
  return (
    <div className="table">
      <div className="panel">
        <h3>Дилер {dealerHidden ? '(?)' : `(${calculateHandValue(dealerHand)})`}</h3>
        <div className="cards">
          {shownDealer.map((c, i) => {
            if (!c) return null;
            // стабильный key: предпочитаем uid, иначе fallback
            const key = c.uid || `${c.rank}-${c.suit}-${i}`;
            const isHidden = i === 1 && dealerHidden;
            // анимировать только последнюю показанную карту (она же новая)
            const animate = i === shownDealer.length - 1;
            return (
              <div key={key} className={`card${animate ? ' card-animate' : ''}`}>
                {isHidden ? '🂠' : `${c.rank}${c.suit}`}
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h3>Игрок ({calculateHandValue(playerHand)})</h3>
        <div className="cards">
          {shownPlayer.map((c, i) => {
            if (!c) return null;
            const key = c.uid || `${c.rank}-${c.suit}-${i}`;
            const animate = i === shownPlayer.length - 1;
            return (
              <div key={key} className={`card${animate ? ' card-animate' : ''}`}>
                {`${c.rank}${c.suit}`}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
