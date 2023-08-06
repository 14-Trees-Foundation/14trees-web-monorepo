import path from 'path';
import express, {Request} from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { MongoClient } from 'mongodb';

interface ResponseError extends  Error {
    status?: number;
}
mongoose.Promise = global.Promise;
// const { applicationDefault, initializeApp } = require('firebase-admin/app');

const app = express();
require('dotenv').config();

app.use(express.static(path.join(__dirname, 'client/build')));

app.use(cors<Request>());
// Add middleware for parsing JSON and urlencoded data and populating `req.body`
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Pass to next layer of middleware
    next();
});

// Connect MongoDB
const connectDB = async () => {
    console.log("[server.ts:31]", "process.env", process.env)
    const mongo_connection_string = process.env.NODE_ENV === 'development' ?
            `mongodb://${process.env.LOCAL_MONGO_URL}` :
            `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PWD}@${process.env.MONGO_URL}`
    try {
        console.log('Connecting to MongoDB...', mongo_connection_string);
        await mongoose.connect(mongo_connection_string + '?retryWrites=true&w=majority', { autoIndex: false, });
        const client = new MongoClient(mongo_connection_string);
        console.log('MongoDB connected!!');
    } catch (err) {
        console.log('Failed to connect to MongoDB', err);
    }
};

connectDB();

import userRoutes from './routes/userRoutes';
import treeRoutes from './routes/treeRoutes';
import profileRoute from './routes/profileRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import plotRoutes from './routes/plotRoutes';
import activityRoutes from './routes/activityRoutes';
import searchRoutes from './routes/searchRoutes';
import eventRoutes from './routes/eventRoutes';
import orgRoutes from './routes/orgRoutes';
import loginRoutes from './routes/loginRoutes';
import mytreesRoutes from './routes/mytreesRoutes';
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';
import templateRoutes from './routes/templateRoute';
import contributionRoutes from './routes/contributeRoutes';
import pondsRoutes from './routes/pondsRoutes';
import imageRoutes from './routes/imageRoutes';

app.use('/api/templates', templateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/profile', profileRoute);
app.use('/api/mytrees', mytreesRoutes);
app.use('/api/plots', plotRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/auth', authRoutes);
// app.use('/api/donations', donationRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/ponds', pondsRoutes);
app.use('/api/images', imageRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err: ResponseError = new Error('Not Found');
    err['status'] = 404;
    next(err);
});

// @ts-ignore
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        error: {
            message: err.message,
        },
    });
});

var port = process.env.SERVER_PORT || 8088;

app.listen(port, function () {
    console.log('API Server listening on port ' + port + '!');
});

export default app;