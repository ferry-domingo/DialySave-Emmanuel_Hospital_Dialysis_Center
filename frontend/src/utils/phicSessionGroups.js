export const PHIC_GROUPS = {
  FIRST_HALF: "first-half",
  SECOND_HALF: "second-half",
  EXCESS: "excess",
};

export const classifyPhicSessionDates = (dates = []) => {
  const groupCounts = new Map();

  return dates.map((value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { value, group: null };

    const half = date.getDate() <= 15 ? PHIC_GROUPS.FIRST_HALF : PHIC_GROUPS.SECOND_HALF;
    const key = `${date.getFullYear()}-${date.getMonth()}-${half}`;
    const count = (groupCounts.get(key) || 0) + 1;
    groupCounts.set(key, count);

    return {
      value,
      group: count > 6 ? PHIC_GROUPS.EXCESS : half,
    };
  });
};
