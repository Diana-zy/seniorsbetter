export default function ({ $axios, redirect }) {
  $axios.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  $axios.onRequest((config) => {});

  $axios.interceptors.response.use(
    (response) => {
      const res = response.data;
      if (res.success === true) {
        return res;
      }  
      return Promise.reject(new Error(res.msg || "Error"));
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}
