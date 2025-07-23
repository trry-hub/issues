export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // 1. 静态资源请求（JS/CSS/图片等）
      const staticExtensions = ['.js', '.css', '.png', '.jpg', '.svg', '.ico', '.json'];
      const isStaticFile = staticExtensions.some(ext => url.pathname.endsWith(ext));
      
      if (isStaticFile) {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return assetResponse;
        }
      }
      
      // 2. 其他所有请求返回 index.html（前端路由接管）
      return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
    } catch (error) {
      // 3. 捕获异常，返回 500 错误或 fallback 页面
      return new Response('Worker Error: ' + error.message, { status: 500 });
    }
  }
};