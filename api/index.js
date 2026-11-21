import 'dotenv/config';
import { createApiMiddlewareApp } from '../server/app.js';

const app = createApiMiddlewareApp();

export default function handler(req, res) {
  return app(req, res);
}
