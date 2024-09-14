<template>
  <div class="model-edit-container"
    ref="modelEditor"
  >
    <a-divider>属性变换</a-divider>
    <a-row type="flex">
      <a-col :span="3">
        <mapgis-ui-form-item label="" class="label-item">
          位置
        </mapgis-ui-form-item>
      </a-col>
      <a-col :span="3" class="icon-tool">
        <mapgis-ui-iconfont
          type="mapgis-moveto"
          @click="handleActiveTool('move')"
          :class="[activeTool==='move'?'active-tool':'']"
        />
      </a-col>         
      <a-col :span="6">
        <mapgis-form-model-item>
          <div slot="label" style="line-height: 20px;font-size: 14px;width: 90%;">经度</div>
          <mapgis-ui-input-number
            v-model="coordinate.longitude"
            :min="0"
            :step="0.0001"
            style="width: 90%"
            @blur="handleEdit('moveTo')"
          />
        </mapgis-form-model-item>
      </a-col>
      <a-col :span="6">
        <mapgis-form-model-item>
          <div slot="label" style="line-height: 20px;font-size: 14px;width: 90%;">纬度</div>
          <mapgis-ui-input-number
            v-model="coordinate.latitude"
            :min="0"
            :step="0.0001"
            style="width: 90%"
            @blur="handleEdit('moveTo')"
          />
        </mapgis-form-model-item>
      </a-col>
      <a-col :span="6">
        <mapgis-form-model-item label="高度">
          <div slot="label" style="line-height: 20px;font-size: 14px;width: 90%;">高度</div>
          <mapgis-ui-input-number
            v-model="coordinate.height"
            :min="0"
            :step="0.0001"
            style="width: 90%"
            @blur="handleEdit('moveTo')"
          />
        </mapgis-form-model-item>
      </a-col>
    </a-row>
    <a-row type="flex">
      <a-col :span="3">
        <mapgis-ui-form-item label="" class="label-item">
          旋转
        </mapgis-ui-form-item>
      </a-col>
      <a-col :span="3" class="icon-tool">
        <mapgis-ui-iconfont
          type="mapgis-rotate"
          @click="handleActiveTool('rotate')"
          :class="[activeTool==='rotate'?'active-tool':'']"
        />
      </a-col>
      <a-col :span="6">
        <mapgis-form-model-item label="X">
          <div slot="label" style="line-height: 20px;font-size: 14px;">X</div>
          <mapgis-ui-input-number
            v-model="rotationOffset.x"
            :min="0"
            style="width: 90%"
            @blur="handleEdit('rotateTo')"
          />
        </mapgis-form-model-item>
      </a-col>
      <a-col :span="6">
        <mapgis-form-model-item label="Y">
          <div slot="label" style="line-height: 20px;font-size: 14px;">Y</div>
        <mapgis-ui-input-number
          v-model="rotationOffset.y"
          :min="0"
          style="width: 90%"
          @blur="handleEdit('rotateTo')"
        />
        </mapgis-form-model-item>
      </a-col>
      <a-col :span="6">
        <mapgis-form-model-item label="Z">
          <div slot="label" style="line-height: 20px;font-size: 14px;">Z</div>
          <mapgis-ui-input-number
            v-model="rotationOffset.z"
            :min="0"
            style="width: 90%"
            @blur="handleEdit('rotateTo')"
          />
        </mapgis-form-model-item>
      </a-col>
    </a-row>
    <a-row type="flex">
      <a-col :span="3">
        <mapgis-ui-form-item label="" class="label-item">
          缩放
        </mapgis-ui-form-item>
      </a-col>
      <a-col :span="3" class="icon-tool">
        <mapgis-ui-iconfont
          type="mapgis-scale"
          @click="handleActiveTool('scale')"
          :class="[activeTool==='scale'?'active-tool':'']"
        />
      </a-col>
      <a-col :span="6">
        <mapgis-form-model-item label="X">
          <div slot="label" style="line-height: 20px;font-size: 14px;">X</div>
        <mapgis-ui-input-number
          v-model="scale.x"
          :min="0"
          style="width: 90%"
          @blur="handleEdit('zoomTo')"
        />
        </mapgis-form-model-item>
      </a-col>
      <a-col :span="6">
        <mapgis-form-model-item label="Y">
          <div slot="label" style="line-height: 20px;font-size: 14px;">Y</div>
        <mapgis-ui-input-number
          v-model="scale.y"
          :min="0"
          style="width: 90%"
          @blur="handleEdit('zoomTo')"
        />
        </mapgis-form-model-item>
      </a-col>
      <a-col :span="6">
        <mapgis-form-model-item label="Z">
          <div slot="label" style="line-height: 20px;font-size: 14px;">Z</div>
        <mapgis-ui-input-number
          v-model="scale.z"
          :min="0"
          style="width: 90%"
          @blur="handleEdit('zoomTo')"
        />
        </mapgis-form-model-item>
      </a-col>
    </a-row>
    <mapgis-ui-form
      layout="inline"
      labelAlign="left"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 10 }"
    >

    </mapgis-ui-form>
    <a-divider>
      矩阵变换
      <mapgis-ui-switch v-model="showMatrix" />
    </a-divider>
    <a-row>
      <div>
        <div style="position: absolute;right: 6px;bottom: 0px;">
          <a-button class="edit-tool-button" style="z-index: 2;" @click="handelEditTransform()">应用</a-button>
        </div>
      <a-textarea placeholder="矩阵" :rows="6" v-model="transformString"/>
    </div>
    </a-row>
    <a-divider></a-divider>
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
      <a-button type="link" @click="share">应用于其它模型缓存子图层</a-button>
    </div>
    <mp-window-wrapper :visible="showSharePanel">
      <template v-slot:default="slotProps">
        <mp-window
          title="应用于模型缓存子图层"
          :width="320"
          :height="400"
          :shrinkAction="false"
          :fullScreenAction="false"
          :visible.sync="showSharePanel"
          anchor="top-center"
          v-bind="slotProps"
        >
          <template>
            <mp-share-panel
              ref="sharePanel"
              :layerDocument.sync="document"
              :transformArray="transformArray"
              :layerObject="layer.layer"
              @save="save"
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
} from '@mapgis/web-app-framework'
import ModelStretchUtil from '../../../ModelStretch/mixin/ModelStretchUtil.js'
import cloneDeep from 'lodash.clonedeep'
import MpSharePanel from './SharePanel.vue'

