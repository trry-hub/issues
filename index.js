export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // 1. 静态资源扩展名
      const staticExtensions = [
        ".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".json",
        ".woff", ".woff2", ".ttf", ".eot", ".webp", ".gif", ".map"
      ];
      const isStaticFile = staticExtensions.some((ext) => url.pathname.endsWith(ext));

      // 2. 静态资源请求优先
      if (isStaticFile) {
        if (!env.ASSETS) {
          throw new Error("ASSETS binding is missing!");
        }
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          // 可选：为静态资源添加缓存头
          return new Response(assetResponse.body, {
            status: assetResponse.status,
            headers: {
              ...Object.fromEntries(assetResponse.headers),
              "Cache-Control": "public, max-age=31536000, immutable"
            }
          });
        }
        // 404 则 fallback 到 index.html
      }

      // 3. 根路径 `/` 直接返回 index.html
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
      }

      // 4. 其它所有请求（如 SPA 路由），fallback 到 index.html
      // 可选：你可以在这里排除 /api/ 路径
      // if (url.pathname.startsWith("/api/")) { ... }

      return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
    } catch (error) {
      return new Response(`Worker Error: ${error.message}`, { status: 500 });
    }
  },
};