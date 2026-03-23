export type BoardGridPoint = {
  row: number;
  col: number;
};

export function getTileGridPoint(index: number): BoardGridPoint {
  if (index <= 10) {
    return { row: 10, col: 10 - index };
  }

  if (index <= 20) {
    return { row: 20 - index, col: 0 };
  }

  if (index <= 30) {
    return { row: 0, col: index - 20 };
  }

  return { row: index - 30, col: 10 };
}
