<template>
  <CustomLink class="news-style-1" :to="`/${item.path_v2}/`">
    <NuxtImg
      format="auto"
      fit="cover"
      width="366"
      height="244"
      :src="item.cover"
      :alt="item.cover_seo_alt"
      loading="lazy"
      class="img m-hidden"
    />
    <NuxtImg
      format="auto"
      fit="cover"
      width="491"
      height="275"
      :src="item.cover"
      :alt="item.cover_seo_alt"
      loading="lazy"
      class="img pc-hidden"
    />
    <p class="title">{{ item.name }}</p>
  </CustomLink>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      required: true
    }
  }
};
</script>

<style lang="scss" scoped>
.news-style-1 {
  transition: border-color 0.2s;
  height: 288px;
  .img {
    width: 282px;
    height: 188px;
  }
  .title {
    font-size: 18px;
    font-family: "se3";
    line-height: 24px;
    @include ellipsis(3);
    margin: 6px 8px 4px;
    transition: color 0.2s;
  }
  &:hover {
    border-color: $color1;
    .title {
      color: $color1;
      text-decoration: underline;
    }
  }
  .pc-hidden {
    display: none;
  }
  .m-hidden {
    display: block;
  }
}
@media screen and (max-width: 750px) {
  .news-style-1 {
    height: vw(552);
    .img {
      width: 100%;
      height: vw(344);
    }
    .title {
      font-size: vw(40);
      line-height: vw(56);
      margin: vw(16) vw(16) vw(8);
      font-weight: 500;
    }
    &:hover {
      border-color: $color1;
      .title {
        color: $color1;
      }
    }
    .pc-hidden {
      display: block;
    }
    .m-hidden {
      display: none;
    }
  }
}
</style>
