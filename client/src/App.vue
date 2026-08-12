<script setup>
import { onMounted } from 'vue';
import Navbar from './components/Navbar.vue';
import { useUserStore } from './stores/user';

const userStore = useUserStore();

onMounted(() => {
    userStore.loadUser();
});

</script>


<template>
	
    <Navbar />

    <router-view />

</template>