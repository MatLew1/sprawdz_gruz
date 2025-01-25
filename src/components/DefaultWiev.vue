<template>
  <div>
    <label for="lineNumber">Numer Linii:</label>
    <line-and-brigade></line-and-brigade>
  </div>
</template>

<script>

import LineAndBrigade from "./LineAndBrigade.vue";

export default {
  components: {
    LineAndBrigade,
  },
};
</script>

<style scoped>
label {
  font-weight: bold;
}
</style>
