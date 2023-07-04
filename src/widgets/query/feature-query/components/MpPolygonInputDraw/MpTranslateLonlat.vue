<template>
  <div class="translateLonlat">
    <mapgis-ui-input-number
      class="input-lonlat"
      size="small"
      :disabled="unenable"
      :max="type == 'longitude' ? 180 : 90"
      :min="type == 'longitude' ? -180 : -90"
      :precision="0"
      v-model="coordinate.degree"
      ref="inputlonlat"
    >
    </mapgis-ui-input-number
    >°
    <mapgis-ui-input-number
      class="input-lonlat"
      size="small"
      :min="0"
      :max="60"
      :precision="0"
      :disabled="unenable"
      v-model="coordinate.min"
    >
    </mapgis-ui-input-number
    >′
    <mapgis-ui-input-number
      class="input-lonlat"
      size="small"
      :min="0"
      :max="60"
      :disabled="unenable"
      v-model="coordinate.sec"
    >
    </mapgis-ui-input-number
    >″
  </div>
</template>

<script>
export default {
  name: 'MpTranslateLonlat',
  // props:['lonlat','unenable'],
  props: {
    lonlat: [Number, String],
    unenable: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: 'longitude',
    },
  },
  data() {
    return {
      coordinate: {
        degree: '',
        min: '',
        sec: '',
      },
      active: false,
    }
  },
  watch: {
    'coordinate.degree': function (str) {
      this.$emit('getLonlat', this.getLonlat())
    },
    'coordinate.min'(str) {
      this.$emit('getLonlat', this.getLonlat())
    },
    'coordinate.sec'(str) {
      this.$emit('getLonlat', this.getLonlat())
    },
  },
  methods: {
    cacuLonLat(a) {
      const degree = Math.floor(a)
      const min = parseInt((a - degree) * 60)
      const sec = Math.round(parseInt((a - degree) * 3600) - parseInt(min * 60))
      this.coordinate.degree = degree.toString()
      this.coordinate.min = min.toString()
      this.coordinate.sec = sec.toString()
    },
    getLonlat() {
      const _this = this
      let lonlat = 0
      // eslint-disable-next-line
      if (!!_this.coordinate.degree) {
        // eslint-disable-next-line
        lonlat = Number(lonlat + _this.coordinate.degree + '.0')
      }
      // eslint-disable-next-line
      if (!!_this.coordinate.min) {
        // eslint-disable-next-line
        lonlat = lonlat + Number(_this.coordinate.min / 60)
      }
      // eslint-disable-next-line
      if (!!_this.coordinate.sec) {
        // eslint-disable-next-line
        lonlat = lonlat + Number(_this.coordinate.sec / 3600)
      }
      // console.log(lonlat);
      return Number(lonlat.toFixed(5))
    },

    // 清空
    clear() {
      this.coordinate = {
        degree: '',
        min: '',
        sec: '',
      }
    },
    updataFn() {
      // eslint-disable-next-line
      if (!!this.lonlat) {
        this.cacuLonLat(this.lonlat)
      }
    },
  },
  mounted() {
    //  debugger
    // eslint-disable-next-line
    if (!!this.lonlat) {
      this.cacuLonLat(this.lonlat)
    }
  },
}
</script>

<style lang="scss" scoped>
.translateLonlat {
  // min-width: 238px;
  padding-bottom: 2px;
  ::v-deep .input-lonlat {
    width: 30%;
    border-top: none;
    border-right: none;
    border-left: none;
  }
}
</style>
