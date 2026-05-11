/* eslint-disable no-unused-vars */
function getMainDomain() {
  const url = window.location.hostname;
  const parts = url.split(".");
  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  }
  return url;
}
function setCookie(name, value, daysToExpire = 1) {
  const date = new Date();
  date.setTime(date.getTime() + daysToExpire * 24 * 60 * 60 * 1000);
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=" + getMainDomain();
}
function setCookieToDay(name, value) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=" + getMainDomain();
}
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
function getHostname() {
  const currentHostName = window.location.hostname;
  if (currentHostName.startsWith("www")) {
    const list = currentHostName.split(".");
    if (list[0] === "www") {
      return currentHostName.replace("www.", "");
    }
    return currentHostName.replace("www", "");
  }
  return currentHostName;
}
function getParam(queryKey) {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.has(queryKey) ? searchParams.get(queryKey).trim() : "";
  } catch (c) {
    return "";
  }
}
function getValueByURLOrCookie(val) {
  let key = "hi_" + val;
  if (val.includes("hi_")) {
    key = val;
  }
  const buffer = getParam(val) || getCookie(key) || "unknown";
  setCookieToDay(key, buffer);
  return buffer;
}
function getSourceClid(source = "tiktok") {
  const map = {
    tiktok: "ttclid",
    taboola: "tblci",
    outbrain: "dicbo",
    facebook: "fbclid"
  };
  const key = typeof source === "string" ? source.toLowerCase() : "";
  const param = map[key];
  if (!param) {
    return { hi_source_clid: "unknown" };
  }
  return { hi_source_clid: getValueByURLOrCookie(param) };
}
function getResultsPageUrl(queryParams) {
  let url = `${window.location.origin}/search/?afs`;
  for (const [key, value] of Object.entries(queryParams)) {
    if (value) {
      url += `&${key}=${value}`;
    }
  }
  return url;
}
function pushEventParamsToGtm(eventName, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params
  });
}
