export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 1. 先尝试返回静态资源（CSS/JS/图片等）
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.svg', '.ico'];
    const isStaticFile = staticExtensions.some(ext => url.pathname.endsWith(ext));
    
    if (isStaticFile) {
      return env.ASSETS.fetch(request);
    }
    
    // 2. 其他所有请求返回 index.html（让前端路由接管）
    return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
  }
};