export default {
  name: 'MpModelEdit',
  components: { MpSharePanel },
  mixins: [WidgetMixin,AppMixin, ModelStretchUtil],
  props: ['layer','model','modelMetadata'],
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
      modelRotation:{
        x:0,
        y:0,
        z:0,
      },
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

      transformArray:[
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        0,0,0,0
      ],

      activeTool: undefined,
      showMatrix: true,
      showSharePanel: false,

      shareMode: 'normal',
    }
  },
  computed:{
    transformString(){
      return this.transformArray.toString()
    }
  },
  created() {},
  mounted(){
    const editorTransform = this.Cesium.Matrix4.clone(this.model.root.transform);
    const ellipsoid = this.viewer.scene.globe.ellipsoid;
    const center = ellipsoid.cartesianToCartographic(this.Cesium.Cartesian3.clone(this.modelMetadata.boundingSphereCenter));
    
    // 获取图层属性中的变换矩阵。初始位置、旋转角度、缩放比例
    if (this.layer.layerProperty && this.layer.layerProperty.transform) {
      this.transformArray = this.layer.layerProperty.transform
    } else {
      this.transformArray = this.Cesium.Matrix4.toArray(this.model.root.transform)
    }
    
    const transformMat4 = new this.Cesium.Matrix4.fromArray(this.transformArray)
    // 获取缩放量、旋转量
    const translate = this.Cesium.Matrix4.getTranslation(transformMat4, new this.Cesium.Cartesian3())
    const scale = this.Cesium.Matrix4.getScale(transformMat4, new this.Cesium.Cartesian3())
    this.scale = scale

    // 模型初始旋转角度
    this.modelRotation = this.getRotationMatrix(new this.Cesium.Matrix4.fromArray(this.model.root.transform))
    // 记录的上一次旋转角度
    this.rotation = this.getRotationMatrix(new this.Cesium.Matrix4.fromArray(this.transformArray))
    // 旋转角度变化量
    this.rotationOffset = {
      x: this.rotation.x - this.modelRotation.x,
      y: this.rotation.y - this.modelRotation.y,
      z: this.rotation.z - this.modelRotation.z
    }

    // 获取模型中心
    this.modelMetadataCenter = {
        longitude: this.Cesium.Math.toDegrees(center.longitude),
        latitude: this.Cesium.Math.toDegrees(center.latitude),
        height: center.height,
    }

    // // 获取平移量
    // const translateDre = ellipsoid.cartesianToCartographic(translate);
    // if(translateDre){
    //   this.coordinate = {
    //     longitude: this.Cesium.Math.toDegrees(translateDre.longitude),
    //     latitude: this.Cesium.Math.toDegrees(translateDre.latitude),
    //     height: translateDre.height,
    //   }
    // } else {
    //   this.coordinate = cloneDeep(this.modelMetadataCenter)
    // }
    // this.coordinateOffset = {
    //   longitude: this.coordinate.longitude - this.modelMetadataCenter.longitude,
    //   latitude: this.coordinate.latitude - this.modelMetadataCenter.latitude,
    //   height: this.coordinate.height - this.modelMetadataCenter.height,
    // }

    // 获取平移位置
    this.coordinate = {
      longitude: this.modelMetadataCenter.longitude,
      latitude: this.modelMetadataCenter.latitude,
      height: this.modelMetadataCenter.height,
    }
    
    // 获取局部坐标系制图中心
    // Todo cesium内核中写的是 取 this.model._root.computedTransform
    const dataCenterCart = this.Cesium.Matrix4.getTranslation(this.model.root.transform, new this.Cesium.Cartesian3())
    const origin = ellipsoid.cartesianToCartographic(dataCenterCart);
    this.origin = {
        longitude: this.Cesium.Math.toDegrees(origin.longitude),
        latitude: this.Cesium.Math.toDegrees(origin.latitude),
        height: origin.height,
    }
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
      modelsInfo = modelsInfo || [
        {
          'layer': this.layer,
          'transform': this.model._root.transform
        }
      ]
      this.$emit('model-edit', 'save' ,modelsInfo)
    },
    handleEdit(type){
      if(this.activeTool){
        this.handleDeactivateTool()
      } 
      if(type === 'moveTo'){
        this.coordinateOffset = {
          longitude: this.coordinate.longitude - this.modelMetadataCenter.longitude,
          latitude: this.coordinate.latitude - this.modelMetadataCenter.latitude,
          height: this.coordinate.height - this.modelMetadataCenter.height,
        }
        this.newOrigin = {
          longitude: this.origin.longitude + this.coordinateOffset.longitude,
          latitude: this.origin.latitude + this.coordinateOffset.latitude,
          height: this.origin.height + this.coordinateOffset.height,
        }
        this.$emit('model-edit', type, {
          move: this.newOrigin,
          model:this.model,
        })
      } else if(type === 'rotateTo'){
        this.$emit('model-edit', type, {
          rotation: this.rotationOffset,
          model:this.model,
        })
      } else if(type === 'zoomTo'){
        this.$emit('model-edit', type, {
          scale: this.scale,
          model:this.model,
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
      
      this.handleEdit('moveTo')
      this.handleEdit('rotateTo')
      this.handleEdit('zoomTo')
      this.$emit('model-edit', 'reset')
    },
    handleActiveTool(type){
      this.activeTool = type
      if(type === 'move'){
        this.$emit('model-edit', 'move')
      } else if(type === 'rotate'){
        this.$emit('model-edit', 'rotate')
      } else if(type === 'scale'){
        this.$emit('model-edit', 'zoomSingle')
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
          this.coordinateOffset = this.convertToDegree(value.offset)
          this.newOrigin = this.convertToDegree(value.originPosition)
        } else if (value.editorMode === 'rotate') {
          this.rotation = value.modelRotation
          this.rotationOffset = {
            x: this.Cesium.Math.toDegrees(this.rotation.x),
            y: this.Cesium.Math.toDegrees(this.rotation.y),
            z: this.Cesium.Math.toDegrees(this.rotation.z)
          }
        } else if (value.editorMode === 'scale') {
          this.scale = value.scale
        }
      }
      this.transformArray = this.Cesium.Matrix4.toArray(this.model.root.transform)
    },
    handelEditTransform(){
      this.transformArray = this.Cesium.Matrix4.toArray(this.model.root.transform)
    },
    getPropertiesByTransform(){
    },
    share(){
      this.showSharePanel = !this.showSharePanel
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
    }
  },

  // 组件销毁前还原模型
  beforeDestroy() {
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
