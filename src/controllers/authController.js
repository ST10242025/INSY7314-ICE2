import { signupUser, loginUser } from '../services/userService.js';

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await signupUser({ username, email, password });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export default {
  signup,
  login,
}; 