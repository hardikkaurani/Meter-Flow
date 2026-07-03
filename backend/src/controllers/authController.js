// HTTP layer for auth. Validation happens in the route via zod; these just
// translate service results into responses.
import * as authService from '../services/authService.js';

export async function signup(req, res) {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function me(req, res) {
  const user = await authService.getMe(req.auth.userId);
  res.json(user);
}
