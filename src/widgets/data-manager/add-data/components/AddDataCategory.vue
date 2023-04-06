<template>
  <mapgis-ui-modal
    title="添加数据分类"
    :visible="visible"
    :width="300"
    :mask="false"
    :ok-button-props="okButtonDisabled"
    @cancel="onAddCancel"
    @ok="onAddOk"
  >
    <div style="display: flex">
      <mapgis-ui-space direction="vertical" style="flex: 1">
        <mapgis-ui-row>
          <label>分类名称</label>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <mapgis-ui-input
            v-model="name"
            placeholder="分类名称"
          ></mapgis-ui-input>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <label>分类描述</label>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <mapgis-ui-input
            v-model="description"
            placeholder="分类描述"
          ></mapgis-ui-input>
        </mapgis-ui-row>
      </mapgis-ui-space>
    </div>
    <!-- <template slot="footer">
      <mapgis-ui-button key="Cancel" @click="onAddCancel">取消</mapgis-ui-button>
      <mapgis-ui-button
        key="Ok"
        type="primary"
        @click="onAddOk"
        :disabled="okButtonDisabled.disabled"
      >
        确定
      </mapgis-ui-button>
    </template> -->
  </mapgis-ui-modal>
</template>

<script lang="ts">
export default {
  name: 'AddDataCategory',
  props: {
    visible: { type: Boolean },
    categories: { type: Array },
  },

  data() {
    return {
      name: '',
      description: '',
    }
  },

  computed: {
    okButtonDisabled() {
      return {
        props: {
          disabled:
            !this.name.length ||
            this.categories.some((category) => category.name === this.name),
        },
      }
    },
  },

  methods: {
    onAddCancel() {
      this.$emit('finished')
    },

    onAddOk() {
      this.$emit('added', { name: this.name, description: this.description })
      this.$emit('finished')
      this.name = ''
      this.description = ''
    },
  },
}
</script>

<style></style>
