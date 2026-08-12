<script setup>

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Notyf } from 'notyf';
import axios from 'axios';
import { Modal } from 'bootstrap';
import { jwtDecode } from 'jwt-decode';

const router = useRouter();
const notyf = new Notyf();

const posts = ref([]);
const selectedPost = ref(null);

const isLoading = ref(false);
const isPostLoading = ref(false);

const comments = ref([]);
const comment = ref('');
const isCommenting = ref(false);

const showCreateModal = ref(false);
const showUpdateModal = ref(false);

const title = ref('');
const content = ref('');
const updateTitle = ref('');
const updateContent = ref('');

const isCreating = ref(false);
const isUpdating = ref(false);

const isCreateActive = computed(() => {
    return (
        title.value.trim() !== '' &&
        content.value.trim() !== ''
    );
});
const isUpdateActive = computed(() => {

    return (
        updateTitle.value.trim() !== '' &&
        updateContent.value.trim() !== ''
    );

});
const isCommentActive = computed(() => {
    return comment.value.trim() !== '';
});

const currentUser = ref(null);


function getPosts() {

    isLoading.value = true;

    axios.get(
        `${import.meta.env.VITE_API_URL}/posts/`
    )
    .then(response => {

        console.log('Posts response:', response.data);

        if (Array.isArray(response.data)) {
            posts.value = response.data;
        } else if (Array.isArray(response.data.posts)) {
            posts.value = response.data.posts;
        } else {
            posts.value = [];
        }

    })
    .catch(error => {

        console.error('Failed to retrieve posts:', error);

        const message = error.response?.data?.message;

        notyf.error(
            message || 'Failed to retrieve posts.'
        );

    })
    .finally(() => {

        isLoading.value = false;

    });
}


function viewPost(id) {
    isPostLoading.value = true;

    axios.get(
        `${import.meta.env.VITE_API_URL}/posts/getPost/${id}`
    )
    .then(response => {
        console.log('Post response:', response.data);

        selectedPost.value = response.data;

        getComments(id);

        const modalElement = document.getElementById('postDetailsModal');

        const modal = new Modal(modalElement);

        modal.show();

    })
    .catch(error => {
        console.error('Failed to retrieve post:', error);
        const message = error.response?.data?.message;
        notyf.error(message || 'Failed to retrieve post.');
    })
    .finally(() => {
        isPostLoading.value = false;
    });
}


function truncateText(text, maxLength = 150) {
    if (!text) {
        return '';
    }

    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength) + '...';
}


function openCreateModal() {

    title.value = '';
    content.value = '';

    showCreateModal.value = true;
}


