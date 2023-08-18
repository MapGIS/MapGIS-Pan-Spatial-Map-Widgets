<template>
  <div class="mp-widget-non-spatial">
    <div class="non-spatial-ftp" v-if="dataType === 'ftp'">
      <div class="non-spatial-header">
        <mapgis-ui-input-search
          v-model="searchValue"
          placeholder="请输入查询条件"
          enter-button="搜索"
          allow-clear
          @search="onSearch"
        />
        <div class="header-right">
          <div class="right-item first">
            <span>类型:</span>
            <mapgis-ui-select
              v-model="selectType"
              size="small"
              @change="onSelectChange"
            >
              <mapgis-ui-select-option
                v-for="item in typeOptions"
                :key="item.value"
              >
                {{ item.label }}
              </mapgis-ui-select-option>
            </mapgis-ui-select>
          </div>
          <div class="right-item">
            <span>展示方式:</span>
            <a-button
              class="btn-first"
              size="small"
              icon="picture"
              @click="onPicture"
            />
            <a-button
              class="btn-second"
              size="small"
              icon="unordered-list"
              @click="onList"
            />
          </div>
        </div>
      </div>
      <div class="non-spatial-panel">
        <mapgis-ui-table
          v-show="!showPicutre"
          :columns="columns"
          :loading="loading"
          :data-source="tableData"
          :pagination="pagination"
          :rowKey="
            (record) => {
              return record.id
            }
          "
          @change="onTablePageChange"
        >
          <template slot="name" slot-scope="text, record">
            <a-icon type="file" />
            <span @click="onView(record)">{{ text }}</span>
          </template>
          <template slot="action" slot-scope="text, record">
            <a-icon type="download" @click="onClickDownLoad(record)" />
          </template>
        </mapgis-ui-table>
        <div v-show="showPicutre" class="panel-content">
          <div
            class="content-item"
            v-for="item in pictrueData"
            :key="item.id"
            @click="onView(item)"
          >
            <div class="item-img">
              <img
                v-if="item.type === 'doc' || item.type === 'docx'"
                src="./images/word.png"
                alt=""
              />
              <img
                v-if="item.type === 'xls' || item.type === 'xlsx'"
                src="./images/excel.png"
                alt=""
              />
              <img
                v-if="
                  item.type === 'ppt' ||
                  item.type === 'pptx' ||
                  item.type === 'pdf'
                "
                src="./images/pdf.png"
                alt=""
              />
              <img
                v-if="
                  item.type === 'mp4' ||
                  item.type === 'avi' ||
                  item.type === 'pcx' ||
                  item.type === 'ogg'
                "
                src="./images/video.png"
                alt=""
              />
              <img
                v-if="item.type === 'jpg' || item.type === 'png'"
                src="./images/img.png"
                alt=""
              />
            </div>
            <div class="item-label">
              <a-popover placement="bottom">
                <template slot="content">
                  <span>{{ item.name }}</span>
                </template>
                <div class="lable-text">{{ item.name }}</div>
              </a-popover>
            </div>
          </div>
        </div>
      </div>
      <div class="non-spatial-footer">
        <mapgis-ui-pagination
          v-show="!showPicutre"
          :current="currentPageList"
          :total="pageTotal"
          :show-total="
            (total, range) => `${range[0]}-${range[1]} of ${total} items`
          "
          :page-size="8"
          @change="onPageChange"
        />

        <mapgis-ui-pagination
          v-show="showPicutre"
          :current="currentPagePic"
          :total="pageTotal"
          :show-total="
            (total, range) => `${range[0]}-${range[1]} of ${total} items`
          "
          :page-size="10"
          :default-current="1"
          @change="onPicturePageChange"
        />
      </div>
    </div>
    <div class="non-spatial-hdfs" v-if="dataType === 'hdfs'">
      <!-- <mapgis-ui-tree :load-data="onLoadData" :tree-data="treeData">
        <template slot="title" slot-scope="node">
          <mapgis-ui-iconfont
            v-if="node.fileType === 'DIRECTORY'"
            class="tree-title-icon"
            type="mapgis-tubiaoqietu_wenjianjia-29"
          />
          <mapgis-ui-iconfont
            v-if="node.fileType !== 'DIRECTORY'"
            class="tree-title-icon"
            :type="getIconType(node.type)"
          />
          <span class="tree-title-content">{{ node.title }}</span>
          <mapgis-ui-iconfont
            v-if="node.fileType !== 'DIRECTORY'"
            class="tree-title-icon"
            type="mapgis-show"
            @click="showDoc(node.path, node.type)"
          /> </template
      ></mapgis-ui-tree> -->
      <mapgis-ui-table
        :columns="tableColumns"
        :data-source="tableData"
        bordered
        :pagination="false"
        :rowKey="(row) => row.path"
        :customRow="rowClick"
      >
        <template slot="fileType" slot-scope="text, record">
          {{ text === 'DIRECTORY' ? '文件夹' : '文件' }}
        </template>

        <template slot="fileSize" slot-scope="text, record">
          {{ text }}
        </template>
        <template slot="operation" slot-scope="text, record">
          <div class="operate-cloumns">
            <a
              v-if="record.fileType === 'DIRECTORY'"
              @click="getNextData(record.path, record.name)"
              >查看</a
            >
            <a
              v-if="record.fileType !== 'DIRECTORY'"
              @click="showDoc(record.path, record.type, record.name)"
              >预览</a
            >
            <a
              v-if="record.fileType !== 'DIRECTORY'"
              @click="dowloadDoc(record.path, record.name)"
              >下载</a
            >
          </div>
        </template>
        <template slot="title" slot-scope="currentPageData">
          <mapgis-ui-breadcrumb>
            <a-breadcrumb-item
              v-for="(item, index) in breadcrumbList"
              :key="index"
              ><a class="link-address" @click="changePath(item.url)">{{
                item.title
              }}</a></a-breadcrumb-item
            >
          </mapgis-ui-breadcrumb>
        </template>
      </mapgis-ui-table>
      <div
        style="text-align: right; padding: 5px 10px 5px 0"
        v-if="tableData && tableData.length > 0"
      >
        <mapgis-ui-pagination
          size="small"
          :total="pagination.total"
          :show-total="showPaginationTotal"
          :page-size-options="pagination.pageSizeOptions"
          :page-size="pagination.pageSize"
          :current="pagination.current"
          show-size-changer
          show-quick-jumper
          @showSizeChange="onPaginationShowSizeChange"
          @change="onPaginationChange"
        >
        </mapgis-ui-pagination>
      </div>
    </div>
    <mapgis-ui-modal
      v-model="showModal"
      :footer="null"
      :width="800"
      @cancel="closePreview"
    >
      <iframe
        v-if="showFileType === 'text'"
        :src="fileUrl"
        width="100%"
        height="100%"
        frameborder="1"
      >
      </iframe>
      <video
        v-if="showFileType === 'video'"
        muted
        autoplay="autoplay"
        loop="loop"
        :src="videoUrl"
        alt="预览"
        id="video"
        controls="controls"
        width="752"
        height="100%"
        max-height="632"
      ></video>
      <img
        v-if="showFileType === 'img'"
        class="preview-picture"
        :src="imgUrl"
        alt=""
      />
    </mapgis-ui-modal>
  </div>
