import axios from 'axios';

// const baseUrl = process.env.REACT_APP_ENV === 'test' ? 'http://localhost:3000/api/' : 'https://api.14trees.org/api/';
const baseUrl = "https://api.14trees.org/api/";

export default axios.create({
    baseURL: baseUrl,
})