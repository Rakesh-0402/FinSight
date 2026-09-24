export const getDateRange = (range,customRange = null) => {
  const now = new Date();

  const formatDate = (date) => {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  let start = null;
  let end = null;

  switch (range) {
    case "this-month":
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );
      end = now;
      break;

    case "last-month":
      start = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

      end = new Date(
        now.getFullYear(),
        now.getMonth(),
        0
      );
      break;

    case "last-3-months":
      start = new Date(
        now.getFullYear(),
        now.getMonth() - 2,
        1
      );
      end = now;
      break;

    case "last-6-months":
      start = new Date(
        now.getFullYear(),
        now.getMonth() - 5,
        1
      );
      end = now;
      break;

    case "this-year":
      start = new Date(
        now.getFullYear(),
        0,
        1
      );
      end = now;
      break;

    case "last-year":
      start = new Date(
        now.getFullYear() - 1,
        0,
        1
      );
      end = new Date(
        now.getFullYear() - 1,
        11,
        31
      );
      break;

    case "custom":
      if (!customRange?.from ||!customRange?.to) {
        return null;
      }

      return {
        startDate:formatDate(customRange.from),
        endDate:formatDate(customRange.to),
      };

    default:return null;
  }

  return {
    startDate:formatDate(start),

    endDate:formatDate(end),
  };
};