</template>

<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'
import axios from 'axios'

const columns = [
  {
    title: '类型',
    dataIndex: 'fileType',
    scopedSlots: { customRender: 'fileType' },
  },
  {
    title: '文件名',
    dataIndex: 'name',
  },
  {
    title: '文件大小',
    dataIndex: 'fileSize',
    scopedSlots: { customRender: 'fileSize' },
  },
  {
    title: '上次修改日期',
    dataIndex: 'modificationTime',
  },
  {
    title: '操作',
    dataIndex: 'operation',
    scopedSlots: { customRender: 'operation' },
  },
]
export default {
  name: 'MpNonSpatial',
  mixins: [WidgetMixin],
  props: {
    // 非空间数据类型, ftp | hdfs
    dataType: {
      type: String,
    },
    // 获取当前选种的非空间数据资源列表url
    url: {
      type: String,
    },
    // 非空间数据资源url
    nonSpatialUrl: {
      type: String,
    },
    // 非空间数据类型
    type: {
      type: String,
    },
    // 目录树微件的配置
    treeConfig: {
      type: Object,
    },
  },
  data() {
    return {
      // 搜索框输入值
      searchValue: '',

      // 类型下拉值
      selectType: '',

      // 类型下拉项数组
      typeOptions: [
        {
          label: '全部',
          value:
            'doc、docx、xls、xlsx、ppt、pptx、jpg、png、mp4、avi、pcx、ogg、pdf',
        },
        {
          label: '图片',
          value: 'jpg、png',
        },
        {
          label: '文档',
          value: 'doc、docx',
        },
        {
          label: '表格',
          value: 'xls、xlsx',
        },
        {
          label: '视频',
          value: 'mp4、avi、pcx、ogg',
        },
      ],

      // 表格数据
      tableData: [],

      // 表格列配置
      columns: [
        {
          title: '名称',
          dataIndex: 'name',
          key: 'name',
          scopedSlots: { customRender: 'name' },
        },
        {
          title: '类型',
          dataIndex: 'type',
          key: 'type',
          scopedSlots: { customRender: 'type' },
        },
        {
          title: '下载',
          dataIndex: 'action',
          key: 'action',
          scopedSlots: { customRender: 'action' },
        },
      ],

      // 数据是否加载中
      loading: false,

      // 以大图方式显示的数据
      pictrueData: [],

      // 数据是否以大图显示
      showPicutre: false,

      // table的分页器配置(table自身的分页器在页面中隐藏显示了)
      // table的分页功能是通过页面下方的分页器进行控制的
      pagination: {
        current: 1,
        total: 0,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
        pageSize: 8,
      },

      // 分页器总数
      pageTotal: 0,

      // 分页器当前页数(列表状态显示)
      currentPageList: 1,

      // 分页器当前页数(大图状态显示)
      currentPagePic: 1,

      // 点击的文件对应的资源url
      fileUrl: '',

      // 媒体文件对应的资源url
      videoUrl: '',

      // 图片文件对应的资源url
      imgUrl: '',

      // 预览对话框的显隐
      showModal: false,

      // 当前预览的文件类型
      showFileType: '',
      treeData: [],
      tableColumns: columns,
      tableData: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: ['5', '10', '20', '30', '50'],
      },
      currentUrl: undefined,
      breadcrumbList: [
        {
          title: '文件目录',
          url: this.url,
        },
      ],
    }
  },
  watch: {
    // 监听非空间数据url变化，初始化table表格数据及大图状态数据
    url: {
      handler(newVal) {
        this.resizeData()
        if (!newVal) {
          this.treeData = []
          return
        }
        if (this.dataType === 'ftp') {
          this.onUrlChange(newVal)
        } else if (this.dataType === 'hdfs') {
          this.getHdfsData(newVal)
        }
      },
    },
  },
  computed: {},
  created() {
    this.initData()
  },
  methods: {
    rowClick(record) {
      return {
        on: {
          dblclick: () => {
            if (record.fileType === 'DIRECTORY') {
              this.getNextData(record.path, record.name)
            } else {
              this.showDoc(record.path, record.type, record.name)
            }
          },
        },
      }
    },
    closePreview() {
      this.showModal = false
      this.imgUrl = ''
      this.showFileType = ''
    },
    resizeData() {
      this.breadcrumbList = [
        {
          title: '文件目录',
          url: this.url,
        },
      ]
      this.tableData = []
    },
    changePath(url) {
      if (!url) return
      const index = this.breadcrumbList.findIndex((item) => item.url === url)
      this.breadcrumbList = this.breadcrumbList.slice(0, index + 1)
      this.pagination.current = 1
      this.getHdfsData(url)
    },
    getNextData(url, name) {
      url = this.url + url
      this.breadcrumbList.push({
        title: name,
        url,
      })
      this.pagination.current = 1
      this.getHdfsData(url)
    },
    onPaginationChange(page, pageSize) {
      this.pagination.current = page
      this.getHdfsData(this.currentUrl)
    },
    onPaginationShowSizeChange(current, size) {
      this.pagination.pageSize = size
      this.pagination.current = 1
      this.getHdfsData(this.currentUrl)
    },
    showPaginationTotal(total, range) {
      return `显示${range[0]}-${range[1]}条，共有 ${total}条`
    },
    dowloadDoc(path, name) {
      try {
        const paresUrl = new URL(this.url)
        const { origin } = paresUrl
        let previewUrl = `${origin}/datastore/rest/services/file/hdfs${path}/download`
        const link = document.createElement('a')
        link.style.display = 'none'
        link.href = previewUrl
        link.setAttribute('download', name)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        console.log(error)
        this.$message.error('url地址异常，无法下载！')
      }
    },
    showDoc(path, type, name) {
      if (type === 'download') {
        this.dowloadDoc(path, name)
        return
      }
      try {
        const paresUrl = new URL(this.url)
        const { origin } = paresUrl
        let previewUrl
        switch (type) {
          case 'pdf':
            previewUrl = `${origin}/hdfs/preview?dir=${path}`
            break
          case '一般文件':
            previewUrl = `${origin}/datastore/rest/services/file/hdfs${path}/download?isPreview=true`
            break
          case 'video':
            this.videoUrl = `${origin}/datastore/rest/services/file/hdfs${path}/download?isPreview=true`
            this.showFileType = 'video'
            break
          case 'img':
            this.imgUrl = `${origin}/datastore/rest/services/file/hdfs${path}/download?isPreview=true`
            this.showFileType = 'img'
            break
        }
        previewUrl && window.open(previewUrl)
        if (!previewUrl) {
          this.showModal = true
        }
      } catch (error) {
        this.$message.error('url地址异常!')
        this.videoUrl = ''
        this.imgUrl = ''
        this.showFileType = ''
      }
    },
    getIconType(type) {
      let icon
      switch (type) {
        case 'video':
          icon = 'mapgis-video'
          break
        case 'pdf':
          icon = 'mapgis-pdf'
          break
        case '一般文件':
          icon = 'mapgis-doc'
          break
        case 'img':
          icon = 'mapgis-image'
          break
        default:
          // const index = Math.floor(Math.random() * 3)
          // const arr = ['mapgis-video', 'mapgis-pdf', 'mapgis-doc']
          // icon = arr[index]
          break
      }
      return icon
    },
    onLoadData(treeNode) {
      return new Promise((resolve) => {
        const { dataRef } = treeNode
        const url = this.url + dataRef.path
        this.getHdfsData(url, dataRef).then(() => resolve())
      })
    },
    getHdfsData(url) {
      this.currentUrl = url
      url += `?pageSize=${this.pagination.pageSize}&pageNo=${this.pagination.current}`
      return new Promise((resolve, reject) => {
        axios
          .get(url)
          .then((res) => {
            const { data, status } = res
            if (status === 200) {
              if (data.t) {
                // const treeData = this.transferHdfsData(data)
                // if (dataRef) {
                //   dataRef.children = [...treeData]
                //   this.treeData = [...this.treeData]
                // } else {
                //   this.treeData = [...treeData]
                // }
                this.tableData = this.transferHdfsData(data)
                this.pagination.total = data.t.total
                resolve()
              } else {
                this.tableData = []
                this.pagination.total = 0
                resolve()
              }
            } else {
              this.$message.error('获取hdfs数据列表失败!')
              resolve()
            }
          })
          .catch((e) => {
            this.$message.error('获取hdfs数据列表失败!')
            resolve()
          })
      })
    },
    transferHdfsData(data) {
      const { rtn } = data.t
      const dataList = []
      rtn.forEach((item) => {
        const { attri, extAttri } = item
        const hdfsData = {
          name: item.name,
          type: this.getFileType(item.name) || item.type,
          dbUrl: attri.dbUrl,
          path: attri.path,
          datasetUrl: extAttri.datasetUrl,
          fileType: extAttri.fileType,
          fileSize: extAttri.fileSize,
          modificationTime: extAttri.modificationTime,
          // isLeaf: !(
          //   extAttri.fileType === 'DIRECTORY' && Number(extAttri.fileSize) > 0
          // ),
          // scopedSlots: { title: 'title' },
        }
        dataList.push(hdfsData)
      })
      return dataList
    },
    getFileType(name) {
      const index = name.lastIndexOf('.') + 1
      const suffix = name.substr(index)
      let type
      // 'doc、docx、xls、xlsx、ppt、pptx、jpg、png、mp4、avi、pcx、ogg、pdf',
      switch (suffix) {
        case 'pdf':
          type = 'pdf'
          break
        case 'doc':
        case 'docx':
        case 'xls':
        case 'xlsx':
        case 'ppt':
        case 'pptx':
          type = 'download'
          break
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'svg':
          type = 'img'
          break
        case 'avi':
        case 'pcx':
          type = 'download'
          break
        case 'mp4':
        case 'ogg':
          type = 'video'
          break
        default:
          type = '一般文件'
          break
      }
      return type
    },
    onUrlChange(newVal) {
      this.loading = true
      this.getUrlData(newVal).then((res) => {
        this.loading = false
        this.tableData = res.content
        this.pageTotal = res.totalElements

        if (this.showPicutre) {
          this.getPictureData()
        }
      })
    },
    // 初始化各项数据
    initData() {
      this.selectType = this.typeOptions[0].value

      this.$message.config({
        top: '100px',
        duration: 2,
        maxCount: 1,
      })
    },

    // 通过发送请求获取对应服务数据
    getUrlData(url) {
      const this_ = this
      return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.ontimeout = function (e) {
          this_.$message.error('请求超时，数据加载失败')
          this_.loading = false
        }
        request.responseType = 'json'
        request.open('GET', url)
        request.withCredentials = true
        request.timeout = 5000
        request.onreadystatechange = () => {
          if (request.readyState === 4) {
            if (request.status >= 200 && request.status <= 304) {
              const data = JSON.parse(JSON.stringify(request.response))
              resolve(data)
            } else {
              reject(request.response)
            }
          }
        }
        request.send()
      })
    },

    // 分页页码改变的回调(列表状态显示)
    onPageChange(page) {
      this.currentPageList = page
      this.pagination.current = page

      // 同步更新table表格的分页器
      this.onTablePageChange(this.pagination)
    },

    // 分页页码改变的回调(大图状态显示)
    onPicturePageChange(page) {
      this.currentPagePic = page

      this.getPictureData()
    },

    // table分页变化时回调
    onTablePageChange(pagination) {
      this.pagination = { ...pagination }
    },

    // 获取大图状态显示下的数据
    getPictureData() {
      if (this.tableData.length <= 10) {
        this.pictrueData = this.tableData
      } else {
        const startIndex = (this.currentPagePic - 1) * 10
        const endIndex = this.currentPagePic * 10
        this.pictrueData = this.tableData.slice(startIndex, endIndex)
      }
    },

    // 搜索框搜索事件回调
    onSearch(value) {
      this.onFilterData()
    },

    // 下拉项变化时回调
    onSelectChange(value) {
      this.onFilterData()
    },

    // 通过搜索框与下拉项筛选数据
    // 可能同时存在搜索值与下拉项值，所以筛选数据都放在一块处理
    onFilterData() {
      this.loading = true
      this.getUrlData(this.url).then((res) => {
        this.loading = false
        this.tableData = res.content

        this.tableData = this.tableData.reduce((result, item) => {
          const type = item.type.toLowerCase()
          if (
            this.selectType.includes(type) &&
            item.name.includes(this.searchValue)
          ) {
            result.push(item)
          }
          return result
        }, [])

        // 筛选数据后，数据总数会变，同时也要同步table表格的页码
        this.pageTotal = this.tableData.length
        this.onPageChange(this.currentPageList)

        if (this.showPicutre) {
          this.getPictureData()
        }
      })
    },

    // 点击大图图标回调
    onPicture() {
      this.showPicutre = true

      this.getPictureData()
    },

    // 点击列表图标回调
    onList() {
      this.showPicutre = false
    },

    // 点击下载图标回调
    onClickDownLoad(record) {
      const downLoadUrl = `${this.baseUrl}/api/non-spatial/download/url?name=${record.name}&path=${this.type}&protocol=ftp&type=${record.type}&url=${this.nonSpatialUrl}`
      this.getUrlData(downLoadUrl).then((res) => {
        const downLoadPath = this.baseUrl + res.path

        const xhr = new XMLHttpRequest()
        xhr.open('get', downLoadPath)
        xhr.responseType = 'blob'
        xhr.withCredentials = true
        xhr.send()
        xhr.onload = function () {
          if (this.status === 200 || this.status === 304) {
            const fileReader = new FileReader()
            fileReader.readAsDataURL(this.response)
            fileReader.onload = function () {
              const a = document.createElement('a')
              a.style.display = 'none'
              a.href = this.result
              a.download = `${record.name}.${record.type}`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
            }
          }
        }
      })
    },

    // 点击文件项进行预览回调
    onView(record) {
      const downLoadUrl = `${this.baseUrl}/api/non-spatial/download/url?name=${record.name}&path=${this.type}&protocol=ftp&type=${record.type}&url=${this.nonSpatialUrl}`

      if (!'pdf,mp4,ogg,jpg,png'.includes(record.type)) {
        this.$message.warning('该类型文件暂不支持预览')
        return false
      } else {
        this.getUrlData(downLoadUrl).then((res) => {
          this.fileUrl = this.baseUrl + res.path

          switch (record.type) {
            // 目前iframe只支持pdf文件的预览
            case 'pdf':
              this.showFileType = 'text'
              break
            // 目前video标签只支持mp4、ogg格式视频文件的预览
            case 'mp4':
            case 'ogg':
              this.showFileType = 'video'
              this.videoUrl = this.fileUrl
              break
            case 'jpg':
            case 'png':
              this.showFileType = 'img'
              this.imgUrl = this.fileUrl
              break
            default:
              break
          }

          this.showModal = true
        })
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-non-spatial {
  display: flex;
  flex-direction: column;
  height: 100%;
  .non-spatial-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .ant-input-search {
      width: 225px;
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .right-item {
      span {
        margin-right: 4px;
      }

      .btn-first {
        margin-right: 8px;
      }
    }

    .first {
      margin-right: 24px;
    }

    .ant-select {
      width: 64px;
    }
  }

  .non-spatial-panel {
    flex-grow: 1;
    width: 100%;
    margin-top: 8px;

    ::v-deep.ant-table-row :hover {
      color: #31a7da;
      cursor: pointer;
    }

    .panel-content {
      width: 100%;
      height: 100%;
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
    }

    .content-item {
      width: 18.6%;
      height: 39%;
      display: flex;
      flex-direction: column;
      padding: 8px;
      margin-bottom: 16px;
    }

    .content-item:hover {
      color: #169bd5;
      cursor: pointer;
    }

    .item-img {
      flex-grow: 1;
      width: 100%;
      position: relative;
      border: 1px solid #dcdcdc;

      img {
        height: 65%;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: auto;
      }
    }

    .item-label {
      border: 1px solid #dcdcdc;
      padding: 2px;

      .lable-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    ::v-deep .ant-table-pagination {
      visibility: hidden;
    }
  }

  .non-spatial-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 12px;
  }

  .non-spatial-hdfs {
    // .tree-title-content {
    //   margin: 0 8px;
    // }
    .operate-cloumns {
      display: flex;
      justify-content: space-around;
    }
    .link-address {
      color: $text-color;
    }
  }
}
::v-deep .mapgis-ui-modal {
  top: 60px;
}
::v-deep .mapgis-ui-modal-body {
  display: flex;
  align-items: center;
  justify-content: center;
  .preview-picture {
    max-width: 752px;
    max-height: 632px;
  }
}
::v-deep .mapgis-ui-modal-close-x {
  display: flex;
  justify-content: center;
  width: 28px;
  padding-top: 8px;
}
</style>
//
<style lang="scss">
// .preview-model {
//   .mapgis-ui-modal {
//     top: 0;
//     .mapgis-ui-modal-content {
//       background-color: #fff;
//       .mapgis-ui-modal-body {
//         height: 100vh;
//       }
//     }
//   }
// }
//
</style>
