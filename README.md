# mapgis-pan-spatial-map-widgets

---

## 简介

<div align="center">
mapgis-pan-spatial-map-widgets 是MapGIS Pan-Spatial Map的基础微件库插件项目，提供基础微件。
</div>



## 目录结构

```text
|-- src
| |-- components									# 微件库公用组件
| | |-- AttributeTable								# 结果集表格组件
| | |-- AttributeTableList							# 结果集表格列表组件
| | |-- CustomQuery									# 结果集自定义查询组件
| | |-- ExportLayer									# 空间分析结果导出组件
| | |-- MetadataInfo								# 元数据信息组件
| | |-- ModelStretch								# 模型拉伸组件
| | |-- QueryResultsTree							# 查询结构树组件
| | |-- Timeline									# 属性体模型展示时间轴组件
| | |-- TreeLayer									# 图层列表组件
| |-- theme											# 样式文件
| |-- widgets										# 基础微件
|       |-- analysis								# 基础微件-分析微件
|       |-- data-manager							# 基础微件-数据管理微件
|       |-- data-visualization						# 基础微件-数据可视化微件
|       |-- editing									# 基础微件-标注微件
|       |-- extended								# 基础微件-扩展微件
|       |-- query									# 基础微件-查询微件
|       `-- tool									# 基础微件-工具微件
|-- README.md										# readme文档							
|-- babel.config.js									# babel配置
|-- package.json									# npm脚本和依赖项
|-- tsconfig.json									# ts配置	
|-- vue.config.js									# 项目配置文件
```

## 开始

### 安装依赖

```bash
yarn install
```

### 打包项目

```bash
yarn build
```

## 在线服务

[问答社区-云听](http://www.smaryun.com/cloudlisten/index.php)

## 在线资源

[MapGIS-Pan-Spatial-Map](http://www.smaryun.com/dev/resource_center.html#/type27/tag204/page1)
