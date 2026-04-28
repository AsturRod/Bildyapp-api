const config = {
    port : process.env.PORT || 3000,
    mongoUri: process.env.MONGO_URI,
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        accessExpiration: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiration: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
};

export default config;