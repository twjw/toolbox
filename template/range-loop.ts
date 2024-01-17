const rangeLoopAsync = async <T>(
  list: T[] = [],
  range = 20,
  tap?: (rangeList: T[]) => Promise<void>
) => {
  if (!Array.isArray(list)) return;

  for (let i = 0; i < list.length; i += range) {
    const rangeList = list.slice(i, i + range);

    if (rangeList.length > 0) {
      tap && (await tap(rangeList));
    }
  }
};

const rangeLoop = <T>(
  list: T[] = [],
  range = 20,
  tap?: (rangeList: T[]) => void
) => {
  if (!Array.isArray(list)) return;

  for (let i = 0; i < list.length; i += range) {
    const rangeList = list.slice(i, i + range);

    if (rangeList.length > 0) {
      tap && tap(rangeList);
    }
  }
};

export { rangeLoop, rangeLoopAsync };
