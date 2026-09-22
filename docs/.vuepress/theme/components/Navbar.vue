<script setup>
import NavbarBrand from "@theme/NavbarBrand.vue";
import NavbarItems from "@theme/NavbarItems.vue";
import ToggleColorModeButton from "@theme/ToggleColorModeButton.vue";
import { useSidebarItems, useThemeLocaleData } from "@vuepress/theme-default/lib/client/composables";
import CatalogIcon from "../../components/CatalogIcon.vue";

defineEmits(["toggle-sidebar"]);
const sidebarItems = useSidebarItems();
const themeLocale = useThemeLocaleData();
</script>

<template>
  <header class="navbar jl-navbar">
    <div class="jl-navbar-inner">
      <div class="jl-navbar-brand">
        <button v-if="sidebarItems.length" class="jl-nav-menu" type="button" aria-label="切换章节目录" @click="$emit('toggle-sidebar')"><CatalogIcon name="list" /></button>
        <NavbarBrand />
      </div>
      <slot name="before" />
      <NavbarItems aria-label="主导航" />
      <slot name="after" />
      <ToggleColorModeButton v-if="themeLocale.colorModeSwitch" />
    </div>
  </header>
</template>
