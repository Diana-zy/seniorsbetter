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
    { pattern: /^\/$/, type: "home" }
  ];

  const matchedPathType = pathTypeMappings.find((mapping) => mapping.pattern.test(currentPathname));
  const from = matchedPathType ? matchedPathType.type : currentPathname.replaceAll("/", "");

  currentParams.delete("from");
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
    { pattern: /^\/$/, type: "home" }
  ];

  const matchedPathType = pathTypeMappings.find((mapping) => mapping.pattern.test(currentPathname));
  const from = matchedPathType ? matchedPathType.type : currentPathname.replaceAll("/", "");

  currentParams.delete("from");
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
