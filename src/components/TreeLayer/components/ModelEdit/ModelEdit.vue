<template>
  <div class="model-edit-container"
    ref="modelEditor"
  >
    <mapgis-ui-divider>属性变换</mapgis-ui-divider>
    <mapgis-ui-row type="flex">
      <mapgis-ui-col :span="3">
        <mapgis-ui-form-item label="" class="label-item">
          位置
        </mapgis-ui-form-item>
      </mapgis-ui-col>
      <mapgis-ui-col :span="3" class="icon-tool">
        <mapgis-ui-iconfont
          type="mapgis-moveto"
          @click="handleActiveTool('move')"
          :class="[activeTool==='move'?'active-tool':'']"
        />
      </mapgis-ui-col>         
      <mapgis-ui-col :span="6">
        <div>
          <div slot="label" style="line-height: 20px;font-size: 14px;width: 90%;">经度</div>
          <mapgis-ui-input-number
            v-model="coordinate.longitude"
            :min="0"
            :step="0.0001"
            style="width: 90%"
            @blur="handleEdit('moveTo')"
          />
        </div>
      </mapgis-ui-col>
      <mapgis-ui-col :span="6">
        <div>
          <div slot="label" style="line-height: 20px;font-size: 14px;width: 90%;">纬度</div>
          <mapgis-ui-input-number
            v-model="coordinate.latitude"
            :min="0"
            :step="0.0001"
            style="width: 90%"
            @blur="handleEdit('moveTo')"
          />
        </div>
      </mapgis-ui-col>
      <mapgis-ui-col :span="6">
        <div>
          <div slot="label" style="line-height: 20px;font-size: 14px;width: 90%;">高度</div>
          <mapgis-ui-input-number
            v-model="coordinate.height"
            :min="0"
            :step="0.0001"
            style="width: 90%"
            @blur="handleEdit('moveTo')"
          />
        </div>
      </mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row type="flex">
      <mapgis-ui-col :span="3">
        <mapgis-ui-form-item label="" class="label-item">
          旋转
        </mapgis-ui-form-item>
      </mapgis-ui-col>
      <mapgis-ui-col :span="3" class="icon-tool">
        <mapgis-ui-iconfont
          type="mapgis-rotate"
          @click="handleActiveTool('rotate')"
          :class="[activeTool==='rotate'?'active-tool':'']"
          style="color: #ff0000;"
        />
      </mapgis-ui-col>
      <mapgis-ui-col :span="6">
        <div>
          <div slot="label" style="line-height: 20px;font-size: 14px;">X</div>
          <mapgis-ui-input-number
            v-model="rotationOffset.x"
            :min="0"
            style="width: 90%"
            @blur="handleEdit('rotateTo')"
          />
        </div>
      </mapgis-ui-col>
      <mapgis-ui-col :span="6">
        <div>
          <div slot="label" style="line-height: 20px;font-size: 14px;">Y</div>
        <mapgis-ui-input-number
          v-model="rotationOffset.y"
          :min="0"
          style="width: 90%"
          @blur="handleEdit('rotateTo')"
        />
        </div>
      </mapgis-ui-col>
      <mapgis-ui-col :span="6">
        <div>
          <div slot="label" style="line-height: 20px;font-size: 14px;">Z</div>
          <mapgis-ui-input-number
            v-model="rotationOffset.z"
            :min="0"
            style="width: 90%"
            @blur="handleEdit('rotateTo')"
          />
        </div>
      </mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row type="flex">
      <mapgis-ui-col :span="3">
        <mapgis-ui-form-item label="" class="label-item">
          缩放
        </mapgis-ui-form-item>
      </mapgis-ui-col>
      <mapgis-ui-col :span="3" class="icon-tool">
        <mapgis-ui-iconfont
          type="mapgis-scale"
          @click="handleActiveTool('scale')"
          :class="[activeTool==='scale'?'active-tool':'']"
        />
      </mapgis-ui-col>
      <mapgis-ui-col :span="6">
        <div>
          <div slot="label" style="line-height: 20px;font-size: 14px;">X</div>
        <mapgis-ui-input-number
          v-model="scale.x"
          :min="0"
          style="width: 90%"
          @blur="handleEdit('zoomTo')"
        />
        </div>
      </mapgis-ui-col>
      <mapgis-ui-col :span="6">
        <div>
          <div slot="label" style="line-height: 20px;font-size: 14px;">Y</div>
        <mapgis-ui-input-number
          v-model="scale.y"
          :min="0"
          style="width: 90%"
          @blur="handleEdit('zoomTo')"
        />
        </div>
      </mapgis-ui-col>
      <mapgis-ui-col :span="6">
        <div>
          <div slot="label" style="line-height: 20px;font-size: 14px;">Z</div>
        <mapgis-ui-input-number
          v-model="scale.z"
          :min="0"
          style="width: 90%"
          @blur="handleEdit('zoomTo')"
        />
        </div>
      </mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-form
      layout="inline"
      labelAlign="left"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 10 }"
    >

    </mapgis-ui-form>
    <mapgis-ui-divider>
      矩阵变换
      <mapgis-ui-switch v-model="showMatrix" />
    </mapgis-ui-divider>
    <mapgis-ui-row v-show="showMatrix">
      <div>
        <div style="position: absolute;right: 6px;bottom: 0px;">
          <mapgis-ui-button class="edit-tool-button" style="z-index: 2;" @click="handelEditTransform">应用</mapgis-ui-button>
        </div>
      <mapgis-ui-textarea placeholder="矩阵" :rows="6" v-model="transformString"/>
    </div>
    </mapgis-ui-row>
    <mapgis-ui-divider v-show="showMatrix"></mapgis-ui-divider>
    <div>
      <mapgis-ui-button
        class="edit-tool-button"
        type="primary"
        @click="submit"
        style="width:48%;margin-right: 4%;"
      >
        保存设置
      </mapgis-ui-button>
      <mapgis-ui-button
        class="edit-tool-button"
        @click="handleReset"
        style="width:48%"
      >
        还原模型
      </mapgis-ui-button>
    </div>
    <div style="
        display: flex;
        justify-content: end;"
    >
      <mapgis-ui-button type="link" @click="share" v-show="showShareLink">应用于其它模型缓存子图层</mapgis-ui-button>
    </div>
    <mp-window-wrapper :visible="showSharePanel" v-if="showShareLink">
      <template v-slot:default="slotProps">
        <mp-window
          title="应用于其它模型缓存子图层"
          :width="320"
          :height="400"
          :shrinkAction="false"
          :fullScreenAction="false"
          :visible.sync="showSharePanel"
          :verticalOffset="52"
          :horizontalOffset="350"
          v-bind="slotProps"
        >
          <template>
            <mp-share-panel
              ref="sharePanel"
              :layerDocument.sync="document"
              :transformArray="transformArray"
              :layerObject="layer.layer"
              @save="save"
              @edit-model="editModel"
            >
            </mp-share-panel>
          </template>
        </mp-window>
      </template>
    </mp-window-wrapper>
  </div>
  
