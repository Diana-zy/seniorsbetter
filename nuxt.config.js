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
      const pathData = await fetch(
        `${process.env.PROD_API_URL}/api/article/get_all_path_v2?site_id=${process.env.SITE_ID}`
      );
      const path = await pathData.json();
      const categoryPaths = path.data.seo_category.map((item) => `/category/${item}/`);
      // URL层级优化：保持 /detail/前缀，后端返回的path_v2已包含分类slug
      const detailPaths = path.data.detail.map((item) => `/${item}/`);
      const urls = [...categoryPaths, ...detailPaths];
      return urls;
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
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }]
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
  buildModules: ["@nuxtjs/style-resources", "@nuxt/image","@nuxtjs/pwa", "@nuxtjs/sitemap"],
  css: ["@/assets/css/fonts.css", "@/assets/css/reset.css", "@/assets/css/common.scss"],
  styleResources: {
    scss: ["~/assets/css/_mixins.scss"]
  },
  modules: ["@nuxtjs/axios"],
  sitemap: {
    hostname: "https://www.seniorsbetter.com/",
    filter({ routes }) {
      return routes.filter(route => route.url && route.url.trim() !== "");
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
