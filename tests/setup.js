import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';
import Client from '../src/models/Client.js';
import Project from '../src/models/Project.js';
import DeliveryNote from '../src/models/DeliveryNote.js';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

let mongoServer;

const syncIndexes = async () => {
    await Promise.all([
        User.syncIndexes(),
        Company.syncIndexes(),
        Client.syncIndexes(),
        Project.syncIndexes(),
        DeliveryNote.syncIndexes(),
    ]);
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await syncIndexes();
});

afterEach(async () => {
    await mongoose.connection.dropDatabase();
    await syncIndexes();
});

afterAll(async () => {
    await mongoose.connection.close();

    if (mongoServer) {
        await mongoServer.stop();
    }
});