function createPost() {

    const token = localStorage.getItem('token');

    if (!token) {

        notyf.error('Please login first.');

        router.push('/login');

        return;

    }


    isCreating.value = true;


    axios.post(
        `${import.meta.env.VITE_API_URL}/posts/createPost`,
        {
            title: title.value.trim(),
            content: content.value.trim()
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
    .then(response => {

        console.log('Create post response:', response.data);

        notyf.success('Post created successfully.');

        title.value = '';
        content.value = '';

        showCreateModal.value = false;

        getPosts();

    })
    .catch(error => {

        console.error('Failed to create post:', error);

        const message = error.response?.data?.message;

        notyf.error(
            message || 'Failed to create post.'
        );

    })
    .finally(() => {

        isCreating.value = false;

    });
}


function getCurrentUser() {

    const token = localStorage.getItem('token');

    if (!token) {
        return;
    }

    try {

        currentUser.value = jwtDecode(token);

        console.log('Current user:', currentUser.value);

    } catch (error) {

        console.error('Invalid token:', error);

        localStorage.removeItem('token');

        router.push('/login');

    }
}


function isPostOwner(post) {

    if (!currentUser.value || !post) {
        return false;
    }

    return (
        post.author?.id?.toString() ===
        currentUser.value.id?.toString()
    );
}


function openUpdateModal() {
    if (!selectedPost.value) {
        return;
    }

    if (!isPostOwner(selectedPost.value)) {
        notyf.error(
            'You can only update your own posts.'
        );

        return;
    }

    updateTitle.value = selectedPost.value.title;
    updateContent.value = selectedPost.value.content;

    const detailsModalElement =
        document.getElementById('postDetailsModal');

    const detailsModal =
        Modal.getInstance(detailsModalElement);

    if (detailsModal) {
        detailsModal.hide();
    }

    showUpdateModal.value = true;
}


function updatePost() {
    const token = localStorage.getItem('token');

    if (!token) {
        notyf.error('Please login first.');
        router.push('/login');
        return;
    }

    if (!selectedPost.value) {
        return;
    }

    isUpdating.value = true;

    axios.patch(
        `${import.meta.env.VITE_API_URL}/posts/updatePost/${selectedPost.value._id}`,
        {
            title: updateTitle.value.trim(),
            content: updateContent.value.trim()
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
    .then(response => {

        console.log(
            'Update post response:',
            response.data
        );

        notyf.success(
            'Post updated successfully.'
        );

        // Update the currently selected post
        if (response.data.post) {
            selectedPost.value = response.data.post;
        } 
        else {
            selectedPost.value.title =
                updateTitle.value.trim();

            selectedPost.value.content =
                updateContent.value.trim();
        }

        showUpdateModal.value = false;
        getPosts();
    })
    .catch(error => {
        console.error(
            'Failed to update post:',
            error
        );

        const message =
            error.response?.data?.message;

        if (error.response?.status === 403) {
            notyf.error(
                message ||
                'You can only update your own posts.'
            );
        } 
        else if (error.response?.status === 401) {
            notyf.error(
                'Please login again.'
            );

            localStorage.removeItem('token');
            router.push('/login');
        } 
        else {
            notyf.error(
                message ||
                'Failed to update post.'
            );
        }
    })
    .finally(() => {
        isUpdating.value = false;
    });
}


function canDeletePost(post) {
    if (!currentUser.value || !post) {
        return false;
    }

    const isOwner =
        post.author?.id?.toString() ===
        currentUser.value.id?.toString();

    const isAdmin =
        currentUser.value.isAdmin === true;

    return isOwner || isAdmin;
}


function deletePost() {
    const token = localStorage.getItem('token');

    if (!token) {
        notyf.error('Please login first.');
        router.push('/login');

        return;
    }

    if (!selectedPost.value) {
        return;
    }

    const confirmed = confirm(
        'Are you sure you want to delete this post?'
    );

    if (!confirmed) {
        return;
    }

    axios.delete(
        `${import.meta.env.VITE_API_URL}/posts/deletePost/${selectedPost.value._id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
    .then(response => {
        console.log(
            'Delete post response:',
            response.data
        );
        notyf.success(
            'Post deleted successfully.'
        );

        const modalElement =
            document.getElementById('postDetailsModal');

        const modal =
            Modal.getInstance(modalElement);

        if (modal) {
            modal.hide();
        }

        selectedPost.value = null;

        getPosts();
    })
    .catch(error => {
        console.error(
            'Failed to delete post:',
            error
        );
        const message =
            error.response?.data?.message;

        if (error.response?.status === 401) {
            notyf.error(
                'Please login again.'
            );
            localStorage.removeItem('token');

            router.push('/login');
        } 
        else if (error.response?.status === 403) {
            notyf.error(
                message ||
                'You are not authorized to delete this post.'
            );
        } 
        else {
            notyf.error(
                message ||
                'Failed to delete post.'
            );
        }
    });
}


function getComments(id) {
    axios.get(
        `${import.meta.env.VITE_API_URL}/posts/getComments/${id}`
    )
    .then(response => {
        console.log(
            'Comments response:',
            response.data
        );

        if (Array.isArray(response.data)) {
            comments.value = response.data;
        } 
        else if (Array.isArray(response.data.comments)) {
            comments.value = response.data.comments;
        } 
        else {
            comments.value = [];
        }
    })
    .catch(error => {
        console.error(
            'Failed to retrieve comments:',
            error
        );
        comments.value = [];
        const message = error.response?.data?.message;
        notyf.error(message || 'Failed to retrieve comments.');
    });
}


function addComment() {
    const token = localStorage.getItem('token');

    if (!token) {
        notyf.error(
            'Please login first.'
        );
        router.push('/login');

        return;
    }

    if (!selectedPost.value) {
        return;
    }

    if (!comment.value.trim()) {
        return;
    }

    isCommenting.value = true;

    axios.post(
        `${import.meta.env.VITE_API_URL}/posts/addComment/${selectedPost.value._id}`,
        {
            comment: comment.value.trim()
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
    .then(response => {
        console.log(
            'Add comment response:',
            response.data
        );

        notyf.success(
            'Comment added successfully.'
        );

        comment.value = '';

        getComments(
            selectedPost.value._id
        );
    })
    .catch(error => {
        console.error(
            'Failed to add comment:',
            error
        );

        const message =
            error.response?.data?.message;


        if (error.response?.status === 401) {
            notyf.error(
                'Please login again.'
            );
            localStorage.removeItem('token');
            router.push('/login');
        } 
        else {
            notyf.error(
                message ||
                'Failed to add comment.'
            );
        }
    })
    .finally(() => {
        isCommenting.value = false;
    });
}


function formatDate(date) {

    if (!date) {
        return 'Unknown date';
    }

    return new Date(date).toLocaleDateString();
}


onMounted(() => {

	getCurrentUser();
    getPosts();
});

</script>


<template>

    <div class="container">

        <div class="d-flex justify-content-between align-items-center my-5">

            <h1 class="mb-0">
                Blog Posts
            </h1>

            <button
                class="btn btn-primary"
                @click="openCreateModal"
            >
                Create Post
            </button>
        </div>

        <!-- Loading Posts -->
        <div v-if="isLoading" class="text-center my-5">

            <div
                class="spinner-border"
                role="status"
            >
                <span class="visually-hidden">
                    Loading...
                </span>
            </div>

            <p class="mt-2">
                Loading posts...
            </p>
        </div>

        <!-- No Posts -->
        <div v-else-if="posts.length === 0" class="text-center my-5">
            <p class="text-muted">
                No posts available.
            </p>
        </div>

        <!-- Posts -->
        <div v-else class="row g-4">
            <div v-for="post in posts" :key="post._id" class="col-md-6 col-lg-4">

                <div class="card h-100 shadow-sm">

                    <div class="card-body d-flex flex-column">

                        <h5 class="card-title">
                            {{ post.title }}
                        </h5>

                        <p class="card-text" style="min-height: 72px;">
                            {{ truncateText(post.content) }}
                        </p>

                        <p class="card-text text-muted mt-auto">

                            <small>
                                Author:
                                {{ post.author?.username || 'Unknown' }}
                            </small>

                        </p>

                        <p class="card-text text-muted">

                            <small>
                                Created:
                                {{ formatDate(post.createdAt) }}
                            </small>

                        </p>


                        <button
                            class="btn btn-primary"
                            @click="viewPost(post._id)"
                            :disabled="isPostLoading"
                        >
                            View Post
                        </button>

                    </div>

                </div>

            </div>
        </div>


        <!-- Post Details Modal -->
        <div class="modal fade" id="postDetailsModal" tabindex="-1" aria-labelledby="postDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">

                    <!-- Modal Header -->
                    <div class="modal-header">

                        <h5 class="modal-title" id="postDetailsModalLabel">
                            Post Details
                        </h5>

                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <!-- Modal Body -->
                    <div class="modal-body">
                        <div v-if="selectedPost">

                            <h2 class="mb-3">
                                {{ selectedPost.title }}
                            </h2>

                            <p class="text-muted mb-1">
                                <strong>Author:</strong>
                                {{ selectedPost.author?.username || 'Unknown' }}
                            </p>

                            <p class="text-muted">
                                <strong>Created:</strong>
                                {{ formatDate(selectedPost.createdAt) }}
                            </p>

                            <hr>

                            <p class="mb-0">
                                {{ selectedPost.content }}
                            </p>

                            <hr class="my-4">

                            <h5 class="mb-3">
                                Comments
                            </h5>

                            <!-- Add Comment -->
                            <div class="mb-4">
                                <label for="comment" class="form-label">
                                    Add a Comment
                                </label>
                                <textarea id="comment" class="form-control" rows="3" placeholder="Write your comment..." v-model="comment"></textarea>
                            </div>

                            <button type="button" class="btn"
                                :class="
                                    isCommentActive
                                        ? 'btn-primary'
                                        : 'btn-danger'
                                "
                                :disabled="
                                    !isCommentActive ||
                                    isCommenting
                                "
                                @click="addComment">
                                {{ isCommenting ? 'Adding...' : 'Add Comment' }}
                            </button>

                            <hr class="my-4">

                            <!-- Comments List -->
                            <div v-if="comments.length === 0">
                                <p class="text-muted">
                                    No comments yet.
                                </p>
                            </div>

                            <div v-else>
                                <div v-for="(item, index) in comments" :key="item._id || index" class="card mb-3">
                                    <div class="card-body">
                                        <p class="mb-1">
                                            {{ item.comment }}
                                        </p>
                                        <small class="text-muted">
                                            {{ item.username || item.author?.username || 'User' }}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="text-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">
                                    Loading...
                                </span>
                            </div>
                        </div>
                    </div>


                    <!-- Modal Footer -->
                    <div class="modal-footer">
                        <button v-if="isPostOwner(selectedPost)" type="button" class="btn btn-primary" @click="openUpdateModal">
                            Update
                        </button>


                        <button v-if="canDeletePost(selectedPost)" type="button" class="btn btn-danger" @click="deletePost">
                            Delete
                        </button>


                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>


        <!-- Create Post Modal -->
        <div class="modal fade" id="createPostModal" tabindex="-1" aria-labelledby="createPostModalLabel" aria-hidden="true" :class="{ show: showCreateModal }" :style="{ display: showCreateModal ? 'block' : 'none' }">
            <div class="modal-dialog modal-lg modal-dialog-centered">

                <div class="modal-content">


                    <!-- Header -->
                    <div class="modal-header">

                        <h5
                            class="modal-title"
                            id="createPostModalLabel"
                        >
                            Create Post
                        </h5>

                        <button
                            type="button"
                            class="btn-close"
                            @click="showCreateModal = false"
                        ></button>

                    </div>


                    <!-- Body -->
                    <div class="modal-body">

                        <div class="mb-3">

                            <label
                                for="postTitle"
                                class="form-label"
                            >
                                Title
                            </label>

                            <input
                                type="text"
                                class="form-control"
                                id="postTitle"
                                placeholder="Enter post title"
                                v-model="title"
                            />

                        </div>


                        <div class="mb-3">

                            <label
                                for="postContent"
                                class="form-label"
                            >
                                Content
                            </label>

                            <textarea
                                class="form-control"
                                id="postContent"
                                rows="6"
                                placeholder="Write your post..."
                                v-model="content"
                            ></textarea>

                        </div>

                    </div>


                    <!-- Footer -->
                    <div class="modal-footer">

                        <button
                            type="button"
                            class="btn btn-secondary"
                            @click="showCreateModal = false"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            class="btn"
                            :class="isCreateActive ? 'btn-primary' : 'btn-danger'"
                            :disabled="!isCreateActive || isCreating"
                            @click="createPost"
                        >
                            {{ isCreating ? 'Creating...' : 'Create Post' }}
                        </button>

                    </div>

                </div>

            </div>
        </div>

        <div v-if="showCreateModal" class="modal-backdrop fade show"></div>


        <!-- Update Post Modal -->
        <div class="modal fade" id="updatePostModal" tabindex="-1" aria-labelledby="updatePostModalLabel" aria-hidden="true" :class="{ show: showUpdateModal }" :style="{ display: showUpdateModal ? 'block' : 'none' }">
            <div class="modal-dialog modal-lg modal-dialog-centered">

                <div class="modal-content">


                    <!-- Header -->
                    <div class="modal-header">

                        <h5
                            class="modal-title"
                            id="updatePostModalLabel"
                        >
                            Update Post
                        </h5>

                        <button
                            type="button"
                            class="btn-close"
                            @click="showUpdateModal = false"
                        ></button>
                    </div>


                    <!-- Body -->
                    <div class="modal-body">

                        <div class="mb-3">

                            <label
                                for="updatePostTitle"
                                class="form-label"
                            >
                                Title
                            </label>

                            <input
                                type="text"
                                class="form-control"
                                id="updatePostTitle"
                                placeholder="Enter post title"
                                v-model="updateTitle"
                            />

                        </div>


                        <div class="mb-3">

                            <label
                                for="updatePostContent"
                                class="form-label"
                            >
                                Content
                            </label>

                            <textarea
                                class="form-control"
                                id="updatePostContent"
                                rows="6"
                                placeholder="Write your post..."
                                v-model="updateContent"
                            ></textarea>

                        </div>
                    </div>


                    <!-- Footer -->
                    <div class="modal-footer">

                        <button
                            type="button"
                            class="btn btn-secondary"
                            @click="showUpdateModal = false"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            class="btn"
                            :class="
                                isUpdateActive
                                    ? 'btn-primary'
                                    : 'btn-danger'
                            "
                            :disabled="
                                !isUpdateActive ||
                                isUpdating
                            "
                            @click="updatePost"
                        >
                            {{
                                isUpdating
                                    ? 'Updating...'
                                    : 'Update Post'
                            }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showUpdateModal" class="modal-backdrop fade show"></div>
    </div>

</template>