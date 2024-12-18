import express from 'express'
import { signup, login, verifyPassword, verfyJWT, refreshAccessToken } from '../controller/userController.js'

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/verifyPassword", verifyPassword);

router.post("/verfyJWT", verfyJWT);

router.post("/refreshAccessToken", refreshAccessToken);

export default router ;