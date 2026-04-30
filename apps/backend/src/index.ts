import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'supersecret';

fastify.register(cors, { origin: true });

const authenticate = async (request: any, reply: any) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new Error('No token provided');
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    request.user = decoded;
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
};

// --- AUTH ---
fastify.post('/register', async (request, reply) => {
  const { username, password } = (request.body || {}) as any;
  if (!username || !password) return reply.status(400).send({ error: "Isi semua!" });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
      select: { id: true, username: true } 
    });
    return reply.status(201).send({ message: "Success", userId: user.id });
  } catch (error: any) {
    if (error.code === 'P2002') return reply.status(400).send({ error: "Username exist" });
    return reply.status(500).send({ error: "Error" });
  }
});

fastify.post('/login', async (request, reply) => {
  const { username, password } = (request.body || {}) as any;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return reply.status(401).send({ error: "Wrong credentials" });
  }
  const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1d' });
  return { token };
});

// --- TRACKS ---
fastify.post('/tracks', { preHandler: [authenticate] }, async (request: any, reply) => {
  const { title, value } = (request.body || {}) as any;
  try {
    const newTrack = await prisma.track.create({
      data: { title, value: parseFloat(value), userId: request.user.userId }
    });
    return reply.status(201).send(newTrack);
  } catch (error) {
    return reply.status(500).send({ error: "Gagal simpan" });
  }
});

fastify.get('/tracks', { preHandler: [authenticate] }, async (request: any) => {
  return await prisma.track.findMany({
    where: { userId: request.user.userId },
    orderBy: { createdAt: 'desc' }
  });
});

fastify.get('/tracks/stats', { preHandler: [authenticate] }, async (request: any) => {
  const tracks = await prisma.track.findMany({
    where: { userId: request.user.userId }
  });
  
  // FIX ERROR sum & t: any
  const totalValue = tracks.reduce((sum: number, t: any) => sum + t.value, 0);
  const avgValue = tracks.length > 0 ? totalValue / tracks.length : 0;
  
  return {
    count: tracks.length,
    total: totalValue,
    average: avgValue.toFixed(2),
    latest: tracks[0] || null
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log(`🚀 SERVER NYALA!`);
  } catch (err) {
    process.exit(1);
  }
};

start();