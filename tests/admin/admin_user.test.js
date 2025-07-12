const request = require("supertest");
const app = require("../../index");
const mongoose = require("mongoose");
const User = require("../../models/User");

let adminToken;
let createdUserId;

beforeAll(async () => {
    await User.deleteMany({ email: { $in: ["admin@test.com", "user1@test.com"] } });

    // Register admin user
    await request(app).post("/api/auth/register").send({
        username: "adminuser",
        name: "Admin",
        email: "admin@test.com",
        password: "admin123",
        role: "customer", // temporary
        phone: "9800000001"
    });

    // Make user admin
    await User.updateOne({ email: "admin@test.com" }, { $set: { role: "admin" } });

    // Login admin
    const res = await request(app).post("/api/auth/login").send({
        email: "admin@test.com",
        password: "admin123"
    });

    adminToken = res.body.token;
});

afterAll(async () => {
    await User.deleteMany({ email: { $in: ["admin@test.com", "user1@test.com"] } });
    await mongoose.disconnect();
});

describe("Admin User Management", () => {
    test("should create a new user as admin", async () => {
        const res = await request(app)
            .post("/api/admin/users/create")
            .set("Authorization", `Bearer ${adminToken}`)
            .field("username", "user1")
            .field("name", "User One")
            .field("email", "user1@test.com")
            .field("password", "user12345")
            .field("role", "customer")
            .field("phone", "9800000002");

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("customer registered");

        createdUserId = res.body.data._id;
    });

    test("should not create user with duplicate email/username", async () => {
        const res = await request(app)
            .post("/api/admin/users/create")
            .set("Authorization", `Bearer ${adminToken}`)
            .field("username", "user1")
            .field("name", "Duplicate User")
            .field("email", "user1@test.com")
            .field("password", "somepass")
            .field("role", "worker")
            .field("phone", "9800000002");

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Email or username already in use");
    });

    test("should get all users with pagination", async () => {
        const res = await request(app)
            .get("/api/admin/users?page=1&limit=5")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.pagination).toHaveProperty("total");
    });

    test("should search users by name/email", async () => {
        const res = await request(app)
            .get("/api/admin/users?search=admin")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.some(u => u.email === "admin@test.com")).toBe(true);
    });

    test("should get a user by ID", async () => {
        const res = await request(app)
            .get(`/api/admin/users/${createdUserId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe("user1@test.com");
    });

    test("should return 404 if user not found", async () => {
        const res = await request(app)
            .get(`/api/admin/users/64cfe3f4b33d9c20cd999999`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("User not found");
    });

    test("should update a user", async () => {
        const res = await request(app)
            .put(`/api/admin/users/${createdUserId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Updated Name", location: "Kathmandu" });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("User updated successfully");
        expect(res.body.data.name).toBe("Updated Name");
    });

    test("should return 404 when updating non-existent user", async () => {
        const res = await request(app)
            .put("/api/admin/users/64cfe3f4b33d9c20cd000000")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Fail Update" });

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("User not found");
    });

    test("should delete a user", async () => {
        const res = await request(app)
            .delete(`/api/admin/users/${createdUserId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("User deleted successfully");
    });

    test("should return 404 when deleting already deleted user", async () => {
        const res = await request(app)
            .delete(`/api/admin/users/${createdUserId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("User not found");
    });
});