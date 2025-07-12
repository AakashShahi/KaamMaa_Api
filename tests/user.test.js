const request = require("supertest");
const app = require("../index");
const User = require("../models/User");
const mongoose = require("mongoose");

let authToken;

afterAll(async () => {
    await User.deleteOne({ email: "ram@gmail.com" });
    await mongoose.disconnect();
});

describe("User Authentication API", () => {
    beforeAll(async () => {
        await User.deleteOne({ email: "ram@gmail.com" });
    });

    test("should fail validation with missing fields during registration", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Ram",
            email: "ram@gmail.com",
        });

        expect(res.statusCode).toBe(500);
        expect(res.body.success).toBe(false);
    });

    test("should register a new user", async () => {
        const res = await request(app).post("/api/auth/register").send({
            username: "ram123",
            name: "Ram Bahadur",
            email: "ram@gmail.com",
            password: "password123",
            role: "customer",
            phone: "9800000000",
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("customer registered");
    });

    test("should fail registering duplicate user", async () => {
        const res = await request(app).post("/api/auth/register").send({
            username: "ram123",
            name: "Ram Bahadur",
            email: "ram@gmail.com",
            password: "password123",
            role: "customer",
            phone: "9800000000",
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Email or username already in use");
    });

    test("should login successfully with email and password", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "ram@gmail.com",
            password: "password123",
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Login Successful");
        expect(res.body.token).toBeDefined();

        authToken = res.body.token;
    });

    test("should fail login with incorrect password", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "ram@gmail.com",
            password: "wrongpass",
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Invalid Credentials");
    });

    test("should fail login with non-existing email", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "nonexistent@gmail.com",
            password: "password123",
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("User not found");
    });
});