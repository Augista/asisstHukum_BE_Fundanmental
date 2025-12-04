const dotenv = require('dotenv');
const createApp = require('./app');

dotenv.config();

const app = createApp();

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
