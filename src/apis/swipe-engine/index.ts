import axios from 'axios'

export const swipe_engine_api = axios.create({
    baseURL: "http://localhost:5000/",
});