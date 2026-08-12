<script setup>

import { useRouter } from 'vue-router';
import { Notyf } from 'notyf';

import { useUserStore } from '../stores/user';


const router = useRouter();
const notyf = new Notyf();

const userStore = useUserStore();


function logout() {

    userStore.unsetUser();

    notyf.success(
        'Logged out successfully.'
    );

    router.push('/login');

}

</script>


<template>

    <nav class="navbar navbar-expand-lg bg-dark navbar-dark">
        <div class="container">

            <!-- Brand -->
            <router-link to="/" class="navbar-brand">
                PostHub
            </router-link>

            <!-- Mobile Toggle -->
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarContent">

                <!-- Left Navigation -->
                <ul class="navbar-nav me-auto">
                    <li v-if="userStore.isLoggedIn" class="nav-item">
                        <router-link to="/posts" class="nav-link">
                            Posts
                        </router-link>
                    </li>
                </ul>

                <!-- Right Navigation -->
                <ul class="navbar-nav">

                    <!-- Logged In -->
                    <li v-if="userStore.isLoggedIn" class="nav-item d-flex align-items-center">
                        <span class="navbar-text me-3">
                            Welcome,
                            {{ userStore.user.username }}
                        </span>

                        <button type="button" class="btn btn-outline-light btn-sm" @click="logout">
                            Logout
                        </button>
                    </li>

                    <!-- Logged Out -->
                    <template v-else>
                        <li class="nav-item">
                            <router-link to="/login" class="nav-link">
                                Login
                            </router-link>
                        </li>

                        <li class="nav-item">
                            <router-link to="/register" class="nav-link">
                                Register
                            </router-link>
                        </li>
                    </template>
                </ul>
            </div>
        </div>
    </nav>

</template>