</template>
<script lang="ts">
import {
  WidgetMixin,
  AppMixin,
  LayerType,
} from '@mapgis/web-app-framework'
import ModelStretchUtil from '../../../ModelStretch/mixin/ModelStretchUtil.js'
import cloneDeep from 'lodash.clonedeep'
import MpSharePanel from './SharePanel.vue'

export default {
  name: 'MpModelEdit',
  components: { MpSharePanel },
  mixins: [WidgetMixin,AppMixin, ModelStretchUtil],
  props: ['layer','model','modelMetadata','modelMetadataList'],
  data() {
    return {
      isSave: false,
      // 模型元数据中心外包圆中心
      modelMetadataCenter:{
        longitude: undefined,
        latitude: undefined,
        height: undefined,
      },
      // 局部坐标系中心
      origin:{
        longitude: undefined,
        latitude: undefined,
        height: undefined,
      },
      // 模型外包圆中心平移到的位置
      coordinate: {
        longitude: undefined,
        latitude: undefined,
        height: undefined,
      },
      coordinateOffset: {
      },

      // 旋转相关参数
      rotate: {
        degree: undefined,
        axis: 'Z',
      },

      rotation:{
        x:0,
        y:0,
        z:0,
      },
      modelRotation: {
        x:undefined,
        y:undefined,
        z:undefined,
      },
      // 上一次旋转角度
      lastRotation:{
        x:0,
        y:0,
        z:0,
      },
      // 以模型初始位置角度为基准，旋转的角度
      rotationOffset:{
        x:0,
        y:0,
        z:0,
      },
      // 缩放相关参数
      scale: {
        x: 1,
        y: 1,
        z: 1,
      },
      // 模型旋转矩阵数组值
      transformArray:[
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        0,0,0,0
      ],
      // 模型旋转矩阵数组值的字符串，用于input框的数据绑定
      transformString:'',
      savedTransform:[],
      // 处于激活状态的编辑工具
      activeTool: undefined,
      showMatrix: false,
      showSharePanel: false,

      shareMode: 'normal',
    }
  },
  computed:{
    showShareLink() {
      if (this.layer && this.layer.type === LayerType.ModelCache) {
        return false
      }  else {
        return true
      }
    },
  },
  created() {},
  mounted(){
    // 获取图层属性中的变换矩阵。初始位置、旋转角度、缩放比例
    if (this.layer.layerProperty && this.layer.layerProperty.transform) {
      this.transformArray = this.layer.layerProperty.transform
    } else {
      this.transformArray = this.Cesium.Matrix4.toArray(this.model._root.transform)
    }
    this.Cesium.Matrix4.clone(this.transformArray, this.savedTransform) 
    this.transformString = this.transformArray.toString()
    this.getPropertiesByTransform(this.transformArray)
  },
  methods:{
    submit() {
      const modelsInfo = [
        {
          'layer': this.layer,
          'transform': this.model._root.transform
        }
      ]
      this.save(modelsInfo)
    },
    save(modelsInfo) {
      this.Cesium.Matrix4.clone(this.model._root.transform, this.savedTransform) 
      modelsInfo = modelsInfo || [
        {
          'layer': this.layer,
          'transform': this.model._root.transform
        }
      ]
      this.$emit('model-edit', 'save' ,modelsInfo)
    },
    handleEdit(type, model){
      if(this.activeTool){
        this.handleDeactivateTool()
      }
      if(!model){
        model = this.model
      }
      if(type === 'moveTo'){
        this.coordinateOffset = {
          longitude: this.coordinate.longitude - this.modelMetadataCenter.longitude,
          latitude: this.coordinate.latitude - this.modelMetadataCenter.latitude,
          height: this.coordinate.height - this.modelMetadataCenter.height,
        }
        this.origin = {
          longitude: this.metadataOrigin.longitude + this.coordinateOffset.longitude,
          latitude: this.metadataOrigin.latitude + this.coordinateOffset.latitude,
          height: this.metadataOrigin.height + this.coordinateOffset.height,
        }
        this.$emit('model-edit', type, {
          move: this.origin,
          model:model,
        })
      } else if(type === 'rotateTo'){
        const rotationChangeValue = {
          x: this.rotationOffset.x - this.lastRotation.x,
          y: this.rotationOffset.y - this.lastRotation.y,
          z: this.rotationOffset.z - this.lastRotation.z,
        }
        this.$emit('model-edit', type, {
          rotation: rotationChangeValue,
          model,
        })
        this.lastRotation = cloneDeep(this.rotationOffset)
      } else if(type === 'zoomTo'){
        this.$emit('model-edit', type, {
          scale: this.scale,
          model,
        })
      }
      
    },
    handleReset(){
      this.activeTool = undefined
      this.coordinate = cloneDeep(this.modelMetadataCenter)
      this.rotationOffset = {
        x:0,
        y:0,
        z:0,
      }
      this.scale = {
        x:1,
        y:1,
        z:1,
      }
      this.transformArray = this.Cesium.Matrix4.toArray(this.modelMetadata.transform)
      this.transformString = this.transformArray.toString()
      const transform = new this.Cesium.Matrix4()
      this.Cesium.Matrix4.clone(this.modelMetadata.transform, transform)     
      this.model._root.transform = transform
      this.$emit('model-edit', 'deactivate')
    },
    handleActiveTool(type){
      if (this.activeTool === type){
        // 如果当前处于激活的工具再次被点击，则取消工具激活
        this.handleDeactivateTool()
      } else {
        // 如果被点击的工具是未被激活状态，则激活工具
        this.activeTool = type
        if (type === 'move'){
          this.$emit('model-edit', 'move')
        } else if(type === 'rotate'){
          this.$emit('model-edit', 'rotate')
        } else if(type === 'scale'){
          this.$emit('model-edit', 'zoomSingle')
        } 
      }
    },
    handleDeactivateTool(){
      if(this.activeTool){
        this.activeTool = undefined
        this.$emit('model-edit', 'deactivate')
      }
    },
    getRotationMatrix(transformMat4){
      const rotateMat3 = new this.Cesium.Matrix3.fromArray([
        transformMat4[0]/this.scale.x, transformMat4[1]/this.scale.x, transformMat4[2]/this.scale.x,
        transformMat4[4]/this.scale.y, transformMat4[5]/this.scale.y, transformMat4[6]/this.scale.y,
        transformMat4[8]/this.scale.z, transformMat4[9]/this.scale.z, transformMat4[10]/this.scale.z
      ])
      const euler = this.rotationMatrixToEuler(rotateMat3)
      return euler
    },
    rotationMatrixToEuler(transformMat) {
      const heading = Math.atan2(transformMat[3], transformMat[0]);
      const pitch = Math.asin(-transformMat[6]);
      const roll = Math.atan2(transformMat[7], transformMat[8]);
      return {
        y: this.Cesium.Math.toDegrees(heading),
        x: this.Cesium.Math.toDegrees(pitch),
        z: this.Cesium.Math.toDegrees(roll)
      };
    },
    transformUpdate(value){
      if (value) {
        if (value.editorMode === 'translate') {
          this.coordinate = this.convertToDegree(value.modelPosition)
          // this.coordinateOffset = this.convertToDegree(value.offset)
          this.newOrigin = this.convertToDegree(value.originPosition)
          this.coordinateOffset = {
            longitude: this.newOrigin.longitude - this.origin.longitude,
            latitude: this.newOrigin.latitude - this.origin.latitude,
            height: this.newOrigin.height - this.origin.height
          }
        } else if (value.editorMode === 'rotate') {
          this.rotation = value.modelRotation
          this.lastRotation = cloneDeep(this.rotationOffset)
          this.rotationOffset = {
            x: this.Cesium.Math.toDegrees(this.rotation.x),
            y: this.Cesium.Math.toDegrees(this.rotation.y),
            z: this.Cesium.Math.toDegrees(this.rotation.z)
          }
        } else if (value.editorMode === 'scale') {
          this.scale = value.scale
        }
      }
      this.transformArray = this.Cesium.Matrix4.toArray(this.model._root.transform)
      this.transformString = this.transformArray.toString()
    },
    handelEditTransform(){
      this.transformArray = this.transformString.split(',')
      const transformMat4 = new this.Cesium.Matrix4.fromArray(this.transformArray)
      this.model._root.transform = transformMat4
      this.getPropertiesByTransform(transformMat4)
    },
    getPropertiesByTransform(transform){
      let transformMat4 = transform
      if (Array.isArray(transform) && transform.length === 16) {
        transformMat4 = new this.Cesium.Matrix4.fromArray(transform)
      }

      // 1.获取缩放量
      this.scale = this.Cesium.Matrix4.getScale(transformMat4, new this.Cesium.Cartesian3())
      
      // 2.获取旋转量
      if (!this.modelRotation || !this.modelRotation.x || !this.modelRotation.y || !this.modelRotation.z ) {
        // 2.1获取模型初始旋转角度
        // this.modelRotation = this.getRotationMatrix(this.modelMetadata.transform, new this.Cesium.Cartesian3())
        this.modelRotation = window.transformEditor.getEulerFromTransform(this.modelMetadata.transform, this.model)
      }
      // 2.2当前旋转角度
      // this.rotation = this.getRotationMatrix(transformMat4, new this.Cesium.Cartesian3())
      this.rotation = window.transformEditor.getEulerFromTransform(transformMat4, this.model)
      // 2.3旋转角度变化量
      this.rotationOffset = {
        x: this.rotation.x - this.modelRotation.x,
        y: this.rotation.y - this.modelRotation.y,
        z: this.rotation.z - this.modelRotation.z
      }
      this.lastRotation  = cloneDeep(this.rotationOffset)

      // 3.获取当前模型外包球中心的位置
      if (!this.modelMetadataCenter || !this.modelMetadataCenter.longitude || !this.modelMetadataCenter.latitude || !this.modelMetadataCenter.height) {
        // 3.1获取模型元数据外包球中心
        this.modelMetadataCenter = this.convertToDegree(this.modelMetadata.boundingSphereCenter)
      }
      if (!this.metadataOrigin || !this.metadataOrigin.longitude || !this.metadataOrigin.latitude || !this.metadataOrigin.height) {
        // 3.2获取元数据局部坐标系中心
        this.metadataOrigin = this.convertToDegree(this.Cesium.Matrix4.getTranslation(this.modelMetadata.transform, new this.Cesium.Cartesian3()))
      }
      // 3.3获取当前局部坐标系中心
      // this.metadataOrigin = this.convertToDegree(this.Cesium.Matrix4.getTranslation(transformMat4, new this.Cesium.Cartesian3()))
      this.origin = this.convertToDegree(this.Cesium.Matrix4.getTranslation(transformMat4, new this.Cesium.Cartesian3()))
      // 3.4获取局部坐标系中心变化量
      this.coordinateOffset = {
        longitude: this.origin.longitude - this.metadataOrigin.longitude,
        latitude: this.origin.latitude - this.metadataOrigin.latitude,
        height: this.origin.height - this.metadataOrigin.height,
      }
      // 3.5获取当前模型外包球中心的位置，该值等于模型元数据中心加上平移量
      this.coordinate = {
        longitude: this.modelMetadataCenter.longitude + this.coordinateOffset.longitude,
        latitude: this.modelMetadataCenter.latitude + this.coordinateOffset.latitude,
        height: this.modelMetadataCenter.height + this.coordinateOffset.height,
      }
    },
    share(){
      this.showSharePanel = !this.showSharePanel
    },
    editModel(model, layer){
      if(!model || !layer) return 
      const modelMetadata = this.getModelMetadata(layer.id)
      const metadataOrigin = this.convertToDegree(this.Cesium.Matrix4.getTranslation(modelMetadata.transform, new this.Cesium.Cartesian3()))
      // 同步平移
      const currentModelOrigin = this.convertToDegree(this.Cesium.Matrix4.getTranslation(this.savedTransform, new this.Cesium.Cartesian3()))
      const coordinateOffset = {
            longitude: currentModelOrigin.longitude - this.metadataOrigin.longitude,
            latitude: currentModelOrigin.latitude - this.metadataOrigin.latitude,
            height: currentModelOrigin.height - this.metadataOrigin.height
          }
      const origin = {
        longitude: metadataOrigin.longitude + coordinateOffset.longitude,
        latitude: metadataOrigin.latitude + coordinateOffset.latitude,
        height: metadataOrigin.height + coordinateOffset.height,
      }
      this.$emit('model-edit', 'moveTo', {
        move: origin,
        model:model,
      })
      // 同步旋转
      // 获取同步的旋转量
      const currentModelRotation = window.transformEditor.getEulerFromTransform(this.savedTransform, this.model)
      const rotationOffset = {
        x: currentModelRotation.x - this.modelRotation.x,
        y: currentModelRotation.y - this.modelRotation.y,
        z: currentModelRotation.z - this.modelRotation.z
      }
      // 获取需要同步模型的初始旋转角和当前旋转角
      const modelRotation = window.transformEditor.getEulerFromTransform(modelMetadata.transform, model)
      const rotation = window.transformEditor.getEulerFromTransform(layer.layerProperty.transform, model)
      const rotationChangeValue = {
        x: modelRotation.x - rotation.x + rotationOffset.x,
        y: modelRotation.y - rotation.y + rotationOffset.y,
        z: modelRotation.z - rotation.z + rotationOffset.z
      }
      this.$emit('model-edit', 'rotateTo', {
        rotation: rotationChangeValue,
        model,
      })
      // 同步缩放
      this.handleEdit('zoomTo', model)
    },
    getModelMetadata(layerId){
      return this.modelMetadataList.find(metadataItem=>metadataItem.layerId === layerId)
    },
    closeSharePanel(){
      this.showSharePanel = false
    },
    convertToDegree(cartesian3){
      const ellipsoid = this.viewer.scene.globe.ellipsoid;
      const radian = ellipsoid.cartesianToCartographic(cartesian3);
      return {
        longitude: this.Cesium.Math.toDegrees(radian.longitude),
        latitude: this.Cesium.Math.toDegrees(radian.latitude),
        height: radian.height,
      }
    },
    // 恢复未保存的数据
    resetUnsave(){
      const transform = new this.Cesium.Matrix4()
      this.Cesium.Matrix4.clone(this.savedTransform, transform)
      if(this.model._root && this.model._root.transform){
        this.model._root.transform = transform
      }
    }
  },

  // 组件销毁前还原模型
  beforeDestroy() {
    this.resetUnsave()
    this.closeSharePanel()
    this.$emit('model-edit', 'destroy', this.isSave)
  },
}
</script>
<style lang="less" scoped>
.model-edit-container {
  .mapgis-ui-form-item {
  margin-bottom: 6px;
  .mapgis-ui-form-item-label {
  line-height: 20px;
  }
  }
  .edit-tools {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    .edit-tool-button {
      margin-bottom: 6px;
    }
  }
  .edit-tool-button {
    margin-bottom: 6px;
  }
  
  .active-tool{
    box-shadow: 0 0 10px 2px #aed8ff;
    color: #aed8ff;
  }

  .label-item,.icon-tool{
    display: flex;
    text-align: center;
    align-items: center;
    padding-top: 14px;
    margin: 0;
    justify-content: center;
  }
}

</style>
