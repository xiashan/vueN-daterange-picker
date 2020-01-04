export const isDateObject = function(val) {
  return val instanceof Date;
};

export const clearTime = function(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const nextDate = function(date, amount = 1) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
};

export const prevDate = function(date, amount = 1) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - amount);
};

export const getStartDateOfMonth = function(year, month) {
  const result = new Date(year, month, 1);
  const day = result.getDay();

  if (day === 0) {
    return prevDate(result, 7);
  }
  return prevDate(result, day);
};

export const getDayCountOfMonth = function(year, month) {
  if (month === 3 || month === 5 || month === 8 || month === 10) {
    return 30;
  }

  if (month === 1) {
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
      return 29;
    }
    return 28;
  }

  return 31;
};

export const getFirstDayOfMonth = function(date) {
  const temp = new Date(date.getTime());
  temp.setDate(1);
  return temp.getDay();
};

// 将日期类型转化成字符串, 忽略时分秒
export const formatDate = function(date, format = 'yyyy-MM-dd') {
  if (!isDateObject(date)) {
    return '';
  }

  function pad(number) {
    let r = String(number);
    if (r.length === 1) {
      r = '0' + r;
    }
    return r;
  }
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  return format
    .replace(/yyyy/g, year)
    .replace(/MM/g, month)
    .replace(/dd/g, day);
};

function compile(format) {
  const re = /([A-Za-z])\1*|./g;
  let keys,
      pattern = [format];

  format = format.replace(
    /\[[^\[\]]*]|\[.*\][^\[]*\]/g,
    (str) => str.replace(/./g, ' ').slice(2));
  while ((keys = re.exec(format))) {
    pattern[pattern.length] = keys[0];
  }
  return pattern;
}

function exec(re, str) {
   var result = (re.exec(str) || [''])[0];
   return {
     value: result | 0,
     length: result.length
   };
}

// 将字符串转化成中国标准时间, 忽略时分秒，默认00:00:00
export const parseDate = function(dateString, format = 'yyyy-MM-dd') {
  const parser = {
    'yyyy': function (str) { return exec(/^\d{4}/, str); },
    'MM': function (str) { return exec(/^\d\d/, str); },
    'dd': function (str) { return exec(/^\d\d/, str); }
  };
  const pattern = typeof format === 'string' ? compile(format) : format;
  let token,
    result,
    offset = 0,
    dt = { y: 1970, M: 1, d: 1, H: 0, m: 0, s: 0 };

  for (let i = 1, len = pattern.length; i < len; i++) {
    token = pattern[i];
    if (parser[token]) {
      result = parser[token](dateString.slice(offset), pattern[0]);
      if (result.length) {
        offset += result.length;
        dt[token.charAt(0)] = result.value;
        dt._match++;
      }
    } else if (token === dateString.charAt(offset) || token === ' ') {
      offset++;
    }
  }
  dt.M -= dt.Y < 100 ? 22801 : 1;
  return new Date(dt.y, dt.M, dt.d, dt.H, dt.m, dt.s);
};

export const modifyDate = function(date, y, m, d) {
  return new Date(
    y,
    m,
    d,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
};

export const changeYearMonthAndClampDate = function(date, year, month) {
  // clamp date to the number of days in `year`, `month`
  // eg: (2010-1-31, 2010, 2) => 2010-2-28
  const monthDate = Math.min(date.getDate(), getDayCountOfMonth(year, month));
  return modifyDate(date, year, month, monthDate);
};

export const prevYear = function(date, amount = 1) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return changeYearMonthAndClampDate(date, year - amount, month);
};

export const nextYear = function(date, amount = 1) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return changeYearMonthAndClampDate(date, year + amount, month);
};

export const prevMonth = function(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return month === 0
    ? changeYearMonthAndClampDate(date, year - 1, 11)
    : changeYearMonthAndClampDate(date, year, month - 1);
};

export const nextMonth = function(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return month === 11
    ? changeYearMonthAndClampDate(date, year + 1, 0)
    : changeYearMonthAndClampDate(date, year, month + 1);
};

export const merge = function(target) {
  for (let i = 1, j = arguments.length; i < j; i++) {
    let source = arguments[i] || {};
    for (let prop in source) {
      // eslint-disable-next-line no-prototype-builtins
      if (source.hasOwnProperty(prop)) {
        let value = source[prop];
        if (value !== undefined) {
          target[prop] = value;
        }
      }
    }
  }

  return target;
};

/*
 * Considers:
 *   1. Date object
 *   2. date string
 *   3. array of 1 or 2
 */
export const valueEquals = function(a, b) {
  // considers Date object and string
  const dateEquals = function(a, b) {
    const aIsDate = a instanceof Date;
    const bIsDate = b instanceof Date;
    if (aIsDate && bIsDate) {
      return a.getTime() === b.getTime();
    }
    if (!aIsDate && !bIsDate) {
      return a === b;
    }
    return false;
  };

  const aIsArray = a instanceof Array;
  const bIsArray = b instanceof Array;
  if (aIsArray && bIsArray) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => dateEquals(item, b[index]));
  }
  if (!aIsArray && !bIsArray) {
    return dateEquals(a, b);
  }
  return false;
};

function isString(val) {
  return typeof val === 'string' || val instanceof String;
}

export const validator = function(val) {
  // either: String, Array of String, null / undefined
  return (
    val === null ||
    val === undefined ||
    isString(val) ||
    (Array.isArray(val) && val.length === 2 && val.every(isString))
  );
};
