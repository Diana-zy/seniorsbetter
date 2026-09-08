<template>
  <div class="page">
    <Header />
    <main class="main">
      <div class="layout-left">
        <div class="page-layout">
          <breadcrumb :info="newInfo"></breadcrumb>
          <article class="article" v-if="newInfo">
            <h1 class="article-title" style="">{{ newInfo.name }}</h1>
            <div class="news-author">
              <nuxt-link
                v-if="newInfo.author && newInfo.author.id"
                :to="`/author/${toAuthorSlug(newInfo.author.name, newInfo.author.id)}/`"
                class="author-link"
              >{{ newInfo.author.name }}</nuxt-link>
              <span v-else>{{ newInfo.author && newInfo.author.name }}</span>
              <div>{{ newInfo.updated_at }}</div>
            </div>
            <div class="news-detail first_paragraph">{{ newInfo.first_paragraph }}</div>

            <div class="article-summary" v-if="newInfo.seo_desc">
              <div class="summary-icon">📋</div>
              <div class="summary-content">
                <h3 class="summary-title">Article Summary</h3>
                <p class="summary-text">{{ newInfo.seo_desc }}</p>
              </div>
            </div>

            <div id="relatedsearches1"> </div>
            <aside class="toc-container" v-if="toc.length">
              <h3 class="toc-title">Table of Contents</h3>
              <nav class="toc-nav">
                <ul class="toc-list">
                  <li
                    v-for="item in toc"
                    :key="item.id"
                    :class="['toc-item', `toc-level-${item.level}`]"
                    @click="scrollToAnchor(item.id)"
                  >
                    {{ item.text }}
                  </li>
                </ul>
              </nav>
            </aside>
            <NuxtImg
              format="auto"
              fit="cover"
              width="600"
              :src="newInfo.cover || '/icon.png'"
              :alt="newInfo.cover_seo_alt"
              class="article-img"
              preload
            />
            <!-- eslint-disable vue/no-v-html -->
            <div class="news-detail" v-html="htmlWithAnchor"></div>
            <!--eslint-enable-->

            <section class="faq-section" v-if="articleFaqs && articleFaqs.length">
              <h2 class="faq-title">Related Questions</h2>
              <div class="faq-list">
                <div v-for="(faq, index) in articleFaqs" :key="index" class="faq-item">
                  <h3 class="faq-question">{{ faq.question }}</h3>
                  <p class="faq-answer">{{ faq.answer }}</p>
                </div>
              </div>
            </section>
          </article>
          <section v-if="newInfo && newInfo.related_articles && newInfo.related_articles.length">
            <h3 class="title-h2">Related Articles</h3>
            <div class="related-articles">
              <news-item-5 v-for="(item, i) in newInfo.related_articles" :key="i" :item="item">
              </news-item-5>
            </div>
          </section>
        </div>
      </div>
      <div class="layout-right">
        <right-side-box :rec-news="recNews" :trending-news="trendingNews" />
      </div>
    </main>
    <footer-seo :info="newInfo || {}" />
  </div>
</template>

<script>
import { shuffleArray, capitalizeFirstLetter, toAuthorSlug } from "../../utils/utils";
import Breadcrumb from "../../components/Breadcrumb";
import CustomLink from "../../components/CustomLink";
import ItemModeNew from "../../components/Item/ModeNew";
import RightSideBox from "../../components/RightSideBox";
import { processHtmlWithToc, generateNestedToc } from "../../utils/cheerio-toc.js";

