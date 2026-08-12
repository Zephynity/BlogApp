const Post = require('../models/Post');
const mongoose = require('mongoose');


module.exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });

        return res.status(200).json(posts);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Failed to retrieve posts'
        });
    }
};



module.exports.getPost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        return res.status(200).json(post);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Failed to retrieve post'
        });
    }
};



module.exports.createPost = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        const newPost = new Post({
            title: title.trim(),
            content: content.trim(),
            author: {
                id: req.user.id,
                username: req.user.username
            }
        });

        await newPost.save();

        return res.status(201).json({
            message: 'Post created successfully',
            post: newPost
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Failed to create post'
        });
    }
};



module.exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        if (post.author.id.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: 'You can only update your own posts'
            });
        }

        post.title = title.trim();
        post.content = content.trim();

        await post.save();

        return res.status(200).json({
            message: 'Post updated successfully',
            post
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Failed to update post'
        });
    }
};



module.exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        if (req.user.isAdmin === true) {
            await Post.findByIdAndDelete(id);

            return res.status(200).json({
                message: 'Post deleted successfully'
            });
        }

        if (post.author.id.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: 'You can only delete your own posts'
            });
        }

        await Post.findByIdAndDelete(id);

        return res.status(200).json({
            message: 'Post deleted successfully'
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Failed to delete post'
        });
    }
};



module.exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        if (!comment || comment.trim() === '') {
            return res.status(400).json({
                message: 'Comment is required'
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        post.comments.push({
            comment: comment.trim(),
            author: {
                id: req.user.id,
                username: req.user.username
            }
        });

        await post.save();

        return res.status(201).json({
            message: 'Comment added successfully',
            post
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Failed to add comment'
        });
    }
};


module.exports.getComments = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }
        return res.status(200).json({
            comments: post.comments || []
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Failed to retrieve comments'
        });
    }
};


module.exports.likePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        const userId = req.user.id.toString();

        if (!post.likes) {
            post.likes = [];
        }

        const likeIndex = post.likes.findIndex(
            like => like.toString() === userId
        );

        if (likeIndex !== -1) {

            post.likes.splice(likeIndex, 1);

            await post.save();

            return res.status(200).json({
                message: 'Post unliked successfully',
                liked: false,
                likesCount: post.likes.length
            });
        }

        post.likes.push(req.user.id);

        await post.save();

        return res.status(200).json({
            message: 'Post liked successfully',
            liked: true,
            likesCount: post.likes.length
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: 'Failed to like post'
        });
    }
};