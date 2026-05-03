const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  space: false,
  shift: false,
  r: false,
  c: false,
  t: false
};

const onceKeys = {
  c: false,
  t: false,
  r: false
};

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === ' ') keys.space = true;
  if (keys.hasOwnProperty(key)) {
    keys[key] = true;
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key === ' ') keys.space = false;
  if (keys.hasOwnProperty(key)) {
    keys[key] = false;
    if (onceKeys.hasOwnProperty(key)) {
        onceKeys[key] = false;
    }
  }
});

export function getKeys() {
  return keys;
}

export function checkKeyOnce(key) {
    if (keys[key] && !onceKeys[key]) {
        onceKeys[key] = true;
        return true;
    }
    return false;
}

// Math utils
export function limit(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
