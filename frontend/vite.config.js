import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Стили вшиваем прямо в index.html тегом <style>, а не отдельным .css файлом.
// Причина: отдельный файл может не доехать до браузера (404, кэш, неверный MIME на
// хостинге) — и тогда страница открывается как голый HTML. Инлайн этого не допускает.
//
// Важно: index.html в Vite 5 обрабатывается хуком transformIndexHtml (order: 'post'),
// где уже доступен собранный бандл. В generateBundle его ещё нет — старый вариант
// плагина поэтому и не срабатывал.
function inlineCss() {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx?.bundle) return html;
        const cssFiles = Object.keys(ctx.bundle).filter((f) => f.endsWith('.css'));
        if (!cssFiles.length) return html;

        let css = '';
        for (const f of cssFiles) {
          css += ctx.bundle[f].source;
          delete ctx.bundle[f];              // отдельный файл больше не нужен
        }
        return html
          .replace(/<link[^>]+rel="stylesheet"[^>]*assets\/[^>]*>/g, '')
          .replace('</head>', `<style>${css}</style></head>`);
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineCss()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },   // локальная разработка
  },
});
