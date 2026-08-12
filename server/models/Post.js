const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        content: {
            type: String,
            required: true,
            trim: true
        },

        author: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },

            username: {
                type: String,
                required: true
            }
        },

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],

        comments: [
            {
                author: {
                    id: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                        required: true
                    },

                    username: {
                        type: String,
                        required: true
                    }
                },

                comment: {
                    type: String,
                    required: true,
                    trim: true
                }
            }
        ]
    },

    {
        timestamps: true
    }
);

module.exports = mongoose.model('Post', postSchema);