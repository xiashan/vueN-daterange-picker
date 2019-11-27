import Picker from '../picker';
import DateRangePanel from '../panel/DateRange';

const getPanel = function(type) {
  return DateRangePanel;
};

export default {
  mixins: [Picker],

  name: 'NoxDateRangePicker',

  props: {
    type: {
      type: String,
      default: 'daterange'
    },
    timeArrowControl: Boolean
  },

  watch: {
    type(type) {
      if (this.picker) {
        this.unmountPicker();
        this.panel = getPanel(type);
        this.mountPicker();
      } else {
        this.panel = getPanel(type);
      }
    }
  },

  created() {
    this.panel = getPanel(this.type);
  }
};
