export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // 1. 静态资源请求（JS/CSS/图片等）
      const staticExtensions = [".js", ".css", ".png", ".jpg", ".svg", ".ico"];
      const isStaticFile = staticExtensions.some((ext) => url.pathname.endsWith(ext));

      if (isStaticFile) {
        // 确保 env.ASSETS 存在
        if (!env.ASSETS) {
          throw new Error("ASSETS binding is missing!");
        }
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return assetResponse;
        }
      }

      // 2. 其他所有请求返回 index.html（前端路由接管）
      return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
    } catch (error) {
      return new Response(`Worker Error: ${error.message}`, { status: 500 });
    }
  },
};