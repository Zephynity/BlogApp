<script setup>

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Notyf } from 'notyf';
import axios from 'axios';

const router = useRouter();
const notyf = new Notyf();

const email = ref('');
const username = ref('');
const password = ref('');


const isActive = computed(() => {

    return (
        email.value.trim() !== '' &&
        username.value.trim() !== '' &&
        password.value !== ''
    );

});


function register() {

    axios.post(
        'http://localhost:4000/users/register',
        {
            email: email.value.trim(),
            username: username.value.trim(),
            password: password.value
        }
    )
    .then(response => {

        console.log('Registration response:', response.data);

        notyf.success('Successfully registered.');

        email.value = '';
        username.value = '';
        password.value = '';

        router.push('/login');

    })
    .catch(error => {

        console.error('Registration error:', error);

        const message = error.response?.data?.message;

        notyf.error(
            message || 'Registration failed. Please try again.'
        );

    });

}

</script>


<template>

    <div class="container">

        <div class="row justify-content-center">

            <div class="col-md-6">

                <h1 class="my-5 text-center">
                    Register
                </h1>


                <form @submit.prevent="register">

                    <div class="mb-3">

                        <label
                            for="email"
                            class="form-label"
                        >
                            Email
                        </label>

                        <input
                            type="email"
                            class="form-control"
                            id="email"
                            placeholder="Enter email"
                            required
                            v-model="email"
                        />

                    </div>


                    <div class="mb-3">

                        <label
                            for="username"
                            class="form-label"
                        >
                            Username
                        </label>

                        <input
                            type="text"
                            class="form-control"
                            id="username"
                            placeholder="Enter username"
                            required
                            v-model="username"
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
                        Register
                    </button>


                    <button
                        type="button"
                        class="btn btn-secondary ms-2"
                        @click="router.push('/login')"
                    >
                        Back to Login
                    </button>

                </form>

            </div>

        </div>

    </div>

</template>