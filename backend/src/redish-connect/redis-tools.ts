require("dotenv").config;
import { createClient } from "redis";

console.log("process.env.REDIS_URL",process.env.REDIS_PASSWORD);

export const redis = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-19144.c14.us-east-1-2.ec2.redns.redis-cloud.com',
        port: 19144
    }
});

export async function connectredis(){
        redis.on('error', err => console.log('Redis redis Error', err));
        await redis.connect();
        await redis.set('foo', 'bar');
        const result = await redis.get('foo');
        console.log(result)
}