<template>
  <CustomLink class="item" :to="`/${item.seo_category_path || item.category_locale_name || item.category_name}/${item.path_v2.replace(/^\//, '')}/`">
    <p class="title">{{ item.name }}</p>
    <p class="path">{{ formattedPath }}</p>
    <p class="desc">{{ item.first_paragraph }}</p>
  </CustomLink>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    formattedPath() {
      const category = this.item.seo_category_path || this.item.category_locale_name || this.item.category_name;
      return `${window.location.origin}/${category}/${this.item.path_v2.replace(/^\//, '')}/`;
    }
  }
};
</script>

<style lang="scss" scoped>
.item {
  display: block;
  border-bottom: 1px solid #ececee;
  margin-bottom: 24px;
  color: rgba($font3, 0.6);
  .title {
    font-family: "hem";
    font-size: 22px;
    line-height: 29px;
    color: $font3;
  }
  .path {
    line-height: 19px;
    margin-top: 8px;
    margin-bottom: 16px;
  }
  .desc {
    line-height: 19px;
    margin-bottom: 24px;
    @include ellipsis(7);
  }
  &:hover {
    .title {
      color: $color1;
      text-decoration: underline;
    }
  }
}
</style>
