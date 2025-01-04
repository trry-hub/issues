<script setup lang="ts">
import {useAttrs} from 'vue'
import type { UploadChangeParam, UploadFile, UploadProps } from 'ant-design-vue'

defineOptions({
  name: 'FileUpload',
})
const props = withDefaults(
  defineProps<{
    data?: UploadProps['data']
    name?: UploadProps['name']
    size?: number
    notip?: boolean
    ext?: string[]
  }>(),
  {
    name: 'file',
    size: 2,
    notip: false,
    ext: () => ['zip', 'rar'],
  },
)

const attrs = useAttrs()

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const fileName = file.name.split('.')
  const fileExt = fileName.at(-1) ?? ''
  const compareExt = props.ext.map(item => item.toLowerCase())
  const isTypeOk = compareExt.includes(fileExt.toLowerCase())
  const isSizeOk = file.size / 1024 / 1024 < props.size
  if (!isTypeOk) {
    // useMessage.error(`上传文件只支持 ${props.ext.join(' / ')} 格式！`)
  }
  if (!isSizeOk) {
    // useMessage.error(`上传文件大小不能超过 ${props.size}MB！`)
  }
  return isTypeOk && isSizeOk
}
</script>

<template>
  <div class="flex gap-5 flex-items-center">
    <a-upload-dragger
      :accept="ext.map(item => `.${item}`).join(',')"
      :data="data"
      :name="name"
      :before-upload="beforeUpload"
      drag
      v-bind="attrs"
    >
      <slot>
        <div class="slot">
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
        </div>
      </slot>
    </a-upload-dragger>
    <div v-if="!notip" class="ant-upload__tip">
      <span>{{ `支持 ${ext.join('/')} 格式，不超过${size}M${attrs.maxCount === 1 ? '' : `，且文件数量不超过 ${attrs.maxCount || 1} 个`}` }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ant-upload-wrapper {
  // line-height: 0;

  :deep(.ant-upload-drag) {
    display: inline-block;
    line-height: normal;
    background: transparent;
    border: none;

    .ant-upload {
      padding: 0;
    }

    &.is-dragover {
      border-width: 1px;
    }

    .slot {
      width: 200px;
      padding: 30px 0 35px;
      overflow: hidden;
      color: #666;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      transition: all 0.3s;

      &:hover {
        color: var(--g-theme-color);
        border: 1px dashed var(--g-theme-color);
      }

      .icon {
        font-size: 30px;
      }
    }
  }
}

.ant-upload__tip {
  color: #969696;
}
</style>
