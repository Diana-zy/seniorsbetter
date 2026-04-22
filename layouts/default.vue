<template>
  <div>
    <nuxt />
  </div>
</template>

<script>
export default {
  data() {
    return {
      maxScrollPercentage: 0
    };
  },
  head() {
    return {
      htmlAttrs: {
        lang: "ja-JP"
      },
      script: [
        {
          type: "application/ld+json",
          json: {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Koureisha Life",
            url: "https://www.koureishalife.com/",
            logo: "https://bunchthings.com/site-logo/koureishalife/koureishalife-logo-144.png",
            sameAs: this.$sameAs,
            ContactPoint: [],
            parentOrganization: {}
          }
        },
        {
          type: "application/ld+json",
          json: {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Koureisha Life",
            url: "https://www.koureishalife.com/",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://www.koureishalife.com/search/?query={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        }
      ],
      link:[
        {
          rel:'canonical',
          hid: "canonical",
          href:`https://www.koureishalife.com${this.$nuxt.context.route.path}`
        }
      ],
      // __dangerouslyDisableSanitizers: ["script"] // 禁用清理，允许插入内联 JavaScript
    };
  },
  mounted() {
    this.handleListenerScroll();
  },
  methods: {
    handleListenerScroll() {
      const self = this;
      window.addEventListener("scroll", (e) => {
        // 获取当前滚动位置
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

        // 获取文档总高度（减去视口高度得到可滚动高度）
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
        // 计算滚动百分比（0-100）
        const currentScrollPercentage =
          scrollHeight > clientHeight
            ? Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100).toFixed(0) // 确保不超过100%
            : 0;
        if (Number(currentScrollPercentage) > Number(self.maxScrollPercentage)) {
          self.maxScrollPercentage = currentScrollPercentage;
        }
      });
      window.addEventListener("beforeunload", () => {
        // window.dataLayer.push({
        //   event: "scroll_depth" + "_" + this.handleFormat(this.maxScrollPercentage),
        //   hi_depth: this.handleFormat(this.maxScrollPercentage)
        // });
        const hi_user_source = window.getValueByURLOrCookie("hi_source");
        if (hi_user_source === "unknown") {
          this.handleFormatSEO(this.maxScrollPercentage);
        }
        window.dataLayer.push({
          event: "scroll_depth",
          hi_depth: this.handleFormat(this.maxScrollPercentage)
        });
      });
    },
    handleFormat(val) {
      if (val === 0) {
        return "0%";
      } else if (val <= 20 && val > 0) {
        return "1_20%";
      } else if (val >= 80) {
        return "81_100%";
      } else {
        return `${Math.floor(val / 20) * 2}1_${Math.floor(val / 20) * 2 + 2}0%`;
      }
    },
    handleFormatSEO(val) {
      if (val < 25) {
        window.dataLayer.push({
          event: "Scroll_Depth_Less_25%_SEO"
        });
      } else if (val >= 25 && val < 50) {
        window.dataLayer.push({
          event: "Scroll_Depth_25%_SEO"
        });
      } else if (val >= 50 && val < 75) {
        window.dataLayer.push({
          event: "Scroll_Depth_50%_SEO"
        });
      } else {
        window.dataLayer.push({
          event: "Scroll_Depth_75%_SEO"
        });
      }
    }
  }
};
</script>
