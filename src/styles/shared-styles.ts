import { css } from 'lit';

export const sharedStyles = css`
  :host {
    display: block;
    color: var(--text);
    font-family: var(--sans);
  }
  h1,
  h2,
  h3 {
    margin: 0;
  }
  .section-title {
    font: 700 15px var(--sans);
    letter-spacing: 0.01em;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .section-title .link {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--accent);
    cursor: pointer;
  }
  button.primary {
    font: 700 14px var(--sans);
    background: var(--accent);
    color: var(--accent-contrast);
    border: none;
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    cursor: pointer;
    letter-spacing: 0.01em;
  }
  button.primary:active {
    filter: brightness(0.94);
  }
  button.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  button.ghost {
    font: 600 13.5px var(--sans);
    background: transparent;
    color: var(--text-dim);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    cursor: pointer;
  }
  .price-row {
    display: flex;
    align-items: baseline;
    gap: 7px;
  }
  .price-row .now {
    font: 700 15px var(--sans);
    color: var(--text);
  }
  .price-row .mrp {
    font-size: 12.5px;
    color: var(--text-faint);
    text-decoration: line-through;
  }
  .price-row .off {
    font-size: 12px;
    font-weight: 700;
    color: var(--good);
  }
  .badge {
    font: 700 10.5px var(--sans);
    padding: 3px 7px;
    border-radius: 5px;
    background: var(--gold-soft);
    color: var(--gold);
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  .empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-faint);
  }
  .empty .icon {
    font-size: 40px;
    display: block;
    margin-bottom: 10px;
  }
  .empty p {
    margin: 4px 0 18px;
    font-size: 14px;
  }
`;
