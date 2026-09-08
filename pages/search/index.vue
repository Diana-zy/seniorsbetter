<template>
  <div class="page">
    <Header />
    <main>
      <div class="layout-left">
        <common-page-label :title="`&quot;${input}&quot; Search Results`" />
        <div id="afscontainer1"> </div>
        <div id="relatedsearches1"> </div>
        <!-- TODO: 搜索结果隐藏，等后端 /api/article/search 返回正确的 seo_category_path 后恢复 -->
        <!-- <h3 class="title-h3">{{ searchTitle }}</h3>
        <section>
          <item-search-result v-for="(item, i) in searchResultNews" :key="i" :item="item">
          </item-search-result>
        </section> -->
      </div>
      <div class="layout-right">
        <right-side-box :rec-news="trendingNews?.list" :trending-news="recNews?.list" />
      </div>
    </main>
    <FooterSeo />
  </div>
</template>

<script>
export default {
  async asyncData({ $axios, env }) {
    try {
      const [recNewsResponse, trendingNewsResponse] = await Promise.all([
        $axios.$get("/api/article/menu", {
          params: {
            site_id: env.SITE_ID,
            mod_id: "rec"
          }
        }),
        $axios.$get("/api/article/get_all_articles", {
          params: {
            site_id: env.SITE_ID,
            size: 4,
            page: 1
          }
        })
      ]);
      return {
        recNews: recNewsResponse,
        trendingNews: trendingNewsResponse
      };
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  },
  data() {
    return {
      searchResultNews: [],
      input: "",
      channelId: "",
      isShowResults: false
    };
  },
  computed: {
    searchTitle() {
      const title = this.isShowResults
        ? `Found ${this.searchResultNews.length} results for "${this.input}"`
        : "Loading search results...";
      return title;
    }
  },
  mounted() {
    window.handleRequestAdByChannel("first", 3, true);

    const searchParams = new URLSearchParams(window.location.search);
    this.channelId = searchParams.has("channel") ? searchParams.get("channel") : "";
    if (searchParams.has("from") && searchParams.get("from") === "detail") {
      window.fromDetailId = window.getCookie("SEO_detail");
    }
    window.setCookie("SEO_detail", "");

    this.input = this.$route.query.query || "";
    if (this.input) {
      // 未请求广告的原因统一上报到Q_AR_NOT事件，why_ad_block区分具体原因，
      // 方便在GA4里统计"广告没请求"里各原因各占多少
      const reportAdNotRequested = why => {
        window.pushEventParamsToGtm("Q_AR_NOT", { why_ad_block: why });
      };
      const proceedAfterAdGate = () => {
        window.checkAdGate().then(gate => {
          if (gate.ok) {
            this.addAdSense();
          } else {
            reportAdNotRequested(
              gate.ipMismatch ? "ip_mismatch" : gate.noClid ? "no_clid" : "unknown"
            );
          }
        });
      };
      if (window.isLoadAd === true) {
        proceedAfterAdGate();
      } else {
        window.addEventListener("loadAd", proceedAfterAdGate);
        // 进站IP解析城市变化被拉黑：youknowwho.js里的判断会让loadAd事件
        // 永远不触发（也就不会走到上面的checkAdGate），单独用另一个事件名
        // 兜底监听，避免这种情况完全没有埋点
        window.addEventListener(
          "adGateCityBlocked",
          () => reportAdNotRequested("city_changed"),
          { once: true }
        );
      }
    }
    this.input && this.searchNews();
  },
  methods: {
    addAdSense() {
      setTimeout(() => {
        if (window.handleRequestAdByChannel("", "", true)) {
          window.pushEventParamsToGtm("Q_AR");
          window.trackEventToPixel("Q_AR");
          this.addAdSenseScript();
        }
      }, 0);
    },
    async searchNews() {
      try {
        const response = await this.$axios.$post("/api/article/search", {
          site_id: process.env.SITE_ID,
          key: this.input
        });

        this.searchResultNews = response.list.filter(item => item.seo_category_path);
        this.isShowResults = true;
      } catch (error) {
        this.isShowResults = true;
        console.error("Error fetching data:", error);
      }
    },
    addAdSenseScript() {
      const queryString = this.input;

      const channelId = window.getParam("channel");
      const from = window.getParam("from");
      const hiSource = window.getParam("hi_source");
      const hiPc = window.getParam("hi_pc");
      const resultsPageBaseUrl = window.getResultsPageUrl({
        channel: channelId,
        from,
        hi_source: hiSource,
        hi_pc: hiPc
      });
      const adSenseConfig = {
        channel: channelId,
        pubId: "partner-pub-6612490456597819",
        query: queryString,
        styleId: "6462282781",
        adsafe: "low",
        ivt: false,
        resultsPageBaseUrl,
        resultsPageQueryParam: "query"
      };

      const adLoadedCallback =
        (eventName, additionalData = {}) =>
        (loaded, response) => {
          if (response) {
            // eslint-disable-next-line no-undef
            dataLayer.push({ event: eventName, ...additionalData });
          }
        };

      const adblock1 = {
        container: "afscontainer1",
        number: 8,
        adLoadedCallback: (loaded, e) => {
          if (e) {
            window.trackEventToPixel("C_AR");
            window.pushEventParamsToGtm("C_AR");
            const hi_user_source = getValueByURLOrCookie("hi_source");
            if (hi_user_source === "unknown") {
              window.dataLayer.push({
                event: "Detail_C_AR_C_SEO",
                SEO_detail: window.fromDetailId || ""
              });
            }
            try {
              const element = document.getElementById("master-1");
              const height = parseFloat(element.style.height);
              const result = Math.round(height / 456);
              // eslint-disable-next-line no-undef
              dataLayer.push({ event: "C_AR_IN", num: result, query: queryString });
            } catch (error) {
              console.error(error);
            }
          } else {
            // eslint-disable-next-line no-undef
            dataLayer.push({ event: "FF_AR", query: queryString });
          }
        }
      };

      const rsblock1 = (() => {
        const baseConfig = {
          container: "relatedsearches1",
          relatedSearches: 5,
          adLoadedCallback: adLoadedCallback("C_AC", { query: queryString })
        };
        return baseConfig;
      })();

      // eslint-disable-next-line no-undef
      _googCsa("ads", adSenseConfig, adblock1, rsblock1);
    }
  }
};
</script>

<style lang="scss" scoped>
main {
  padding-bottom: 32px;
  border-bottom: 1px solid #ececee;
}
.title-h3 {
  color: $font4;
}
@media screen and (max-width: 750px) {
  main {
    padding-bottom: vw(32);
    border-bottom: vw(2) solid #ececee;
  }
}
</style>
