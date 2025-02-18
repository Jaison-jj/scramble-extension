const mapId = new Set();
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const LENGTH = 16;

export function createId() {
  let id = '';
  let i = 0;
  while (i < LENGTH) {
    id = id + LETTERS[Math.floor(Math.random() * LETTERS.length)];
    i++;
  }
  if (!mapId.has(id)) {
    mapId.add(id);
    return id;
  }

  return createId();
}

export function toNumber(val) {
  return Number(val) || 0;
}
