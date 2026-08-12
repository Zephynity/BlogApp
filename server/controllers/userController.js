const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


module.exports.register = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            username,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(201).json({
            message: "Registered successfully"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Registration failed"
        });
    }
};


module.exports.login = async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({
                message: "Username/email and password are required"
            });
        }

        const user = await User.findOne({
            $or: [
                { email: login.toLowerCase().trim() },
                { username: login.trim() }
            ]
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Incorrect email/username or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: '1d'
            }
        );

        return res.status(200).json({
            message: "Login successful",
            access: token
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Login failed"
        });
    }
};