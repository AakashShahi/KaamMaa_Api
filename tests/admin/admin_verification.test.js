const request = require("supertest");
const app = require("../../index");
const mongoose = require("mongoose");
const User = require("../../models/User");

let adminToken;
let workerId;

beforeAll(async () => {
    // Clean up previous test data
    await User.deleteMany({ email: { $in: ["admin@test.com", "worker@test.com"] } });

    // Register Admin
    await request(app).post("/api/auth/register").send({
        username: "admin",
        name: "Admin User",
        email: "admin@test.com",
        password: "admin123",
        role: "customer",
        phone: "9800000001"
    });

    // Elevate to Admin
    await User.updateOne({ email: "admin@test.com" }, { $set: { role: "admin" } });

    // Login Admin
    const loginRes = await request(app).post("/api/auth/login").send({
        email: "admin@test.com",
        password: "admin123"
    });
    adminToken = loginRes.body.token;

    // Register a Worker who requested verification
    const worker = await new User({
        username: "worker1",
        name: "Worker One",
        email: "worker@test.com",
        password: await require("bcrypt").hash("worker123", 10),
        role: "worker",
        phone: "9800000002",
        verificationRequest: true,
        isVerified: false
    }).save();

    workerId = worker._id;
});

afterAll(async () => {
    await User.deleteMany({ email: { $in: ["admin@test.com", "worker@test.com"] } });
    await mongoose.disconnect();
});

describe("Admin Verification Management", () => {

    test("should fetch all verification requests", async () => {
        const res = await request(app)
            .get("/api/admin/verification/worker")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0].role).toBe("worker");
        expect(res.body.data[0].verificationRequest).toBe(true);
        expect(res.body.data[0].isVerified).toBe(false);
    });

    test("should accept worker verification", async () => {
        const res = await request(app)
            .post(`/api/admin/verification/worker/accept/${workerId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Worker verified successfully");

        const updatedWorker = await User.findById(workerId);
        expect(updatedWorker.isVerified).toBe(true);
        expect(updatedWorker.verificationRequest).toBe(false);
    });

    test("should reject verification on an already verified user", async () => {
        const res = await request(app)
            .post(`/api/admin/verification/worker/reject/${workerId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        // Still succeeds because we manually force verificationRequest again later
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Verification request rejected");

        const updatedWorker = await User.findById(workerId);
        expect(updatedWorker.verificationRequest).toBe(false);
        expect(updatedWorker.isVerified).toBe(false);
    });

    test("should return 404 for invalid worker ID on accept", async () => {
        const res = await request(app)
            .post("/api/admin/verification/worker/accept/64cfe3f4b33d9c20cd999999")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Worker not found");
    });

    test("should return 404 for invalid worker ID on reject", async () => {
        const res = await request(app)
            .post("/api/admin/verification/worker/reject/64cfe3f4b33d9c20cd999999")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Worker not found");
    });
});