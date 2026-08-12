import { createRouter, createWebHistory } from 'vue-router';

import Home from '../pages/Home.vue';
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';
import Posts from '../pages/Posts.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),

    routes: [

    	{
    	    path: '/',
    	    name: 'home',
    	    component: Home
    	},

        {
            path: '/login',
            name: 'login',
            component: Login
        },

        {
            path: '/register',
            name: 'register',
            component: Register
        },

        {
            path: '/posts',
            name: 'posts',
            component: Posts,
            meta: {
                requiresAuth: true
            }
        }

    ]
});


router.beforeEach((to) => {

    const token = localStorage.getItem('token');

    if (to.meta.requiresAuth && !token) {
        return '/login';
    }

    return true;
});


export default router;