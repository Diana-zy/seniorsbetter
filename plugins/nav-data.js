export default async function ({ $axios, env, isServer }, inject) {
  try {
    const data = await $axios.$get("/api/article/get_all_seo_category", {
      params: {
        site_id: env.SITE_ID
      }
    });
    inject("navData", data);
    inject("sameAs", [
      "https://x.com/seniorsbetter",
      "https://www.facebook.com/people/Seniorsbetter/61586174372459/"
    ]);
  } catch (error) {
    console.error("Failed to fetch navigation data:", error);
    inject("navData", { list: [] });
  }
}