export default {
  components: { Breadcrumb, CustomLink, ItemModeNew, RightSideBox },
  async asyncData({ $axios, params, env }) {
    const path = params.detail;
    const lastDashIndex = path.lastIndexOf("-");
    const id = path.substring(lastDashIndex + 1, path.length);

    try {
      let data = null;
      try {
        data = await $axios.$get("/api/article/detail", {
          params: {
            site_id: env.SITE_ID,
            article_id: id,
            related_num: 3
          }
        });
      } catch (detailError) {
        console.error(`Failed to fetch detail for ID ${id}:`, detailError);
        return {
          newInfo: null,
          all: null,
          floatArray: [],
          toc: [],
          id,
          htmlWithAnchor: "",
          recNews: [],
          trendingNews: [],
          articleFaqs: []
        };
      }

      console.log("Detail data check:", { hasData: !!data, hasContent: !!data?.content, contentLength: data?.content?.length });
      if (!data?.content) {
        console.warn(`No content found for ID ${id}`);
        return {
          newInfo: null,
          all: null,
          floatArray: [],
          toc: [],
          id,
          htmlWithAnchor: "",
          recNews: [],
          trendingNews: [],
          articleFaqs: []
        };
      }

      let recNewsResponse = null;
      let trendingNewsResponse = null;
      let allResponse = null;

      try {
        [recNewsResponse, trendingNewsResponse, allResponse] = await Promise.all([
          $axios.$get("/api/article/menu", {
            params: {
              site_id: env.SITE_ID,
              mod_id: "rec"
            }
          }).catch(err => {
            console.error("recNews API error:", err.message);
            return null;
          }),
          $axios.$get("/api/article/get_all_articles", {
            params: {
              site_id: env.SITE_ID,
              size: 4,
              page: 1
            }
          }).catch(err => {
            console.error("trendingNews API error:", err.message);
            return null;
          }),
          $axios.$get("/api/article/menu", {
            params: {
              site_id: env.SITE_ID,
              mod_id: "all",
              page: 1,
              size: 20
            }
          }).catch(err => {
            console.error("allResponse API error:", err.message);
            return null;
          })
        ]);
      } catch (error) {
        console.error("Parallel fetch error:", error);
      }

      const extractList = (response) => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (response.list) return response.list;
        if (response.data?.list) return response.data.list;
        if (response.data && Array.isArray(response.data)) return response.data;
        if (response.items) return response.items;
        if (response.result) return response.result;
        return [];
      };

      data.content = data.content.replace(/font-family:\s*['"']?宋体['"']?;/g, "");
      data.content = data.content.replace(/<\/h4><p><br><br>|<br><br><\/p><h4>/g, (match) => {
        return match.includes("</h4><p>") ? "</h4><p>" : "</p><h4>";
      });

      const { toc: flatToc, htmlWithAnchor: rawHtml } = processHtmlWithToc(data.content, [2]);
      const toc = generateNestedToc(flatToc);

      let htmlWithAnchor = rawHtml
        .replace(/(<table)/g, '<div class="table-scroll-wrapper">$1')
        .replace(/<\/table>/g, '</table></div>');
      const pEnds = [];
      const pRegex = /<\/p>/gi;
      let pMatch;
      while ((pMatch = pRegex.exec(rawHtml)) !== null) {
        pEnds.push(pMatch.index + pMatch[0].length);
      }
      if (pEnds.length > 0) {
        const midPos = pEnds[Math.floor(pEnds.length / 2)];
        htmlWithAnchor = rawHtml.slice(0, midPos) + '<div id="relatedsearches2"></div>' + rawHtml.slice(midPos);
      }

      const articleFaqs = data.faqs || [
        {
          question: "Would you like to know more about the content of this article?",
          answer: "Our site provides the latest information on senior well-being. Related articles introduce each topic in detail."
        },
        {
          question: "When should seniors start planning for their well-being?",
          answer: "It is generally recommended to start planning early. The sooner you begin, the more time you have to build a comfortable and fulfilling lifestyle."
        },
        {
          question: "Where can I find more information about senior well-being?",
          answer: "Visit the category pages on Seniors Better to find more articles with expert advice and practical tips for elders."
        }
      ];

      return {
        newInfo: data,
        all: allResponse,
        floatArray: shuffleArray(allResponse?.list?.slice() || []),
        toc,
        id,
        htmlWithAnchor,
        recNews: extractList(recNewsResponse),
        trendingNews: extractList(trendingNewsResponse),
        articleFaqs
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      return {
        newInfo: null,
        all: null,
        floatArray: [],
        toc: [],
        id,
        htmlWithAnchor: "",
        recNews: [],
        trendingNews: [],
        articleFaqs: []
      };
    }
  },
  data() {
    return {
      channelId: "",
      navData: this.$root.$options.navData || this.$navData || {}
    };
  },
  head() {
    const seoTitle = this.newInfo?.seo_title || this.newInfo?.name;
    const seoDesc = this.newInfo?.seo_desc;
    return {
      title: seoTitle ? `${seoTitle} - Seniors Better` : "Seniors Better",
      meta: [
        {
          hid: "description",
          name: "description",
          content: seoDesc
        },
        {
          hid: "og:title",
          property: "og:title",
          content: seoTitle
        },
        {
          hid: "og:description",
          property: "og:description",
          content: seoDesc
        },
        {
          hid: "og:url",
          property: "og:url",
          content: `https://seniorsbetter.com/${this.newInfo?.path_v2}/`
        },
        {
          hid: "og:locale",
          property: "og:locale",
          content: this.newInfo?.language
        },
        {
          hid: "og:image",
          property: "og:image",
          content: `https://bunchthings.com/cdn-cgi/image/w=600,f=auto,fit=cover/${this.newInfo?.cover}`
        },
        {
          hid: "og:type",
          property: "og:type",
          content: "article"
        },
        {
          hid: "twitter:image",
          property: "twitter:image",
          content: `https://bunchthings.com/cdn-cgi/image/w=600,f=auto,fit=cover/${this.newInfo?.cover}`
        },
        {
          hid: "twitter:title",
          property: "twitter:title",
          content: seoTitle
        },
        {
          hid: "twitter:description",
          property: "twitter:description",
          content: seoDesc
        },
        {
          hid: "twitter:url",
          property: "twitter:url",
          content: `https://seniorsbetter.com/${this.newInfo?.path_v2}/`
        },
        {
          hid: "twitter:locale",
          property: "twitter:locale",
          content: this.newInfo?.language
        }
      ],
      script: [
        {
          type: "application/ld+json",
          json: {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: (this.articleFaqs || []).map(faq => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer
              }
            }))
          }
        },
        {
          type: "application/ld+json",
          json: {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            articleBody: this.newInfo?.content_text || "",
            articleSection: `Home, ${
              this.newInfo?.seo_category_name || this.newInfo?.category_locale_name || ""
            }, ${this.newInfo?.name || ""}`,
            headline: this.newInfo?.seo_title || this.newInfo?.name || "",
            description: seoDesc || "",
            datePublished: this.newInfo?.updated_at || "",
            dateModified: this.newInfo?.updated_at || "",
            author: [
              {
                "@type": "Person",
                name: this.newInfo?.author?.name || "",
                description: this.newInfo?.author?.intro || "",
                image: `https://bunchthings.com/${this.newInfo?.author?.avatar || ""}`,
                url: this.newInfo?.author?.id
                  ? `https://seniorsbetter.com/author/${toAuthorSlug(this.newInfo.author.name, this.newInfo.author.id)}/`
                  : undefined
              }
            ],
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://seniorsbetter.com/${this.newInfo?.path_v2 || ""}/`
            },
            publisher: {
              "@type": "NewsMediaOrganization",
              name: "Seniors Better",
              url: "https://seniorsbetter.com",
              publishingPrinciples: "https://seniorsbetter.com/us/",
              sameAs: this.$sameAs
            },
            image: [
              `https://bunchthings.com/cdn-cgi/image/f=auto,fit=cover/${this.newInfo?.cover || ""}`,
              `https://bunchthings.com/cdn-cgi/image/w=600,f=auto,fit=cover/${this.newInfo?.cover || ""}`
            ]
          }
        },
        {
          type: "application/ld+json",
          json: {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                item: {
                  "@id": "https://seniorsbetter.com/",
                  name: "Home"
                }
              },
              {
                "@type": "ListItem",
                position: 2,
                item: {
                  "@id": `https://seniorsbetter.com/category/${this.newInfo?.category_id || ""}/`,
                  name: this.newInfo?.category_name || ""
                }
              },
              {
                "@type": "ListItem",
                position: 3,
                item: {
                  "@id": `https://seniorsbetter.com/${this.newInfo?.path_v2 || ""}/`,
                  name: this.newInfo?.name || ""
                }
              }
            ]
          }
        }
      ]
    };
  },

  mounted: function () {
    this.handleCreateTableParentDom();
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("channel")) {
      this.channelId = searchParams.get("channel");
    } else {
      this.channelId = this.newInfo?.channel || "";
      // URL本身没带channel、从文章配置兜底取到的情况下，不改当前URL（避免
      // 碰到SEO文章的地址栏），改成写一个当次访问的短期cookie，供
      // handleRequestAdByChannel()在URL读不到channel时兜底读取——保证
      // 详情页和后续结果页对同一次访问判断出一致的channel，不然详情页记录
      // 的漏斗状态和结果页读到的channel对不上号，广告请求会被误挡
      if (this.channelId !== "") {
        window.setCookie("hi_channel_fallback", this.channelId, 1);
      }
    }
    window.handleRequestAdByChannel("mounted", 1);
    this.$nextTick(() => {
      this.handleAdsScript();
    });
  },
  methods: {
    toAuthorSlug,
    capitalizeFirstLetter,
    scrollToAnchor(anchorId) {
      const target = document.getElementById(anchorId);
      if (!target) return;
      const navbarHeight = 60;
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
      window.scrollTo({
        top: targetTop,
        behavior: "smooth"
      });
      window.history.pushState({}, "", `#${anchorId}`);
    },
    handleAdsScript() {
      if (this.newInfo?.no_entry !== 1) {
        this.addAdSenseScript();
      }
    },
    addAdSenseScript() {
      const searchParams = new URLSearchParams(window.location.search);
      let terms = searchParams.has("terms") ? searchParams.get("terms") : "";
      terms = terms.replace(/[，]/g, ",");
      let headline = searchParams.has("headline") ? searchParams.get("headline") : "";
      if (headline === "{title}" || headline === "{{ad_title}}") {
        headline = "";
      }

      const paramKeys = [];
      for (const param of searchParams) {
        paramKeys.push(param[0]);
      }
      const ignoredPageParams = paramKeys.join(",");

      const hiSource = window.getParam("hi_source");
      const hiPc = window.getParam("hi_pc");
      const resultsPageBaseUrl = window.getResultsPageUrl({
        channel: this.channelId,
        from: "detail",
        hi_source: hiSource,
        hi_pc: hiPc
      });
      const adSenseConfig = {
        channel: this.channelId,
        pubId: "partner-pub-6612490456597819",
        styleId: "6462282781",
        adsafe: "low",
        adtest: "off",
        ignoredPageParams,
        relatedSearchTargeting: "content",
        resultsPageBaseUrl,
        resultsPageQueryParam: "query",
        terms: terms || this.newInfo?.terms,
        referrerAdCreative: headline || terms || this.newInfo?.referrer_ad_creative,
        ivt: false
      };

      // eslint-disable-next-line no-undef
      _googCsa(
        "relatedsearch",
        adSenseConfig,
        {
          container: "relatedsearches1",
          relatedSearches: 5,
          adLoadedCallback: function (loaded, response, isExperimentVariant, callbackOptions) {
            if (response) {
              window.trackEventToPixel("D_C_AC");
              window.pushEventParamsToGtm("C_AC");
              window.handleRequestAdByChannel("query_ad", 1);
              const hi_user_source = window.getValueByURLOrCookie("hi_source");
              if (hi_user_source === "unknown") {
                window.dataLayer.push({
                  event: "Detail_D_C_AC_SEO",
                  SEO_detail: "detail_" + this.id
                });
              }
              try {
                let numberOfKeys = 0;
                let concatenatedKeys = "miss";
                if (callbackOptions.termPositions) {
                  const keys = Object.keys(callbackOptions.termPositions);
                  numberOfKeys = keys.length;
                  concatenatedKeys = keys.join(",");
                }

                const element = document.getElementById("master-1");
                const height = parseFloat(element.style.height);
                const result = Math.round(height / 105);

                // eslint-disable-next-line no-undef
                dataLayer.push({
                  event: "C_AC_IN",
                  queryNum: 10,
                  num: result,
                  key1: numberOfKeys,
                  key2: concatenatedKeys
                });
              } catch (e) {
                console.log(e);
              }
            }
          }
        },
        {
          container: "relatedsearches2",
          relatedSearches: 5
        }
      );
    },
    handleCreateTableParentDom() {
      let doms = Array.from(document.querySelectorAll(".news-detail table"));
      doms.forEach(dom => {
        dom.classList.add("table-container");
        if (!dom.parentNode.classList.contains("table-container-parent")) {
          let newParent = document.createElement("div");
          newParent.setAttribute("class", "table-container-parent");
          let parent = dom.parentNode;
          parent.insertBefore(newParent, dom);
          newParent.appendChild(dom);
        }
      });
    }
  }
};
</script>

