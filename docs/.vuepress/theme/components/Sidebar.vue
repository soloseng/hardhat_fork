<template>
  <div class="sidebar">
    <NavLinks :github="true" />
    <slot name="top" />
    <ul class="sidebar-links" v-if="items.length">
      <li v-for="(item, i) in items" :key="i">
        <SidebarGroup
          v-if="item.type === 'group'"
          :item="item"
          :first="i === 0"
          :open="i === openGroupIndex"
          :collapsable="item.collapsable || item.collapsible"
          @toggle="toggleGroup(i)"
        />
        <SidebarLink v-else :item="item" />
      </li>
    </ul>
    <slot name="bottom" />
  </div>
</template>

<script>
import SidebarGroup from "./SidebarGroup.vue";
import SidebarLink from "./SidebarLink.vue";
import NavLinks from "./NavLinks.vue";
import { isActive } from "../util";

export default {
  components: { SidebarGroup, SidebarLink, NavLinks },

  props: ["items"],

  data() {
    return {
      openGroupIndex: 0,
    };
  },

  created() {
    this.refreshIndex();
  },

  watch: {
    $route() {
      this.refreshIndex();
    },
  },

  methods: {
    refreshIndex() {
      const index = resolveOpenGroupIndex(this.$route, this.items);
      if (index > -1) {
        this.openGroupIndex = index;
      }
    },

    toggleGroup(index) {
      this.openGroupIndex = index === this.openGroupIndex ? -1 : index;
    },

    isActive(page) {
      return isActive(this.$route, page.path);
    },
  },
};

function resolveOpenGroupIndex(route, items) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (
      item.type === "group" &&
      item.children.some((c) => isActive(route, c.path))
    ) {
      return i;
    }
  }
  return -1;
}
</script>

<style lang="stylus">
@import '../styles/config.styl'

.sidebar
  ul
    padding 0
    margin 0
    list-style-type none

  a
    display inline-block

  .nav-links
    display none
    border-bottom 1px solid $borderColor
    padding 1rem 0 1.25rem 0

    a
      font-weight 600

    .nav-item, .repo-link
      display block
      line-height 1.25rem
      font-size 1.1em
      padding 0.5rem 0 0.5rem 1.5rem

  .sidebar-links
    padding 2rem 0
    a
      @media (min-width: $MQMobileNarrow)
        padding-left 26px
  .sidebar-sub-header
    a
      @media (min-width: $MQMobileNarrow)
        padding-left 46px

  .sidebar-group-items
    a
      @media (min-width: $MQMobileNarrow)
        padding-left 56px


@media (min-width: $MQMobileNarrow)
  .sidebar

    .sidebar-links
      padding 2rem 0

      li > .sidebar-group > .sidebar-heading
        padding-left 32px
        font-family 'ChivoBold'

@media (max-width: $MQMobileNarrow)
  .sidebar
  .sidebar-links
    padding 2rem 0

    > li > .sidebar-group > .sidebar-heading
      a
        padding-left 32px

  .sidebar-group-items
    a
      padding-left 2.4rem


@media (max-width: $MQMobile)



  .sidebar
    .nav-links
      display block

      .dropdown-wrapper .nav-dropdown .dropdown-item a.router-link-active::after
        top calc(1rem - 2px)

      a
        color $textColor;

      a:hover
        color $accentColor !important

      a.router-link-active
        color $accentColor !important
        border-bottom 2px solid $accentColor !important


    .sidebar-links
      padding 2rem 0
</style>
