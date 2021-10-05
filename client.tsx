import 'normalize.css';

import './style.css';

import { css } from '@linaria/core';
import { io } from 'socket.io-client';
import { render } from 'react-dom';
import { useEffect, useState } from 'react';

import iconFood from './food.png';
import iconMedical from './medical.png';
import iconPpe from './ppe.png';
import iconShelter from './shelter.png';
import iconTorch from './torch.png';
import iconWater from './water.png';

const socket = io(`http://localhost:13241`);

socket
  .on('connect', () => {
    console.log(`Connected to ${socket.id}`);
  })
  .on('disconnect', () => {
    console.log(`Disconnected from ${socket.id}`);
  });

function Alert({ earthquake }) {
  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        background: #b40a0a;
        color: #fff;
        text-align: center;
      `}
    >
      <div
        className={css`
          padding: 2rem;
        `}
      >
        <h2>Alert!</h2>
        <p>
          An earthquake with magnitude {earthquake.magnitude} has been recorded
          near {earthquake.place}
        </p>
      </div>
    </div>
  );
}

function Inventory({ inventory }) {
  return (
    <div
      className={css`
        display: grid;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        padding: 1rem;
        background: #eee;
        color: #fff;
        text-align: center;
        > div {
          min-height: 5rem;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          > div {
            margin-right: 1rem;
            > img {
              width: 100%;
            }
          }
        }
      `}
    >
      <div style={{ background: inventory.water ? '#0b943f' : '#b40a0a' }}>
        <div
          className={css`
            width: 4rem;
          `}
        >
          <img src={iconWater} />
        </div>
        <h4>Water</h4>
      </div>
      <div style={{ background: inventory.food ? '#0b943f' : '#b40a0a' }}>
        <div
          className={css`
            width: 5rem;
          `}
        >
          <img src={iconFood} />
        </div>
        <h4>Food</h4>
      </div>
      <div style={{ background: inventory.torch ? '#0b943f' : '#b40a0a' }}>
        <div
          className={css`
            width: 4rem;
          `}
        >
          <img src={iconTorch} />
        </div>
        <h4>Torch</h4>
      </div>
      <div style={{ background: inventory.shelter ? '#0b943f' : '#b40a0a' }}>
        <div
          className={css`
            width: 4rem;
          `}
        >
          <img src={iconShelter} />
        </div>
        <h4>Shelter</h4>
      </div>
      <div style={{ background: inventory.ppe ? '#0b943f' : '#b40a0a' }}>
        <div
          className={css`
            width: 5rem;
          `}
        >
          <img src={iconPpe} />
        </div>
        <h4>PPE</h4>
      </div>
      <div style={{ background: inventory.medical ? '#0b943f' : '#b40a0a' }}>
        <div
          className={css`
            width: 4rem;
          `}
        >
          <img src={iconMedical} />
        </div>
        <h4>Medical</h4>
      </div>
    </div>
  );
}

function App() {
  const [state, setState] = useState(() => ({
    earthquake: null,
    inventory: {
      water: false,
      food: false,
      torch: false,
      shelter: false,
      ppe: false,
      medical: false,
    },
  }));
  useEffect(() => {
    socket
      .on('earthquake', (val) =>
        setState((it) => ({ ...it, earthquake: JSON.parse(val) }))
      )
      .on('inventory', (val) =>
        setState((it) => ({ ...it, inventory: JSON.parse(val) }))
      );
  }, []);
  return state.earthquake ? (
    <Alert earthquake={state.earthquake} />
  ) : (
    <Inventory inventory={state.inventory} />
  );
}

render(<App />, document.getElementById('root'));
