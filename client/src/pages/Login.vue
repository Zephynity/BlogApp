<script setup>

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Notyf } from 'notyf';
import axios from 'axios';
import { useUserStore } from '../stores/user';

const router = useRouter();
const notyf = new Notyf();
const userStore = useUserStore();

const loginInput = ref('');
const password = ref('');

const isActive = computed(() => {
    return (
        loginInput.value.trim() !== '' &&
        password.value !== ''
    );
});


function login() {

    axios.post(
        'http://localhost:4000/users/login',
        {
            login: loginInput.value.trim(),
            password: password.value
        }
    )
    .then(response => {

        console.log('Login response:', response.data);

        const token = response.data.access;

        if (!token) {
            notyf.error('Login failed. No token received.');
            return;
        }

        userStore.setUser(token);

        notyf.success('Successfully logged in.');

        loginInput.value = '';
        password.value = '';

        router.push('/posts');
    })
    .catch(error => {
        console.error('Login error:', error);
        const message = error.response?.data?.message;
        notyf.error(
            message || 'Invalid login credentials.'
        );
    });
}

</script>

<template>

    <div class="container">

        <div class="row justify-content-center">

            <div class="col-md-6">

                <h1 class="my-5 text-center">
                    Login
                </h1>

                <form @submit.prevent="login">

                    <div class="mb-3">

                        <label
                            for="login"
                            class="form-label"
                        >
                            Email or Username
                        </label>

                        <input
                            type="text"
                            class="form-control"
                            id="login"
                            placeholder="Enter email or username"
                            required
                            v-model="loginInput"
                        />

                    </div>


                    <div class="mb-3">

                        <label
                            for="password"
                            class="form-label"
                        >
                            Password
                        </label>

                        <input
                            type="password"
                            class="form-control"
                            id="password"
                            placeholder="Enter password"
                            required
                            v-model="password"
                        />

                    </div>


                    <button
                        :disabled="!isActive"
                        type="submit"
                        class="btn"
                        :class="isActive ? 'btn-primary' : 'btn-danger'"
                    >
                        Login
                    </button>

                </form>

            </div>

        </div>

    </div>

</template>