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

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log(`🚀 SERVER NYALA!`);
  } catch (err) {
    process.exit(1);
  }
};

start();