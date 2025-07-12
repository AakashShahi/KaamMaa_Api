const request = require("supertest");
const app = require("../../index");
const mongoose = require("mongoose");
const User = require("../../models/User");
const Profession = require("../../models/ProfessionCategory");

let token;
let professionId;

beforeAll(async () => {
    await User.deleteOne({ email: "admin@test.com" });

    // Register Admin User
    await request(app).post("/api/auth/register").send({
        username: "adminuser",
        name: "Admin User",
        email: "admin@test.com",
        password: "admin123",
        role: "customer", // temp role, update below
        phone: "9811111111"
    });

    // Set role to admin
    await User.updateOne({ email: "admin@test.com" }, { $set: { role: "admin" } });

    // Login to get token
    const loginRes = await request(app).post("/api/auth/login").send({
        email: "admin@test.com",
        password: "admin123"
    });

    token = loginRes.body.token;
});

afterAll(async () => {
    await User.deleteOne({ email: "admin@test.com" });
    await Profession.deleteMany({});
    await mongoose.disconnect();
});

describe("Admin Profession Routes", () => {
    test("should create a new profession", async () => {
        const res = await request(app)
            .post("/api/admin/profession/create")
            .set("Authorization", `Bearer ${token}`)
            .field("name", "Electrician")
            .field("category", "electrician")
            .field("description", "Handles electrical work");

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Profession "Electrician" added successfully');

        professionId = res.body.data._id;
    });

    test("should not allow duplicate profession category", async () => {
        const res = await request(app)
            .post("/api/admin/profession/create")
            .set("Authorization", `Bearer ${token}`)
            .field("name", "Electrician")
            .field("category", "electrician")
            .field("description", "Duplicate entry");

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Profession already exists");
    });

    test("should get all professions", async () => {
        const res = await request(app)
            .get("/api/admin/profession")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.message).toBe("Professions fetched successfully");
    });

    test("should get one profession by ID", async () => {
        const res = await request(app)
            .get(`/api/admin/profession/${professionId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data._id).toBe(professionId);
    });

    test("should return 404 for invalid profession ID", async () => {
        const res = await request(app)
            .get("/api/admin/profession/64cfe3f4b33d9c20cd999999")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Profession not found");
    });

    test("should update the profession", async () => {
        const res = await request(app)
            .put(`/api/admin/profession/${professionId}`)
            .set("Authorization", `Bearer ${token}`)
            .field("name", "Updated Electrician")
            .field("category", "electrician")
            .field("description", "Updated description");

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Profession updated successfully");
        expect(res.body.data.name).toBe("Updated Electrician");
    });

    test("should delete the profession", async () => {
        const res = await request(app)
            .delete(`/api/admin/profession/${professionId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Profession deleted successfully");
    });

    test("should return 404 on deleting already deleted profession", async () => {
        const res = await request(app)
            .delete(`/api/admin/profession/${professionId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Profession not found");
    });
});