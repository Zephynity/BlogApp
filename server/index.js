const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();


app.use(cors());
app.use(express.json());


const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');

app.use('/users', userRoutes);
app.use('/posts', postRoutes);


app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Blog API is running.'
    });
});


app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        message: 'Internal Server Error'
    });
});


mongoose.connect(process.env.MONGODB_URI)
	.then(() => {
	    console.log('MongoDB connected successfully.');

	    app.listen(process.env.PORT || 4000, () => {
	        console.log(
	            `Server running on port ${process.env.PORT || 4000}`
	        );
	    });
	})
	.catch(error => {
	    console.error('MongoDB connection failed:', error);
	});