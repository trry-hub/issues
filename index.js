export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 1. 先尝试返回静态资源（如 /assets/xxx.js、/favicon.ico）
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }
    
    // 2. 如果静态资源不存在，返回 index.html（让前端路由处理）
    return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
  }
};