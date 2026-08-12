const express = require('express');

const router = express.Router();

const postController = require('../controllers/postController');
const { verify } = require('../middleware/auth');


router.get('/', postController.getPosts);

router.get('/getPost/:id', postController.getPost);

router.post('/createPost', verify, postController.createPost);

router.patch('/updatePost/:id', verify, postController.updatePost);

router.delete('/deletePost/:id', verify, postController.deletePost);

router.post('/addComment/:id', verify, postController.addComment);

router.get('/getComments/:id', postController.getComments);


module.exports = router;