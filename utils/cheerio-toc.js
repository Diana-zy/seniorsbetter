const cheerio = require("cheerio");
const GithubSlugger = require("github-slugger");

exports.processHtmlWithToc = (html, levels = [1, 2, 3]) => {
  const $ = cheerio.load(html);
  const slugger = new GithubSlugger();
  const toc = [];
  const titleMap = {};

  levels.forEach((level) => {
    $(`h${level}`).each((i, el) => {
      const $el = $(el);
      const titleText = $el.text().trim();

      if (!titleText) return;

      const anchorId = slugger.slug(titleText);
      $el.attr("id", anchorId);

      titleMap[anchorId] = $el.index(`h${level}`);

      toc.push({
        id: anchorId,
        text: titleText,
        level,
        index: titleMap[anchorId]
      });
    });
  });

  toc.sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    return a.index - b.index;
  });

  const cleanToc = toc.map(({ index, ...rest }) => rest);

  return {
    toc: cleanToc,
    htmlWithAnchor: $.html()
  };
};

exports.generateNestedToc = (flatToc) => {
  const nestedToc = [];
  const stack = [];
  flatToc.forEach((item) => {
    const node = { ...item, children: [] };
    while (stack.length && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }
    if (stack.length) {
      stack[stack.length - 1].children.push(node);
    } else {
      nestedToc.push(node);
    }
    stack.push(node);
  });
  return nestedToc;
};
