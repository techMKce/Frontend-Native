// import axios from 'axios';

// const Api = axios.create({
//   baseURL: 'https://assignmentservice-2a8o.onrender.com/api'
// });
//  export default Api;
import axios from 'axios';

export const BASE_URL = 'https://assignmentservice-2a8o.onrender.com/api';

const Api = axios.create({
  baseURL: BASE_URL,
});

export default Api;