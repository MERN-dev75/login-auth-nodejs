import express from 'express';
import connectDB from './dbSetup.js';
import loginRoutes from './routes/loginRoutes.js';

const app = express();

const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

app.use(express.json()); // Available in Express v4.16.0 and newer

app.use('/api', loginRoutes);

app.listen(PORT, ()=>{
    console.log("port 4000")
})