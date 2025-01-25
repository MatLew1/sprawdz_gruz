<template>
  <div>
    <HeaderApp />
    <RouterView></RouterView>
  </div>
</template>

<script>
import HeaderApp from "./components/HeaderApp.vue";

export default {
  name: "App",
  components: {
    HeaderApp,
  },
};
</script>

<style lang="scss">
#app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #121d07;
  background-color: white;
  margin-top: -20px;
}


</style>
