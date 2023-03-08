<template>
  <mapgis-ui-form :label-col="{ span: 7 }" :wrapper-col="{ span: 17 }">
    <mapgis-ui-form-item label="分析模式">
      <mapgis-ui-radio-group
        :value="value.analyTp"
        @change="(val) => valueChange('analyTp', val.target.value)"
      >
        <mapgis-ui-radio value="UserMode"> 用户模式 </mapgis-ui-radio>
        <mapgis-ui-radio value="SystemMode"> 系统模式 </mapgis-ui-radio>
      </mapgis-ui-radio-group>
    </mapgis-ui-form-item>
    <mapgis-ui-form-item label="分析半径">
      <mapgis-ui-input
        :value="`${value.nearDis}`"
        @change="(val) => valueChange('nearDis', val.target.value)"
      />
    </mapgis-ui-form-item>
    <mapgis-ui-form-item label="结点网络权值">
      <mapgis-ui-select
        :value="value.wid1"
        :options="options"
        @change="(val) => valueChange('wid1', 'Weight1')"
      />
    </mapgis-ui-form-item>
    <mapgis-ui-form-item label="边线元素网络权值">
      <mapgis-ui-select
        :value="value.wid2"
        :options="options"
        @change="(val) => valueChange('wid2', 'Weight1')"
      />
    </mapgis-ui-form-item>
    <mapgis-ui-form-item label="边线逆向网络权值">
      <mapgis-ui-select
        :value="value.wid3"
        :options="options"
        @change="(val) => valueChange('wid3', 'Weight1')"
      />
    </mapgis-ui-form-item>
  </mapgis-ui-form>
</template>
<script>
import { Vue, Prop, Component, Watch } from 'vue-property-decorator'

@Component({ name: 'Setting' })
export default class Setting extends Vue {
  @Prop({ type: Object }) value

  options = [
    { value: 'Weight1', label: '缺省网络权值' },
    // { value: '2', label: '顺距离' },
    // { value: '3', label: '逆距离' },
    // { value: '4', label: '顺时' },
    // { value: '5', label: '逆时' }
  ]

  valueChange(key, val) {
    const { value } = this
    value[key] = val
    this.$emit('input', value)
  }
}
</script>
<style lang="less" scoped>
.form-card-container {
  display: flex;
  flex-direction: column;
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  & > label {
    height: 40px;
    background-color: #dcdcdc;
    line-height: 40px;
    padding: 0 10px;
  }
}
</style>
