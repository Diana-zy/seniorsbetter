/* eslint-disable prefer-const */
/* eslint-disable no-undef */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
function createUserId() {
  const userId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  return userId.replace(/-/g, "");
}

function getInfoBySource(source) {
  if (source === "tiktok") {
    const hi_source_clid = getValueByURLOrCookie("ttclid");
    const hi_source_aid = getValueByURLOrCookie("ad_id");
    return {
      hi_source_clid,
      hi_source_aid,
      hi_source_site: "unknown",
      hi_source_site_name: "unknown",
      hi_section_id: "unknown",
      hi_section_name: "unknown"
    };
  } else if (source === "taboola") {
    const hi_source_clid = getValueByURLOrCookie("tblci");
    const hi_source_aid = getValueByURLOrCookie("campaign_id");
    const hi_source_site = getValueByURLOrCookie("site_id");
    const hi_source_site_name = getValueByURLOrCookie("site_name");
    return {
      hi_source_clid,
      hi_source_aid,
      hi_source_site,
      hi_source_site_name,
      hi_section_id: "unknown",
      hi_section_name: "unknown"
    };
  } else if (source === "outbrain") {
    const hi_source_clid = getValueByURLOrCookie("dicbo");
    const hi_source_aid = getValueByURLOrCookie("campaign_id");
    const hi_source_site = getValueByURLOrCookie("site_id");
    const hi_source_site_name = getValueByURLOrCookie("site_name");
    const hi_section_id = getValueByURLOrCookie("section_id");
    const hi_section_name = getValueByURLOrCookie("section_name");
    return {
      hi_source_clid,
      hi_source_aid,
      hi_source_site,
      hi_source_site_name,
      hi_section_id,
      hi_section_name
    };
  } else if (source === "pinterest") {
    return {
      hi_source_clid: "unknown",
      hi_source_aid: "unknown",
      hi_source_site: "unknown",
      hi_source_site_name: "unknown",
      hi_section_id: "unknown",
      hi_section_name: "unknown"
    };
  } else if (source === "facebook") {
    const hi_source_clid = getValueByURLOrCookie("fbclid");
    return {
      hi_source_clid,
      hi_source_aid: "unknown",
      hi_source_site: "unknown",
      hi_source_site_name: "unknown",
      hi_section_id: "unknown",
      hi_section_name: "unknown"
    };
  } else {
    return {
      hi_source_clid: "unknown",
      hi_source_aid: "unknown",
      hi_source_site: "unknown",
      hi_source_site_name: "unknown",
      hi_section_id: "unknown",
      hi_section_name: "unknown"
    };
  }
}

function getUserProperty() {
  const hi_user_source = getValueByURLOrCookie("hi_source");
  const hi_user_sub_site = getHostname();
  const hi_user_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  const {
    hi_source_clid: hi_user_source_clid,
    hi_source_aid: hi_user_source_aid,
    hi_source_site: hi_user_source_site,
    hi_source_site_name: hi_user_source_site_name,
    hi_section_id: hi_user_section,
    hi_section_name: hi_user_section_name
  } = getInfoBySource(hi_user_source);
  return {
    hi_user_source,
    hi_user_sub_site,
    hi_user_timezone,
    hi_user_source_clid,
    hi_user_source_aid,
    hi_user_source_site,
    hi_user_source_site_name,
    hi_user_section,
    hi_user_section_name
  };
}

function interceptGaFetch() {
  const { fetch: originalFetch } = window;
  window.fetch = async (...args) => {
    let [resource, config] = args;
    if (resource.includes("https://www.google-analytics.com/g/collect")) {
      for (let key in userProperties) {
        if (!resource.includes(`up.${key}=${userProperties[key]}`)) {
          resource = resource + `&up.${key}=${userProperties[key]}`;
        }
      }
    }
    return await originalFetch(resource, config);
  };
}

function pushEventToGTM(event, param = {}) {
  const hi_channel = getValueByURLOrCookie("channel");
  const hi_gaid = getCookie("_ga") || "unknown";
  const hi_source = getValueByURLOrCookie("hi_source");
  const {
    hi_source_clid,
    hi_source_aid,
    hi_source_site,
    hi_source_site_name,
    hi_section_id,
    hi_section_name
  } = getInfoBySource(hi_source);
  let buffer = {
    hi_channel,
    hi_gaid,
    hi_source,
    hi_source_clid,
    hi_source_aid,
    hi_source_site,
    hi_source_site_name,
    hi_section_id,
    hi_section_name
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...buffer,
    ...param
  });
}

function TACChangeCookie() {
  const detailPvUser = window.getCookie("detailPvUser");
  try {
    const buffer = JSON.parse(detailPvUser);
    const _isPushGtm = buffer[getHostname() + "_isPushGtm"];
    if (_isPushGtm) {
      return;
    }
    buffer[getHostname() + "_first"] = undefined;
    buffer[getHostname() + "_second"] = undefined;
    setCookieToDay("detailPvUser", JSON.stringify(buffer));
  } catch (e) {}
}

