export default {
  async fetch(request, env) {
    // 获取请求路径（如 /index.html 或 /assets/xxx.js）
    const url = new URL(request.url);
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    
    // 从上传的 assets 中获取文件
    const asset = await env.ASSETS.fetch(new Request(url));
    if (asset.status !== 404) {
      return asset;
    }
    
    // 默认返回 index.html（用于 SPA 路由）
    return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
  }
};