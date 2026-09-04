export const PHIC_GROUPS = {
  FIRST_HALF: "first-half",
  SECOND_HALF: "second-half",
  EXCESS: "excess",
};

const SESSION_LIMIT = 6;

export const classifyPhicSessionDates = (dates = []) => {
  const monthCounts = new Map();

  return dates.map((value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { value, group: null };

    const half = date.getDate() <= 15 ? PHIC_GROUPS.FIRST_HALF : PHIC_GROUPS.SECOND_HALF;
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const counts = monthCounts.get(monthKey) || { firstHalf: 0, secondHalf: 0 };
    let group = half;

    if (half === PHIC_GROUPS.FIRST_HALF) {
      if (counts.firstHalf < SESSION_LIMIT) counts.firstHalf += 1;
      else if (counts.secondHalf < SESSION_LIMIT) {
        counts.secondHalf += 1;
        group = PHIC_GROUPS.SECOND_HALF;
      } else group = PHIC_GROUPS.EXCESS;
    } else if (counts.secondHalf < SESSION_LIMIT) counts.secondHalf += 1;
    else group = PHIC_GROUPS.EXCESS;

    monthCounts.set(monthKey, counts);

    return {
      value,
      group,
    };
  });
};
