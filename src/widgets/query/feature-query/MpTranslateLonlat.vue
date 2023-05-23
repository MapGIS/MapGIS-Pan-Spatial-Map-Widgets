<template>
  <div class="translateLonlat">
    <mapgis-ui-input
      class="input-lonlat"
      size="small"
      :disabled="unenable"
      :max-length="type == 'longitude' ? 3 : 2"
      v-model="coordinate.degree"
      onkeyup="value=value.replace(/[^\d\.]/g,'').replace(/^[^\d]/g,'').replace('.','$#$').replace(/\./g,'').replace('$#$','.')"
      ref="inputlonlat"
    >
    </mapgis-ui-input
    >°
    <mapgis-ui-input
      class="input-lonlat"
      size="small"
      :disabled="unenable"
      v-model="coordinate.min"
      onkeyup="value=value.replace(/[^\d\.]/g,'').replace(/^[^\d]/g,'').replace('.','$#$').replace(/\./g,'').replace('$#$','.')"
    >
    </mapgis-ui-input
    >′
    <mapgis-ui-input
      class="input-lonlat"
      size="small"
      :disabled="unenable"
      v-model="coordinate.sec"
      onkeyup="value=value.replace(/[^\d\.]/g,'').replace(/^[^\d]/g,'').replace('.','$#$').replace(/\./g,'').replace('$#$','.')"
    >
    </mapgis-ui-input
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
      // debugger
      const _this = this
      _this.coordinate.degree = str.replace(/[^\d]$/, '')
      if (_this.coordinate.degree > 180 && _this.type == 'longitude')
        _this.coordinate.degree = 180
      if (_this.coordinate.degree > 90 && _this.type == 'latitude')
        _this.coordinate.degree = 90
      _this.$emit('getLonlat', _this.getLonlat())
    },
    'coordinate.min'(str) {
      const _this = this
      _this.coordinate.min = str.replace(/[^\d]$/, '')
      if (_this.coordinate.min > 60) _this.coordinate.min = 59
      _this.$emit('getLonlat', _this.getLonlat())
    },
    'coordinate.sec'(str) {
      const _this = this
      this.coordinate.sec = str.replace(/[^\d]$/, '')
      if (_this.coordinate.sec > 60) _this.coordinate.sec = 59
      _this.$emit('getLonlat', _this.getLonlat())
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
