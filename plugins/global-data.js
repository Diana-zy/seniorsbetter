import Vue from "vue";

export default ({ app }, inject) => {
  const globalData = Vue.observable({
    isNavigationVisible: false,
    notification: {
      show: false,
      message: "",
      type: ""
    }
  });
  inject("globalData", globalData);

  inject("globalMethod", {
    toggleNavigation: () => {
      globalData.isNavigationVisible = !globalData.isNavigationVisible;
    },
    showNotification: ({ message, type }) => {
      globalData.notification.show = true;
      globalData.notification.message = message;
      globalData.notification.type = type;
      setTimeout(() => {
        app.$globalMethod.hideNotification();
      }, 3000);
    },
    hideNotification: () => {
      globalData.notification.show = false;
      globalData.notification.message = "";
      globalData.notification.type = "";
    }
  });
};
