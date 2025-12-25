<template>
  <div class="page">
    <Header />
    <main class="main">
      <h3 class="title-h3">Web Results</h3>
      <section class="news-box-3">
        <news-item-3 v-for="(item, i) in news" :key="i" :item="item"> </news-item-3>
      </section>
    </main>
    <Footer />
  </div>
</template>

<script>
export default {
  data() {
    return {
      news: [], // 新闻列表
      input: "", // 搜索输入
      channelId: "" // 频道 ID
    };
  },
  mounted() {
    const searchParams = new URLSearchParams(window.location.search);
    this.channelId = searchParams.has("channel") ? searchParams.get("channel") : "";

    this.input = this.$route.query.query || "";
    this.input && this.searchNews();
  },
  methods: {
    async searchNews() {
      try {
        if (this.channelId) {
          const purchaseValueResponse = await this.$axios.$get("/api/common/qdhzhygz", {
            params: {
              site_id: process.env.SITE_ID,
              qdh: this.channelId
            }
          });
          window.purchaseValue = purchaseValueResponse.ygz;
        }

        const response = await this.$axios.$post("/api/article/search", {
          site_id: process.env.SITE_ID,
          key: this.input
        });
        this.news = response.list;
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.main {
  padding-bottom: 32px;
  border-bottom: 1px solid #ececee;
}
.title-h3 {
  color: rgba($font3, 0.6);
}
@media screen and (max-width: 750px) {
  .main {
    padding-bottom: vw(32);
    border-bottom: vw(2) solid #ececee;
  }
}
</style>