function handleDataMonitor() {
  let T_AR_COUNT = getCookie("T_AR_COUNT");
  const detailPvUser = window.getCookie("detailPvUser");
  let buffer = {};
  const hi_source = getValueByURLOrCookie("hi_source");
  const { hi_source_clid } = getInfoBySource(hi_source);
  try {
    buffer = JSON.parse(detailPvUser);
  } catch (e) {}
  let hi_duration_ms = getCookie("hi_duration_ms");
  const now = new Date().getTime();
  if (!hi_duration_ms) {
    hi_duration_ms = 0;
  } else {
    hi_duration_ms = now - Number(hi_duration_ms);
    pushEventToGTM("T_AR_MULTI", {
      hi_duration: Math.floor(hi_duration_ms / 1000),
      hi_duration_ms
    });
  }
  setCookieToDay("hi_duration_ms", now);
  if (T_AR_COUNT !== "yes") {
    T_AR_COUNT = Number(T_AR_COUNT) + 1;
    if (T_AR_COUNT === 1) {
      pushEventToGTM("T_AR_FIRST", {
        hi_duration: Math.floor((now - Number(buffer[hi_source_clid].time)) / 1000),
        hi_duration_ms: now - Number(buffer[hi_source_clid].time)
      });
    } else if (T_AR_COUNT >= 3) {
      pushEventToGTM("T_AR_3");
      setCookieToDay("T_AR_COUNT", "yes");
      return;
    }
    setCookieToDay("T_AR_COUNT", T_AR_COUNT);
  }
}

function handleTACMSGToLoad() {
  const detail_time = window.getCookie("detail_time");
  const now = new Date().getTime();
  const time = now - Number(detail_time);
  if (!detail_time) {
    return "unknown";
  }
  if (time <= 499) {
    return "0~499";
  } else if (time > 499 && time <= 999) {
    return "500~999";
  } else if (time > 999) {
    return ">=1000";
  } else {
    return "unknown";
  }
}

function setDetailPvUser() {
  const { pathname } = window.location;
  const hi_source = getValueByURLOrCookie("hi_source");
  const { hi_source_clid } = getInfoBySource(hi_source);
  if (pathname.includes("/detail")) {
    window.setCookieToDay("detail_time", new Date().getTime());
    const detailPvUser = window.getCookie("detailPvUser");
    if (detailPvUser) {
      let buffer = {};
      try {
        buffer = JSON.parse(detailPvUser);
        if (!buffer[hi_source_clid]) {
          buffer[hi_source_clid] = {
            isPush: true,
            time: new Date().getTime()
          };
          if (!buffer[getHostname() + "_isPushGtm"]) {
            if (buffer[getHostname() + "_first"]) {
              if (
                !buffer[getHostname() + "_second"] &&
                buffer[getHostname() + "_first"] !== hi_source_clid
              ) {
                buffer[getHostname() + "_second"] = hi_source_clid;
              }
            } else {
              buffer[getHostname() + "_first"] = hi_source_clid;
            }
          }
          pushEventToGTM("Detail_pv_user");
          setCookieToDay("detailPvUser", JSON.stringify(buffer));
        }
      } catch (e) {}
    } else {
      let buffer = {};
      buffer[hi_source_clid] = {
        isPush: true,
        time: new Date().getTime()
      };
      buffer[getHostname() + "_first"] = hi_source_clid;
      pushEventToGTM("Detail_pv_user");
      setCookieToDay("detailPvUser", JSON.stringify(buffer));
    }
  }
}

window.addEventListener("beforeunload", () => {
  if (window.location.pathname.includes("/detail")) {
    const detailPvUser = window.getCookie("detailPvUser");
    try {
      const buffer = JSON.parse(detailPvUser);
      const _first = buffer[getHostname() + "_first"];
      const _second = buffer[getHostname() + "_second"];
      const hi_source = getValueByURLOrCookie("hi_source");
      const { hi_source_clid } = getInfoBySource(hi_source);
      const _isPushGtm = buffer[getHostname() + "_isPushGtm"];
      if (_isPushGtm || !_second || window.done2) {
        return;
      }
      window.done2 = true;
      const activeElement = document.activeElement;
      const src = activeElement?.getAttribute("src") || "";
      if (src && src.includes("afs/ads?") && activeElement.getAttribute("id") === "master-1") {
      } else if (
        src &&
        src.includes("afs/ads/i/") &&
        activeElement.getAttribute("id") === "slave-1-1"
      ) {
      } else if (_second === hi_source_clid) {
          pushEventToGTM("User_second_not_click");
          buffer[getHostname() + "_isPushGtm"] = 1;
          setCookieToDay("detailPvUser", JSON.stringify(buffer));
        }
    } catch (e) {}
  }
});
