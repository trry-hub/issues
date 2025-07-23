export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    return await env.ASSETS.fetch(new Request(url));
  }
};