<template>
  <div class="page home-page">
    <Header />
    <h1 style="display: none">Essential Resources and Tips for Elders' Well-being</h1>
    <main class="main">
      <div class="layout-left">
        <section v-swiper:mySwiper="swiperOption" class="swiper-box">
          <div class="swiper-wrapper">
            <item-swiper-rec
              v-for="(item, i) in recNews && recNews.list"
              :key="i"
              class="swiper-slide"
              :item="item"
              :index="i"
            >
            </item-swiper-rec>
          </div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-button-next"></div>
        </section>

        <h2 class="title-new-tag">Latest Articles</h2>
        <section class="news-box-new">
          <item-text-new v-for="(item, i) in trendingNews && trendingNews.list" :key="i" :item="item">
          </item-text-new>
        </section>

        <div v-for="(items, index) in categoryList" class="category-box" :key="items.id">
          <h2 class="title-h2">{{ items.seo_category && items.seo_category.name }}</h2>
          <section>
            <div class="news-box-2">
              <news-item-2 v-for="(item, i) in items && items.list" :key="i" :item="item" :index="index">
              </news-item-2>
            </div>
          </section>
        </div>
      </div>
      <div class="layout-right">
        <right-side-box :rec-news="(trendingNews && trendingNews.list) || []" :trending-news="(recNews && recNews.list) || []" />
      </div>
    </main>
    <FooterSeo />
  </div>
</template>

<script>
import { directive } from "vue-awesome-swiper";
import "swiper/css/swiper.min.css";
import { simulateAFSSearch, filterSeoArticles } from "~/utils/utils";

export default {
  directives: {
    swiper: directive
  },
  async asyncData({ $axios, env }) {
    try {
      const [recNewsResponse, trendingNewsResponse, allNewsResponse, categoryResponse] =
        await Promise.all([
          $axios.$get("/api/article/menu", {
            params: {
              site_id: env.SITE_ID,
              mod_id: "rec",
              size: 20
            }
          }).catch(() => null),
          $axios.$get("/api/article/get_all_articles", {
            params: {
              site_id: env.SITE_ID,
              size: 4,
              page: 1
            }
          }).catch(() => null),
          $axios.$get("/api/article/menu", {
            params: {
              site_id: env.SITE_ID,
              mod_id: "all",
              page: 1,
              size: 4
            }
          }).catch(() => null),
          $axios.$get("/api/article/get_all_seo_category", {
            params: {
              site_id: env.SITE_ID
            }
          }).catch(() => null)
        ]);

      const categoryItems = (categoryResponse && categoryResponse.list) || [];
      const category = categoryItems.map((item) =>
        $axios.$get("/api/article/get_seo_category_page", {
          params: {
            site_id: env.SITE_ID,
            seo_category_id: item.id,
            size: 4,
            page: 1
          }
        }).catch(() => null)
      );
      const list = await Promise.all(category);

      // 首页展示的这几个列表都要过滤掉非SEO文章(投放落地页)，避免混进
      // 正常内容展示、影响站点SEO效果
      if (recNewsResponse) recNewsResponse.list = filterSeoArticles(recNewsResponse.list);
      if (trendingNewsResponse) trendingNewsResponse.list = filterSeoArticles(trendingNewsResponse.list);
      if (allNewsResponse) allNewsResponse.list = filterSeoArticles(allNewsResponse.list);
      const filteredList = list.map((item) => {
        if (item) item.list = filterSeoArticles(item.list);
        return item;
      });

      return {
        recNews: recNewsResponse,
        trendingNews: trendingNewsResponse,
        allNews: allNewsResponse,
        categoryList: filteredList.filter((item) => item != null)
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return {
        recNews: null,
        trendingNews: null,
        allNews: null,
        categoryList: []
      };
    }
  },
  data() {
    return {
      swiperOption: {
        slidesPerView: "auto",
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev"
        }
      },
      input: ""
    };
  },
  mounted() {},
  methods: {
    search() {
      if (this.input.length < 1) {
        this.$globalMethod.showNotification({
          message: "Please enter at least 1 characters",
          type: "warning"
        });
        return;
      }

      simulateAFSSearch(this.input);
    },
    clear() {
      this.input = "";
    }
  }
};
</script>
<style lang="scss" scoped>
.main {
  padding-bottom: 32px;
  border-bottom: 1px solid #ececee;
}
.category-box {
  display: flex;
  flex-direction: column;
  gap: 0px;
}
.swiper-box {
  position: relative;
  overflow: hidden;
  .swiper-button-prev {
    top: 209px;
    @include icon(50px, 50px, "icon-left.png");
    &:after {
      content: "";
    }
  }
  .swiper-button-next {
    top: 209px;
    @include icon(50px, 50px, "icon-right.png");
    &:after {
      content: "";
    }
  }
}
.news-box-2 {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.home-search {
  width: 100%;
  height: 315px;
  background-image: url("~/assets/images/bg-pc.webp");
  background-size: cover;
  margin-bottom: 32px;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;

  .search-group {
    position: relative;
  }
  .search {
    margin-top: 110px;
    width: 560px;
    height: 48px;
    background: #ffffff;
    box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0);
    border-radius: 4px 4px 4px 4px;
    padding-left: 16px;
    padding-right: 126px;
    &::placeholder {
      color: rgba($font1, 0.6);
    }
  }
  .icon-search {
    display: block;
    position: absolute;
    right: -1px;
    top: 110px;
    width: 64px;
    height: 48px;
    cursor: pointer;
    border-radius: 0 4px 4px 0;
    background-color: $color1;
    background-image: url("~/assets/images/icon-search.png");
    background-size: 30px;
    background-repeat: no-repeat;
    background-position: center;
  }
  .icon-clear {
    position: absolute;
    right: 76px;
    top: 122px;
    cursor: pointer;
    background-image: url("~/assets/images/icon-clear.png");
    width: 24px;
    height: 24px;
    background-size: cover;
  }

  .words-container {
    margin-top: 24px;
    width: 560px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
  }

  .marquee {
    display: flex;
    overflow: hidden;
    user-select: none;
    gap: 12px;
  }

  .marquee-group {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 12px;
    min-width: 100%;
    animation: scrollLeft 40s linear infinite;
  }
  .marquee:nth-child(even) {
    margin-left: calc(vw(176) / -2);
  }
  .hot-words {
    background: rgba(23, 23, 23, 0.35);
    border-radius: 4px 4px 4px 4px;
    padding: 6px 8px;
    font-family: "se3";
    font-size: 12px;
    color: #ffffff;
    text-align: left;
    cursor: pointer;
  }
}

