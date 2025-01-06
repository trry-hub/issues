import { compile } from "json-schema-to-typescript";
import fs from 'node:fs'
import clipboard from 'clipboardy'
// 从 API 获取 JSON Schema
async function fetchJsonSchema(id: string, key: string, Cookie: string) {
  try {
    const response = await fetch(`https://yapi.yaomaitong.net/api/interface/get?id=${id}`, {
      method: 'GET',
      headers: {
        Cookie
      }
    });
    const schema = await response.json();
    if (schema.data) {
      let json = JSON.parse(schema.data[key])
      return json
    } else {
      console.log('schema: ', schema)
    }
  } catch (error) {
    console.error('获取 Schema 失败:', error);
    throw error;
  }
}

// 主函数
async function generateTypes(
  { typeName = 'ExampleSchema', apiId, key = 'res_body', Cookie: string = '' }:
    { typeName?: string, apiId: string, key?: string, Cookie: string }
) {
  const schema = await fetchJsonSchema(apiId, key, Cookie);

  // 转换 JSON Schema 为 TypeScript 并写入文件
  try {
    const ts = await compile(schema, typeName, {
      additionalProperties: false,  // 禁用额外属性
      bannerComment: '',  // 禁用头部注释
      style: {
        singleQuote: true
      }
    });
    if (!fs.existsSync('./types')) {
      fs.mkdirSync('./types', { recursive: true });
    }
    fs.writeFileSync(`./types/${typeName}.d.ts`, ts);
    await clipboard.write(ts);  // 将生成的类型定义复制到剪贴板
    console.log('TypeScript 类型文件已生成并复制到剪贴板！');
  } catch (err) {
    console.error('转换失败:', err);
  }
}

// 执行生成
let Cookie = 'ARK_STARTUP=eyJTVEFSVFVQIjp0cnVlLCJTVEFSVFVQVElNRSI6IjIwMjQtMTEtMjYgMTU6MDM6MTMuNTU3In0%3D; ARK_ID=JS4cdf59a94a251e2ce1b24e71b05dacfc4cdf; FZ_STROAGE.yaomaitong.net=eyJTRUVTSU9OSUQiOiJjNmFkOWEyNTFmNWNkZDJhIiwiU0VFU0lPTkRBVEUiOjE3MzI2MDQ1OTM1NjEsIkFOU0FQUElEIjoiNDNmODE0ZGQyNzI0ODRhMSIsIkFOUyRERUJVRyI6MiwiQU5TVVBMT0FEVVJMIjoiaHR0cHM6Ly9sb2cueWFvbWFpdG9uZy5uZXQvIiwiRlJJU1REQVkiOiIyMDI0MTEyNiIsIkZSSVNUSU1FIjpmYWxzZSwiQVJLX0lEIjoiSlM0Y2RmNTlhOTRhMjUxZTJjZTFiMjRlNzFiMDVkYWNmYzRjZGYiLCJBUktGUklTVFBST0ZJTEUiOiIyMDI0LTExLTI2IDE1OjAzOjEzLjU1OSJ9; _yapi_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjg4LCJpYXQiOjE3MzU4NzQyNTcsImV4cCI6MTczNjQ3OTA1N30.RAnXZksi6vo0DymM8xZQFObmtXB9M-iVPh0oKSQuZLs; _yapi_uid=88'
let obj = {
  typeName: 'ExampleSchema',
  apiId: '27198',
  Cookie
}
generateTypes(obj);
