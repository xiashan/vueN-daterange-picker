export const PLACEMENT_MAP = {
  left: 'bottom-start',
  center: 'bottom',
  right: 'bottom-end'
};

export const PICKER_OPTIONS = {
  shortcuts: [
    { text: 'Today', value: '0d' },
    { text: 'Yesterday', value: '-1d' },
    { text: 'Last 3 Days', value: '-3d' },
    { text: 'Last 7 Days', value: '-7d' },
    { text: 'Last 14 Days', value: '-14d' },
    { text: 'Last 30 Days', value: '-30d' },
    { text: 'Last 90 Days', value: '-90d' },
    { text: 'Last 180 Days', value: '-180d' },
    { text: 'Last Week', value: '-1w' },
    { text: 'This Month', value: '0m' },
    { text: 'Last Month', value: '-1m' }
  ]
};

export const DEFAULT_FORMATS = {
  daterange: 'yyyy-MM-dd',
  date: 'yyyy-MM-dd',
  datetime: 'yyyy-MM-dd HH:mm:ss'
};

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const WEEKS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
