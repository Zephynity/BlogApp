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

const isLiking = ref({});

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


function isPostLiked(post) {
    if (!currentUser.value || !post) {
        return false;
    }

    if (!Array.isArray(post.likes)) {
        return false;
    }

    return post.likes.some(
        like => like?.toString() === currentUser.value.id?.toString()
    );
}


function toggleLike(post) {

    const token = localStorage.getItem('token');

    if (!token) {
        notyf.error('Please login first.');
        router.push('/login');
        return;
    }

    if (!post) {
        return;
    }

    if (isLiking.value[post._id]) {
        return;
    }

    isLiking.value[post._id] = true;

    const likeUrl =
        `${import.meta.env.VITE_API_URL}/posts/like/${post._id}`;

    console.log('Like URL:', likeUrl);

    axios.post(
        likeUrl,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
    .then(response => {

        console.log(
            'Like response:',
            response.data
        );

        const postIndex = posts.value.findIndex(
            item => item._id === post._id
        );

        if (postIndex !== -1) {

            const updatedPost = posts.value[postIndex];

            if (!Array.isArray(updatedPost.likes)) {
                updatedPost.likes = [];
            }

            const userId =
                currentUser.value.id.toString();

            const likeIndex =
                updatedPost.likes.findIndex(
                    like =>
                        like?.toString() === userId
                );

            if (response.data.liked) {

                if (likeIndex === -1) {
                    updatedPost.likes.push(userId);
                }

            } else {

                if (likeIndex !== -1) {
                    updatedPost.likes.splice(
                        likeIndex,
                        1
                    );
                }
            }
        }

    })
    .catch(error => {

        console.error(
            'Failed to like post:',
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

        } else {

            notyf.error(
                message ||
                'Failed to like post.'
            );

        }

    })
    .finally(() => {

        isLiking.value[post._id] = false;

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

    <div class="posthub-feed">

        <!-- Page Header -->
        <div class="feed-header">

            <div>
                <h1 class="feed-title">
                    Home
                </h1>

                <p class="feed-subtitle">
                    See what people are sharing on PostHub.
                </p>
            </div>

            <button class="create-post-btn" @click="openCreateModal">
                <span>+</span>
                Create Post
            </button>

        </div>


        <!-- Loading Posts -->
        <div
            v-if="isLoading"
            class="loading-container"
        >

            <div
                class="spinner-border"
                role="status"
            >
                <span class="visually-hidden">
                    Loading...
                </span>
            </div>

            <p>
                Loading posts...
            </p>

        </div>


        <!-- No Posts -->
        <div
            v-else-if="posts.length === 0"
            class="empty-feed"
        >

            <div class="empty-icon">
                ✎
            </div>

            <h4>
                No posts yet
            </h4>

            <p>
                Be the first person to share something!
            </p>

            <button
                class="create-post-btn"
                @click="openCreateModal"
            >
                Create the First Post
            </button>

        </div>


        <!-- Facebook-style Feed -->
        <div v-else class="post-feed">

            <article
                v-for="post in posts"
                :key="post._id"
                class="post-card"
            >

                <!-- Post Header -->
                <div class="post-header">

                    <div class="user-avatar">
                        {{
                            (
                                post.author?.username ||
                                'U'
                            ).charAt(0).toUpperCase()
                        }}
                    </div>

                    <div class="post-user-info">

                        <div class="post-username">
                            {{ post.author?.username || 'Unknown User' }}
                        </div>

                        <div class="post-date">
                            {{ formatDate(post.createdAt) }}
                        </div>

                    </div>

                </div>


                <!-- Post Content -->
                <div class="post-content">

                    <h2 class="post-title">
                        {{ post.title }}
                    </h2>

                    <p class="post-text">
                        {{ truncateText(post.content) }}
                    </p>

                    <button
                        v-if="post.content && post.content.length > 150"
                        class="read-more-btn"
                        @click="viewPost(post._id)"
                    >
                        Read more
                    </button>

                </div>


                <!-- Post Footer -->
                <div class="post-footer">

                    <!-- Post Stats -->
                    <div class="post-stats">

                        <span>
                            👍 {{ post.likes?.length || 0 }}
                            {{ post.likes?.length === 1 ? 'Like' : 'Likes' }}
                        </span>

                        <span>
                            💬 Comments
                        </span>

                    </div>


                    <!-- Post Actions -->
                    <div class="post-actions">

                        <!-- Like Button -->
                        <button
                            type="button"
                            class="post-action-btn"
                            :class="{ liked: isPostLiked(post) }"
                            :disabled="isLiking[post._id]"
                            @click="toggleLike(post)"
                        >
                            {{ isPostLiked(post) ? '👍 Liked' : '👍 Like' }}
                        </button>


                        <!-- View Post -->
                        <button
                            type="button"
                            class="view-post-btn"
                            @click="viewPost(post._id)"
                            :disabled="isPostLoading"
                        >
                            View Post
                        </button>
                    </div>
                </div>

            </article>
        </div>


        <!-- Post Details Modal -->
        <div
            class="modal fade"
            id="postDetailsModal"
            tabindex="-1"
            aria-labelledby="postDetailsModalLabel"
            aria-hidden="true"
        >

            <div class="modal-dialog modal-lg modal-dialog-centered">

                <div class="modal-content post-modal">

                    <!-- Modal Header -->
                    <div class="modal-header">

                        <h5
                            class="modal-title"
                            id="postDetailsModalLabel"
                        >
                            Post
                        </h5>

                        <button
                            type="button"
                            class="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        ></button>

                    </div>


                    <!-- Modal Body -->
                    <div class="modal-body">

                        <div v-if="selectedPost">

                            <!-- User Information -->
                            <div class="modal-user">

                                <div class="user-avatar">
                                    {{
                                        (
                                            selectedPost.author?.username ||
                                            'U'
                                        ).charAt(0).toUpperCase()
                                    }}
                                </div>

                                <div>

                                    <div class="post-username">
                                        {{
                                            selectedPost.author?.username ||
                                            'Unknown User'
                                        }}
                                    </div>

                                    <div class="post-date">
                                        {{
                                            formatDate(
                                                selectedPost.createdAt
                                            )
                                        }}
                                    </div>

                                </div>

                            </div>


                            <!-- Full Post -->
                            <div class="modal-post-content">

                                <h2 class="modal-post-title">
                                    {{ selectedPost.title }}
                                </h2>

                                <p class="modal-post-text">
                                    {{ selectedPost.content }}
                                </p>

                            </div>


                            <hr class="my-4">


                            <!-- Comments -->
                            <h5 class="comments-title">
                                Comments
                            </h5>


                            <!-- Add Comment -->
                            <div class="comment-form">

                                <label
                                    for="comment"
                                    class="form-label"
                                >
                                    Add a Comment
                                </label>

                                <textarea
                                    id="comment"
                                    class="form-control"
                                    rows="3"
                                    placeholder="Write a comment..."
                                    v-model="comment"
                                ></textarea>

                                <div class="comment-submit">

                                    <button
                                        type="button"
                                        class="btn"
                                        :class="
                                            isCommentActive
                                                ? 'btn-primary'
                                                : 'btn-danger'
                                        "
                                        :disabled="
                                            !isCommentActive ||
                                            isCommenting
                                        "
                                        @click="addComment"
                                    >
                                        {{
                                            isCommenting
                                                ? 'Adding...'
                                                : 'Comment'
                                        }}
                                    </button>

                                </div>

                            </div>


                            <hr class="my-4">


                            <!-- Comments List -->
                            <div
                                v-if="comments.length === 0"
                                class="no-comments"
                            >

                                <p>
                                    No comments yet.
                                </p>

                            </div>


                            <div v-else>

                                <div
                                    v-for="(item, index) in comments"
                                    :key="item._id || index"
                                    class="comment-card"
                                >

                                    <div class="comment-avatar">
                                        {{
                                            (
                                                item.username ||
                                                item.author?.username ||
                                                'U'
                                            )
                                            .charAt(0)
                                            .toUpperCase()
                                        }}
                                    </div>

                                    <div class="comment-body">

                                        <div class="comment-user">
                                            {{
                                                item.username ||
                                                item.author?.username ||
                                                'User'
                                            }}
                                        </div>

                                        <p>
                                            {{ item.comment }}
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div
                            v-else
                            class="text-center"
                        >

                            <div
                                class="spinner-border"
                                role="status"
                            >
                                <span class="visually-hidden">
                                    Loading...
                                </span>
                            </div>

                        </div>

                    </div>


                    <!-- Modal Footer -->
                    <div class="modal-footer">

                        <button
                            v-if="isPostOwner(selectedPost)"
                            type="button"
                            class="btn btn-primary"
                            @click="openUpdateModal"
                        >
                            Update
                        </button>


                        <button
                            v-if="canDeletePost(selectedPost)"
                            type="button"
                            class="btn btn-danger"
                            @click="deletePost"
                        >
                            Delete
                        </button>


                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-bs-dismiss="modal"
                        >
                            Close
                        </button>

                    </div>

                </div>

            </div>

        </div>


        <!-- Create Post Modal -->
        <div
            class="modal fade"
            id="createPostModal"
            tabindex="-1"
            aria-labelledby="createPostModalLabel"
            aria-hidden="true"
            :class="{ show: showCreateModal }"
            :style="{
                display: showCreateModal
                    ? 'block'
                    : 'none'
            }"
        >

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
                            :class="
                                isCreateActive
                                    ? 'btn-primary'
                                    : 'btn-danger'
                            "
                            :disabled="
                                !isCreateActive ||
                                isCreating
                            "
                            @click="createPost"
                        >
                            {{
                                isCreating
                                    ? 'Creating...'
                                    : 'Create Post'
                            }}
                        </button>

                    </div>

                </div>

            </div>

        </div>


        <div
            v-if="showCreateModal"
            class="modal-backdrop fade show"
        ></div>


        <!-- Update Post Modal -->
        <div
            class="modal fade"
            id="updatePostModal"
            tabindex="-1"
            aria-labelledby="updatePostModalLabel"
            aria-hidden="true"
            :class="{ show: showUpdateModal }"
            :style="{
                display: showUpdateModal
                    ? 'block'
                    : 'none'
            }"
        >

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

<style scoped>

    .posthub-feed {
        max-width: 760px;
        margin: 0 auto;
        padding: 35px 15px 60px;
    }


    .feed-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
    }

    .feed-title {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
    }

    .feed-subtitle {
        margin: 5px 0 0;
        color: #6c757d;
        font-size: 14px;
    }


    .create-post-btn {
        border: none;
        background-color: #a2e436;
        color: white;
        font-weight: 600;
        padding: 10px 18px;
        border-radius: 8px;
        transition: 0.2s ease;
    }

    .create-post-btn:hover {
        background-color: #e67e00;
        transform: translateY(-1px);
    }

    .create-post-btn span {
        font-size: 20px;
        margin-right: 5px;
    }


    .post-feed {
        display: flex;
        flex-direction: column;
        gap: 18px;
    }


    .post-card {
        background: white;
        border: 1px solid #e4e6eb;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        transition: box-shadow 0.2s ease,
                    transform 0.2s ease;
    }

    .post-card:hover {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
    }


    .post-header {
        display: flex;
        align-items: center;
        margin-bottom: 18px;
    }

    .user-avatar {
        width: 46px;
        height: 46px;
        min-width: 46px;
        border-radius: 50%;
        background-color: #ff8c00;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 19px;
        font-weight: 700;
        margin-right: 12px;
    }

    .post-user-info {
        display: flex;
        flex-direction: column;
    }

    .post-username {
        font-weight: 700;
        font-size: 15px;
        color: #212529;
    }

    .post-date {
        color: #65676b;
        font-size: 13px;
        margin-top: 2px;
    }


    .post-content {
        padding-left: 2px;
    }

    .post-title {
        font-size: 23px;
        font-weight: 700;
        margin-bottom: 10px;
        color: #1c1e21;
    }

    .post-text {
        color: #4b4f56;
        font-size: 15px;
        line-height: 1.7;
        margin-bottom: 5px;
        white-space: pre-line;
    }

    .read-more-btn {
        border: none;
        background: none;
        padding: 0;
        color: #1877f2;
        font-weight: 600;
        font-size: 14px;
    }

    .read-more-btn:hover {
        text-decoration: underline;
    }


    .post-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #e4e6eb;
        margin-top: 18px;
        padding-top: 15px;
    }

    .post-stats {
        color: #65676b;
        font-size: 14px;
    }

    .view-post-btn {
        border: none;
        background-color: #1877f2;
        color: white;
        font-weight: 600;
        padding: 8px 17px;
        border-radius: 6px;
        transition: 0.2s ease;
    }

    .view-post-btn:hover {
        background-color: #166fe5;
    }


    .empty-feed {
        text-align: center;
        background: white;
        border: 1px solid #e4e6eb;
        border-radius: 12px;
        padding: 60px 20px;
    }

    .empty-icon {
        font-size: 45px;
        color: #ff8c00;
        margin-bottom: 10px;
    }

    .empty-feed h4 {
        font-weight: 700;
    }

    .empty-feed p {
        color: #6c757d;
    }



    .loading-container {
        text-align: center;
        padding: 60px 20px;
    }

    .loading-container p {
        margin-top: 12px;
        color: #6c757d;
    }



    .post-modal {
        border: none;
        border-radius: 12px;
        overflow: hidden;
    }

    .modal-user {
        display: flex;
        align-items: center;
        margin-bottom: 25px;
    }

    .modal-post-content {
        padding: 5px 0;
    }

    .modal-post-title {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 15px;
    }

    .modal-post-text {
        font-size: 16px;
        line-height: 1.8;
        white-space: pre-line;
        color: #343a40;
    }


    .comments-title {
        font-weight: 700;
    }

    .comment-form {
        background-color: #f5f6f7;
        border-radius: 10px;
        padding: 15px;
    }

    .comment-form textarea {
        resize: vertical;
        border: 1px solid #d9dce1;
    }

    .comment-submit {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
    }

    .comment-card {
        display: flex;
        align-items: flex-start;
        background-color: #f5f6f7;
        border-radius: 10px;
        padding: 12px 15px;
        margin-bottom: 10px;
    }

    .comment-avatar {
        width: 36px;
        height: 36px;
        min-width: 36px;
        border-radius: 50%;
        background-color: #ff8c00;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        margin-right: 10px;
    }

    .comment-body {
        flex: 1;
    }

    .comment-user {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 2px;
    }

    .comment-body p {
        margin: 0;
        color: #343a40;
        font-size: 14px;
        line-height: 1.5;
    }

    .no-comments {
        color: #6c757d;
    }


    @media (max-width: 576px) {

        .posthub-feed {
            padding: 20px 10px 40px;
        }

        .feed-header {
            align-items: flex-start;
            gap: 15px;
        }

        .feed-title {
            font-size: 26px;
        }

        .feed-subtitle {
            font-size: 13px;
        }

        .create-post-btn {
            padding: 8px 12px;
            font-size: 13px;
        }

        .post-card {
            padding: 16px;
        }

        .post-title {
            font-size: 20px;
        }

        .post-text {
            font-size: 14px;
        }

        .post-footer {
            align-items: center;
        }

        .view-post-btn {
            padding: 7px 12px;
            font-size: 13px;
        }

        .modal-post-title {
            font-size: 23px;
        }

    }
    

    .post-footer {
        border-top: 1px solid #e9ecef;
        padding-top: 12px;
        margin-top: 15px;
    }

    .post-stats {
        display: flex;
        justify-content: space-between;
        color: #65676b;
        font-size: 14px;
        margin-bottom: 10px;
    }

    .post-actions {
        display: flex;
        gap: 10px;
    }

    .post-action-btn {
        flex: 1;
        border: none;
        background: transparent;
        color: #65676b;
        font-weight: 600;
        padding: 8px 12px;
        border-radius: 6px;
        transition: background-color 0.2s ease;
    }

    .post-action-btn:hover {
        background-color: #f0f2f5;
    }

    .post-action-btn.liked {
        color: #0d6efd;
    }

    .post-action-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .view-post-btn {
        flex: 1;
    }
</style>