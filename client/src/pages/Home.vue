<script setup>

import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();


function goToPosts() {
    router.push('/posts');
}

function goToLogin() {
    router.push('/login');
}

function goToRegister() {
    router.push('/register');
}

</script>


<template>
    <div class="container">
        <div class="row justify-content-center text-center">
            <div class="col-md-8">
                <div class="my-5">
                    <h1 class="display-4 fw-bold">
                        Welcome to PostHub
                    </h1>
                    <p class="lead text-muted mt-3">
                        Share your thoughts, discover new posts,
                        and connect with other users.
                    </p>

                    <!-- Logged In -->
                    <div v-if="userStore.isLoggedIn" class="mt-4">
                        <p>
                            Welcome back,
                            <strong>
                                {{ userStore.user.username }}
                            </strong>!
                        </p>
                        <button class="btn btn-primary" @click="goToPosts">
                            View Posts
                        </button>
                    </div>

                    <!-- Logged Out -->
                    <div v-else class="mt-4">
                        <button class="btn btn-primary me-2" @click="goToLogin">
                            Login
                        </button>

                        <button class="btn btn-outline-primary" @click="goToRegister">
                            Register
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>