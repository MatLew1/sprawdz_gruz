<template>
  <div>
    <h2 class="h2container">Sprawdź na jakiej linii jest autobus</h2>
    <header>
      <nav>
        <ul>
          <li><RouterLink to="/">Po numerze Linii</RouterLink></li>
          <li><RouterLink to="/numberbus">Po numerze Autobusu</RouterLink></li>
        </ul>
      </nav>
    </header>
  </div>
</template>

<script>
export default {
  name: "HeaderApp",
};
</script>

<style scoped>
.h2container {
  margin-top: 30px;
  padding-top: 30px;
  padding-bottom: 30px;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 15px;
  border: 1px solid white;
  background: #0c3b2e;
  color: #ccc;
}

header {
  width: 100%;
  height: 5rem;
  background-color: #0c3b2e;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  border-radius: 15px;
}

header a {
  text-decoration: none;
  color: white;
  display: inline-block;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 0.2rem;
  padding-right: 0.2rem;
  border: 1px solid transparent;
  font-size: 17px;
}

a:active,
a:hover,
a.router-link-active {
  border: 5px solid black;
  border-radius: 15px;
}

header nav {
  width: 90%;
  margin: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

header ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

li {
  margin: 0 0.5rem;
}
</style>
