const request = require("supertest");
const app = require("../../index"); // Import your main Express app
const mongoose = require("mongoose");
const User = require("../../models/User");
const Job = require("../../models/Job");
const Profession = require("../../models/ProfessionCategory");

// Store tokens and IDs to use across different tests
let adminToken, customerToken, workerToken;
let customerId;
let professionId;
let jobId1, jobId2;

beforeAll(async () => {
    // Ensure a clean database before tests run
    await User.deleteMany({});
    await Job.deleteMany({});
    await Profession.deleteMany({});

    // 1. CREATE USERS (ADMIN, CUSTOMER, WORKER)
    // Admin User (Register as customer first, then elevate to admin)
    await request(app).post("/api/auth/register").send({
        username: "adminjobtest",
        name: "Admin Job Test",
        email: "admin.job@test.com",
        password: "password123",
        role: "customer",
        phone: "9800000001"
    });
    await User.updateOne({ email: "admin.job@test.com" }, { $set: { role: "admin" } });

    // Customer User
    await request(app).post("/api/auth/register").send({
        username: "customerjobtest",
        name: "Customer Job Test",
        email: "customer.job@test.com",
        password: "password123",
        role: "customer",
        phone: "9800000002"
    });
    const customerUser = await User.findOne({ email: "customer.job@test.com" });
    customerId = customerUser._id;

    // Worker User
    await request(app).post("/api/auth/register").send({
        username: "workerjobtest",
        name: "Worker Job Test",
        email: "worker.job@test.com",
        password: "password123",
        role: "worker",
        phone: "9800000003"
    });

    // 2. LOG IN USERS TO GET JWT TOKENS
    const adminLoginRes = await request(app).post("/api/auth/login").send({ email: "admin.job@test.com", password: "password123" });
    adminToken = adminLoginRes.body.token;

    const customerLoginRes = await request(app).post("/api/auth/login").send({ email: "customer.job@test.com", password: "password123" });
    customerToken = customerLoginRes.body.token;

    const workerLoginRes = await request(app).post("/api/auth/login").send({ email: "worker.job@test.com", password: "password123" });
    workerToken = workerLoginRes.body.token;

    // 3. CREATE PREREQUISITE PROFESSION DATA
    const profession = await Profession.create({
        name: "API Plumbing Test",
        category: "api-plumbing-test",
        description: "Test profession for job-related tests",
        icon: "some-icon-url.png"
    });
    professionId = profession._id;

    // 4. CREATE JOBS DIRECTLY IN DB FOR TESTING ADMIN ROUTES
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const job1 = await Job.create({
        title: "Fix Leaky Faucet",
        description: "A test job to fix a faucet.",
        location: "Test Kitchen",
        postedBy: customerId,
        category: professionId,
        date: futureDate,
        time: "10:00",
    });
    jobId1 = job1._id;

    const job2 = await Job.create({
        title: "Install New Shower",
        description: "A second test job to install a shower.",
        location: "Test Bathroom",
        postedBy: customerId,
        category: professionId,
        date: futureDate,
        time: "14:00",
    });
    jobId2 = job2._id;
});

afterAll(async () => {
    // Clean up all test data from the database
    await User.deleteMany({});
    await Job.deleteMany({});
    await Profession.deleteMany({});
    await mongoose.disconnect();
});

describe("Admin Job Routes - /api/admin/job", () => {

    // ------------------------------------------
    // TEST SUITE FOR GET / (getAllJobs)
    // ------------------------------------------
    describe("GET /", () => {
        test("✅ [SUCCESS] Admin should get all jobs", async () => {
            const res = await request(app)
                .get("/api/admin/job")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBe(2);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data[0]).toHaveProperty("description");
            // Check if population works correctly
            expect(res.body.data[0].postedBy).toHaveProperty("name", "Customer Job Test");
            expect(res.body.data[0].category).toHaveProperty("name", "API Plumbing Test");
        });

        test("❌ [AUTH] Customer should be forbidden from getting all jobs", async () => {
            const res = await request(app)
                .get("/api/admin/job")
                .set("Authorization", `Bearer ${customerToken}`);

            expect(res.statusCode).toBe(403); // Forbidden
        });

        test("❌ [AUTH] Worker should be forbidden from getting all jobs", async () => {
            const res = await request(app)
                .get("/api/admin/job")
                .set("Authorization", `Bearer ${workerToken}`);

            expect(res.statusCode).toBe(403);
        });

        test("❌ [AUTH] Should fail without an authentication token", async () => {
            const res = await request(app).get("/api/admin/job");

            expect(res.statusCode).toBe(401); // Unauthorized
            expect(res.body.message).toBe("Auhthentication require");
        });
    });

    // ------------------------------------------
    // TEST SUITE FOR DELETE /:id (deleteJobById)
    // ------------------------------------------
    describe("DELETE /:id", () => {
        test("✅ [SUCCESS] Admin should delete a single job by ID", async () => {
            const res = await request(app)
                .delete(`/api/admin/job/${jobId1}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Job deleted successfully");

            // Verify the job is no longer in the database
            const deletedJob = await Job.findById(jobId1);
            expect(deletedJob).toBeNull();
        });

        test("❌ [NOT FOUND] Should return 404 for a non-existent job ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/admin/job/${nonExistentId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Job not found");
        });

        test("❌ [SERVER ERROR] Should return 500 for a malformed job ID", async () => {
            const res = await request(app)
                .delete("/api/admin/job/invalid-id-format")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Server error");
        });

        test("❌ [AUTH] Customer should be forbidden from deleting a job", async () => {
            const res = await request(app)
                .delete(`/api/admin/job/${jobId2}`)
                .set("Authorization", `Bearer ${customerToken}`);

            expect(res.statusCode).toBe(403);
        });
    });

    // ------------------------------------------
    // TEST SUITE FOR DELETE / (deleteAllJobs)
    // ------------------------------------------
    describe("DELETE /", () => {
        test("✅ [SUCCESS] Admin should delete all remaining jobs", async () => {
            const jobCountBefore = await Job.countDocuments();
            expect(jobCountBefore).toBeGreaterThan(0);

            const res = await request(app)
                .delete("/api/admin/job")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("All jobs deleted successfully");

            // Verify the Job collection is empty
            const jobCountAfter = await Job.countDocuments();
            expect(jobCountAfter).toBe(0);
        });

        test("✅ [SUCCESS] Should succeed even if there are no jobs to delete", async () => {
            const res = await request(app)
                .delete("/api/admin/job")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("All jobs deleted successfully");
        });

        test("❌ [AUTH] Customer should be forbidden from deleting all jobs", async () => {
            // Re-create a job to test the delete guard
            await Job.create({
                title: "Temp",
                description: "Temp",
                location: "Temp",
                postedBy: customerId,
                category: professionId,
                date: new Date(),
                time: "12:00"
            });

            const res = await request(app)
                .delete("/api/admin/job")
                .set("Authorization", `Bearer ${customerToken}`);

            expect(res.statusCode).toBe(403);

            // Verify the job was NOT deleted
            const jobCount = await Job.countDocuments();
            expect(jobCount).toBe(1);
        });
    });
});