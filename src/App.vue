<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";
import FileUpload from "./componets/FileUpload.vue";
// import { uploadFile } from "@qxs-bns/utils";
import type { UploadRequestOption } from "ant-design-vue/es/vc-upload/interface";

const fileList = ref([]);

function uploadFile(options: {
  file: File
  getCredentials: () => Promise<any>
  bucket: string
  onProgress: ({ percent }: { percent: number }) => void
}) {
  return new Promise((resolve, reject) => {
    let percent = 0
    setInterval(() => {
      percent += 10
      if (percent > 100) {
        return
      }
      options.onProgress({ percent })
      console.log('percent: ', percent)
      if (percent === 100) {
        setTimeout(() => {
          resolve({
            url: 'https://www.baidu.com',
          })
        }, 1000)
      }
    }, 1000)
  })
}

async function getCredentials() {
  const params = {
    bucketType: 107,
  };
  const res = await axios({
    url: '/proxy'+import.meta.env.VITE_APP_API_QXS + "/common/v1/get-sts-token",
    params,
    headers: {
      token: "9_430083009817070058_88f91c756b1247429713edcfee420e68",
    },
  });
  return res.data.data
}
async function customRequest(options: UploadRequestOption) {
  const { onProgress, onError, onSuccess, file } = options;
  try {
    // oss sdk 上传
    const res = await uploadFile({
      file: file as File,
      getCredentials,
      bucket: "yao-file-daily",
      onProgress,
    });
    onSuccess?.(res);
  } catch (error) {
    onError?.(error as Error, null);
  }
}
</script>

<template>
  <FileUpload
    v-model:file-list="fileList"
    :custom-request="customRequest"
    :max-count="1"
    :notip="true"
    :ext="['png', 'jpg', 'jpeg']"
  >
    <a-button>上传</a-button>
  </FileUpload>
</template>
