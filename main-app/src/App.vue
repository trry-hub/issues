<template>
  <div id="app">
    <p>
      <img alt="Vue logo" src="./assets/logo.png">
    </p>
    <router-link class="button" to="/page1">page1</router-link>
    <router-link class="button" to="/page2">page2</router-link>
    <router-link class="button" to="/sub-app/page1">micro-app</router-link>
    <transition name="main" mode="out-in">
      <router-view></router-view>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style lang="scss" scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.button {
  padding: 3px 5px;
  border: 1px solid #ff6700;
  border-radius: 3px;

  &+.button {
    margin-left: 10px;
  }

  &:hover,
  &:active, &.router-link-active {
    background-color: #ff6700;
    color: #fff;
  }
}

// 主内容区动画
.main-enter-active {
  transition: all 0.2s;
}

.main-leave-active {
  transition: all 0.15s;
}

.main-enter {
  opacity: 0;
  margin-left: -20px;
}

.main-leave-to {
  opacity: 0;
  margin-left: 20px;
}
</style>
