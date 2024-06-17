import axios from 'axios';

export default axios.create({
    baseURL: process.env.NODE_ENV === "production" ? 'https://api.14trees.org/api/' : `http://localhost:${process.env.SERVER_PORT || 8088}/api/`,
})