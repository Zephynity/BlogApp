<script setup>

import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Notyf } from 'notyf';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const notyf = new Notyf();

const post = ref(null);
const isLoading = ref(false);


function getPost() {

    isLoading.value = true;

    axios.get(
        `http://localhost:4000/posts/getPost/${route.params.id}`
    )
    .then(response => {

        console.log('Post response:', response.data);

        post.value = response.data;

    })
    .catch(error => {

        console.error('Failed to retrieve post:', error);

        const message = error.response?.data?.message;

        notyf.error(
            message || 'Failed to retrieve post.'
        );

        router.push('/posts');

    })
    .finally(() => {

        isLoading.value = false;

    });

}


function formatDate(date) {

    if (!date) {
        return 'Unknown date';
    }

    return new Date(date).toLocaleDateString();

}


onMounted(() => {

    getPost();

});

</script>


<template>

    <div class="container">

        <h1 class="my-5 text-center">
            Post Details
        </h1>


        <!-- Loading -->

        <div
            v-if="isLoading"
            class="text-center my-5"
        >

            <div
                class="spinner-border"
                role="status"
            >
                <span class="visually-hidden">
                    Loading...
                </span>
            </div>

            <p class="mt-2">
                Loading post...
            </p>

        </div>


        <!-- Post -->

        <div
            v-else-if="post"
            class="card shadow-sm mb-5"
        >

            <div class="card-body">

                <h2 class="card-title mb-4">
                    {{ post.title }}
                </h2>


                <p>
                    <strong>Author:</strong>

                    {{ post.author?.username || 'Unknown' }}
                </p>


                <p>
                    <strong>Created:</strong>

                    {{ formatDate(post.createdAt) }}
                </p>


                <hr>


                <p class="card-text">
                    {{ post.content }}
                </p>

            </div>

        </div>


        <!-- Back -->

        <div class="mb-5">

            <button
                class="btn btn-secondary"
                @click="router.push('/posts')"
            >
                Back to Posts
            </button>

        </div>

    </div>

</template>