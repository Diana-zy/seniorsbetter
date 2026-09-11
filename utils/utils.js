export function simulateAFSSearch(value) {
  const targetPath = "/search/";
  const url = generateCustomPath(targetPath);
  const link = document.createElement("a");
  link.href = `${url}&query=${value}`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateCustomLink(url) {
  const targetPath = url;
  const currentParams = new URLSearchParams(window.location.search);
  const currentPathname = window.location.pathname;

  const pathTypeMappings = [
    { pattern: /^\/category\/[\w-]+\/$/, type: "category-detail" },
    { pattern: /^\/category\/$/, type: "category" },
    { pattern: /^\/detail\/.*/, type: "detail" },
    { pattern: /^\/(?!category\/|search\/|us\/)[\w-]+\/[\w-]+\/$/, type: "detail" },
    { pattern: /^\/$/, type: "home" }
  ];

  const matchedPathType = pathTypeMappings.find((mapping) => mapping.pattern.test(currentPathname));
  const from = matchedPathType ? matchedPathType.type : currentPathname.replaceAll("/", "");

  currentParams.delete("from");
  currentParams.delete("channel");
  if (currentPathname === "/search/" || currentPathname === "/content/") {
    currentParams.delete("text");
  }

  const currentDomain = window.location.host;
  let targetDomain = "";

  const domainPattern = /^(www[0-9]*|[0-9]*)\.?([^\.]+)\.([a-z]{2,})$/;
  const match = currentDomain.match(domainPattern);
  if (match) {
    const prefix = match[1];

    if (!prefix) {
      targetDomain = `www.${currentDomain}`;
    } else if (prefix.startsWith("www")) {
      if (prefix === "www") {
        targetDomain = currentDomain.substring(4);
      } else {
        targetDomain = currentDomain.substring(3);
      }
    } else {
      targetDomain = `www${currentDomain}`;
    }
  } else {
    targetDomain = currentDomain;
  }

  const protocol = window.location.protocol;

  const queryString = currentParams.toString();
  return `${protocol}//${targetDomain}${targetPath}?${queryString}${
    queryString ? "&" : ""
  }from=${encodeURIComponent(from)}`;
}

export function generateCustomPath(url) {
  const targetPath = url;
  const currentParams = new URLSearchParams(window.location.search);
  const currentPathname = window.location.pathname;

  const pathTypeMappings = [
    { pattern: /^\/category\/[\w-]+\/$/, type: "category-detail" },
    { pattern: /^\/category\/$/, type: "category" },
    { pattern: /^\/detail\/.*/, type: "detail" },
    { pattern: /^\/(?!category\/|search\/|us\/)[\w-]+\/[\w-]+\/$/, type: "detail" },
    { pattern: /^\/$/, type: "home" }
  ];

  const matchedPathType = pathTypeMappings.find((mapping) => mapping.pattern.test(currentPathname));
  const from = matchedPathType ? matchedPathType.type : currentPathname.replaceAll("/", "");

  currentParams.delete("from");
  currentParams.delete("channel");
  if (currentPathname === "/search/" || currentPathname === "/content/") {
    currentParams.delete("text");
    currentParams.delete("query");
  }

  const queryString = currentParams.toString();
  return `${targetPath}?${queryString}${queryString ? "&" : ""}from=${encodeURIComponent(from)}`;
}

export function simulateClickLink(url) {
  const link = document.createElement("a");
  link.href = url;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function getRandomValueFromArray(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

export function shuffleArray(array) {
  if(!array){
    return []
  }
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function capitalizeFirstLetter(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function handleCreatScriptSchema(data) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.innerText = data;
  document.head.appendChild(script);
}

// 从"最新/推荐文章"这类列表接口的响应里过滤掉非SEO文章(投放落地页)，
// 避免污染首页/分类页/详情页侧边栏的正常展示、影响站点SEO效果。is_seo
// 缺失（接口没返回这个字段的极端情况）时默认保留，只有明确是false/0
// 才排除，避免因为缺字段误伤正常内容
export function filterSeoArticles(list) {
  if (!Array.isArray(list)) return list;
  return list.filter((item) => !(item && (item.is_seo === false || item.is_seo === 0)));
}

// 根据文章的path_v2字段构建正确的文章链接（相对路径，不含域名）。
// 2026-09-10确认：get_all_path_v2/文章列表接口里，SEO文章的path_v2是
// "分类/urlslug-id"（不带前导斜杠），非SEO文章(投放落地页)是
// "/urlslug-id"这种带前导斜杠、分类段为空的格式。之前各组件都是直接用
// `/${item.path_v2}/`拼链接，对非SEO文章会拼出两个斜杠开头的路径
// (`//urlslug-id/`)，浏览器会把这种协议相对URL的第一段当成域名去解析，
// 导致点击直接404/DNS错误。这里统一按跟nuxt.config.js的routes()同一套
// 规则处理：非SEO文章从slug里按最后一个"-"切出纯数字id，构建成
// /detail/{id}/（对齐ad_delivery投放链接实际格式）；SEO文章照旧
// /{分类}/{urlslug}/
export function buildArticleUrl(pathV2) {
  if (!pathV2) return "/";
  const s = String(pathV2).trim();
  if (s.startsWith("/")) {
    const slug = s.slice(1);
    const lastDashIndex = slug.lastIndexOf("-");
    const id = lastDashIndex >= 0 ? slug.substring(lastDashIndex + 1) : slug;
    return `/detail/${id}/`;
  }
  return `/${s}/`;
}

export function toAuthorSlug(name, id) {
  if (!name || !id) return `author-${id}`;
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `${slug}-${id}` : `author-${id}`;
}
