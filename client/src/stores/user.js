import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';

export const useUserStore = defineStore('user', () => {

    const user = ref({
        id: null,
        email: null,
        username: null,
        isAdmin: false
    });

    const isLoggedIn = computed(() => {
        return user.value.id !== null;
    });


    function setUser(token) {
        try {
            const decodedToken = jwtDecode(token);

            user.value.id = decodedToken.id || null;
            user.value.email = decodedToken.email || null;
            user.value.username = decodedToken.username || null;
            user.value.isAdmin = decodedToken.isAdmin === true;

            localStorage.setItem('token', token);

        } catch (error) {
            console.error('Failed to decode token:', error);
            unsetUser();
        }
    }


    function loadUser() {
        const token = localStorage.getItem('token');

        if (!token) {
            return;
        }

        setUser(token);
    }


    function unsetUser() {
        user.value.id = null;
        user.value.email = null;
        user.value.username = null;
        user.value.isAdmin = false;

        localStorage.removeItem('token');
    }


    return {
        user,
        isLoggedIn,
        setUser,
        loadUser,
        unsetUser
    };
});