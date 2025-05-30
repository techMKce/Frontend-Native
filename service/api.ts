import axios from 'axios';

const Api = axios.create({
  baseURL: 'https://assignmentservice-2a8o.onrender.com/api'
});
 export default Api;