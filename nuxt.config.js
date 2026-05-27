import TerserPlugin from "terser-webpack-plugin";
import OptimizeCSSAssetsPlugin from "optimize-css-assets-webpack-plugin";

export default {
  target: "static",
  server: {
    host: "0.0.0.0"
  },
  env: {
    // SITE_ID: process.env.SITE_ID
    SITE_ID: process.env.SITE_ID
  },
  generate: {
    crawler: false,
    concurrency: 1,
    interval: 2000,
    async routes() {
      const fetchWithRetry = async (url, retries = 4, delay = 2000) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fetch(url);
          } catch (e) {
            if (i < retries - 1) await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
            else throw e;
          }
        }
      };
      const pathData = await fetchWithRetry(
        `${process.env.PROD_API_URL}/api/article/get_all_path_v2?site_id=${process.env.SITE_ID}`
      );
      const path = await pathData.json();
      const categoryPaths = path.data.seo_category
        .filter((item) => item && String(item).trim())
        .map((item) => `/category/${item}/`);
      const detailPaths = path.data.detail
        .filter((item) => item && String(item).trim())
        .map((item) => `/${item}/`);
      return [...categoryPaths, ...detailPaths];
    }
  },
  axios: {
    baseURL:
      process.env.NODE_ENV === "production" ? process.env.PROD_API_URL : process.env.TEST_API_URL
  },
  router: {
    trailingSlash: true,
    extendRoutes(routes, resolve) {
      routes.push({
        name: "category-detail",
        path: "/:category/:detail",
        component: resolve(__dirname, "pages/detail/_detail.vue")
      });
    }
  },
  head: {
    title: "Seniors Better | Essential Resources and Tips for Elders' Well-being",
    meta: [
      {
        name: "version",
        content: process.env.APP_VERSION || "1.0"
      },
      {
        name: "viewport",
        content:
          "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,minimal-ui"
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes"
      },
      {
        name: "mobile-web-app-capable",
        content: "yes"
      },
      {
        hid: "description",
        name: "description",
        content:
          "Discover essential resources, expert advice, and practical tips for seniors to enhance their well-being. Start exploring today and live a fulfilling, independent life."
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Seniors Better"
      },
      {
        property: "twitter:site_name",
        content: "Seniors Better"
      },
      {
        hid: "twitter:description",
        name: "twitter:description",
        content:
          "Discover essential resources, expert advice, and practical tips for seniors to enhance their well-being. Start exploring today and live a fulfilling, independent life."
      }
    ],
    link: [{ rel: "icon", type: "image/png", href: "/favicon.png" }]
  },
  image: {
    provider: "cloudflare",
    cloudflare: {
      baseURL: "https://bunchthings.com"
    }
  },
  plugins: [
    { src: "~/plugins/vue-infinite-scroll", ssr: false },
    "~/plugins/axios",
    "~/plugins/global-data",
    "~/plugins/nav-data"
  ],
  components: true,
  buildModules: ["@nuxt/image", "@nuxtjs/pwa"],
  css: ["@/assets/css/fonts.css", "@/assets/css/reset.css", "@/assets/css/common.scss"],
  modules: ["@nuxtjs/axios"],
  hooks: {
    'generate:done'(generator) {
      const nodePath = require('path')
      const fs = require('fs')
      const hostname = 'https://www.seniorsbetter.com'
      const today = new Date().toISOString().split('T')[0]

      const routes = [...generator.generatedRoutes].filter(
        (r) => r && typeof r === 'string' && !r.includes(':')
      )

      const urlEntries = routes
        .map(
          (r) =>
            `  <url>\n    <loc>${hostname}${r}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
        )
        .join('\n')

      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urlEntries +
        `\n</urlset>`

      const outputPath = nodePath.join(generator.options.generate.dir, 'sitemap.xml')
      fs.writeFileSync(outputPath, xml, 'utf8')
    }
  },
  pwa: {
    manifest: {
      name: "Seniors Better",
      short_name: "Seniors Better",
      description:
        "Welcome to Seniors Better, your dedicated digital resource designed to help elders navigate the aging journey with confidence and independence."
    },
    icon: {
      source: "./static/icon.png"
    }
  },
  build: {
    loaders: {
      scss: {
        additionalData: '@import "~/assets/css/_mixins.scss";'
      }
    },
    html: {
      minify: {
        collapseWhitespace: true,
        removeComments: true
      }
    },
    extractCSS: {
      ignoreOrder: true
    },
    optimization: {
      splitChunks: {
        chunks: "all",
        automaticNameDelimiter: ".",
        name: true,
        minSize: 10000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            name: "vendors",
            test: /[\\/]node_modules[\\/]/,
            chunks: "all",
            maxSize: 244000,
            priority: -10
          },
          styles: {
            name: "styles",
            test: /\.(css|vue)$/,
            chunks: "all",
            enforce: true
          }
        }
      },
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true
            },
            output: {
              comments: false
            }
          }
        }),
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            map: { inline: false },
            discardComments: { removeAll: true }
          }
        })
      ]
    }
  },
  purgeCSS: {
    whitelistPatterns: [
      /^swiper-container/,
      /^swiper-wrapper/,
      /::v-deep/, // 添加这些
      /\/deep\//, // 添加这些
      />>>/
    ] // 忽略swiper样式
  }
};
