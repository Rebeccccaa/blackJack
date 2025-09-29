// src/components/Table.jsx
import React, { useEffect, useState } from 'react';
import { calculateHandValue } from '../gameEngine';

export default function Table({ dealerHand = [], playerHand = [], dealerHidden = true }) {
  // Анимированное появление карт (по одной)
  const [shownDealer, setShownDealer] = useState([]);
  const [shownPlayer, setShownPlayer] = useState([]);

  // Анимация раздачи дилеру
  useEffect(() => {
    setShownDealer([]);
    if (!dealerHand.length) return;
    let i = 0;
    function showNext() {
      setShownDealer((prev) => dealerHand.slice(0, i + 1));
      i++;
      if (i < dealerHand.length) {
        setTimeout(showNext, 220);
      }
    }
    showNext();
    // eslint-disable-next-line
  }, [dealerHand]);

  // Анимация раздачи игроку
  useEffect(() => {
    setShownPlayer([]);
    if (!playerHand.length) return;
    let i = 0;
    function showNext() {
      setShownPlayer((prev) => playerHand.slice(0, i + 1));
      i++;
      if (i < playerHand.length) {
        setTimeout(showNext, 220);
      }
    }
    showNext();
    // eslint-disable-next-line
  }, [playerHand]);

  return (
    <div className="table">
      <div className="panel">
        <h3>Дилер {dealerHidden ? '(?)' : `(${calculateHandValue(dealerHand)})`}</h3>
        <div className="cards">
          {shownDealer.map((c, i) => {
            const isHidden = (i === 1 && dealerHidden);
            // Анимация только для последней карты
            const animate = i === shownDealer.length - 1;
            return (
              <div key={i} className={`card${animate ? ' card-animate' : ''}`}>
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
            const animate = i === shownPlayer.length - 1;
            return (
              <div key={i} className={`card${animate ? ' card-animate' : ''}`}>{`${c.rank}${c.suit}`}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