<style lang="scss">
::v-deep .table-scroll-wrapper,
::v-deep .table-container-parent {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.news-author {
  display: flex;
  justify-content: space-between;
  margin-top: 13px;
  font-size: 14px;
  padding-bottom: 16px;
  @include author-icon(25px, 25px);

  .author-link {
    color: inherit;
    text-decoration: none;
    &:hover {
      color: $color1;
    }
  }
}
::v-deep .table-container {
  position: relative;
  width: max-content;
  min-width: 100%;
  margin: 24px 0;
  border-top: 3px solid rgba($font3, 0.65);
  border-collapse: collapse;
  tr {
    text-align: center;
    padding: 10px;
    height: 61px;
    td {
      min-width: 120px;
      background: rgba(#fd9a25, 0.1);
      border: 2px solid #fff;
      font-size: 14px;
      color: $font5;
    }
    td:first-child {
      font-size: 16px;
      color: $font5;
    }
  }
  tr:first-child {
    th,td {
      min-width: 120px;
      color: $font5;
      font-size: 16px;
      border-bottom: 3px solid rgba($font3, 0.35);
    }
  }
}
::v-deep .iframe-video-style {
  width: 100%;
  aspect-ratio: 16/9;
  iframe {
    width: 100%;
    height: 100%;
  }
}
.page-layout {
  padding: 0 20px;
}
.article-img {
  width: 100%;
  margin-bottom: 1em;
}
::v-deep .article {
  line-height: 1.5;
  font-family: "hem";
  font-size: 16px;
  padding-bottom: 32px;
  border-bottom: 1px solid #ececee;
  min-height: calc(100vh - 72px - 56px - 64px);
  menu,
  ul {
    list-style: disc;
    padding-left: 40px;
  }
  menu,
  ol {
    list-style: decimal;
    padding-left: 40px;
  }
  a {
    text-decoration: underline;
    color: $color1;
  }
  p {
    margin-bottom: 28px;
  }
  h2 {
    font-size: 1.2em !important;
  }
}
.article-title {
  font-size: 26px;
  font-weight: bold;
  line-height: 30px;
  margin-bottom: 24px;
}
.news-detail {
  color: $font5;
}
.read-more {
  line-height: 4;
}
.hide {
  display: none;
  &.show {
    display: block;
  }
}
.first_paragraph {
  font-size: 14px;
  margin-bottom: 28px;
}

.article-summary {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  margin: 24px 0;
  background: linear-gradient(135deg, #fff9e6 0%, #fff5d6 100%);
  border-left: 4px solid #fd9a25;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.summary-icon {
  font-size: 28px;
  flex-shrink: 0;
  line-height: 1.4;
}

.summary-content {
  flex: 1;
}

.summary-title {
  font-size: 16px;
  font-weight: bold;
  color: #b8860b;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.summary-text {
  font-size: 14px;
  color: #5a5a5a;
  line-height: 1.6;
  margin: 0;
}
.google-ad-preload {
  margin-bottom: 4px;
}
.news-box-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.toc-container {
  margin: 0px 0 20px;
  padding: 12px 0;
  width: 100%;
  color: $font1;
  background: rgba(#fd9a25, 0.1);
  ul {
    padding-left: 0;
  }
  .toc-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 12px;
  }
  .toc-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    li {
      cursor: pointer;
      line-height: 26px;
      font-size: 20px;
      width: 100%;
      @include ellipsis();
    }
  }
}

.related-articles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
@media screen and (max-width: 1100px) {
  .news-box-2 {
    display: flex;
    flex-wrap: wrap;
  }
}

@media screen and (max-width: 750px) {
  ::v-deep .table-container-parent {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  ::v-deep .table-container {
    margin: vw(30) 0;
    border-top: vw(4) solid rgba($font3, 0.65);
    tr {
      text-align: center;
      padding: vw(20);
      min-height: vw(122);
      td {
        min-width: vw(200);
        background: rgba(#fd9a25, 0.1);
        border: vw(4) solid #fff;
        font-size: vw(28);
        padding: vw(12) vw(32);
      }
      td:first-child {
        font-weight: normal;
        font-size: vw(32);
      }
    }
    tr:first-child {
      border-collapse: collapse;
      th,td {
        border-bottom: vw(4) solid rgba($font3, 0.35);
        min-width: vw(200);
        padding: vw(12) vw(32);
        background: rgba(#fd9a25, 0.1);
        font-weight: normal;
        font-size: vw(32);
      }
    }
  }
  .page-layout {
    padding: 0 0;
  }
  ::v-deep .article {
    line-height: vw(38);
    font-size: vw(36);
    padding-bottom: vw(32);
    border-bottom: vw(2) solid #ececee;
    min-height: calc(100vh - vw(304));
    menu,
    ol,
    ul {
      padding-left: vw(32);
    }
    p {
      margin-bottom: vw(32);
    }
  }
  .article-title {
    font-size: vw(40);
    line-height: vw(56);
    margin-bottom: vw(32);
  }
  .article-desc {
    margin-bottom: vw(48);
  }
  .first_paragraph {
    font-size: vw(32);
    color: rgba(23, 23, 23, 0.8);
    line-height: vw(44);
    margin-bottom: vw(32);
  }

  .article-summary {
    flex-direction: column;
    gap: 12px;
    padding: vw(24);
    margin: vw(24) 0;
  }

  .summary-icon {
    font-size: vw(40);
  }

  .summary-title {
    font-size: vw(28);
  }

  .summary-text {
    font-size: vw(26);
    line-height: vw(38);
  }
  .google-ad-preload {
    margin-bottom: vw(10);
  }
  .title-h2-margin {
    margin-top: vw(74);
    margin-bottom: vw(32);
  }
  .news-box-2 {
    gap: vw(32);
  }
  .toc-container {
    margin: 0 0 vw(32);
    padding: vw(24) 0;
    .toc-title {
      font-size: vw(40);
      margin-bottom: vw(24);
    }
    ul {
      padding-left: 0;
    }
    .toc-list {
      gap: vw(10);
      li {
        line-height: vw(50);
        font-size: vw(32);
      }
    }
  }
  .related-articles {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: vw(40);
    padding-bottom: vw(32);
  }
}
</style>
