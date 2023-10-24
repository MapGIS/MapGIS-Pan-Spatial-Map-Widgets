export default {
  inject: ['vueCesium', 'Cesium', 'viewer'],
  data() {
    return {
      scaleLength: 15,
      extrudedHeight: 25,
      gridNumX: 15,
      gridNumY: 6,
      gridNumZ: 10,
    }
  },
  methods: {
    initCoordinateGrid(layer, type) {
      if (!this.graphicsLayer) {
        this.addGraphicLayer()
      }
      const drawConfig = this.drawCoordinateGrid(layer)
      this.coordinateGridStyle(drawConfig, type)
    },
    addGraphicLayer() {
      const { Cesium, viewer } = this
      this.graphicsLayer = new Cesium.GraphicsLayer(viewer, {})
    },
    drawCoordinateGrid(layer) {
      const { Cesium } = this
      // 获取模型原点坐标和其他三个方向坐标
      const center = layer.root.boundingVolume.boundingVolume.center
      const halfAxes = layer.root.boundingVolume.boundingVolume.halfAxes

      const halfAxesX = Cesium.Matrix3.getColumn(
        halfAxes,
        0,
        new Cesium.Cartesian3()
      )
      const halfAxesY = Cesium.Matrix3.getColumn(
        halfAxes,
        1,
        new Cesium.Cartesian3()
      )
      const halfAxesZ = Cesium.Matrix3.getColumn(
        halfAxes,
        2,
        new Cesium.Cartesian3()
      )

      // 单位法向量
      const normalizeX = Cesium.Cartesian3.normalize(
        halfAxesX,
        new Cesium.Cartesian3()
      )
      const normalizeY = Cesium.Cartesian3.normalize(
        halfAxesY,
        new Cesium.Cartesian3()
      )
      const normalizeZ = Cesium.Cartesian3.normalize(
        halfAxesZ,
        new Cesium.Cartesian3()
      )

      // 模型网格边界四个点坐标
      const southWestBottom = Cesium.Cartesian3.subtract(
        center,
        halfAxesX,
        new Cesium.Cartesian3()
      )
      Cesium.Cartesian3.subtract(southWestBottom, halfAxesY, southWestBottom)
      Cesium.Cartesian3.subtract(southWestBottom, halfAxesZ, southWestBottom)

      const southWestTop = Cesium.Cartesian3.subtract(
        center,
        halfAxesX,
        new Cesium.Cartesian3()
      )
      Cesium.Cartesian3.subtract(southWestTop, halfAxesY, southWestTop)
      Cesium.Cartesian3.add(southWestTop, halfAxesZ, southWestTop)

      const southEastBottom = Cesium.Cartesian3.add(
        center,
        halfAxesX,
        new Cesium.Cartesian3()
      )
      Cesium.Cartesian3.subtract(southEastBottom, halfAxesY, southEastBottom)
      Cesium.Cartesian3.subtract(southEastBottom, halfAxesZ, southEastBottom)

      const northWestBottom = Cesium.Cartesian3.subtract(
        center,
        halfAxesX,
        new Cesium.Cartesian3()
      )
      Cesium.Cartesian3.add(northWestBottom, halfAxesY, northWestBottom)
      Cesium.Cartesian3.subtract(northWestBottom, halfAxesZ, northWestBottom)
      return {
        boundaryCoordinates: {
          southWestBottom,
          southWestTop,
          southEastBottom,
          northWestBottom,
        },
        unitVector: {
          normalizeX,
          normalizeY,
          normalizeZ,
        },
      }
    },
    coordinateGridStyle(drawConfig, type) {
      switch (type) {
        case 'coordinate':
          // 坐标网格风格1，通过两个点和线段数，绘制坐标网格
          this.drawGridStyleForCoordinate(drawConfig)
          break
        case 'grid':
          // 坐标网格风格2，绘制平面网格
          this.drawGridStyleForGrid(drawConfig)
          break
        default:
          break
      }
    },
    drawGridStyleForCoordinate(drawConfig) {
      const { Cesium } = this
      const {
        boundaryCoordinates: {
          southWestBottom,
          southWestTop,
          southEastBottom,
          northWestBottom,
        },
        unitVector,
      } = drawConfig
      // 获取两点之间的距离计算刻度
      const distanceX = Cesium.Cartesian3.distance(
        southWestBottom,
        southEastBottom
      )
      const distanceY = Cesium.Cartesian3.distance(
        southWestBottom,
        northWestBottom
      )
      const distanceZ = Cesium.Cartesian3.distance(
        southWestBottom,
        southWestTop
      )
      // 获取最小值
      const minDistance = Math.min.apply(null, [
        distanceX,
        distanceY,
        distanceZ,
      ])
      // 获取最大值
      const maxDistance = Math.max.apply(null, [
        distanceX,
        distanceY,
        distanceZ,
      ])
      // 获取中间值
      const midDistance = [distanceX, distanceY, distanceZ].find(
        (item) => item !== maxDistance && item !== minDistance
      )
      let midScale
      let minScale
      // 默认绘制10个刻度
      const maxScale = Math.ceil(maxDistance / 10)
      // 以最大值作为刻度标准
      midScale = Math.ceil(midDistance / maxScale)
      midScale = midScale > 1 ? maxScale : Math.floor(midDistance)
      minScale = Math.ceil(minDistance / maxScale)
      minScale = minScale > 1 ? maxScale : Math.floor(minDistance)
      // 获取xyz坐标对应的刻度
      const scaleX = [maxDistance, midDistance, minDistance].find(
        (item) => item === distanceX
      )
      const scaleY = [maxDistance, midDistance, minDistance].find(
        (item) => item === distanceY
      )
      const scaleZ = [maxDistance, midDistance, minDistance].find(
        (item) => item === distanceZ
      )
      const scaleRelation = {}
      scaleRelation[maxDistance] = maxScale
      scaleRelation[midDistance] = midScale
      scaleRelation[minDistance] = minScale

      // 绘制x线
      this.drawCoordinateGridStyle(
        southWestBottom,
        southEastBottom,
        'x',
        scaleRelation[scaleX],
        unitVector
      )
      // 绘制y线
      this.drawCoordinateGridStyle(
        southWestBottom,
        northWestBottom,
        'y',
        scaleRelation[scaleY],
        unitVector
      )
      // 绘制z线
      this.drawCoordinateGridStyle(
        southWestBottom,
        southWestTop,
        'z',
        scaleRelation[scaleZ],
        unitVector
      )
      // 添加(0,0)text
      this.addOriginalPoint(southWestBottom, unitVector)
    },
    drawCoordinateGridStyle(
      startPosition,
      endPosition,
      direction,
      gridLength,
      unitVector
    ) {
      // let gridLengthX, gridLengthY, gridLengthZ
      const { Cesium } = this
      // 绘制轴线
      this.addGraphicPolylineArrow([startPosition, endPosition])
      // 两点间的距离
      const distance = Cesium.Cartesian3.distance(endPosition, startPosition)
      this.extrudedHeight = gridLength
      // 绘制刻度线和刻度值
      switch (direction) {
        case 'x':
          for (let i = 1; i < Math.ceil(distance / gridLength); i++) {
            // 绘制X刻度线和刻度值
            this.addLineAndTextX(startPosition, i * gridLength, unitVector)
          }
          break
        case 'y':
          for (let i = 1; i < Math.ceil(distance / gridLength); i++) {
            // 绘制Y刻度线和刻度值
            this.addLineAndTextY(startPosition, i * gridLength, unitVector)
          }
          break
        case 'z':
          for (let i = 1; i < Math.ceil(distance / gridLength); i++) {
            // 绘制Z刻度线和刻度值
            this.addLineAndTextZ(startPosition, i * gridLength, unitVector)
          }
          break
        default:
          break
      }
    },
    addGraphicPolylineArrow(positions) {
      const { Cesium } = this
      const polylineGraphic = new Cesium.Graphic({
        // 类型
        type: 'polyline',
        // 几何数组
        positions: positions,
        // 样式
        style: {
          // 箭头线材质
          material: Cesium.Material.fromType('PolylineArrow', {
            // 颜色
            color: Cesium.Color.AQUA,
          }),
          // 宽度
          width: 4,
          // 深度测试
          depthTest: true,
        },
      })
      // 将标绘添加入标绘图层
      this.graphicsLayer.addGraphic(polylineGraphic)
    },
    addGraphicPolyline(positions) {
      const { Cesium } = this
      const polylineGraphic = new Cesium.Graphic({
        // 类型
        type: 'polyline',
        // 几何数组
        positions: positions,
        // 样式
        style: {
          // 颜色
          color: Cesium.Color.AQUA,
          // 宽度
          width: 1,
          // 深度测试
          depthTest: true,
        },
      })
      // 将标绘添加入标绘图层
      this.graphicsLayer.addGraphic(polylineGraphic)
    },
    addGraphicText(positions, text) {
      const { Cesium } = this
      const { extrudedHeight } = this
      const textGraphic = new Cesium.Graphic({
        // 类型
        type: 'wall',
        // 几何点数组
        positions: positions,
        // 样式
        style: {
          extrudedHeight: extrudedHeight,
          height: Cesium.Cartographic.fromCartesian(positions[1]).height,
          // 材质类型
          materialType: 'text',
          // 材质
          material: {
            // 文字
            text: text,
            // 文字颜色
            fillColor: Cesium.Color.AQUA,
            font: 'bolder 10px MicroSoft YaHei',
          },
        },
      })
      // 将标绘点添加入标绘图层
      this.graphicsLayer.addGraphic(textGraphic)
    },
    // 通过原点坐标和偏移量添加X方向刻度线和刻度值
    addLineAndTextX(startPosition, value, unitVector) {
      const { Cesium } = this
      const { scaleLength, extrudedHeight } = this
      const { normalizeX, normalizeY, normalizeZ } = unitVector
      // 计算刻度线两点坐标
      const linePosition1 = Cesium.Cartesian3.add(
        startPosition,
        Cesium.Cartesian3.multiplyByScalar(
          normalizeX,
          value,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      const linePosition2 = Cesium.Cartesian3.subtract(
        linePosition1,
        Cesium.Cartesian3.multiplyByScalar(
          normalizeZ,
          scaleLength,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      // 计算刻度值两点坐标
      const textPosition1 = Cesium.Cartesian3.subtract(
        linePosition2,
        Cesium.Cartesian3.multiplyByScalar(
          normalizeX,
          extrudedHeight / 2,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      const textPosition2 = Cesium.Cartesian3.subtract(
        Cesium.Cartesian3.add(
          textPosition1,
          Cesium.Cartesian3.multiplyByScalar(
            normalizeX,
            extrudedHeight,
            new Cesium.Cartesian3()
          ),
          new Cesium.Cartesian3()
        ),
        Cesium.Cartesian3.multiplyByScalar(
          normalizeZ,
          extrudedHeight,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      this.addGraphicPolyline([linePosition1, linePosition2])
      this.addGraphicText([textPosition1, textPosition2], value)
    },
    // 通过原点坐标和偏移量添加Y方向刻度线和刻度值
    addLineAndTextY(startPosition, value, unitVector) {
      const { Cesium } = this
      const { scaleLength, extrudedHeight } = this
      const { normalizeX, normalizeY, normalizeZ } = unitVector
      // 计算刻度线两点坐标
      const linePosition1 = Cesium.Cartesian3.add(
        startPosition,
        Cesium.Cartesian3.multiplyByScalar(
          normalizeY,
          value,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      const linePosition2 = Cesium.Cartesian3.add(
        linePosition1,
        Cesium.Cartesian3.multiplyByScalar(
          normalizeZ,
          scaleLength,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      // 计算刻度值两点坐标
      const textPosition1 = Cesium.Cartesian3.add(
        Cesium.Cartesian3.subtract(
          linePosition2,
          Cesium.Cartesian3.multiplyByScalar(
            normalizeX,
            extrudedHeight / 2,
            new Cesium.Cartesian3()
          ),
          new Cesium.Cartesian3()
        ),
        Cesium.Cartesian3.multiplyByScalar(
          normalizeZ,
          extrudedHeight,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      const textPosition2 = Cesium.Cartesian3.subtract(
        Cesium.Cartesian3.add(
          textPosition1,
          Cesium.Cartesian3.multiplyByScalar(
            normalizeX,
            extrudedHeight,
            new Cesium.Cartesian3()
          ),
          new Cesium.Cartesian3()
        ),
        Cesium.Cartesian3.multiplyByScalar(
          normalizeZ,
          extrudedHeight,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      this.addGraphicPolyline([linePosition1, linePosition2])
      this.addGraphicText([textPosition1, textPosition2], value)
    },
    // 通过原点坐标和偏移量添加Z方向刻度线和刻度值
    addLineAndTextZ(startPosition, value, unitVector) {
      const { Cesium } = this
      const { scaleLength, extrudedHeight } = this
      const { normalizeX, normalizeY, normalizeZ } = unitVector
      // 计算刻度线两点坐标
      const linePosition1 = Cesium.Cartesian3.add(
        startPosition,
        Cesium.Cartesian3.multiplyByScalar(
          normalizeZ,
          value,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      const linePosition2 = Cesium.Cartesian3.add(
        linePosition1,
        Cesium.Cartesian3.multiplyByScalar(
          normalizeX,
          scaleLength,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      // 计算刻度值两点坐标
      const textPosition1 = Cesium.Cartesian3.add(
        linePosition2,
        Cesium.Cartesian3.multiplyByScalar(
          normalizeZ,
          extrudedHeight / 2,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      const textPosition2 = Cesium.Cartesian3.add(
        Cesium.Cartesian3.subtract(
          textPosition1,
          Cesium.Cartesian3.multiplyByScalar(
            normalizeZ,
            extrudedHeight,
            new Cesium.Cartesian3()
          ),
          new Cesium.Cartesian3()
        ),
        Cesium.Cartesian3.multiplyByScalar(
          normalizeX,
          extrudedHeight,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      this.addGraphicPolyline([linePosition1, linePosition2])
      this.addGraphicText([textPosition1, textPosition2], value)
    },
    addOriginalPoint(southWestBottom, unitVector) {
      const { Cesium } = this
      const { scaleLength, extrudedHeight } = this
      const { normalizeX, normalizeY, normalizeZ } = unitVector
      const OriginalPointPosition1 = southWestBottom
      const OriginalPointPosition2 = Cesium.Cartesian3.subtract(
        Cesium.Cartesian3.add(
          OriginalPointPosition1,
          Cesium.Cartesian3.multiplyByScalar(
            normalizeX,
            extrudedHeight,
            new Cesium.Cartesian3()
          ),
          new Cesium.Cartesian3()
        ),
        Cesium.Cartesian3.multiplyByScalar(
          normalizeZ,
          extrudedHeight,
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      )
      this.addGraphicText(
        [OriginalPointPosition1, OriginalPointPosition2],
        '(0,0,0)'
      )
    },
    drawGridStyleForGrid(drawConfig) {
      const { gridNumX, gridNumY, gridNumZ } = this
      const {
        boundaryCoordinates: {
          southWestBottom,
          southWestTop,
          southEastBottom,
          northWestBottom,
        },
      } = drawConfig
      this.drawGridStyle(
        southWestBottom,
        southEastBottom,
        northWestBottom,
        gridNumX,
        gridNumY
      )
      this.drawGridStyle(
        southWestBottom,
        southEastBottom,
        southWestTop,
        gridNumX,
        gridNumZ
      )
      this.drawGridStyle(
        southWestBottom,
        northWestBottom,
        southWestTop,
        gridNumY,
        gridNumZ
      )
    },
    drawGridStyle(centerPosition, position1, position2, gridNum1, gridNum2) {
      const { Cesium } = this
      // position1每一份坐标向量
      const averagePosition1 = Cesium.Cartesian3.divideByScalar(
        Cesium.Cartesian3.subtract(
          position1,
          centerPosition,
          new Cesium.Cartesian3()
        ),
        gridNum1,
        new Cesium.Cartesian3()
      )
      // position2每一份坐标向量
      const averagePosition2 = Cesium.Cartesian3.divideByScalar(
        Cesium.Cartesian3.subtract(
          position2,
          centerPosition,
          new Cesium.Cartesian3()
        ),
        gridNum2,
        new Cesium.Cartesian3()
      )
      for (let i = 0; i <= gridNum1; i++) {
        const linePosition1 = Cesium.Cartesian3.add(
          centerPosition,
          Cesium.Cartesian3.multiplyByScalar(
            averagePosition1,
            i,
            new Cesium.Cartesian3()
          ),
          new Cesium.Cartesian3()
        )
        for (let j = 0; j <= gridNum2; j++) {
          const linePosition2 = Cesium.Cartesian3.add(
            position2,
            Cesium.Cartesian3.multiplyByScalar(
              averagePosition1,
              i,
              new Cesium.Cartesian3()
            ),
            new Cesium.Cartesian3()
          )
          // 绘制线
          this.addGraphicPolyline([linePosition1, linePosition2])
          const linePositionNew1 = Cesium.Cartesian3.add(
            centerPosition,
            Cesium.Cartesian3.multiplyByScalar(
              averagePosition2,
              j,
              new Cesium.Cartesian3()
            ),
            new Cesium.Cartesian3()
          )
          const linePositionNew2 = Cesium.Cartesian3.add(
            position1,
            Cesium.Cartesian3.multiplyByScalar(
              averagePosition2,
              j,
              new Cesium.Cartesian3()
            ),
            new Cesium.Cartesian3()
          )
          // 绘制线
          this.addGraphicPolyline([linePositionNew1, linePositionNew2])
        }
      }
    },
    removeAllGraphicLayers() {
      if (this.graphicsLayer) {
        this.graphicsLayer.removeAllGraphic()
      }
    },
  },
}
