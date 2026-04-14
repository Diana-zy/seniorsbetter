<template>
  <div class="news-detail">
    <template v-for="(item, index) in contentItems">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="item.type === 'content'" :key="`content-${index}`" v-html="item.content" />
      <GoogleAd v-else :key="`ad-${index}`" :ad-slot="item.slot" />
    </template>
  </div>
</template>

<script>
export default {
  name: "ArticleWithAds",
  props: {
    content: {
      type: String,
      required: true
    },
    charInterval: {
      type: Number,
      default: 400
    },
    adConfigs: {
      type: Array,
      default: () => [
        {
          slot: "9106902700"
        }
      ]
    }
  },
  computed: {
    contentItems() {
      const parts = this.content.split(/(<p[^>]*>.*?<\/p>)/gs);
      let charCount = 0;
      let adIndex = 0;
      let lastAdCharCount = 0;
      const items = [];
      const maxAds = this.adConfigs.length;

      parts.forEach((part) => {
        if (!part.trim()) return;

        items.push({
          type: "content",
          content: part
        });

        if (!part.startsWith("<p")) return;
        if (adIndex >= maxAds) return;

        const textContent = part.replace(/<[^>]+>/g, "");
        charCount += textContent.length;

        if (
          charCount >= this.charInterval &&
          (charCount - lastAdCharCount >= this.charInterval || lastAdCharCount === 0)
        ) {
          items.push({
            type: "ad",
            slot: this.adConfigs[adIndex].slot
          });
          lastAdCharCount = charCount;
          adIndex++;
        }
      });

      return items;
    }
  }
};
</script>
