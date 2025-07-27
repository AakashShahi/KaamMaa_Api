const request = require("supertest");
const app = require("../../index");
const mongoose = require("mongoose");
const User = require("../../models/User");
const Job = require("../../models/Job");
const Profession = require("../../models/ProfessionCategory");
const Review = require("../../models/Review");

let customerToken, workerToken, adminToken;
let customerId, workerId, otherWorkerId;
let professionId, professionId2;
let openJobId, assignedJobId, requestedJobId, inProgressJobId, doneJobId, failedJobId;

// Function to get a future date string
const getFutureDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
};

beforeAll(async () => {
    // Clean database before all tests
    await User.deleteMany({});
    await Job.deleteMany({});
    await Profession.deleteMany({});
    await Review.deleteMany({});

    // 1. CREATE USERS VIA API TO ENSURE PASSWORD HASHING
    await request(app).post("/api/auth/register").send({ username: 'adminjob', name: 'Admin', email: 'admin.job@test.com', password: 'password123', role: 'admin', phone: '9811111100' });
    await request(app).post("/api/auth/register").send({ username: 'customerjob', name: 'Customer', email: 'customer.job@test.com', password: 'password123', role: 'customer', phone: '9811111101' });
    await request(app).post("/api/auth/register").send({ username: 'workerjob', name: 'Worker', email: 'worker.job@test.com', password: 'password123', role: 'worker', phone: '9811111102' });
    await request(app).post("/api/auth/register").send({ username: 'otherworker', name: 'Other Worker', email: 'other.worker@test.com', password: 'password123', role: 'worker', phone: '9811111103' });

    // Fetch created users to get their IDs
    const customerUser = await User.findOne({ email: 'customer.job@test.com' });
    const workerUser = await User.findOne({ email: 'worker.job@test.com' });
    const otherWorkerUser = await User.findOne({ email: 'other.worker@test.com' });

    customerId = customerUser._id;
    workerId = workerUser._id;
    otherWorkerId = otherWorkerUser._id;

    // 2. LOG IN USERS TO GET TOKENS
    const adminLoginRes = await request(app).post("/api/auth/login").send({ email: "admin.job@test.com", password: "password123" });
    adminToken = adminLoginRes.body.token;
    const customerLoginRes = await request(app).post("/api/auth/login").send({ email: "customer.job@test.com", password: "password123" });
    customerToken = customerLoginRes.body.token;
    const workerLoginRes = await request(app).post("/api/auth/login").send({ email: "worker.job@test.com", password: "password123" });
    workerToken = workerLoginRes.body.token;

    // 3. CREATE PROFESSIONS
    const prof1 = await Profession.create({ name: 'Plumbing', category: 'plumbing', description: 'Fixing pipes' });
    const prof2 = await Profession.create({ name: 'Electrical', category: 'electrical', description: 'Fixing wires' });
    professionId = prof1._id;
    professionId2 = prof2._id;

    // 4. CREATE JOBS WITH DIFFERENT STATUSES
    openJobId = (await Job.create({ postedBy: customerId, category: professionId, description: 'Fix sink', location: 'Kitchen', date: getFutureDate(2), time: '14:00', status: 'open' }))._id;
    assignedJobId = (await Job.create({ postedBy: customerId, category: professionId, assignedTo: workerId, description: 'Install dishwasher', location: 'Kitchen', date: getFutureDate(3), time: '15:00', status: 'assigned' }))._id;
    requestedJobId = (await Job.create({ postedBy: customerId, category: professionId, assignedTo: otherWorkerId, description: 'Unclog drain', location: 'Bathroom', date: getFutureDate(4), time: '11:00', status: 'requested' }))._id;
    inProgressJobId = (await Job.create({ postedBy: customerId, category: professionId, assignedTo: workerId, description: 'Rewire living room', location: 'Living Room', date: getFutureDate(1), time: '09:00', status: 'in-progress' }))._id;
    doneJobId = (await Job.create({ postedBy: customerId, category: professionId, assignedTo: workerId, description: 'Paint the fence', location: 'Yard', date: getFutureDate(1), time: '10:00', status: 'done' }))._id;
    failedJobId = (await Job.create({ postedBy: customerId, category: professionId, description: 'Fix roof leak', location: 'Roof', date: getFutureDate(5), time: '12:00', status: 'failed' }))._id;
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Customer Job Controller - /api/customer", () => {
    // --- POST /jobs ---
    describe("POST /jobs (postPublicJob)", () => {
        test("✅ [SUCCESS] Customer should post a new job", async () => {
            const res = await request(app)
                .post("/api/customer/jobs")
                .set("Authorization", `Bearer ${customerToken}`)
                .send({
                    category: professionId,
                    description: "A new public job",
                    location: "Garage",
                    date: getFutureDate(7),
                    time: "17:00"
                });
            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.description).toBe("A new public job");
        });

        test("❌ [FAIL] Should not post a job with a past date", async () => {
            const res = await request(app)
                .post("/api/customer/jobs")
                .set("Authorization", `Bearer ${customerToken}`)
                .send({
                    category: professionId,
                    description: "A past job",
                    location: "Basement",
                    date: "2020-01-01",
                    time: "12:00"
                });
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("You cannot set a past date and time for the job");
        });

        test("❌ [AUTH] Worker should not be able to post a job", async () => {
            const res = await request(app)
                .post("/api/customer/jobs")
                .set("Authorization", `Bearer ${workerToken}`)
                .send({ category: professionId, description: "Job by worker", location: "Attic", date: getFutureDate(2), time: "10:00" });
            expect(res.statusCode).toBe(403);
        });
    });

    // --- GET /jobs/* ---
    describe("GET /jobs/* (Fetch jobs by status)", () => {
        test("✅ [SUCCESS] Should get all open jobs for the customer", async () => {
            const res = await request(app)
                .get("/api/customer/jobs/open")
                .set("Authorization", `Bearer ${customerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.some(job => job._id.toString() === openJobId.toString())).toBe(true);
        });
        test("✅ [SUCCESS] Should get all assigned jobs for the customer", async () => {
            const res = await request(app)
                .get("/api/customer/jobs/assigned")
                .set("Authorization", `Bearer ${customerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.some(job => job._id.toString() === assignedJobId.toString())).toBe(true);
        });
        test("✅ [SUCCESS] Should get all requested jobs for the customer", async () => {
            const res = await request(app)
                .get("/api/customer/jobs/requested")
                .set("Authorization", `Bearer ${customerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.some(job => job._id.toString() === requestedJobId.toString())).toBe(true);
        });
        test("✅ [SUCCESS] Should get all in-progress jobs for the customer", async () => {
            const res = await request(app)
                .get("/api/customer/jobs/in-progress")
                .set("Authorization", `Bearer ${customerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.some(job => job._id.toString() === inProgressJobId.toString())).toBe(true);
        });
        test("✅ [SUCCESS] Should get all failed jobs for the customer", async () => {
            const res = await request(app)
                .get("/api/customer/jobs/failed")
                .set("Authorization", `Bearer ${customerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.some(job => job._id.toString() === failedJobId.toString())).toBe(true);
        });
    });

    // --- POST /jobs/accept-worker ---
    describe("POST /jobs/accept-worker", () => {
        test("✅ [SUCCESS] Customer should accept a worker for a requested job", async () => {
            const res = await request(app)
                .post("/api/customer/jobs/accept-worker")
                .set("Authorization", `Bearer ${customerToken}`)
                .send({ jobId: requestedJobId, workerId: otherWorkerId });
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("Worker accepted");
            const job = await Job.findById(requestedJobId);
            expect(job.status).toBe("in-progress");
        });
    });

    // --- POST /jobs/review ---
    describe("POST /jobs/review (submitReview)", () => {
        test("✅ [SUCCESS] Customer should submit a review for a done job", async () => {
            const res = await request(app)
                .post("/api/customer/jobs/review")
                .set("Authorization", `Bearer ${customerToken}`)
                .send({ jobId: doneJobId, rating: 5, comment: "Fantastic service!" });
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Review submitted successfully");

            const job = await Job.findById(doneJobId);
            expect(job.review).toBeDefined();
        });

        test("❌ [FAIL] Should not submit a review twice for the same job", async () => {
            const res = await request(app)
                .post("/api/customer/jobs/review")
                .set("Authorization", `Bearer ${customerToken}`)
                .send({ jobId: doneJobId, rating: 4, comment: "Another try." });
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("Review already submitted");
        });
    });

    // --- DELETE /jobs/:jobId ---
    describe("DELETE /jobs/:jobId (deleteOpenJob)", () => {
        test("✅ [SUCCESS] Customer should permanently delete an open job", async () => {
            const res = await request(app)
                .delete(`/api/customer/jobs/${openJobId}`)
                .set("Authorization", `Bearer ${customerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("Open job permanently deleted.");
            const job = await Job.findById(openJobId);
            expect(job).toBeNull();
        });

        test("❌ [FAIL] Should not delete a job that is not open", async () => {
            const res = await request(app)
                .delete(`/api/customer/jobs/${assignedJobId}`)
                .set("Authorization", `Bearer ${customerToken}`);
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("Only open jobs can be deleted.");
        });
    });

    // --- PUT /jobs/unassign/:jobId ---
    describe("PUT /jobs/unassign/:jobId", () => {
        test("✅ [SUCCESS] Customer should cancel a job assignment", async () => {
            const res = await request(app)
                .put(`/api/customer/jobs/unassign/${assignedJobId}`)
                .set("Authorization", `Bearer ${customerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("Job assignment cancelled. Job is now open.");

            const job = await Job.findById(assignedJobId);
            expect(job.status).toBe("open");
            expect(job.assignedTo).toBeNull();
        });
    });

    // --- DELETE /jobs/soft-delete/:jobId ---
    describe("DELETE /jobs/soft-delete/:jobId", () => {
        test("✅ [SUCCESS] Customer should soft delete a failed job", async () => {
            const res = await request(app)
                .delete(`/api/customer/jobs/soft-delete/${failedJobId}`)
                .set("Authorization", `Bearer ${customerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe("Job deleted from customer view");

            const job = await Job.findById(failedJobId);
            expect(job.deletedByCustomer).toBe(true);
        });
    });
});