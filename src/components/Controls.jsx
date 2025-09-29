// src/components/Controls.jsx
import React from 'react';

export default function Controls({
  balance,
  bet,
  setBet,
  inRound,
  onDeal,
  onHit,
  onStand,
  onDouble,
  canDouble,
  roundFinished,
  onNextRound
}) {
  return (
    <div className="controls">
      {/* Поле для ставки показываем только если:
          - нет активного раунда
          - и раунд ещё не завершён (т.е. можно поставить и начать новый) */}
      {!inRound && !roundFinished && (
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>
            Ставка:
            <input
              type="number"
              value={bet}
              min="1"
              onChange={(e) => setBet(Number(e.target.value))}
              disabled={inRound}
              style={{ marginLeft: 8, width: 100 }}
            />
          </label>
          <span className="small">Баланс: {balance}</span>
        </div>
      )}

      {/* Кнопки */}
      <div
        className="buttons"
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
      >
        {/* Раздать — если можно начать раунд */}
        {!inRound && !roundFinished && (
          <button onClick={onDeal} disabled={balance < bet} aria-label="deal">
            Раздать
          </button>
        )}

        {/* Новый раунд — если предыдущий завершён */}
        {!inRound && roundFinished && (
          <button onClick={onNextRound} aria-label="new-round">
            Новый раунд
          </button>
        )}

        {/* Во время раунда — Hit, Double, Stand */}
        {inRound && (
          <>
            <button onClick={onHit} aria-label="hit">Hit</button>

            <button onClick={onDouble} disabled={!canDouble} aria-label="double">
              Double
            </button>

            <button onClick={onStand} aria-label="stand">Stand</button>
          </>
        )}
      </div>
    </div>
  );
}