.swiper-slide {
  overflow: hidden;
}
.news-box-new {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.rec {
  display: none;
}

@keyframes scrollLeft {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-100% - vw(16)));
  }
}
@media screen and (max-width: 1100px) {
  .news-box-2 {
  }
}
@media screen and (max-width: 750px) {
  .main {
    padding-bottom: vw(32);
    border-bottom: none;
  }

  .home-search {
    width: 100vw;
    height: vw(392);
    background-image: url("~/assets/images/bg-m.webp");
    margin-bottom: vw(48);
    margin-left: vw(-46);
    margin-top: vw(-48);
    .search {
      margin-top: vw(66);
      width: vw(658);
      height: vw(80);
      box-shadow: 0 0 vw(16) 0 rgba(0, 0, 0, 0);
      border-radius: vw(8);
      padding-left: vw(34);
      padding-right: vw(210);
    }
    .icon-search {
      top: vw(66);
      width: vw(128);
      height: vw(80);
      border-radius: 0 vw(8) vw(8) 0;
      background-size: vw(48);
    }
    .icon-clear {
      top: vw(90);
      right: vw(144);
      width: vw(32);
      height: vw(32);
    }
    .words-container {
      margin-top: vw(16);
      width: 100%;
    }
  }

  .rec {
    margin-top: vw(24);
    display: inline-block;
    text-align: center;
    font-family: "hem";
    font-size: 12px;
    color: #ffffff;
  }
  .swiper-box {
    margin-top: vw(32);
    width: 100%;
    .swiper-button-prev {
      top: vw(186);
      @include icon(vw(64), vw(64), "icon-left.png");
      &:after {
        content: "";
      }
    }
    .swiper-button-next {
      top: vw(186);
      @include icon(vw(64), vw(64), "icon-right.png");
      &:after {
        content: "";
      }
    }
  }
  .swiper-slide {
    width: 100%;
    height: vw(764);
  }
  .news-box-2 {
    gap: vw(28) vw(14);
  }
  .news-box-new {
    grid-template-columns: repeat(1, 1fr);
    gap: vw(20);
  }
}
</style>
