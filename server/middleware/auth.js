const jwt = require('jsonwebtoken');

module.exports.verify = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            auth: "Failed",
            message: "No token provided"
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            auth: "Failed",
            message: "Invalid token"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        req.user = decoded;

        next();

    } catch (error) {
        console.error(error);

        return res.status(401).json({
            auth: "Failed",
            message: "Invalid or expired token"
        });
    }
};


module.exports.verifyAdmin = (req, res, next) => {
    if (req.user.isAdmin === true) {
        next();
    } else {
        return res.status(403).json({
            auth: "Failed",
            message: "Action Forbidden"
        });
    }
};